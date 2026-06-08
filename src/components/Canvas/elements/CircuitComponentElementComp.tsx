import React, { memo } from 'react'
import type { CircuitComponentElement } from '../../../types/canvas'

interface Props {
  element: CircuitComponentElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

// All symbols drawn in a normalized [-w/2, w/2] × [-h/2, h/2] box
// Connection wire terminals at x = -w/2 and x = w/2, y = 0

function ResistorSymbol({ w, h, color, sw }: { w: number; h: number; color: string; sw: number }) {
  const bx = w * 0.25
  const bw = w * 0.5
  const bh = h * 0.55
  return (
    <g>
      <line x1={-w / 2} y1={0} x2={-bx} y2={0} stroke={color} strokeWidth={sw} />
      <rect x={-bx} y={-bh / 2} width={bw} height={bh} fill="none" stroke={color} strokeWidth={sw} />
      <line x1={bx} y1={0} x2={w / 2} y2={0} stroke={color} strokeWidth={sw} />
    </g>
  )
}

function BatterySymbol({ w, h, color, sw }: { w: number; h: number; color: string; sw: number }) {
  const gap = w * 0.08
  const tallH = h * 0.7
  const shortH = h * 0.45
  return (
    <g>
      <line x1={-w / 2} y1={0} x2={-gap} y2={0} stroke={color} strokeWidth={sw} />
      <line x1={-gap} y1={-tallH / 2} x2={-gap} y2={tallH / 2} stroke={color} strokeWidth={sw * 1.5} />
      <line x1={gap} y1={-shortH / 2} x2={gap} y2={shortH / 2} stroke={color} strokeWidth={sw} />
      <line x1={gap} y1={0} x2={w / 2} y2={0} stroke={color} strokeWidth={sw} />
      {/* + and - labels */}
      <text x={-gap - 8} y={-tallH / 2 - 4} fontSize={10} fill={color} textAnchor="middle">−</text>
      <text x={gap + 8} y={-shortH / 2 - 4} fontSize={10} fill={color} textAnchor="middle">+</text>
    </g>
  )
}

function BulbSymbol({ w, h, color, sw, lit }: { w: number; h: number; color: string; sw: number; lit: boolean }) {
  const r = Math.min(w, h) * 0.3
  const glow = '#fbbf24'
  return (
    <g>
      {/* halo when lit */}
      {lit && (
        <>
          <circle cx={0} cy={0} r={r * 2.2} fill={glow} opacity={0.18}>
            <animate attributeName="opacity" values="0.10;0.28;0.10" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={0} cy={0} r={r * 1.4} fill={glow} opacity={0.3} />
        </>
      )}
      <line x1={-w / 2} y1={0} x2={-r} y2={0} stroke={color} strokeWidth={sw} />
      <circle cx={0} cy={0} r={r} fill={lit ? glow : 'none'} fillOpacity={lit ? 0.85 : 0} stroke={lit ? glow : color} strokeWidth={sw} />
      {/* filament cross */}
      <line x1={-r * 0.5} y1={-r * 0.5} x2={r * 0.5} y2={r * 0.5} stroke={lit ? '#b45309' : color} strokeWidth={sw * 0.8} />
      <line x1={r * 0.5} y1={-r * 0.5} x2={-r * 0.5} y2={r * 0.5} stroke={lit ? '#b45309' : color} strokeWidth={sw * 0.8} />
      <line x1={r} y1={0} x2={w / 2} y2={0} stroke={color} strokeWidth={sw} />
    </g>
  )
}

function SwitchSymbol({ w, h, color, sw, open }: { w: number; h: number; color: string; sw: number; open: boolean }) {
  const px = w * 0.25
  return (
    <g>
      <line x1={-w / 2} y1={0} x2={-px} y2={0} stroke={color} strokeWidth={sw} />
      <circle cx={-px} cy={0} r={sw + 1} fill={color} />
      <circle cx={px} cy={0} r={sw + 1} fill={color} />
      {open
        ? <line x1={-px} y1={0} x2={px} y2={-h * 0.4} stroke={color} strokeWidth={sw} />
        : <line x1={-px} y1={0} x2={px} y2={0} stroke={color} strokeWidth={sw} />
      }
      <line x1={px} y1={0} x2={w / 2} y2={0} stroke={color} strokeWidth={sw} />
    </g>
  )
}

function CapacitorSymbol({ w, h, color, sw }: { w: number; h: number; color: string; sw: number }) {
  const gap = w * 0.07
  const plateH = h * 0.65
  return (
    <g>
      <line x1={-w / 2} y1={0} x2={-gap} y2={0} stroke={color} strokeWidth={sw} />
      <line x1={-gap} y1={-plateH / 2} x2={-gap} y2={plateH / 2} stroke={color} strokeWidth={sw * 2} />
      <line x1={gap} y1={-plateH / 2} x2={gap} y2={plateH / 2} stroke={color} strokeWidth={sw * 2} />
      <line x1={gap} y1={0} x2={w / 2} y2={0} stroke={color} strokeWidth={sw} />
    </g>
  )
}

function GroundSymbol({ w, h, color, sw }: { w: number; h: number; color: string; sw: number }) {
  const lines = [1, 0.66, 0.33]
  return (
    <g>
      <line x1={0} y1={-h / 2} x2={0} y2={0} stroke={color} strokeWidth={sw} />
      {lines.map((scale, i) => (
        <line key={i}
          x1={-w / 2 * scale} y1={h * i * 0.22}
          x2={w / 2 * scale} y2={h * i * 0.22}
          stroke={color} strokeWidth={sw} />
      ))}
    </g>
  )
}

function MeterSymbol({ w, h, color, sw, letter }: { w: number; h: number; color: string; sw: number; letter: string }) {
  const r = Math.min(w, h) * 0.38
  return (
    <g>
      <line x1={-w / 2} y1={0} x2={-r} y2={0} stroke={color} strokeWidth={sw} />
      <circle cx={0} cy={0} r={r} fill="none" stroke={color} strokeWidth={sw} />
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={r * 1.1} fill={color} fontFamily="sans-serif" fontWeight="bold">{letter}</text>
      <line x1={r} y1={0} x2={w / 2} y2={0} stroke={color} strokeWidth={sw} />
    </g>
  )
}

const CircuitComponentElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, rotation, component, width, strokeColor, strokeWidth, label, value, energized } = element
  const h = width * 0.45
  const isSwitch = component === 'switch-open' || component === 'switch-closed'

  const renderSymbol = () => {
    switch (component) {
      case 'resistor': return <ResistorSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} />
      case 'battery': return <BatterySymbol w={width} h={h} color={strokeColor} sw={strokeWidth} />
      case 'bulb': return <BulbSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} lit={!!energized} />
      case 'switch-open': return <SwitchSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} open={true} />
      case 'switch-closed': return <SwitchSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} open={false} />
      case 'capacitor': return <CapacitorSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} />
      case 'ground': return <GroundSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} />
      case 'voltmeter': return <MeterSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} letter="V" />
      case 'ammeter': return <MeterSymbol w={width} h={h} color={strokeColor} sw={strokeWidth} letter="A" />
    }
  }

  return (
    <g transform={`translate(${x},${y}) rotate(${rotation})`} onClick={onClick}
      style={{ cursor: isSwitch ? 'pointer' : undefined }}>
      {/* Hit area */}
      <rect x={-width / 2 - 6} y={-h / 2 - 6} width={width + 12} height={h + 12} fill="transparent" stroke="transparent" />

      {renderSymbol()}

      {/* Value label */}
      {value && (
        <text x={0} y={-h / 2 - 6} textAnchor="middle" fontSize={11} fill={strokeColor}
          fontFamily="monospace" style={{ pointerEvents: 'none' }}>
          {value}
        </text>
      )}
      {/* Name label */}
      {label && (
        <text x={0} y={h / 2 + 16} textAnchor="middle" fontSize={11} fill={strokeColor}
          fontFamily="sans-serif" style={{ pointerEvents: 'none' }}>
          {label}
        </text>
      )}

      {/* Selection */}
      {isSelected && (
        <rect x={-width / 2 - 6} y={-h / 2 - 6} width={width + 12} height={h + 12}
          fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

CircuitComponentElementComp.displayName = 'CircuitComponentElementComp'
export default CircuitComponentElementComp
