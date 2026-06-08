import React, { memo, useState } from 'react'
import type { RichTextElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'
import { renderMd } from '../../../utils/markdown'

interface Props {
  element: RichTextElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const RichTextElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, heading, body, fontSize, color, align } = element
  const updateElement = useCanvasStore(s => s.updateElement)
  const pushHistory = useCanvasStore(s => s.pushHistory)
  const [editing, setEditing] = useState(false)

  // rough height estimate for the selection box
  const charsPerLine = Math.max(12, Math.floor(width / (fontSize * 0.55)))
  const lines = body.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / charsPerLine)), 0)
  const height = (heading ? fontSize + 14 : 0) + lines * (fontSize * 1.5) + 20

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick}
       onDoubleClick={(e) => { e.stopPropagation(); if (!editing) { pushHistory(); setEditing(true) } }}
       style={{ cursor: 'pointer' }}>
      {isSelected && (
        <rect x={-6} y={-6} width={width + 12} height={height + 12} rx={8} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 3" />
      )}
      <foreignObject x={0} y={0} width={width} height={height + 40} style={{ overflow: 'visible' }}>
        <div
          // @ts-expect-error xmlns
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ width: '100%', fontFamily: 'var(--font-sans)', color, textAlign: align, pointerEvents: editing ? 'auto' : 'none' }}
        >
          {((heading && heading.trim() && heading.trim() !== 'Titre') || editing) && (
            <div
              contentEditable={editing} suppressContentEditableWarning
              onBlur={(ev) => updateElement(element.id, { heading: ev.currentTarget.textContent ?? '' })}
              data-ph="Titre…"
              style={{
                fontWeight: 700, fontSize: fontSize + 5, marginBottom: 8, letterSpacing: '-0.01em',
                outline: editing ? '1px dashed var(--accent)' : 'none', outlineOffset: 3,
                borderRadius: 4, minHeight: editing ? '1.2em' : undefined,
              }}
            >
              {heading}
            </div>
          )}
          {editing ? (
            // In-place editing: a contentEditable styled EXACTLY like the
            // rendered text — no textarea, no jarring box swap.
            <div
              autoFocus suppressContentEditableWarning contentEditable
              ref={(el) => { if (el && document.activeElement !== el) el.focus() }}
              onBlur={(ev) => { updateElement(element.id, { body: ev.currentTarget.innerText }); setEditing(false) }}
              style={{
                fontSize, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                outline: '1px dashed var(--accent)', outlineOffset: 4, borderRadius: 4, padding: 2, minHeight: '1.5em',
              }}
            >
              {body}
            </div>
          ) : (
            <div style={{ fontSize, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: renderMd(body) }} />
          )}
        </div>
      </foreignObject>
    </g>
  )
})

RichTextElementComp.displayName = 'RichTextElementComp'
export default RichTextElementComp
