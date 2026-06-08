/* ============================================================
   Generic property panel — for ANY selected element, reads the
   element's parameter schema from the tool registry and renders a
   ParamControl per parameter. One panel replaces dozens of
   hand-written ones; adding a tool param makes it editable here
   for free.
   ============================================================ */
import React from 'react'
import { X, Trash2, Copy } from 'lucide-react'
import type { CanvasElement } from '../../types/canvas'
import { getTool } from '../../tools/registry'
import { useCanvasStore } from '../../store/canvasStore'
import { coerce } from '../../scene/validate'
import ParamControl from '../ui/ParamControl'
import { T, R } from '../../theme/tokens'

interface Props {
  element: CanvasElement
  onClose: () => void
}

const GenericPropertyPanel: React.FC<Props> = ({ element, onClose }) => {
  const updateElement = useCanvasStore((s) => s.updateElement)
  const deleteElement = useCanvasStore((s) => s.deleteElement)
  const addElement = useCanvasStore((s) => s.addElement)
  const pushHistory = useCanvasStore((s) => s.pushHistory)

  const tool = getTool(element.type)
  const rec = element as unknown as Record<string, unknown>
  const params = tool?.params ?? []

  const onChange = (key: string, raw: unknown) => {
    const spec = params.find((p) => p.key === key)
    const value = spec ? coerce(spec, raw) : raw
    if (value === undefined) return
    updateElement(element.id, { [key]: value } as Partial<CanvasElement>)
  }

  const duplicate = () => {
    pushHistory()
    const copy = JSON.parse(JSON.stringify(element)) as CanvasElement
    copy.id = `${element.type}_${Date.now()}`
    copy.x += 24
    copy.y += 24
    if ('x2' in copy) { (copy as { x2: number }).x2 += 24; (copy as { y2: number }).y2 += 24 }
    copy.group = undefined
    addElement(copy)
  }

  return (
    <div style={{
      width: 248, maxHeight: '70vh', overflowY: 'auto',
      background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.lg,
      boxShadow: T.shadowPop, padding: 12,
    }} className="no-scrollbar">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: T.text3 }}>{tool?.icon}</span>
          {tool?.label ?? element.type}
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.text3, padding: 0 }}>
          <X size={15} />
        </button>
      </div>

      {/* Parameters */}
      {params.length === 0 ? (
        <div style={{ fontSize: 12, color: T.text3, padding: '4px 0 10px' }}>
          Aucun paramètre éditable pour cet élément.
        </div>
      ) : (
        params.map((spec) => (
          <ParamControl
            key={spec.key}
            spec={spec}
            value={rec[spec.key]}
            onChange={(v) => onChange(spec.key, v)}
          />
        ))
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={duplicate}
          style={actionBtn(T.text2)}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text1 }}
          onMouseLeave={(e) => { e.currentTarget.style.background = T.surface2; e.currentTarget.style.color = T.text2 }}
        >
          <Copy size={14} /> Dupliquer
        </button>
        <button
          onClick={() => { deleteElement(element.id); onClose() }}
          style={actionBtn('#f87171')}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.surface2)}
        >
          <Trash2 size={14} /> Supprimer
        </button>
      </div>
    </div>
  )
}

function actionBtn(color: string): React.CSSProperties {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 32, borderRadius: R.md, border: `1px solid ${T.border}`, cursor: 'pointer',
    background: T.surface2, color, fontSize: 12, fontFamily: 'inherit',
    transition: 'background var(--dur-fast) var(--ease)',
  }
}

export default GenericPropertyPanel
