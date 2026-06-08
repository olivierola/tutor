import React, { memo, useMemo } from 'react'
import type { GridElement } from '../../../types/canvas'

interface Props {
  element: GridElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const GridElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, height, cellSize, variant, strokeColor, strokeWidth, bgColor, opacity, id } = element

  const w = Math.abs(width)
  const h = Math.abs(height)
  const ox = width < 0 ? x + width : x
  const oy = height < 0 ? y + height : y

  // Avoid rendering if too small
  if (w < 2 || h < 2) return null

  const patternId = `grid-pat-${id}`
  const clipId    = `grid-clip-${id}`
  const cs = Math.max(cellSize, 4)

  const patternContent = useMemo(() => {
    switch (variant) {
      case 'square':
        // Full square grid (horizontal + vertical lines)
        return (
          <>
            <line x1={cs} y1={0} x2={cs} y2={cs}
              stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1={0} y1={cs} x2={cs} y2={cs}
              stroke={strokeColor} strokeWidth={strokeWidth} />
          </>
        )
      case 'dot':
        return (
          <circle cx={cs} cy={cs} r={Math.max(0.8, strokeWidth * 0.8)}
            fill={strokeColor} />
        )
      case 'line-h':
        return (
          <line x1={0} y1={cs} x2={cs} y2={cs}
            stroke={strokeColor} strokeWidth={strokeWidth} />
        )
      case 'line-v':
        return (
          <line x1={cs} y1={0} x2={cs} y2={cs}
            stroke={strokeColor} strokeWidth={strokeWidth} />
        )
    }
  }, [variant, cs, strokeColor, strokeWidth])

  return (
    <g transform={`translate(${ox},${oy})`} onClick={onClick} style={{ opacity }}>
      <defs>
        <pattern id={patternId} x={0} y={0} width={cs} height={cs} patternUnits="userSpaceOnUse">
          {patternContent}
        </pattern>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={w} height={h} />
        </clipPath>
      </defs>

      {/* Background fill */}
      <rect x={0} y={0} width={w} height={h}
        fill={bgColor}
        rx={2}
      />

      {/* Grid pattern */}
      <rect x={0} y={0} width={w} height={h}
        fill={`url(#${patternId})`}
        clipPath={`url(#${clipId})`}
      />

      {/* Outer border */}
      <rect x={0} y={0} width={w} height={h}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        rx={2}
        style={{ pointerEvents: 'none' }}
      />

      {/* Invisible wider hit area */}
      <rect x={0} y={0} width={w} height={h}
        fill="transparent" stroke="transparent" strokeWidth={10}
      />

      {/* Selection */}
      {isSelected && (
        <rect x={-3} y={-3} width={w + 6} height={h + 6}
          fill="none"
          stroke="#d97706"
          strokeWidth={2}
          strokeDasharray="7 4"
          rx={4}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  )
})

GridElementComp.displayName = 'GridElementComp'
export default GridElementComp
