/* ============================================================
   Proactive tutor — makes the agent feel alive: it reacts to the
   student's actions (answering an exercise right/wrong) and, after
   a spell of inactivity, gently offers help. Kept conservative
   with cooldowns so it never spams the model or the user.

   Mounted once inside the editor (CourseEditor).
   ============================================================ */
import { useEffect, useRef } from 'react'
import { useExerciseEvents } from './exerciseEvents'
import { useAgentStore } from './agentStore'
import { usePlaybackStore } from './playbackStore'

const REACT_COOLDOWN = 8000        // min gap between reactions
const IDLE_DELAY = 90_000          // 90s of inactivity → gentle nudge
const IDLE_COOLDOWN = 180_000      // don't nudge more than every 3 min

const ENCOURAGE = [
  'Bravo, c’est exact ! 🎉 On continue ?',
  'Parfait, tu as bien compris ✅',
  'Excellent ! Tu peux passer à la suite.',
]
const SUPPORT = [
  'Pas tout à fait — relis l’énoncé et réessaie, tu y es presque 💪',
  'Ce n’est pas la bonne réponse, mais c’est en réfléchissant qu’on apprend. Besoin d’un indice ?',
  'Erreur fréquente ! Reprends le calcul étape par étape.',
]
const IDLE = [
  'Besoin d’un coup de main ? Demande-moi une explication ou un exercice.',
  'Tu veux que je détaille un point ou que je propose un exercice ?',
]

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

function speak(text: string) {
  useAgentStore.getState().set({
    status: 'done', chatOnly: true, bubbleOpen: true,
    lastTurn: { text, ok: true, warnings: [] },
  })
}

export function useProactiveTutor(enabled: boolean) {
  const lastReactRef = useRef(0)
  const lastIdleRef = useRef(0)
  const lastSeq = useRef(0)
  const idleTimer = useRef<number | undefined>(undefined)

  // ── React to exercise answers ───────────────────────────────
  useEffect(() => {
    if (!enabled) return
    const unsub = useExerciseEvents.subscribe((s) => {
      const ev = s.last
      if (!ev || ev.id === lastSeq.current) return
      lastSeq.current = ev.id
      bumpIdle()
      if (ev.kind !== 'answered') return
      const now = Date.now()
      if (now - lastReactRef.current < REACT_COOLDOWN) return
      // don't interrupt an ongoing writing animation
      if (usePlaybackStore.getState().state !== 'idle') return
      lastReactRef.current = now
      speak(ev.correct ? pick(ENCOURAGE) : pick(SUPPORT))
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // ── Idle nudge ──────────────────────────────────────────────
  function bumpIdle() {
    window.clearTimeout(idleTimer.current)
    if (!enabled) return
    idleTimer.current = window.setTimeout(() => {
      const now = Date.now()
      if (now - lastIdleRef.current < IDLE_COOLDOWN) return
      if (usePlaybackStore.getState().state !== 'idle') return
      if (useAgentStore.getState().status === 'pending') return
      lastIdleRef.current = now
      speak(pick(IDLE))
    }, IDLE_DELAY)
  }

  useEffect(() => {
    if (!enabled) return
    const reset = () => bumpIdle()
    const evs = ['pointerdown', 'keydown', 'wheel'] as const
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    bumpIdle()
    return () => {
      window.clearTimeout(idleTimer.current)
      evs.forEach((e) => window.removeEventListener(e, reset))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
