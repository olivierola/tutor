import React, { memo } from 'react'
import { RefreshCw } from 'lucide-react'
import type { FlashcardElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { useExerciseEvents } from '../../../agent/exerciseEvents'
import { inlineMd } from '../../../utils/markdown'

interface Props {
  element: FlashcardElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const FlashcardElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, height, front, back, flipped } = element
  const update = useCanvasStore(s => s.updateElement)
  const emit = useExerciseEvents(s => s.emit)

  const flip = () => {
    update(element.id, { flipped: !flipped })
    emit({ kind: 'flipped', elementId: element.id, elementType: 'flashcard', label: front })
  }

  const faceColor = flipped ? '#22c55e' : 'var(--accent)'

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={0} y={0} width={width} height={height} rx={14}
        fill="var(--surface-1)" stroke={isSelected ? '#3b82f6' : 'var(--border)'} strokeWidth={isSelected ? 2 : 1}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }} />
      <rect x={0} y={0} width={width} height={5} rx={2.5} fill={faceColor} style={{ pointerEvents: 'none' }} />

      <foreignObject x={0} y={0} width={width} height={height} style={{ overflow: 'hidden' }}>
        <div
          onClick={(e) => { e.stopPropagation(); flip() }}
          style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-sans)', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: faceColor, textTransform: 'uppercase', letterSpacing: '0.06em', position: 'absolute', top: 12, left: 16 }}>
            {flipped ? 'Réponse' : 'Carte'}
          </div>
          <div style={{ fontSize: flipped ? 15 : 16, fontWeight: flipped ? 500 : 600, color: 'var(--text-1)', lineHeight: 1.4 }}
            dangerouslySetInnerHTML={{ __html: inlineMd(flipped ? back : front) }} />
          <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-3)' }}>
            <RefreshCw size={11} /> retourner
          </div>
        </div>
      </foreignObject>
    </g>
  )
})

FlashcardElementComp.displayName = 'FlashcardElementComp'
export default FlashcardElementComp
