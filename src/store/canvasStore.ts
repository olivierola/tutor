import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  CanvasElement,
  Instrument,
  Viewport,
  ToolType,
  HistoryEntry,
  GridVariant,
  FontStyle,
} from '../types/canvas'
import { simulateCircuits, toggleInteractive } from '../utils/simulate'

const MAX_HISTORY = 100

interface CanvasState {
  // Data
  elements: CanvasElement[]
  instruments: Instrument[]
  viewport: Viewport
  // Tool state
  activeTool: ToolType
  activeColor: string
  strokeWidth: number
  fillColor: string
  gridVariant: GridVariant
  activeTextFont: FontStyle
  bondFromAtomId: string | null
  activeAtomSymbol: string
  // Selection
  selectedIds: string[]
  // History
  history: HistoryEntry[]
  historyIndex: number
  // Text editing
  editingTextId: string | null

  // Element actions
  addElement: (el: CanvasElement) => void
  updateElement: (id: string, patch: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  deleteSelectedElements: () => void

  // Viewport
  setViewport: (vp: Partial<Viewport>) => void

  // Tool
  setActiveTool: (t: ToolType) => void
  setColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeWidth: (w: number) => void
  setGridVariant: (v: GridVariant) => void
  setActiveTextFont: (f: FontStyle) => void
  setBondFromAtomId: (id: string | null) => void
  setActiveAtomSymbol: (sym: string) => void

  // Selection
  selectElement: (id: string, additive?: boolean) => void
  selectElements: (ids: string[]) => void
  selectWithGroup: (id: string, additive?: boolean) => void
  clearSelection: () => void

  // Group-aware movement (multi-element drag)
  moveElementsBy: (ids: string[], dx: number, dy: number) => void
  /** Expand a set of ids to include every element sharing their group. */
  expandGroup: (ids: string[]) => string[]

  // Instruments
  addInstrument: (inst: Instrument) => void
  updateInstrument: (id: string, patch: Partial<Instrument>) => void
  removeInstrument: (id: string) => void

  // History
  pushHistory: () => void
  undo: () => void
  redo: () => void

  // Text editing
  setEditingTextId: (id: string | null) => void

  // Utility
  fitToContent: () => { width: number; height: number }
  exportJSON: () => string

  // Document load/save (used by the course editor)
  loadDocument: (doc: { elements: CanvasElement[]; instruments: Instrument[]; viewport: Viewport }) => void
  getDocument: () => { elements: CanvasElement[]; instruments: Instrument[]; viewport: Viewport }

  // AI scene I/O
  addElements: (els: CanvasElement[], opts?: { select?: boolean; createdBy?: 'user' | 'ai' }) => void

  // Functional interactivity (click a switch → recompute circuit state)
  interactWithElement: (id: string) => void
  /** Recompute derived simulation state (energized flags, …). */
  runSimulation: () => void
}

function snapshot(state: CanvasState): HistoryEntry {
  return {
    elements: JSON.parse(JSON.stringify(state.elements)),
    instruments: JSON.parse(JSON.stringify(state.instruments)),
  }
}

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set, get) => ({
    // ── initial state ──────────────────────────────────────────
    elements: [],
    instruments: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    activeTool: 'select',
    activeColor: '#1e293b',
    fillColor: 'transparent',
    gridVariant: 'square',
    activeTextFont: 'sans',
    bondFromAtomId: null,
    activeAtomSymbol: 'C',
    strokeWidth: 2,
    selectedIds: [],
    history: [],
    historyIndex: -1,
    editingTextId: null,

    // ── element actions ────────────────────────────────────────
    addElement: (el) => {
      get().pushHistory()
      set((s) => ({ elements: [...s.elements, el] }))
      if (el.type === 'circuit-component') get().runSimulation()
    },

    updateElement: (id, patch) => {
      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as CanvasElement) : el
        ),
      }))
    },

    deleteElement: (id) => {
      get().pushHistory()
      set((s) => ({
        elements: s.elements.filter((el) => el.id !== id),
        selectedIds: s.selectedIds.filter((sid) => sid !== id),
      }))
    },

    deleteSelectedElements: () => {
      const { selectedIds, expandGroup } = get()
      if (selectedIds.length === 0) return
      const toDelete = new Set(expandGroup(selectedIds))
      get().pushHistory()
      set((s) => ({
        elements: s.elements.filter((el) => !toDelete.has(el.id)),
        selectedIds: [],
      }))
    },

    // ── viewport ───────────────────────────────────────────────
    setViewport: (vp) => {
      set((s) => ({ viewport: { ...s.viewport, ...vp } }))
    },

    // ── tool ───────────────────────────────────────────────────
    setActiveTool: (t) => {
      set({ activeTool: t, selectedIds: [] })
    },

    setColor: (color) => set({ activeColor: color }),

    setFillColor: (color) => set({ fillColor: color }),
    setGridVariant: (v) => set({ gridVariant: v }),
    setActiveTextFont: (f) => set({ activeTextFont: f }),
    setBondFromAtomId: (id) => set({ bondFromAtomId: id }),
    setActiveAtomSymbol: (sym) => set({ activeAtomSymbol: sym }),

    setStrokeWidth: (w) => set({ strokeWidth: w }),

    // ── selection ──────────────────────────────────────────────
    selectElement: (id, additive = false) => {
      set((s) => {
        if (additive) {
          const already = s.selectedIds.includes(id)
          return {
            selectedIds: already
              ? s.selectedIds.filter((sid) => sid !== id)
              : [...s.selectedIds, id],
          }
        }
        return { selectedIds: [id] }
      })
    },

    selectElements: (ids) => set({ selectedIds: ids }),

    expandGroup: (ids) => {
      const { elements } = get()
      const groups = new Set(
        ids.map((id) => elements.find((e) => e.id === id)?.group).filter(Boolean) as string[]
      )
      if (groups.size === 0) return ids
      const set2 = new Set(ids)
      for (const el of elements) {
        if (el.group && groups.has(el.group)) set2.add(el.id)
      }
      return [...set2]
    },

    selectWithGroup: (id, additive = false) => {
      const expanded = get().expandGroup([id])
      set((s) => {
        if (additive) {
          // toggle the whole group
          const allSelected = expanded.every((eid) => s.selectedIds.includes(eid))
          if (allSelected) {
            return { selectedIds: s.selectedIds.filter((sid) => !expanded.includes(sid)) }
          }
          return { selectedIds: [...new Set([...s.selectedIds, ...expanded])] }
        }
        return { selectedIds: expanded }
      })
    },

    clearSelection: () => set({ selectedIds: [] }),

    moveElementsBy: (ids, dx, dy) => {
      if (ids.length === 0 || (dx === 0 && dy === 0)) return
      const idset = new Set(ids)
      set((s) => ({
        elements: s.elements.map((el) => {
          if (!idset.has(el.id) || el.locked) return el
          const next = { ...el, x: el.x + dx, y: el.y + dy } as Record<string, unknown>
          if ('x2' in el) { next.x2 = (el as { x2: number }).x2 + dx; next.y2 = (el as { y2: number }).y2 + dy }
          if (el.type === 'pen') {
            next.points = (el as { points: number[][] }).points.map(([px, py]) => [px + dx, py + dy])
          }
          if (el.type === 'light-ray') {
            next.points = (el as { points: [number, number][] }).points.map(([px, py]) => [px + dx, py + dy])
          }
          return next as unknown as CanvasElement
        }),
      }))
    },

    // ── instruments ────────────────────────────────────────────
    addInstrument: (inst) => {
      set((s) => ({ instruments: [...s.instruments, inst] }))
    },

    updateInstrument: (id, patch) => {
      set((s) => ({
        instruments: s.instruments.map((inst) =>
          inst.id === id ? ({ ...inst, ...patch } as Instrument) : inst
        ),
      }))
    },

    removeInstrument: (id) => {
      set((s) => ({
        instruments: s.instruments.filter((inst) => inst.id !== id),
      }))
    },

    // ── history ────────────────────────────────────────────────
    pushHistory: () => {
      const state = get()
      const entry = snapshot(state)
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(entry)
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      })
    },

    undo: () => {
      const { history, historyIndex } = get()
      if (historyIndex <= 0) return
      const prev = history[historyIndex - 1]
      set({
        elements: JSON.parse(JSON.stringify(prev.elements)),
        instruments: JSON.parse(JSON.stringify(prev.instruments)),
        historyIndex: historyIndex - 1,
        selectedIds: [],
      })
    },

    redo: () => {
      const { history, historyIndex } = get()
      if (historyIndex >= history.length - 1) return
      const next = history[historyIndex + 1]
      set({
        elements: JSON.parse(JSON.stringify(next.elements)),
        instruments: JSON.parse(JSON.stringify(next.instruments)),
        historyIndex: historyIndex + 1,
        selectedIds: [],
      })
    },

    // ── text editing ───────────────────────────────────────────
    setEditingTextId: (id) => set({ editingTextId: id }),

    // ── utilities ──────────────────────────────────────────────
    fitToContent: () => {
      // Returns viewport dimensions needed; caller passes screen size
      return { width: window.innerWidth, height: window.innerHeight }
    },

    exportJSON: () => {
      const { elements, instruments, viewport } = get()
      return JSON.stringify({ elements, instruments, viewport }, null, 2)
    },

    // ── document load / save ───────────────────────────────────
    loadDocument: (doc) => {
      const elements = JSON.parse(JSON.stringify(doc.elements)) as CanvasElement[]
      const instruments = JSON.parse(JSON.stringify(doc.instruments)) as Instrument[]
      set({
        elements,
        instruments,
        viewport: { ...doc.viewport },
        selectedIds: [],
        editingTextId: null,
        // fresh history seeded with the loaded state
        history: [{ elements: JSON.parse(JSON.stringify(elements)), instruments: JSON.parse(JSON.stringify(instruments)) }],
        historyIndex: 0,
      })
    },

    getDocument: () => {
      const { elements, instruments, viewport } = get()
      return {
        elements: JSON.parse(JSON.stringify(elements)),
        instruments: JSON.parse(JSON.stringify(instruments)),
        viewport: { ...viewport },
      }
    },

    // ── batch insert (AI scenes, paste, duplicate) ─────────────
    addElements: (els, opts) => {
      if (els.length === 0) return
      get().pushHistory()
      const stamped = els.map((el) => ({
        ...el,
        createdBy: opts?.createdBy ?? el.createdBy ?? 'ai',
      })) as CanvasElement[]
      set((s) => ({
        elements: [...s.elements, ...stamped],
        selectedIds: opts?.select ? stamped.map((e) => e.id) : s.selectedIds,
      }))
      get().runSimulation()
    },

    // ── functional interactivity ───────────────────────────────
    interactWithElement: (id) => {
      const el = get().elements.find((e) => e.id === id)
      if (!el) return
      const patch = toggleInteractive(el)
      if (!patch) return
      get().pushHistory()
      set((s) => ({
        elements: s.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as CanvasElement) : e)),
      }))
      get().runSimulation()
    },

    runSimulation: () => {
      set((s) => {
        const next = simulateCircuits(s.elements)
        return next === s.elements ? {} : { elements: next }
      })
    },
  }))
)
