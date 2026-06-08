import React, { memo, useEffect, useRef, useState } from 'react'
import type { FormulaElement } from '../../../types/canvas'

interface Props {
  element: FormulaElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const FormulaElementComp = memo(({ element, isSelected, onClick }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState('')
  const [size, setSize] = useState({ width: 200, height: 40 })

  useEffect(() => {
    let cancelled = false
    import('katex').then((katex) => {
      if (cancelled) return
      try {
        const html = katex.default.renderToString(element.latex, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        })
        setRendered(html)
      } catch {
        setRendered(`<span style="color:red">Invalid LaTeX</span>`)
      }
    })
    return () => { cancelled = true }
  }, [element.latex])

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height })
      }
    }
  }, [rendered])

  return (
    <g onClick={onClick} style={{ cursor: 'move' }}>
      {isSelected && (
        <rect
          x={element.x - 6}
          y={element.y - 6}
          width={size.width + 12}
          height={size.height + 12}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.7}
          rx={4}
          style={{ pointerEvents: 'none' }}
        />
      )}
      <foreignObject
        x={element.x}
        y={element.y}
        width={Math.max(size.width + 8, 200)}
        height={Math.max(size.height + 4, 50)}
      >
        <div
          ref={containerRef}
          style={{
            display: 'inline-block',
            color: element.color,
            fontSize: element.fontSize,
            lineHeight: 1,
            padding: '4px',
          }}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      </foreignObject>
    </g>
  )
})

FormulaElementComp.displayName = 'FormulaElementComp'
export default FormulaElementComp
