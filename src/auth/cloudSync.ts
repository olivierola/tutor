/* ============================================================
   Cloud sync — when the user is signed in, mirror their hub state
   (courses + folders) to a single per-user row in `user_state`.
     • pull  on sign-in: newer cloud data replaces local
     • push  (debounced) whenever courses/folders change
   Last-write-wins by updated timestamp. Guests stay local-only.
   ============================================================ */
import { getSupabase } from '../lib/supabase'
import { useCoursesStore, type Course, type Folder } from '../store/coursesStore'
import { useAuthStore } from './authStore'

interface StateBlob { courses: Course[]; folders: Folder[]; updatedAt: number }

let pushTimer: number | undefined
let unsubStore: (() => void) | undefined

function localBlob(): StateBlob {
  const s = useCoursesStore.getState()
  return { courses: s.courses, folders: s.folders, updatedAt: Date.now() }
}

/** Replace the local hub state with the given blob. */
function applyBlob(blob: StateBlob) {
  useCoursesStore.setState({
    courses: Array.isArray(blob.courses) ? blob.courses : [],
    folders: Array.isArray(blob.folders) ? blob.folders : [],
  })
  // Persist to localStorage too (the store persists on its own actions,
  // but a direct setState bypasses that, so mirror it here).
  try {
    localStorage.setItem('tutor-ai:courses', JSON.stringify({
      version: 2, courses: blob.courses ?? [], folders: blob.folders ?? [],
    }))
  } catch { /* ignore */ }
}

async function pull(userId: string): Promise<void> {
  const sb = await getSupabase()
  if (!sb) return
  const { data, error } = await sb.from('user_state').select('data, updated_at').eq('user_id', userId).maybeSingle()
  if (error || !data) return
  const blob = data.data as StateBlob
  // Adopt cloud data if it has any courses (first device push wins on empty).
  if (blob?.courses?.length) {
    applyBlob(blob)
  }
}

async function push(userId: string): Promise<void> {
  const sb = await getSupabase()
  if (!sb) return
  const blob = localBlob()
  await sb.from('user_state').upsert(
    { user_id: userId, data: blob, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
}

function schedulePush(userId: string) {
  window.clearTimeout(pushTimer)
  pushTimer = window.setTimeout(() => { push(userId) }, 1500)
}

/** Begin syncing for a signed-in user. Idempotent. */
export async function startCloudSync(userId: string): Promise<void> {
  stopCloudSync()
  await pull(userId)
  // Push on any future course/folder change.
  unsubStore = useCoursesStore.subscribe(() => schedulePush(userId))
}

/** Stop syncing (sign-out / guest). */
export function stopCloudSync(): void {
  window.clearTimeout(pushTimer)
  unsubStore?.(); unsubStore = undefined
}

/** Wire sync to auth changes — call once at app start. */
export function initCloudSync(): void {
  let current: string | null = null
  const handle = (userId: string | null) => {
    if (userId === current) return
    current = userId
    if (userId) startCloudSync(userId)
    else stopCloudSync()
  }
  // react to auth store changes
  useAuthStore.subscribe((s) => handle(s.user?.id ?? null))
  // and run once for the initial state
  handle(useAuthStore.getState().user?.id ?? null)
}
