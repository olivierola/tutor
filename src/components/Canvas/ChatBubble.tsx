/* ============================================================
   Floating chat panel (top-left of the canvas). Shows the
   persistent per-course conversation with the tutor: past turns,
   the pending state, and — during a live "writing" reveal — the
   pause / resume / stop controls with progress. Can be collapsed.
   ============================================================ */
import React, { useEffect, useRef } from 'react'
import { Sparkles, X, Pause, Play, Square, FastForward, Loader2, Eraser } from 'lucide-react'
import { useAgentStore } from '../../agent/agentStore'
import { usePlaybackStore } from '../../agent/playbackStore'
import { useNavStore } from '../../store/navStore'
import { useCoursesStore } from '../../store/coursesStore'
import { T, R } from '../../theme/tokens'

interface Props {
  /** Shift right when the vertical toolbar is open, to avoid overlap. */
  leftOffset?: number
}

const ChatBubble: React.FC<Props> = ({ leftOffset = 0 }) => {
  const { status, bubbleOpen, dismiss } = useAgentStore()
  const pb = usePlaybackStore()
  const view = useNavStore((s) => s.view)
  const courseId = view.kind === 'editor' ? view.courseId : null
  const course = useCoursesStore((s) => (courseId ? s.courses.find((c) => c.id === courseId) : undefined))
  const clearMessages = useCoursesStore((s) => s.clearMessages)
  const messages = course?.messages ?? []

  const scrollRef = useRef<HTMLDivElement>(null)
  const pending = status === 'pending'
  const playing = pb.state !== 'idle'

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, pending])

  if (!bubbleOpen && !playing) return null

  const ctrlBtn = (icon: React.ReactNode, label: string, fn: () => void) => (
    <button title={label} onClick={fn}
      style={{
        width: 28, height: 28, borderRadius: R.sm, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', color: T.text2,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text1 }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2 }}
    >{icon}</button>
  )

  return (
    <div style={{
      position: 'absolute', top: 64, left: 16 + leftOffset, zIndex: 44, width: 340, maxWidth: '42vw',
      display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)',
      transition: 'left var(--dur-med) var(--ease)',
      background: T.surfaceOverlay, backdropFilter: 'blur(12px)',
      border: `1px solid ${T.border}`, borderRadius: R.lg, boxShadow: T.shadowPop,
      animation: 'dropIn 0.16s ease-out',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 8px', borderBottom: `1px solid ${T.border}` }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)', color: 'var(--text-on-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Sparkles size={14} /></span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text1, flex: 1 }}>Tuteur</span>
        {messages.length > 0 && courseId && ctrlBtn(<Eraser size={14} />, 'Effacer la conversation', () => clearMessages(courseId))}
        {ctrlBtn(<X size={15} />, 'Fermer', dismiss)}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }} className="no-scrollbar">
        {messages.length === 0 && !pending && (
          <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
            Pose une question ou demande un cours : « explique le théorème de Thalès », « schéma d'un circuit »…
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '88%', padding: '7px 11px', borderRadius: R.md, fontSize: 13, lineHeight: 1.45,
            background: m.role === 'user' ? 'var(--accent)' : T.surface2,
            color: m.role === 'user' ? 'var(--text-on-accent)' : T.text1,
            border: m.role === 'user' ? 'none' : `1px solid ${T.border}`,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {m.content}
          </div>
        ))}
        {pending && (
          <div style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, color: T.text2, fontSize: 12.5, padding: '6px 10px' }}>
            <Loader2 size={14} className="spin" /> Je réfléchis…
          </div>
        )}
      </div>

      {/* Playback controls */}
      {playing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderTop: `1px solid ${T.border}` }}>
          {pb.state === 'playing' ? ctrlBtn(<Pause size={15} />, 'Pause', pb.pause) : ctrlBtn(<Play size={15} />, 'Reprendre', pb.resume)}
          {ctrlBtn(<FastForward size={15} />, 'Tout afficher', pb.finishNow)}
          {ctrlBtn(<Square size={14} />, 'Arrêter', pb.stop)}
          <div style={{ flex: 1, height: 4, background: T.surface3, borderRadius: 2, marginLeft: 6, overflow: 'hidden' }}>
            <div style={{ width: `${pb.total ? Math.round((pb.done / pb.total) * 100) : 0}%`, height: '100%', background: 'var(--accent)', transition: 'width var(--dur-med) var(--ease)' }} />
          </div>
          <span style={{ fontSize: 11, color: T.text3, fontFamily: 'monospace', minWidth: 34, textAlign: 'right' }}>{pb.done}/{pb.total}</span>
        </div>
      )}
    </div>
  )
}

export default ChatBubble
