import React, { memo } from 'react'
import type { AxesElement } from '../../../types/canvas'

interface Props {
  element: AxesElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const AxesElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const {
    x, y, xMin, xMax, yMin, yMax, xStep, yStep, unitSize,
    strokeColor, strokeWidth, showGrid, showLabels, xLabel, yLabel,
  } = element

  const W = (xMax - xMin) * unitSize
  const H = (yMax - yMin) * unitSize
  // Origin in local coords
  const ox = -xMin * unitSize
  const oy = yMax * unitSize

  const gridLines: React.ReactNode[] = []
  const ticks: React.ReactNode[] = []
  const labels: React.ReactNode[] = []

  // Vertical grid lines & x-axis ticks
  for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
    const lx = ox + v * unitSize
    if (showGrid) {
      gridLines.push(
        <line key={`gv${v}`} x1={lx} y1={0} x2={lx} y2={H}
          stroke={strokeColor} strokeWidth={strokeWidth * 0.25} opacity={0.25} />
      )
    }
    const tickLen = 6
    ticks.push(
      <line key={`tv${v}`} x1={lx} y1={oy - tickLen} x2={lx} y2={oy + tickLen}
        stroke={strokeColor} strokeWidth={strokeWidth} />
    )
    if (showLabels && v !== 0) {
      labels.push(
        <text key={`lv${v}`} x={lx} y={oy + tickLen + 14}
          textAnchor="middle" fontSize={Math.max(10, unitSize * 0.35)}
          fill={strokeColor} fontFamily="serif" style={{ pointerEvents: 'none' }}>
          {v}
        </text>
      )
    }
  }

  // Horizontal grid lines & y-axis ticks
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
    const ly = oy - v * unitSize
    if (showGrid) {
      gridLines.push(
        <line key={`gh${v}`} x1={0} y1={ly} x2={W} y2={ly}
          stroke={strokeColor} strokeWidth={strokeWidth * 0.25} opacity={0.25} />
      )
    }
    const tickLen = 6
    ticks.push(
      <line key={`th${v}`} x1={ox - tickLen} y1={ly} x2={ox + tickLen} y2={ly}
        stroke={strokeColor} strokeWidth={strokeWidth} />
    )
    if (showLabels && v !== 0) {
      labels.push(
        <text key={`lh${v}`} x={ox - tickLen - 6} y={ly}
          textAnchor="end" dominantBaseline="central"
          fontSize={Math.max(10, unitSize * 0.35)} fill={strokeColor}
          fontFamily="serif" style={{ pointerEvents: 'none' }}>
          {v}
        </text>
      )
    }
  }

  const arrowSize = strokeWidth * 4
  const fs = Math.max(12, unitSize * 0.45)

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}>
      {/* Hit area */}
      <rect x={0} y={0} width={W} height={H} fill="transparent" stroke="transparent" strokeWidth={10} />

      {/* Grid */}
      {gridLines}

      {/* X axis */}
      <line x1={0} y1={oy} x2={W} y2={oy} stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Y axis */}
      <line x1={ox} y1={0} x2={ox} y2={H} stroke={strokeColor} strokeWidth={strokeWidth} />

      {/* X arrowhead */}
      <polygon
        points={`${W},${oy} ${W - arrowSize},${oy - arrowSize / 2} ${W - arrowSize},${oy + arrowSize / 2}`}
        fill={strokeColor} style={{ pointerEvents: 'none' }}
      />
      {/* Y arrowhead */}
      <polygon
        points={`${ox},0 ${ox - arrowSize / 2},${arrowSize} ${ox + arrowSize / 2},${arrowSize}`}
        fill={strokeColor} style={{ pointerEvents: 'none' }}
      />

      {/* Ticks */}
      {ticks}

      {/* Labels */}
      {labels}

      {/* Axis labels */}
      {showLabels && (
        <>
          <text x={W + 6} y={oy} textAnchor="start" dominantBaseline="central"
            fontSize={fs} fill={strokeColor} fontFamily="serif" fontStyle="italic" style={{ pointerEvents: 'none' }}>
            {xLabel || 'x'}
          </text>
          <text x={ox} y={-8} textAnchor="middle"
            fontSize={fs} fill={strokeColor} fontFamily="serif" fontStyle="italic" style={{ pointerEvents: 'none' }}>
            {yLabel || 'y'}
          </text>
          {/* Origin label */}
          <text x={ox - 6} y={oy + 14} textAnchor="end"
            fontSize={Math.max(10, unitSize * 0.35)} fill={strokeColor} fontFamily="serif" style={{ pointerEvents: 'none' }}>
            O
          </text>
        </>
      )}

      {/* Selection */}
      {isSelected && (
        <rect x={0} y={0} width={W} height={H}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

AxesElementComp.displayName = 'AxesElementComp'
export default AxesElementComp
