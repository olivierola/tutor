/* ============================================================
   Exercise event bus — when the student answers an interactive
   element (QCM, short answer, fill-blank, flashcard), the
   renderer reports it here. The proactive tutor subscribes and
   decides whether to react (encourage, hint, propose the next
   step). Decoupling keeps the element components dumb.
   ============================================================ */
import { create } from 'zustand'

export type ExerciseEventKind = 'answered' | 'flipped'

export interface ExerciseEvent {
  id: number
  kind: ExerciseEventKind
  elementId: string
  elementType: string
  correct?: boolean
  /** short human description, e.g. the question text */
  label?: string
  at: number
}

interface ExerciseEventStore {
  last: ExerciseEvent | null
  /** monotonically increasing so subscribers can dedupe. */
  seq: number
  emit: (e: Omit<ExerciseEvent, 'id' | 'at'>) => void
}

export const useExerciseEvents = create<ExerciseEventStore>((set, get) => ({
  last: null,
  seq: 0,
  emit: (e) => {
    const seq = get().seq + 1
    set({ seq, last: { ...e, id: seq, at: Date.now() } })
  },
}))
