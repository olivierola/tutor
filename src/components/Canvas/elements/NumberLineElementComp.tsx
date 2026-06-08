import React, { memo } from 'react'
import type { NumberLineElement } from '../../../types/canvas'

interface Props {
  element: NumberLineElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const NumberLineElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, min, max, step, length, strokeColor, strokeWidth, marked } = element

  const range = max - min
  const unitLen = length / range
  const arrowSz = strokeWidth * 3.5
  const tickH = 10

  const ticks: React.ReactNode[] = []
  const labels: React.ReactNode[] = []
  const dots: React.ReactNode[] = []

  for (let v = min; v <= max; v += step) {
    const px = (v - min) * unitLen
    ticks.push(
      <line key={`t${v}`}
        x1={px} y1={-tickH / 2} x2={px} y2={tickH / 2}
        stroke={strokeColor} strokeWidth={strokeWidth} />
    )
    labels.push(
      <text key={`l${v}`}
        x={px} y={tickH / 2 + 14}
        textAnchor="middle" fontSize={Math.max(10, strokeWidth * 4)}
        fill={strokeColor} fontFamily="serif">
        {v}
      </text>
    )
  }

  // Marked points
  for (const v of marked) {
    const px = (v - min) * unitLen
    dots.push(
      <circle key={`m${v}`} cx={px} cy={0} r={strokeWidth * 2.5}
        fill={strokeColor} style={{ pointerEvents: 'none' }} />
    )
  }

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Hit area */}
      <rect x={-arrowSz} y={-tickH - 4} width={length + arrowSz * 2} height={tickH * 2 + 8}
        fill="transparent" stroke="transparent" />

      {/* Main line */}
      <line x1={0} y1={0} x2={length} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} />

      {/* Arrowheads */}
      <polygon points={`${length + arrowSz},0 ${length},${-arrowSz / 2} ${length},${arrowSz / 2}`}
        fill={strokeColor} style={{ pointerEvents: 'none' }} />
      <polygon points={`${-arrowSz},0 0,${-arrowSz / 2} 0,${arrowSz / 2}`}
        fill={strokeColor} style={{ pointerEvents: 'none' }} />

      {/* Ticks & Labels */}
      {ticks}
      {labels}

      {/* Marked points */}
      {dots}

      {/* Selection */}
      {isSelected && (
        <rect x={-arrowSz} y={-tickH - 4} width={length + arrowSz * 2} height={tickH * 2 + 8}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3"
          style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

NumberLineElementComp.displayName = 'NumberLineElementComp'
export default NumberLineElementComp
