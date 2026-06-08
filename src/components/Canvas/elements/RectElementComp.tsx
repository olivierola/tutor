import React, { memo } from 'react'
import type { RectElement } from '../../../types/canvas'

interface Props {
  element: RectElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const RectElementComp = memo(({ element, isSelected, onClick }: Props) => {
  // Normalize negative dimensions
  const x = element.width >= 0 ? element.x : element.x + element.width
  const y = element.height >= 0 ? element.y : element.y + element.height
  const w = Math.abs(element.width)
  const h = Math.abs(element.height)
  const r = element.borderRadius ?? 0

  return (
    <g
      onClick={onClick}
      style={{
        cursor: 'move',
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        transformOrigin: `${x + w / 2}px ${y + h / 2}px`,
      }}
    >
      {isSelected && (
        <rect
          x={x - 3} y={y - 3}
          width={w + 6} height={h + 6}
          rx={r + 3}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 3"
          opacity={0.7}
          style={{ pointerEvents: 'none' }}
        />
      )}
      <rect
        x={x} y={y}
        width={w} height={h}
        rx={r}
        fill={element.fill}
        stroke={element.strokeColor}
        strokeWidth={element.strokeWidth}
      />
    </g>
  )
})

RectElementComp.displayName = 'RectElementComp'
export default RectElementComp
