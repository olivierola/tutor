import React, { memo, useState } from 'react'
import type { RichTextElement } from '../../../types/canvas'
import { useCanvasStore } from '../../../store/canvasStore'

interface Props {
  element: RichTextElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

/** Inline markdown: **bold**, *italic*, `code`. Returns HTML (escaped first). */
function inline(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:4px;font-family:monospace;font-size:0.92em">$1</code>')
}

/** Block markdown → HTML: blank-line paragraphs, "- " bullet lists. */
function renderBody(body: string): string {
  const blocks = body.split(/\n\s*\n/)
  return blocks.map((block) => {
    const lines = block.split('\n')
    const isList = lines.every((l) => /^\s*[-*]\s+/.test(l))
    if (isList) {
      const items = lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')
      return `<ul style="margin:0 0 0 18px;padding:0">${items}</ul>`
    }
    return `<p style="margin:0 0 8px">${inline(block).replace(/\n/g, '<br/>')}</p>`
  }).join('')
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
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                defaultValue={heading ?? ''} placeholder="Titre (optionnel)"
                onBlur={(ev) => updateElement(element.id, { heading: ev.target.value })}
                style={{ font: `600 ${fontSize + 4}px var(--font-sans)`, border: '1px solid var(--border)', borderRadius: 6, padding: 6, background: 'var(--surface-0)', color: 'var(--text-1)' }}
              />
              <textarea
                autoFocus defaultValue={body}
                onBlur={(ev) => { updateElement(element.id, { body: ev.target.value }); setEditing(false) }}
                style={{ minHeight: 80, resize: 'vertical', border: '1px solid var(--border)', borderRadius: 6, padding: 8, font: `${fontSize}px var(--font-sans)`, background: 'var(--surface-0)', color: 'var(--text-1)' }}
              />
            </div>
          ) : (
            <>
              {heading && <div style={{ fontWeight: 700, fontSize: fontSize + 5, marginBottom: 8, letterSpacing: '-0.01em' }}>{heading}</div>}
              <div style={{ fontSize, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: renderBody(body) }} />
            </>
          )}
        </div>
      </foreignObject>
    </g>
  )
})

RichTextElementComp.displayName = 'RichTextElementComp'
export default RichTextElementComp
