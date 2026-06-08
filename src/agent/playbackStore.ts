/* ============================================================
   Playback store — drives the "live teaching" reveal. Instead of
   dropping all of the AI's elements at once, we queue them and
   reveal one at a time with a delay, so it feels like a teacher
   writing on the board. Supports pause / resume / stop, and can
   be interrupted by a new request.

   Each revealed element gets a transient "appear" animation via
   the `recentlyRevealed` set (consumed by the canvas renderer).
   ============================================================ */
import { create } from 'zustand'
import type { CanvasElement } from '../types/canvas'
import { useCanvasStore } from '../store/canvasStore'

export type PlaybackState = 'idle' | 'playing' | 'paused'

interface PlaybackStore {
  state: PlaybackState
  queue: CanvasElement[]
  total: number
  done: number
  /** ids revealed in the last ~1s, for the writing animation. */
  recentlyRevealed: Set<string>
  /** canvas-space position of the AI "pen" cursor (last reveal), or null. */
  cursor: { x: number; y: number } | null

  /** Start revealing a batch of elements step by step. */
  play: (elements: CanvasElement[], opts?: { stepMs?: number }) => void
  pause: () => void
  resume: () => void
  stop: () => void
  /** Reveal everything immediately (skip the animation). */
  finishNow: () => void
}

let timer: number | undefined
let stepMs = 650

function clearTimer() {
  if (timer !== undefined) { window.clearTimeout(timer); timer = undefined }
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => {
  function revealNext() {
    const { queue } = get()
    if (queue.length === 0) {
      set({ state: 'idle' })
      return
    }
    const [next, ...rest] = queue
    // commit the element to the canvas
    useCanvasStore.setState((s) => ({ elements: [...s.elements, next] }))
    const revealed = new Set(get().recentlyRevealed); revealed.add(next.id)
    set({ queue: rest, done: get().done + 1, recentlyRevealed: revealed, cursor: { x: next.x, y: next.y } })

    // clear the "recent" flag after the animation window
    window.setTimeout(() => {
      const r = new Set(usePlaybackStore.getState().recentlyRevealed)
      r.delete(next.id)
      usePlaybackStore.setState({ recentlyRevealed: r })
    }, 900)

    if (rest.length > 0) {
      timer = window.setTimeout(revealNext, stepMs)
    } else {
      set({ state: 'idle' })
      // hide the cursor shortly after the last element settles
      window.setTimeout(() => {
        if (usePlaybackStore.getState().state === 'idle') usePlaybackStore.setState({ cursor: null })
      }, 700)
    }
  }

  return {
    state: 'idle',
    queue: [],
    total: 0,
    done: 0,
    recentlyRevealed: new Set<string>(),
    cursor: null,

    play: (elements, opts) => {
      clearTimer()
      stepMs = opts?.stepMs ?? 650
      // single undo step for the whole reveal
      useCanvasStore.getState().pushHistory()
      set({ state: 'playing', queue: elements, total: elements.length, done: 0 })
      revealNext()
    },

    pause: () => {
      if (get().state !== 'playing') return
      clearTimer()
      set({ state: 'paused' })
    },

    resume: () => {
      if (get().state !== 'paused') return
      set({ state: 'playing' })
      revealNext()
    },

    stop: () => {
      clearTimer()
      set({ state: 'idle', queue: [], total: 0, done: 0, cursor: null })
    },

    finishNow: () => {
      clearTimer()
      const { queue } = get()
      if (queue.length > 0) {
        useCanvasStore.setState((s) => ({ elements: [...s.elements, ...queue] }))
      }
      set({ state: 'idle', queue: [], done: get().total, cursor: null })
    },
  }
})
