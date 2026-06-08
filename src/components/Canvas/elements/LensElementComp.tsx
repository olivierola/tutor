import React, { memo } from 'react'
import type { LensElement } from '../../../types/canvas'

interface Props {
  element: LensElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const LensElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, height, focalLength, strokeColor, strokeWidth, showFocalPoints, showAxis } = element

  const converging = focalLength > 0
  const r = height   // half-height of lens
  const bulge = Math.abs(focalLength) * 0.15 + 8

  // Lens shape using two cubic bezier arcs
  // Converging: biconvex (both sides curved outward)
  // Diverging: biconcave (both sides curved inward)
  const sign = converging ? 1 : -1

  // Top: (0, -r), Bottom: (0, r), left arc from top to bottom via (-sign*bulge, 0), right arc via (+sign*bulge, 0)
  const lensPath = `
    M 0 ${-r}
    C ${-sign * bulge} ${-r * 0.6} ${-sign * bulge} ${r * 0.6} 0 ${r}
    C ${sign * bulge} ${r * 0.6} ${sign * bulge} ${-r * 0.6} 0 ${-r}
    Z
  `

  const axisLen = Math.abs(focalLength) * 2.5 + r * 2
  const fl = Math.abs(focalLength)
  const arrowSz = 6

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Optical axis */}
      {showAxis && (
        <>
          <line x1={-axisLen / 2} y1={0} x2={axisLen / 2} y2={0}
            stroke="#94a3b8" strokeWidth={strokeWidth * 0.5} strokeDasharray="8 4"
            style={{ pointerEvents: 'none' }} />
          <polygon points={`${axisLen / 2},0 ${axisLen / 2 - arrowSz},${-arrowSz / 2} ${axisLen / 2 - arrowSz},${arrowSz / 2}`}
            fill="#94a3b8" style={{ pointerEvents: 'none' }} />
        </>
      )}

      {/* Focal points */}
      {showFocalPoints && (
        <>
          <circle cx={converging ? fl : -fl} cy={0} r={4} fill={converging ? '#22c55e' : '#ef4444'}
            style={{ pointerEvents: 'none' }} />
          <circle cx={converging ? -fl : fl} cy={0} r={4} fill={converging ? '#22c55e' : '#ef4444'}
            style={{ pointerEvents: 'none' }} />
          <text x={converging ? fl : -fl} y={-10} textAnchor="middle" fontSize={11}
            fill={converging ? '#22c55e' : '#ef4444'} fontStyle="italic" fontFamily="serif"
            style={{ pointerEvents: 'none' }}>F</text>
          <text x={converging ? -fl : fl} y={-10} textAnchor="middle" fontSize={11}
            fill={converging ? '#22c55e' : '#ef4444'} fontStyle="italic" fontFamily="serif"
            style={{ pointerEvents: 'none' }}>F'</text>
        </>
      )}

      {/* Lens hit area */}
      <path d={lensPath} fill="transparent" stroke="transparent" strokeWidth={Math.max(8, strokeWidth + 6)} />

      {/* Lens shape */}
      <path d={lensPath}
        fill="rgba(147, 210, 255, 0.25)"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Arrows on lens axis (converging = inward, diverging = outward) */}
      <polygon
        points={`0,${-r - arrowSz - 4} ${-arrowSz / 2},${-r} ${arrowSz / 2},${-r}`}
        fill={strokeColor} style={{ pointerEvents: 'none' }}
      />
      <polygon
        points={`0,${r + arrowSz + 4} ${-arrowSz / 2},${r} ${arrowSz / 2},${r}`}
        fill={strokeColor} style={{ pointerEvents: 'none' }}
      />

      {/* Type label */}
      <text x={0} y={r + arrowSz + 18} textAnchor="middle" fontSize={11} fill={strokeColor}
        fontFamily="sans-serif" style={{ pointerEvents: 'none' }}>
        {converging ? 'Convergente' : 'Divergente'} (f={focalLength > 0 ? '+' : ''}{focalLength})
      </text>

      {/* Selection */}
      {isSelected && (
        <ellipse cx={0} cy={0} rx={bulge + 4} ry={r + 4}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

LensElementComp.displayName = 'LensElementComp'
export default LensElementComp
