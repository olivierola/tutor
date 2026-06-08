import React, { memo } from 'react'
import type { TriangleElement } from '../../../types/canvas'

interface Props {
  element: TriangleElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

function angleBetween(a: [number, number], b: [number, number], c: [number, number]): number {
  const ab = [b[0] - a[0], b[1] - a[1]]
  const ac = [c[0] - a[0], c[1] - a[1]]
  const dot = ab[0] * ac[0] + ab[1] * ac[1]
  const mag = Math.sqrt(ab[0] ** 2 + ab[1] ** 2) * Math.sqrt(ac[0] ** 2 + ac[1] ** 2)
  return Math.round((Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI)
}

function sideLength(a: [number, number], b: [number, number]): number {
  return Math.round(Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2))
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
}

// Offset point away from triangle interior for label placement
function labelOffset(mid: [number, number], centroid: [number, number], dist = 14): [number, number] {
  const dx = mid[0] - centroid[0]
  const dy = mid[1] - centroid[1]
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return [mid[0] + (dx / len) * dist, mid[1] + (dy / len) * dist]
}

const TriangleElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, v1, v2, v3, fill, strokeColor, strokeWidth, showAngles, showSides } = element

  // Absolute positions
  const A: [number, number] = [x + v1[0], y + v1[1]]
  const B: [number, number] = [x + v2[0], y + v2[1]]
  const C: [number, number] = [x + v3[0], y + v3[1]]

  const pts = `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`
  const centroid: [number, number] = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3]

  const angleA = angleBetween(A, B, C)
  const angleB = angleBetween(B, A, C)
  const angleC = angleBetween(C, A, B)

  const fs = strokeWidth * 5 + 10   // font size proportional to stroke

  return (
    <g onClick={onClick}>
      {/* Hit area */}
      <polygon points={pts} fill="transparent" stroke="transparent" strokeWidth={Math.max(strokeWidth + 8, 10)} />

      {/* Fill */}
      <polygon points={pts} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />

      {/* Selection outline */}
      {isSelected && (
        <polygon
          points={pts}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth + 3}
          strokeDasharray="6 3"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Angle labels */}
      {showAngles && (
        <g style={{ pointerEvents: 'none' }} fontSize={fs} textAnchor="middle" dominantBaseline="central" fill={strokeColor} fontFamily="sans-serif">
          <text x={A[0]} y={A[1] - 10}>{angleA}°</text>
          <text x={B[0] + 12} y={B[1]}>{angleB}°</text>
          <text x={C[0] - 12} y={C[1]}>{angleC}°</text>
        </g>
      )}

      {/* Side length labels */}
      {showSides && (
        <g style={{ pointerEvents: 'none' }} fontSize={fs} textAnchor="middle" dominantBaseline="central" fill={strokeColor} fontFamily="sans-serif">
          {(() => {
            const mAB = midpoint(A, B)
            const lAB = labelOffset(mAB, centroid)
            const mBC = midpoint(B, C)
            const lBC = labelOffset(mBC, centroid)
            const mCA = midpoint(C, A)
            const lCA = labelOffset(mCA, centroid)
            return (
              <>
                <text x={lAB[0]} y={lAB[1]}>{sideLength(A, B)}</text>
                <text x={lBC[0]} y={lBC[1]}>{sideLength(B, C)}</text>
                <text x={lCA[0]} y={lCA[1]}>{sideLength(C, A)}</text>
              </>
            )
          })()}
        </g>
      )}
    </g>
  )
})

TriangleElementComp.displayName = 'TriangleElementComp'
export default TriangleElementComp
