import React, { memo } from 'react'
import type { TreeElement, TreeNode } from '../../../types/canvas'

interface Props {
  element: TreeElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

interface Flat {
  label: string
  depth: number
  row: number
  hasChildren: boolean
}

/** Flatten the tree depth-first into rows for an indented list layout. */
function flatten(root: TreeNode): Flat[] {
  const out: Flat[] = []
  let row = 0
  const walk = (n: TreeNode, depth: number) => {
    out.push({ label: n.label, depth, row: row++, hasChildren: !!n.children?.length })
    n.children?.forEach(c => walk(c, depth + 1))
  }
  walk(root, 0)
  return out
}

const TreeElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, root, nodeColor, lineColor, textColor, fontSize, rowHeight, indent } = element
  const flat = flatten(root)

  const width = Math.max(
    ...flat.map(f => f.depth * indent + f.label.length * fontSize * 0.6 + 40)
  )
  const height = flat.length * rowHeight

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={-6} y={-6} width={width + 12} height={height + 12} rx={8}
        fill="var(--surface-0)" stroke={isSelected ? '#3b82f6' : 'var(--border)'} strokeWidth={isSelected ? 2 : 1} />

      {flat.map((f) => {
        const cy = f.row * rowHeight + rowHeight / 2
        const cx = f.depth * indent
        // connector elbows back to the parent column
        return (
          <g key={f.row}>
            {f.depth > 0 && (
              <>
                <line x1={cx - indent + 8} y1={cy} x2={cx + 2} y2={cy}
                  stroke={lineColor} strokeWidth={1} style={{ pointerEvents: 'none' }} />
                <line x1={cx - indent + 8} y1={cy - rowHeight} x2={cx - indent + 8} y2={cy}
                  stroke={lineColor} strokeWidth={1} style={{ pointerEvents: 'none' }} />
              </>
            )}
            <circle cx={cx + 6} cy={cy} r={f.hasChildren ? 5 : 3.5}
              fill={f.hasChildren ? nodeColor : 'var(--surface-2)'} stroke={nodeColor} strokeWidth={1.5}
              style={{ pointerEvents: 'none' }} />
            <text x={cx + 18} y={cy} dominantBaseline="central" fontSize={fontSize}
              fill={textColor} fontFamily="ui-monospace, monospace" style={{ pointerEvents: 'none' }}>
              {f.label}
            </text>
          </g>
        )
      })}
    </g>
  )
})

TreeElementComp.displayName = 'TreeElementComp'
export default TreeElementComp
