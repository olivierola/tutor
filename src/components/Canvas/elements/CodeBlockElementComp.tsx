import React, { memo, useState } from 'react'
import type { CodeBlockElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface Props {
  element: CodeBlockElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const LANG_LABEL: Record<string, string> = {
  python: 'Python', js: 'JavaScript', ts: 'TypeScript', c: 'C', cpp: 'C++',
  java: 'Java', sql: 'SQL', bash: 'Bash', html: 'HTML', css: 'CSS',
  json: 'JSON', pseudo: 'Pseudo-code', go: 'Go', rust: 'Rust', php: 'PHP',
}

const CodeBlockElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, code, language, title, showLineNumbers, variant, highlightLines, fontSize } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [editing, setEditing] = useState(false)

  const lines = code.split('\n')
  const lineH = fontSize * 1.5
  const headerH = 30
  const padY = 10
  const bodyH = lines.length * lineH + padY * 2
  const height = headerH + bodyH

  const isTerminal = variant === 'terminal'
  const bg = isTerminal ? '#0b0f17' : '#1e1e2e'
  const fg = isTerminal ? '#d1fae5' : '#cdd6f4'
  const gutterFg = '#6c7086'
  const headerBg = isTerminal ? '#11161f' : '#181825'

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={0} y={0} width={width} height={height} rx={10}
        fill={bg} stroke={isSelected ? '#3b82f6' : 'rgba(255,255,255,0.12)'} strokeWidth={isSelected ? 2 : 1} />

      {/* header */}
      <rect x={0} y={0} width={width} height={headerH} rx={10} fill={headerBg} />
      <rect x={0} y={headerH - 10} width={width} height={10} fill={headerBg} />
      {isTerminal ? (
        <>
          <circle cx={14} cy={headerH / 2} r={4} fill="#ef4444" />
          <circle cx={28} cy={headerH / 2} r={4} fill="#eab308" />
          <circle cx={42} cy={headerH / 2} r={4} fill="#22c55e" />
        </>
      ) : (
        <text x={12} y={headerH / 2} dominantBaseline="central" fontSize={11}
          fill="#a6adc8" fontFamily="monospace" style={{ pointerEvents: 'none' }}>
          {LANG_LABEL[language] ?? language}
        </text>
      )}
      {title && (
        <text x={width / 2} y={headerH / 2} dominantBaseline="central" textAnchor="middle"
          fontSize={11} fill="#a6adc8" fontFamily="system-ui" style={{ pointerEvents: 'none' }}>
          {title}
        </text>
      )}

      {/* body */}
      <foreignObject x={0} y={headerH} width={width} height={bodyH} style={{ overflow: 'hidden' }}>
        <div
          // @ts-expect-error xmlns
          xmlns="http://www.w3.org/1999/xhtml"
          onDoubleClick={(e) => { e.stopPropagation(); pushHistory(); setEditing(true) }}
          style={{
            width: '100%', height: '100%', boxSizing: 'border-box',
            padding: `${padY}px 0`, fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize, lineHeight: `${lineH}px`, color: fg, overflow: 'hidden',
            pointerEvents: editing ? 'auto' : 'none',
          }}
        >
          {editing ? (
            <textarea autoFocus defaultValue={code}
              onBlur={(ev) => { updateElement(element.id, { code: ev.target.value }); setEditing(false) }}
              style={{
                width: '100%', height: bodyH - padY * 2, resize: 'none', border: 'none', outline: 'none',
                background: 'transparent', color: fg, font: 'inherit', lineHeight: `${lineH}px`,
                padding: `0 12px`, boxSizing: 'border-box',
              }} />
          ) : (
            <div style={{ display: 'flex' }}>
              {showLineNumbers && (
                <div style={{ flexShrink: 0, textAlign: 'right', color: gutterFg, padding: '0 10px', userSelect: 'none' }}>
                  {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
              )}
              <div style={{ flex: 1, paddingRight: 12, paddingLeft: showLineNumbers ? 0 : 12, whiteSpace: 'pre' }}>
                {lines.map((ln, i) => (
                  <div key={i} style={{ background: highlightLines.includes(i + 1) ? 'rgba(250,204,21,0.12)' : 'transparent' }}>
                    {isTerminal && <span style={{ color: '#22c55e' }}>$ </span>}{ln || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  )
})

CodeBlockElementComp.displayName = 'CodeBlockElementComp'
export default CodeBlockElementComp
