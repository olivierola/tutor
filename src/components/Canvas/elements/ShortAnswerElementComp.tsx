import React, { memo } from 'react'
import { Check, X as XIcon, RotateCcw, Lightbulb } from 'lucide-react'
import type { ShortAnswerElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { useExerciseEvents } from '../../../agent/exerciseEvents'
import { inlineMd } from '../../../utils/markdown'

interface Props {
  element: ShortAnswerElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(',', '.')
}

const ShortAnswerElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, question, answer, alternatives, unit, explanation, input, status } = element
  const update = useCanvasStore(s => s.updateElement)
  const emit = useExerciseEvents(s => s.emit)
  const answered = status !== 'unanswered'

  const qLines = Math.ceil(question.length / Math.max(18, (width - 32) / 8))
  const height = 44 + qLines * 22 + 48 + (answered && explanation ? 56 : 0) + 44

  const check = () => {
    if (!input.trim()) return
    const accepted = [answer, ...(alternatives ?? [])].map(norm)
    const ok = accepted.includes(norm(input))
    update(element.id, { status: ok ? 'correct' : 'incorrect' })
    emit({ kind: 'answered', elementId: element.id, elementType: 'short-answer', correct: ok, label: question })
  }
  const reset = () => update(element.id, { input: '', status: 'unanswered' })
  const accent = status === 'correct' ? '#22c55e' : status === 'incorrect' ? '#ef4444' : 'var(--accent)'

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={0} y={0} width={width} height={height} rx={12} fill="var(--surface-1)"
        stroke={isSelected ? '#3b82f6' : answered ? accent : 'var(--border)'} strokeWidth={isSelected || answered ? 2 : 1} />
      <rect x={0} y={0} width={4} height={height} fill={accent} rx={2} style={{ pointerEvents: 'none' }} />

      <foreignObject x={4} y={0} width={width - 4} height={height} style={{ overflow: 'visible' }}>
        <div
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: 'var(--font-sans)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Réponse courte
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10, lineHeight: 1.4 }}
            dangerouslySetInnerHTML={{ __html: inlineMd(question) }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input value={input} disabled={answered}
              onChange={(e) => update(element.id, { input: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); check() } }}
              placeholder="Ta réponse…"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 13,
                border: `1px solid ${answered ? accent : 'var(--border)'}`, background: 'var(--surface-2)', color: 'var(--text-1)', outline: 'none' }} />
            {unit && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{unit}</span>}
          </div>

          {answered && status === 'incorrect' && (
            <div style={{ fontSize: 12.5, color: '#22c55e', marginTop: 8 }}>Réponse attendue : <strong>{answer}{unit ? ` ${unit}` : ''}</strong></div>
          )}
          {answered && explanation && (
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45, display: 'flex', gap: 7 }}>
              <Lightbulb size={15} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
              <span dangerouslySetInnerHTML={{ __html: inlineMd(explanation) }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            {!answered ? (
              <button onClick={(e) => { e.stopPropagation(); check() }} disabled={!input.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none',
                  cursor: input.trim() ? 'pointer' : 'default', background: input.trim() ? 'var(--accent)' : 'var(--surface-3)',
                  color: input.trim() ? 'var(--text-on-accent)' : 'var(--text-3)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                <Check size={15} /> Vérifier
              </button>
            ) : (
              <>
                <button onClick={(e) => { e.stopPropagation(); reset() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontFamily: 'inherit' }}>
                  <RotateCcw size={14} /> Recommencer
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: accent }}>
                  {status === 'correct' ? <><Check size={16} /> Correct !</> : <><XIcon size={16} /> Incorrect</>}
                </span>
              </>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  )
})

ShortAnswerElementComp.displayName = 'ShortAnswerElementComp'
export default ShortAnswerElementComp
