import { useEffect } from 'react'
import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

const STORAGE_KEY = 'tutor-ai:theme'

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function resolve(mode: ThemeMode): Resolved {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

function applyToDocument(resolved: Resolved) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

function loadInitial(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch { /* ignore */ }
  return 'dark' // dashboard reference is dark-first
}

interface ThemeState {
  mode: ThemeMode
  resolved: Resolved
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const initialMode = loadInitial()

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolved: resolve(initialMode),
  setMode: (mode) => {
    const resolved = resolve(mode)
    applyToDocument(resolved)
    try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* ignore */ }
    set({ mode, resolved })
  },
  toggle: () => {
    // light → dark → light (system collapses to its resolved value first)
    const next = get().resolved === 'dark' ? 'light' : 'dark'
    get().setMode(next)
  },
}))

// Apply once at module load so there's no flash before React mounts.
applyToDocument(resolve(initialMode))

/**
 * Mount once near the app root. Keeps the document in sync and
 * reacts to OS theme changes while in `system` mode.
 */
export function useThemeSync() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)

  useEffect(() => {
    applyToDocument(resolve(mode))
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setMode('system') // re-resolve
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode, setMode])
}
