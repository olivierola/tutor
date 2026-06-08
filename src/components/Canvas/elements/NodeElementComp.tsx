import React, { memo, useState } from 'react'
import type { NodeElement, NodeShape } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { glyphIcon } from './nodeGlyphs'

interface Props {
  element: NodeElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

/** Build the body path/shape for a given node shape. */
function ShapeBody({ shape, w, h, fill, accent, sw }: {
  shape: NodeShape; w: number; h: number; fill: string; accent: string; sw: number
}) {
  const common = { fill, stroke: accent, strokeWidth: sw } as const
  switch (shape) {
    case 'circle':
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...common} />
    case 'pill':
      return <rect x={0} y={0} width={w} height={h} rx={h / 2} ry={h / 2} {...common} />
    case 'rounded':
    case 'card':
    case 'note':
      return <rect x={0} y={0} width={w} height={h} rx={10} ry={10} {...common} />
    case 'diamond':
      return <polygon points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`} {...common} />
    case 'hexagon': {
      const i = h * 0.5
      return <polygon points={`${i},0 ${w - i},0 ${w},${h / 2} ${w - i},${h} ${i},${h} 0,${h / 2}`} {...common} />
    }
    case 'parallelogram': {
      const s = h * 0.4
      return <polygon points={`${s},0 ${w},0 ${w - s},${h} 0,${h}`} {...common} />
    }
    case 'cylinder': {
      const ry = Math.min(12, h * 0.18)
      return (
        <g>
          <path d={`M0,${ry} A${w / 2},${ry} 0 0 1 ${w},${ry} L${w},${h - ry} A${w / 2},${ry} 0 0 1 0,${h - ry} Z`} {...common} />
          <path d={`M0,${ry} A${w / 2},${ry} 0 0 0 ${w},${ry}`} fill="none" stroke={accent} strokeWidth={sw} />
        </g>
      )
    }
    case 'cloud': {
      const u = w / 10
      return (
        <path d={`M${2 * u},${h} a${1.6 * u},${1.6 * u} 0 0 1 0,${-h * 0.55}
          a${2 * u},${2 * u} 0 0 1 ${3.5 * u},${-h * 0.18}
          a${1.8 * u},${1.8 * u} 0 0 1 ${3 * u},${h * 0.1}
          a${1.6 * u},${1.6 * u} 0 0 1 ${0.5 * u},${h * 0.63} Z`} {...common} />
      )
    }
    case 'document':
      return <path d={`M0,0 L${w},0 L${w},${h - 12} Q${w * 0.75},${h - 24} ${w / 2},${h - 12} Q${w * 0.25},${h} 0,${h - 12} Z`} {...common} />
    case 'folder':
      return <path d={`M0,8 Q0,0 8,0 L${w * 0.4},0 L${w * 0.46},8 L${w - 8},8 Q${w},8 ${w},16 L${w},${h - 8} Q${w},${h} ${w - 8},${h} L8,${h} Q0,${h} 0,${h - 8} Z`} {...common} />
    case 'actor':
      return <rect x={0} y={0} width={w} height={h} rx={6} ry={6} {...common} />
    case 'rect':
    default:
      return <rect x={0} y={0} width={w} height={h} {...common} />
  }
}

const NodeElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width: w, height: h, shape, title, subtitle, glyph, accent, fill, textColor, showPorts } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [editing, setEditing] = useState(false)

  const sw = 2
  const glyphSize = Math.min(22, h * 0.42)
  const hasGlyph = glyph !== 'none'

  const beginEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    pushHistory()
    setEditing(true)
  }

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ShapeBody shape={shape} w={w} h={h} fill={fill} accent={accent} sw={sw} />

      {/* accent header strip for card/note shapes */}
      {(shape === 'card' || shape === 'note') && (
        <rect x={0} y={0} width={w} height={6} rx={3} fill={accent} style={{ pointerEvents: 'none' }} />
      )}

      {/* content via foreignObject so text wraps & is editable */}
      <foreignObject x={0} y={0} width={w} height={h} style={{ overflow: 'visible' }}>
        <div
          // @ts-expect-error xmlns for foreignObject html
          xmlns="http://www.w3.org/1999/xhtml"
          onDoubleClick={beginEdit}
          style={{
            width: w, height: h, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: hasGlyph ? 'flex-start' : 'center',
            gap: 8, padding: '0 12px',
            fontFamily: 'system-ui, sans-serif', color: textColor,
            pointerEvents: 'none', userSelect: 'none',
          }}
        >
          {hasGlyph && (
            <span style={{ color: accent, flexShrink: 0, display: 'flex' }}>
              {glyphIcon(glyph, glyphSize)}
            </span>
          )}
          <div style={{ minWidth: 0, textAlign: hasGlyph ? 'left' : 'center', lineHeight: 1.15 }}>
            {editing ? (
              <input
                autoFocus
                defaultValue={title}
                onBlur={(ev) => { updateElement(element.id, { title: ev.target.value } as Partial<NodeElement>); setEditing(false) }}
                onKeyDown={(ev) => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur() }}
                style={{
                  pointerEvents: 'auto', width: '100%', border: 'none', outline: 'none',
                  background: 'transparent', font: 'inherit', fontWeight: 600,
                  fontSize: Math.min(15, h * 0.34), color: textColor, textAlign: hasGlyph ? 'left' : 'center',
                }}
              />
            ) : (
              <div style={{ fontWeight: 600, fontSize: Math.min(15, h * 0.34), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </div>
            )}
            {subtitle ? (
              <div style={{ fontSize: 11, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </foreignObject>

      {/* connection ports */}
      {showPorts && [[0, h / 2], [w, h / 2], [w / 2, 0], [w / 2, h]].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={4} fill={accent} stroke="var(--surface-0)" strokeWidth={1.5}
          style={{ pointerEvents: 'none' }} />
      ))}

      {isSelected && (
        <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={8} fill="none"
          stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

NodeElementComp.displayName = 'NodeElementComp'
export default NodeElementComp
