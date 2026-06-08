import React, { memo } from 'react'
import { Check, X as XIcon, Circle, CheckCircle2, RotateCcw, Lightbulb } from 'lucide-react'
import type { QcmElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { useExerciseEvents } from '../../../agent/exerciseEvents'
import { inlineMd } from '../../../utils/markdown'

interface Props {
  element: QcmElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const QcmElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, question, options, multi, explanation, chosen, status } = element
  const update = useCanvasStore(s => s.updateElement)
  const emit = useExerciseEvents(s => s.emit)
  const answered = status !== 'unanswered'

  // rough height
  const qLines = Math.ceil(question.length / Math.max(18, (width - 32) / 8))
  const rowH = 38
  const height = 44 + qLines * 22 + options.length * rowH + (answered && explanation ? 60 : 0) + 52

  const toggle = (i: number) => {
    if (answered) return
    let next: number[]
    if (multi) next = chosen.includes(i) ? chosen.filter(c => c !== i) : [...chosen, i]
    else next = [i]
    update(element.id, { chosen: next })
  }

  const check = () => {
    if (chosen.length === 0) return
    const correctSet = new Set(options.map((o, i) => (o.correct ? i : -1)).filter(i => i >= 0))
    const chosenSet = new Set(chosen)
    const ok = correctSet.size === chosenSet.size && [...correctSet].every(i => chosenSet.has(i))
    update(element.id, { status: ok ? 'correct' : 'incorrect' })
    emit({ kind: 'answered', elementId: element.id, elementType: 'qcm', correct: ok, label: question })
  }

  const reset = () => update(element.id, { chosen: [], status: 'unanswered' })

  const accent = status === 'correct' ? '#22c55e' : status === 'incorrect' ? '#ef4444' : 'var(--accent)'

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={0} y={0} width={width} height={height} rx={12} fill="var(--surface-1)"
        stroke={isSelected ? '#3b82f6' : answered ? accent : 'var(--border)'} strokeWidth={isSelected || answered ? 2 : 1} />
      <rect x={0} y={0} width={4} height={height} fill={accent} rx={2} style={{ pointerEvents: 'none' }} />

      <foreignObject x={4} y={0} width={width - 4} height={height} style={{ overflow: 'visible' }}>
        <div
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: 'var(--font-sans)', pointerEvents: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            QCM{multi ? ' · choix multiples' : ''}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10, lineHeight: 1.4 }}
            dangerouslySetInnerHTML={{ __html: inlineMd(question) }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {options.map((opt, i) => {
              const picked = chosen.includes(i)
              const showCorrect = answered && opt.correct
              const showWrong = answered && picked && !opt.correct
              const bg = showCorrect ? 'rgba(34,197,94,0.12)' : showWrong ? 'rgba(239,68,68,0.12)' : picked ? 'var(--accent-soft)' : 'var(--surface-2)'
              const bd = showCorrect ? '#22c55e' : showWrong ? '#ef4444' : picked ? 'var(--accent)' : 'var(--border)'
              return (
                <button key={i} onClick={(e) => { e.stopPropagation(); toggle(i) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px',
                    borderRadius: 8, border: `1px solid ${bd}`, background: bg, cursor: answered ? 'default' : 'pointer',
                    fontSize: 13, color: 'var(--text-1)', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'background 0.12s, border-color 0.12s',
                  }}>
                  <span style={{ flexShrink: 0, color: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : picked ? 'var(--accent-text)' : 'var(--text-3)', display: 'flex' }}>
                    {showCorrect ? <CheckCircle2 size={16} /> : showWrong ? <XIcon size={16} /> : picked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: inlineMd(opt.text) }} />
                </button>
              )
            })}
          </div>

          {answered && explanation && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45, display: 'flex', gap: 7 }}>
              <Lightbulb size={15} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
              <span dangerouslySetInnerHTML={{ __html: inlineMd(explanation) }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!answered ? (
              <button onClick={(e) => { e.stopPropagation(); check() }} disabled={chosen.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none',
                  cursor: chosen.length ? 'pointer' : 'default', background: chosen.length ? 'var(--accent)' : 'var(--surface-3)',
                  color: chosen.length ? 'var(--text-on-accent)' : 'var(--text-3)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                <Check size={15} /> Vérifier
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); reset() }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  cursor: 'pointer', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontFamily: 'inherit' }}>
                <RotateCcw size={14} /> Recommencer
              </button>
            )}
            {answered && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: accent }}>
                {status === 'correct' ? <><Check size={16} /> Correct !</> : <><XIcon size={16} /> Réessaie</>}
              </span>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  )
})

QcmElementComp.displayName = 'QcmElementComp'
export default QcmElementComp
