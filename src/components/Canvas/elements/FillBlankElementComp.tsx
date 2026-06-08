import React, { memo } from 'react'
import { Check, X as XIcon, RotateCcw } from 'lucide-react'
import type { FillBlankElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { useExerciseEvents } from '../../../agent/exerciseEvents'

interface Props {
  element: FillBlankElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

type Seg = { text: string } | { blank: number; answer: string }

/** Parse "a {{b}} c" into [text a][blank b][text c]. */
function parse(template: string): { segs: Seg[]; answers: string[] } {
  const segs: Seg[] = []
  const answers: string[] = []
  const re = /\{\{([^}]*)\}\}/g
  let last = 0, m: RegExpExecArray | null, bi = 0
  while ((m = re.exec(template))) {
    if (m.index > last) segs.push({ text: template.slice(last, m.index) })
    segs.push({ blank: bi, answer: m[1].trim() })
    answers.push(m[1].trim())
    bi++; last = re.lastIndex
  }
  if (last < template.length) segs.push({ text: template.slice(last) })
  return { segs, answers }
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

const FillBlankElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, template, filled, status } = element
  const update = useCanvasStore(s => s.updateElement)
  const emit = useExerciseEvents(s => s.emit)
  const answered = status !== 'unanswered'
  const { segs, answers } = parse(template)

  const setBlank = (i: number, v: string) => {
    const next = [...filled]
    while (next.length < answers.length) next.push('')
    next[i] = v
    update(element.id, { filled: next })
  }

  const check = () => {
    const ok = answers.every((a, i) => norm(filled[i] ?? '') === norm(a))
    update(element.id, { status: ok ? 'correct' : 'incorrect' })
    emit({ kind: 'answered', elementId: element.id, elementType: 'fill-blank', correct: ok, label: 'Texte à trous' })
  }
  const reset = () => update(element.id, { filled: answers.map(() => ''), status: 'unanswered' })
  const accent = status === 'correct' ? '#22c55e' : status === 'incorrect' ? '#ef4444' : 'var(--accent)'

  // estimate height
  const approxLen = template.replace(/\{\{|\}\}/g, '').length
  const lines = Math.max(1, Math.ceil(approxLen / Math.max(20, (width - 32) / 8)))
  const height = 40 + lines * 30 + 44

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={0} y={0} width={width} height={height} rx={12} fill="var(--surface-1)"
        stroke={isSelected ? '#3b82f6' : answered ? accent : 'var(--border)'} strokeWidth={isSelected || answered ? 2 : 1} />
      <rect x={0} y={0} width={4} height={height} fill={accent} rx={2} style={{ pointerEvents: 'none' }} />

      <foreignObject x={4} y={0} width={width - 4} height={height} style={{ overflow: 'visible' }}>
        <div
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: 'var(--font-sans)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Texte à trous
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
            {segs.map((s, k) => 'text' in s
              ? <span key={k} style={{ whiteSpace: 'pre-wrap' }}>{s.text}</span>
              : (() => {
                  const v = filled[s.blank] ?? ''
                  const ok = answered && norm(v) === norm(s.answer)
                  const bd = answered ? (ok ? '#22c55e' : '#ef4444') : 'var(--accent)'
                  return (
                    <input key={k} value={v} disabled={answered}
                      onChange={(e) => setBlank(s.blank, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: `${Math.max(60, s.answer.length * 10)}px`, padding: '2px 6px', fontSize: 13,
                        borderRadius: 6, border: `1px solid ${bd}`, borderBottom: `2px solid ${bd}`,
                        background: 'var(--surface-2)', color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit' }} />
                  )
                })()
            )}
          </div>
          {answered && status === 'incorrect' && (
            <div style={{ fontSize: 12, color: '#22c55e', marginTop: 8 }}>Attendu : {answers.map((a, i) => <strong key={i}>{a}{i < answers.length - 1 ? ', ' : ''}</strong>)}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            {!answered ? (
              <button onClick={(e) => { e.stopPropagation(); check() }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: 'var(--text-on-accent)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                <Check size={15} /> Vérifier
              </button>
            ) : (
              <>
                <button onClick={(e) => { e.stopPropagation(); reset() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontFamily: 'inherit' }}>
                  <RotateCcw size={14} /> Recommencer
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: accent }}>
                  {status === 'correct' ? <><Check size={16} /> Bravo !</> : <><XIcon size={16} /> À revoir</>}
                </span>
              </>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  )
})

FillBlankElementComp.displayName = 'FillBlankElementComp'
export default FillBlankElementComp
