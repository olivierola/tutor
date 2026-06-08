/* ============================================================
   Quick action bar — a small floating toolbar shown just above
   the currently selected element. Gives one-click duplicate,
   delete and "edit" (opens the property panel) without opening
   the full panel first.
   ============================================================ */
import React from 'react'
import { SlidersHorizontal, Copy, Trash2 } from 'lucide-react'
import type { CanvasElement } from '../../types/canvas'
import { useCanvasStore } from '../../store/canvasStore'
import { T, R } from '../../theme/tokens'

interface Props {
  element: CanvasElement
  /** screen position of the bar (already computed by the canvas) */
  left: number
  top: number
  onEdit: () => void
  onAfterDelete: () => void
}

const QuickActions: React.FC<Props> = ({ element, left, top, onEdit, onAfterDelete }) => {
  const deleteElement = useCanvasStore((s) => s.deleteElement)
  const addElement = useCanvasStore((s) => s.addElement)
  const pushHistory = useCanvasStore((s) => s.pushHistory)

  const duplicate = () => {
    pushHistory()
    const copy = JSON.parse(JSON.stringify(element)) as CanvasElement
    copy.id = `${element.type}_${Date.now()}`
    copy.x += 24; copy.y += 24
    if ('x2' in copy) { (copy as { x2: number }).x2 += 24; (copy as { y2: number }).y2 += 24 }
    copy.group = undefined
    addElement(copy)
  }

  const btn = (icon: React.ReactNode, label: string, fn: () => void, danger = false) => (
    <button
      title={label}
      onClick={(e) => { e.stopPropagation(); fn() }}
      style={{
        width: 30, height: 30, borderRadius: R.sm, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', color: danger ? '#f87171' : T.text2,
        transition: 'background var(--dur-fast) var(--ease)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.14)' : T.hoverBg; if (!danger) e.currentTarget.style.color = T.text1 }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; if (!danger) e.currentTarget.style.color = T.text2 }}
    >
      {icon}
    </button>
  )

  return (
    <div
      style={{
        position: 'fixed', left, top, zIndex: 250, transform: 'translate(-50%, -100%)',
        display: 'flex', alignItems: 'center', gap: 2, padding: 3,
        background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.md,
        boxShadow: T.shadowPop,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {btn(<SlidersHorizontal size={15} />, 'Modifier', onEdit)}
      {btn(<Copy size={15} />, 'Dupliquer', duplicate)}
      {btn(<Trash2 size={15} />, 'Supprimer', () => { deleteElement(element.id); onAfterDelete() }, true)}
    </div>
  )
}

export default QuickActions
