import React, { memo, useMemo } from 'react'
import type { SpringElement } from '../../../types/canvas'

interface Props {
  element: SpringElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const SpringElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, x2, y2, coils, amplitude, strokeColor, strokeWidth } = element

  const dx = x2 - x
  const dy = y2 - y
  const len = Math.sqrt(dx * dx + dy * dy)

  if (len < 4) return null

  const angle = Math.atan2(dy, dx)

  // Spring path in local coords (along x-axis), then rotate
  const pathPoints = useMemo(() => {
    const endCapLen = len * 0.08
    const springLen = len - 2 * endCapLen
    const segLen = springLen / (coils * 2)
    const pts: string[] = [`M 0 0`, `L ${endCapLen} 0`]

    for (let i = 0; i < coils * 2; i++) {
      const px = endCapLen + (i + 0.5) * segLen
      const py = (i % 2 === 0 ? -1 : 1) * amplitude
      pts.push(`L ${px} ${py}`)
    }
    pts.push(`L ${len - endCapLen} 0`, `L ${len} 0`)
    return pts.join(' ')
  }, [len, coils, amplitude])

  // Bounding box for hit area
  const hw = amplitude + strokeWidth + 6

  return (
    <g
      transform={`translate(${x},${y}) rotate(${angle * 180 / Math.PI})`}
      onClick={onClick}
    >
      {/* Hit area */}
      <rect x={0} y={-hw} width={len} height={hw * 2} fill="transparent" stroke="transparent" />

      {/* Attachment points */}
      <circle cx={0} cy={0} r={strokeWidth * 2} fill={strokeColor} style={{ pointerEvents: 'none' }} />
      <circle cx={len} cy={0} r={strokeWidth * 2} fill={strokeColor} style={{ pointerEvents: 'none' }} />

      {/* Spring path */}
      <path d={pathPoints} stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />

      {/* Selection */}
      {isSelected && (
        <rect x={0} y={-hw} width={len} height={hw * 2}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

SpringElementComp.displayName = 'SpringElementComp'
export default SpringElementComp
