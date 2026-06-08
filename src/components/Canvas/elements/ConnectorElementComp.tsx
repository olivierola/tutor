import React, { memo, useMemo } from 'react'
import type { ConnectorElement, CanvasElement } from '../../../types/canvas'

interface Props {
  element: ConnectorElement
  elements: CanvasElement[]   // full list to resolve fromId / toId
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

// Centre d'un élément (approximatif)
function elementCenter(el: CanvasElement): { x: number; y: number } {
  switch (el.type) {
    case 'circle':      return { x: el.x, y: el.y }
    case 'atom':        return { x: el.x, y: el.y }
    case 'benzene-ring':return { x: el.x, y: el.y }
    case 'lens':        return { x: el.x, y: el.y }
    case 'rect':        return { x: el.x + el.width / 2,  y: el.y + el.height / 2 }
    case 'grid':        return { x: el.x + el.width / 2,  y: el.y + el.height / 2 }
    case 'triangle':    return { x: el.x + (el.v1[0] + el.v2[0] + el.v3[0]) / 3, y: el.y + (el.v1[1] + el.v2[1] + el.v3[1]) / 3 }
    case 'axes':        return { x: el.x, y: el.y }
    case 'inclined-plane': return { x: el.x + el.width / 2, y: el.y + (el.width * Math.tan(el.angle * Math.PI / 180)) / 2 }
    case 'circuit-component': return { x: el.x, y: el.y }
    case 'spring':
    case 'line':
    case 'arrow':
    case 'force-vector':
    case 'bond':
      return { x: (el.x + el.x2) / 2, y: (el.y + el.y2) / 2 }
    default:
      return { x: el.x, y: el.y }
  }
}

// Génère le path d'un ressort entre deux points
function springPath(x1: number, y1: number, x2: number, y2: number, coils: number, amplitude: number): string {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 4) return `M ${x1} ${y1} L ${x2} ${y2}`
  const endCap = len * 0.08
  const springLen = len - 2 * endCap
  const segLen = springLen / (coils * 2)
  // local coords then rotate
  const pts: string[] = [`M 0 0`, `L ${endCap} 0`]
  for (let i = 0; i < coils * 2; i++) {
    const px = endCap + (i + 0.5) * segLen
    const py = (i % 2 === 0 ? -1 : 1) * amplitude
    pts.push(`L ${px} ${py}`)
  }
  pts.push(`L ${len - endCap} 0`, `L ${len} 0`)
  const localPath = pts.join(' ')
  // We embed transform on the <g>
  return localPath
}

const ConnectorElementComp: React.FC<Props> = memo(({ element, elements, isSelected, onClick }) => {
  const { x, y, x2, y2, fromId, toId, connectorType, color, strokeWidth, label, coils = 8, amplitude = 12 } = element

  // Resolve actual endpoints
  const fromEl = elements.find(e => e.id === fromId)
  const toEl   = elements.find(e => e.id === toId)

  const from = fromEl ? elementCenter(fromEl) : { x, y }
  const to   = toEl   ? elementCenter(toEl)   : { x: x2, y: y2 }

  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)

  const body = useMemo(() => {
    if (len < 2) return null

    switch (connectorType) {
      case 'wire':
        return (
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        )
      case 'double-wire':
        return (
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={color} strokeWidth={strokeWidth * 2.5} strokeLinecap="round"
            strokeOpacity={0.35} />
        )
      case 'dashed':
        return (
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={`${strokeWidth * 4} ${strokeWidth * 3}`} />
        )
      case 'rod': {
        const rodAngle = Math.atan2(dy, dx) * 180 / Math.PI
        const hw = strokeWidth * 2
        return (
          <g transform={`translate(${from.x},${from.y}) rotate(${rodAngle})`}>
            <rect x={0} y={-hw / 2} width={len} height={hw}
              fill={color} rx={hw / 2} />
            {/* end caps */}
            <circle cx={0}   cy={0} r={hw * 0.8} fill={color} />
            <circle cx={len} cy={0} r={hw * 0.8} fill={color} />
          </g>
        )
      }
      case 'spring': {
        const angle = Math.atan2(dy, dx)
        const pathD = springPath(0, 0, len, 0, coils, amplitude)
        return (
          <g transform={`translate(${from.x},${from.y}) rotate(${angle * 180 / Math.PI})`}>
            <path d={pathD} stroke={color} strokeWidth={strokeWidth}
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={0}   cy={0} r={strokeWidth * 1.8} fill={color} />
            <circle cx={len} cy={0} r={strokeWidth * 1.8} fill={color} />
          </g>
        )
      }
    }
  }, [connectorType, from, to, color, strokeWidth, len, coils, amplitude, dx, dy])

  if (!body) return null

  // Midpoint for label
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const nx = -dy / (len || 1)
  const ny = dx / (len || 1)

  return (
    <g onClick={onClick}>
      {/* Hit area */}
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke="transparent" strokeWidth={Math.max(strokeWidth + 14, 18)} />

      {body}

      {/* Label */}
      {label && (
        <text
          x={mx + nx * 16} y={my + ny * 16}
          textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(11, strokeWidth * 4)}
          fill={color} fontFamily="sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}

      {/* Selection */}
      {isSelected && (
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke="#d97706" strokeWidth={strokeWidth + 4} strokeDasharray="6 3"
          style={{ pointerEvents: 'none' }} />
      )}

      {/* Endpoint dots when selected */}
      {isSelected && (
        <>
          <circle cx={from.x} cy={from.y} r={6} fill="#d97706" opacity={0.7} style={{ pointerEvents: 'none' }} />
          <circle cx={to.x}   cy={to.y}   r={6} fill="#d97706" opacity={0.7} style={{ pointerEvents: 'none' }} />
        </>
      )}
    </g>
  )
})

ConnectorElementComp.displayName = 'ConnectorElementComp'
export default ConnectorElementComp
