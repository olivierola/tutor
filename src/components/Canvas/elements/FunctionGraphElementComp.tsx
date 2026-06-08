import React, { memo, useMemo } from 'react'
import type { FunctionGraphElement } from '../../../types/canvas'

interface Props {
  element: FunctionGraphElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

// Safe math expression evaluator (only pure math, no side effects)
function evalExpr(expr: string, xVal: number): number | null {
  try {
    // Replace ^ with ** for exponentiation
    const sanitized = expr
      .replace(/\^/g, '**')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\blog\b/g, 'Math.log10')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
    // eslint-disable-next-line no-new-func
    const fn = new Function('x', `"use strict"; return (${sanitized})`)
    const result = fn(xVal)
    if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) return null
    return result
  } catch {
    return null
  }
}

const FunctionGraphElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, expression, xMin, xMax, unitSize, color, strokeWidth, showAxes, label } = element

  const STEPS = 400

  const pathData = useMemo(() => {
    const points: string[] = []
    let penUp = true
    for (let i = 0; i <= STEPS; i++) {
      const xVal = xMin + (i / STEPS) * (xMax - xMin)
      const yVal = evalExpr(expression, xVal)
      if (yVal === null || Math.abs(yVal) > 1e6) {
        penUp = true
        continue
      }
      const px = xVal * unitSize
      const py = -yVal * unitSize
      if (penUp) {
        points.push(`M ${px} ${py}`)
        penUp = false
      } else {
        points.push(`L ${px} ${py}`)
      }
    }
    return points.join(' ')
  }, [expression, xMin, xMax, unitSize])

  const W = (xMax - xMin) * unitSize
  const ox = -xMin * unitSize
  // Find y range from evaluation
  const yValues: number[] = []
  for (let i = 0; i <= 50; i++) {
    const xVal = xMin + (i / 50) * (xMax - xMin)
    const v = evalExpr(expression, xVal)
    if (v !== null) yValues.push(v)
  }
  const yMax = yValues.length ? Math.max(...yValues) : 5
  const yMin = yValues.length ? Math.min(...yValues) : -5
  const H = Math.max((yMax - yMin) * unitSize, 50)
  const oy = yMax * unitSize

  const arrowSz = strokeWidth * 3.5

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Background hit area */}
      <rect x={0} y={0} width={W} height={H} fill="transparent" stroke="transparent" strokeWidth={12} />

      {/* Axes */}
      {showAxes && (
        <>
          {/* x-axis */}
          <line x1={0} y1={oy} x2={W} y2={oy} stroke="#94a3b8" strokeWidth={strokeWidth * 0.7} />
          <polygon points={`${W},${oy} ${W - arrowSz},${oy - arrowSz / 2} ${W - arrowSz},${oy + arrowSz / 2}`} fill="#94a3b8" />
          {/* y-axis */}
          {ox >= 0 && ox <= W && (
            <>
              <line x1={ox} y1={0} x2={ox} y2={H} stroke="#94a3b8" strokeWidth={strokeWidth * 0.7} />
              <polygon points={`${ox},0 ${ox - arrowSz / 2},${arrowSz} ${ox + arrowSz / 2},${arrowSz}`} fill="#94a3b8" />
            </>
          )}
          {/* Axis labels */}
          <text x={W + 6} y={oy} dominantBaseline="central" fontSize={12} fill="#94a3b8" fontStyle="italic" style={{ pointerEvents: 'none' }}>x</text>
          {ox >= 0 && ox <= W && (
            <text x={ox + 6} y={8} fontSize={12} fill="#94a3b8" fontStyle="italic" style={{ pointerEvents: 'none' }}>y</text>
          )}
        </>
      )}

      {/* Clip path */}
      <clipPath id={`clip-${element.id}`}>
        <rect x={0} y={0} width={W} height={H} />
      </clipPath>

      {/* Function curve */}
      <g transform={`translate(${ox},${oy})`} clipPath={`url(#clip-${element.id})`}>
        <path d={pathData} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Expression label */}
      {label !== undefined ? (
        <text x={W - 4} y={16} textAnchor="end" fontSize={13} fill={color} fontStyle="italic" fontFamily="serif" style={{ pointerEvents: 'none' }}>
          {label}
        </text>
      ) : (
        <text x={W - 4} y={16} textAnchor="end" fontSize={12} fill={color} fontFamily="monospace" style={{ pointerEvents: 'none' }}>
          f(x) = {expression}
        </text>
      )}

      {/* Selection */}
      {isSelected && (
        <rect x={0} y={0} width={W} height={H}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

FunctionGraphElementComp.displayName = 'FunctionGraphElementComp'
export default FunctionGraphElementComp
