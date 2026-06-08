import React, { memo, useEffect, useRef } from 'react'
import type { TextElement } from '../../../types/canvas'

interface Props {
  element: TextElement
  isSelected: boolean
  isEditing: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onEditComplete: (newContent: string) => void
  zoom: number
}

const TextElementComp = memo(({
  element,
  isSelected,
  isEditing,
  onClick,
  onDoubleClick,
  onEditComplete,
  zoom,
}: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <foreignObject
        x={element.x}
        y={element.y - element.fontSize}
        width={300}
        height={element.fontSize * 3}
      >
        <textarea
          ref={textareaRef}
          defaultValue={element.content}
          onBlur={(e) => onEditComplete(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onEditComplete((e.target as HTMLTextAreaElement).value)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onEditComplete((e.target as HTMLTextAreaElement).value)
            }
          }}
          style={{
            background: 'rgba(255,253,248,0.97)',
            border: '2px dashed #d97706',
            outline: 'none',
            padding: '4px 8px',
            fontSize: element.fontSize / zoom,
            fontFamily: element.fontFamily,
            color: element.color,
            resize: 'none',
            width: '100%',
            height: '100%',
            lineHeight: 1.5,
            borderRadius: 6,
          }}
        />
      </foreignObject>
    )
  }

  return (
    <g
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'move' }}
    >
      {isSelected && (
        <rect
          x={element.x - 4}
          y={element.y - element.fontSize - 2}
          width={200}
          height={element.fontSize * 1.5}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.7}
          rx={3}
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* Origin marker: a thin left rule distinguishes who wrote it —
          a neutral "handwritten" bar for the user, an accent bar for AI. */}
      <rect
        x={element.x - 8}
        y={element.y - element.fontSize}
        width={2.5}
        height={element.fontSize * 1.2}
        rx={1.25}
        fill={element.createdBy === 'ai' ? 'var(--accent)' : 'var(--text-3)'}
        opacity={element.createdBy === 'ai' ? 0.7 : 0.45}
        style={{ pointerEvents: 'none' }}
      />
      <text
        x={element.x}
        y={element.y}
        fontSize={element.fontSize}
        fill={element.color}
        fontFamily={element.fontFamily}
        fontWeight={element.fontStyle === 'handwriting' ? 600 : 'normal'}
        style={{ userSelect: 'none' }}
      >
        {element.content}
      </text>
    </g>
  )
})

TextElementComp.displayName = 'TextElementComp'
export default TextElementComp
