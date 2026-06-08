/* ============================================================
   Courses store — the hub's data model.

   A Course groups several Pages. Each Page owns an independent
   infinite-canvas document (elements + instruments + viewport).
   Everything is persisted to localStorage so the hub survives
   reloads with no backend.

   The live editing of a page's canvas happens in canvasStore;
   when the user opens a page we hydrate canvasStore from here,
   and we save back when they leave / on demand.
   ============================================================ */
import { create } from 'zustand'
import type { CanvasElement, Instrument, Viewport } from '../types/canvas'
import { generateId } from '../utils/canvasUtils'

export interface Page {
  id: string
  title: string
  elements: CanvasElement[]
  instruments: Instrument[]
  viewport: Viewport
}

export type CourseColor =
  | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'zinc'

/** One turn of the persistent per-course chat with the tutor. */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  at: number
}

export interface Course {
  id: string
  title: string
  description: string
  color: CourseColor
  subject?: string        // free-form: "Mathématiques", "Physique"…
  createdAt: number
  updatedAt: number
  pages: Page[]
  /** Persistent conversation with the tutor for this course. */
  messages?: ChatMessage[]
  /** Folder this course belongs to (undefined = unfiled). */
  folderId?: string
}

/** A simple, one-level folder for organising courses. */
export interface Folder {
  id: string
  name: string
  color: CourseColor
  createdAt: number
}

const STORAGE_KEY = 'tutor-ai:courses'
const SCHEMA_VERSION = 2

interface Persisted {
  version: number
  courses: Course[]
  folders?: Folder[]
}

function emptyPage(title = 'Page 1'): Page {
  return {
    id: generateId('page'),
    title,
    elements: [],
    instruments: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

function load(): { courses: Course[]; folders: Folder[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { courses: seed(), folders: [] }
    const data = JSON.parse(raw) as Persisted
    if (!data || !Array.isArray(data.courses)) return { courses: seed(), folders: [] }
    return { courses: data.courses, folders: Array.isArray(data.folders) ? data.folders : [] }
  } catch {
    return { courses: seed(), folders: [] }
  }
}

function persist(courses: Course[], folders: Folder[]) {
  try {
    const payload: Persisted = { version: SCHEMA_VERSION, courses, folders }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch { /* quota / private mode — ignore */ }
}

/** First-run sample so the hub isn't empty. */
function seed(): Course[] {
  const now = Date.now()
  return [
    {
      id: generateId('course'),
      title: 'Cours de démonstration',
      description: 'Un exemple pour découvrir le tableau infini. Ouvrez-le et dessinez !',
      color: 'blue',
      subject: 'Général',
      createdAt: now,
      updatedAt: now,
      pages: [emptyPage('Introduction')],
    },
  ]
}

interface CoursesState {
  courses: Course[]
  folders: Folder[]

  createCourse: (input?: Partial<Pick<Course, 'title' | 'description' | 'color' | 'subject'>>) => Course
  updateCourse: (id: string, patch: Partial<Omit<Course, 'id' | 'pages'>>) => void
  deleteCourse: (id: string) => void
  duplicateCourse: (id: string) => Course | null

  // Folders
  createFolder: (name?: string, color?: CourseColor) => Folder
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  moveCourseToFolder: (courseId: string, folderId: string | undefined) => void

  addPage: (courseId: string, title?: string) => Page | null
  updatePage: (courseId: string, pageId: string, patch: Partial<Omit<Page, 'id'>>) => void
  deletePage: (courseId: string, pageId: string) => void

  // Per-course chat session
  addMessage: (courseId: string, msg: Omit<ChatMessage, 'id' | 'at'>) => ChatMessage | null
  clearMessages: (courseId: string) => void

  getCourse: (id: string) => Course | undefined
  getPage: (courseId: string, pageId: string) => Page | undefined
}

const _loaded = load()

export const useCoursesStore = create<CoursesState>((set, get) => ({
  courses: _loaded.courses,
  folders: _loaded.folders,

  createCourse: (input) => {
    const now = Date.now()
    const course: Course = {
      id: generateId('course'),
      title: input?.title?.trim() || 'Nouveau cours',
      description: input?.description ?? '',
      color: input?.color ?? 'blue',
      subject: input?.subject,
      createdAt: now,
      updatedAt: now,
      pages: [emptyPage()],
    }
    set((s) => {
      const courses = [course, ...s.courses]
      persist(courses, get().folders)
      return { courses }
    })
    return course
  },

  updateCourse: (id, patch) => {
    set((s) => {
      const courses = s.courses.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
      )
      persist(courses, get().folders)
      return { courses }
    })
  },

  deleteCourse: (id) => {
    set((s) => {
      const courses = s.courses.filter((c) => c.id !== id)
      persist(courses, get().folders)
      return { courses }
    })
  },

  duplicateCourse: (id) => {
    const src = get().courses.find((c) => c.id === id)
    if (!src) return null
    const now = Date.now()
    const copy: Course = {
      ...structuredClone(src),
      id: generateId('course'),
      title: `${src.title} (copie)`,
      createdAt: now,
      updatedAt: now,
      pages: src.pages.map((p) => ({ ...structuredClone(p), id: generateId('page') })),
    }
    set((s) => {
      const courses = [copy, ...s.courses]
      persist(courses, get().folders)
      return { courses }
    })
    return copy
  },

  addPage: (courseId, title) => {
    let created: Page | null = null
    set((s) => {
      const courses = s.courses.map((c) => {
        if (c.id !== courseId) return c
        created = emptyPage(title || `Page ${c.pages.length + 1}`)
        return { ...c, pages: [...c.pages, created], updatedAt: Date.now() }
      })
      persist(courses, get().folders)
      return { courses }
    })
    return created
  },

  updatePage: (courseId, pageId, patch) => {
    set((s) => {
      const courses = s.courses.map((c) => {
        if (c.id !== courseId) return c
        return {
          ...c,
          updatedAt: Date.now(),
          pages: c.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
        }
      })
      persist(courses, get().folders)
      return { courses }
    })
  },

  deletePage: (courseId, pageId) => {
    set((s) => {
      const courses = s.courses.map((c) => {
        if (c.id !== courseId) return c
        // never leave a course with zero pages
        const remaining = c.pages.filter((p) => p.id !== pageId)
        return { ...c, pages: remaining.length ? remaining : [emptyPage()], updatedAt: Date.now() }
      })
      persist(courses, get().folders)
      return { courses }
    })
  },

  // ── folders ─────────────────────────────────────────────────
  createFolder: (name, color) => {
    const folder: Folder = {
      id: generateId('folder'),
      name: name?.trim() || 'Nouveau dossier',
      color: color ?? 'zinc',
      createdAt: Date.now(),
    }
    set((s) => {
      const folders = [...s.folders, folder]
      persist(s.courses, folders)
      return { folders }
    })
    return folder
  },

  renameFolder: (id, name) => {
    if (!name.trim()) return
    set((s) => {
      const folders = s.folders.map((f) => (f.id === id ? { ...f, name: name.trim() } : f))
      persist(s.courses, folders)
      return { folders }
    })
  },

  deleteFolder: (id) => {
    set((s) => {
      const folders = s.folders.filter((f) => f.id !== id)
      // unfile any courses that were in it
      const courses = s.courses.map((c) => (c.folderId === id ? { ...c, folderId: undefined } : c))
      persist(courses, folders)
      return { folders, courses }
    })
  },

  moveCourseToFolder: (courseId, folderId) => {
    set((s) => {
      const courses = s.courses.map((c) =>
        c.id === courseId ? { ...c, folderId, updatedAt: Date.now() } : c
      )
      persist(courses, s.folders)
      return { courses }
    })
  },

  addMessage: (courseId, msg) => {
    const message: ChatMessage = { ...msg, id: generateId('msg'), at: Date.now() }
    set((s) => {
      const courses = s.courses.map((c) => {
        if (c.id !== courseId) return c
        const messages = [...(c.messages ?? []), message].slice(-100) // cap history
        return { ...c, messages }
      })
      persist(courses, get().folders)
      return { courses }
    })
    return message
  },

  clearMessages: (courseId) => {
    set((s) => {
      const courses = s.courses.map((c) => (c.id === courseId ? { ...c, messages: [] } : c))
      persist(courses, get().folders)
      return { courses }
    })
  },

  getCourse: (id) => get().courses.find((c) => c.id === id),
  getPage: (courseId, pageId) =>
    get().courses.find((c) => c.id === courseId)?.pages.find((p) => p.id === pageId),
}))
