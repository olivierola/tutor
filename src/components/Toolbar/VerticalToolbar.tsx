/* ============================================================
   Vertical toolbar — a left rail driven entirely by the tool
   registry. Hidden by default; opened via a floating button at
   the top-right (handled by the parent). Top: quick tools
   (select/pan/pen/eraser). Then one button per category that
   opens a flyout list of that category's tools. Bottom: colour,
   stroke, undo/redo, zoom.
   ============================================================ */
import React, { useState, useEffect, useRef } from 'react'
import {
  MousePointer2, Hand, Pencil, Eraser, Type as TypeIcon,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Search, X,
} from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import { CATEGORY_META, toolsByCategory, searchTools } from '../../tools/registry'
import type { ToolDef } from '../../tools/types'
import type { ToolType } from '../../types/canvas'
import { fitViewportToElements } from '../../utils/canvasUtils'
import { T, R } from '../../theme/tokens'

const PALETTE = ['#e4e4e7', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#78716c', '#0a0a0a']

interface Props {
  onClose: () => void
  /** Which side of the screen the bar sits on (flyout opens inward). */
  side?: 'left' | 'right'
}

const QUICK: { id: ToolType; icon: React.ReactNode; label: string }[] = [
  { id: 'select', icon: <MousePointer2 size={17} />, label: 'Sélection (V)' },
  { id: 'pan', icon: <Hand size={17} />, label: 'Déplacer (H)' },
  { id: 'pen', icon: <Pencil size={17} />, label: 'Stylo (P)' },
  { id: 'text', icon: <TypeIcon size={17} />, label: 'Texte (T)' },
  { id: 'eraser', icon: <Eraser size={17} />, label: 'Gomme (E)' },
]

const RailBtn: React.FC<{ active?: boolean; title: string; onClick: () => void; children: React.ReactNode }> = ({ active, title, onClick, children }) => (
  <button
    title={title} onClick={onClick}
    style={{
      width: 38, height: 38, borderRadius: R.md, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      background: active ? T.accentSoft : 'transparent',
      color: active ? 'var(--accent-text)' : T.text2,
      transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)',
    }}
    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text1 } }}
    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2 } }}
  >
    {children}
  </button>
)

const VerticalToolbar: React.FC<Props> = ({ onClose, side = 'left' }) => {
  const activeTool = useCanvasStore(s => s.activeTool)
  const setActiveTool = useCanvasStore(s => s.setActiveTool)
  const activeColor = useCanvasStore(s => s.activeColor)
  const setColor = useCanvasStore(s => s.setColor)
  const strokeWidth = useCanvasStore(s => s.strokeWidth)
  const setStrokeWidth = useCanvasStore(s => s.setStrokeWidth)
  const viewport = useCanvasStore(s => s.viewport)
  const setViewport = useCanvasStore(s => s.setViewport)
  const elements = useCanvasStore(s => s.elements)
  const undo = useCanvasStore(s => s.undo)
  const redo = useCanvasStore(s => s.redo)
  const history = useCanvasStore(s => s.history)
  const historyIndex = useCanvasStore(s => s.historyIndex)

  const [openCat, setOpenCat] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpenCat(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const pick = (id: string) => { setActiveTool(id as ToolType); setOpenCat(null) }
  const zoom = (f: number) => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2
    const nz = Math.min(20, Math.max(0.05, viewport.zoom * f))
    setViewport({ x: cx - (cx - viewport.x) * (nz / viewport.zoom), y: cy - (cy - viewport.y) * (nz / viewport.zoom), zoom: nz })
  }
  const fit = () => setViewport(fitViewportToElements(elements, window.innerWidth, window.innerHeight))

  const results: ToolDef[] = query.trim() ? searchTools(query).slice(0, 24) : []
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1
  const Sep = () => <div style={{ height: 1, width: 24, background: T.border, margin: '4px auto', flexShrink: 0 }} />

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: side === 'right' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 0 }}>
      {/* Rail */}
      <div style={{
        width: 50, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 6px',
        background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.lg, boxShadow: T.shadowLg,
      }} className="no-scrollbar">
        {/* search toggle */}
        <RailBtn title="Rechercher un outil" active={openCat === '__search'} onClick={() => setOpenCat(openCat === '__search' ? null : '__search')}>
          <Search size={17} />
        </RailBtn>
        <Sep />

        {/* quick tools */}
        {QUICK.map(q => (
          <RailBtn key={q.id} title={q.label} active={activeTool === q.id} onClick={() => pick(q.id)}>{q.icon}</RailBtn>
        ))}
        <Sep />

        {/* categories */}
        {CATEGORY_META.filter(c => c.id !== 'draw').map(cat => {
          const hasActive = toolsByCategory(cat.id).some(t => t.id === activeTool)
          return (
            <RailBtn key={cat.id} title={cat.label} active={openCat === cat.id || hasActive} onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}>
              <span style={{ color: openCat === cat.id || hasActive ? 'var(--accent-text)' : undefined }}>{cat.icon}</span>
            </RailBtn>
          )
        })}
        <Sep />

        {/* colour */}
        <label title="Couleur" style={{ width: 26, height: 26, borderRadius: R.sm, background: activeColor, border: `2px solid ${T.border}`, cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
          <input type="color" value={activeColor} onChange={e => setColor(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </label>
        {/* stroke */}
        <RailBtn title={`Épaisseur : ${strokeWidth}px`} active={openCat === '__stroke'} onClick={() => setOpenCat(openCat === '__stroke' ? null : '__stroke')}>
          <svg width={20} height={20}><line x1={3} y1={10} x2={17} y2={10} stroke="currentColor" strokeWidth={Math.min(strokeWidth, 6)} strokeLinecap="round" /></svg>
        </RailBtn>
        <Sep />

        <RailBtn title="Annuler (Ctrl+Z)" onClick={() => canUndo && undo()}><Undo2 size={16} style={{ opacity: canUndo ? 1 : 0.3 }} /></RailBtn>
        <RailBtn title="Rétablir" onClick={() => canRedo && redo()}><Redo2 size={16} style={{ opacity: canRedo ? 1 : 0.3 }} /></RailBtn>
        <Sep />
        <RailBtn title="Zoom +" onClick={() => zoom(1.2)}><ZoomIn size={16} /></RailBtn>
        <RailBtn title="Zoom −" onClick={() => zoom(0.8)}><ZoomOut size={16} /></RailBtn>
        <RailBtn title="Ajuster" onClick={fit}><Maximize2 size={16} /></RailBtn>
        <Sep />
        <RailBtn title="Fermer la barre" onClick={onClose}><X size={16} /></RailBtn>
      </div>

      {/* Flyout panel */}
      {openCat && (
        <div style={{
          marginLeft: side === 'right' ? 0 : 8, marginRight: side === 'right' ? 8 : 0,
          width: 232, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
          background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.lg, boxShadow: T.shadowPop, padding: 8,
        }} className="no-scrollbar">
          {openCat === '__search' ? (
            <>
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Chercher un outil…"
                style={{ width: '100%', padding: '7px 10px', borderRadius: R.md, border: `1px solid ${T.border}`, background: T.surface2, color: T.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
              {results.map(t => <ToolRow key={t.id} t={t} active={activeTool === t.id} onClick={() => pick(t.id)} />)}
              {query.trim() && results.length === 0 && <div style={{ fontSize: 12, color: T.text3, padding: 8 }}>Aucun outil.</div>}
            </>
          ) : openCat === '__stroke' ? (
            <div style={{ padding: 6 }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 8, fontFamily: 'monospace', textAlign: 'center' }}>Épaisseur : {strokeWidth}px</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                {[1, 2, 4, 6, 10].map(w => (
                  <button key={w} onClick={() => setStrokeWidth(w)} style={{ width: 30, height: 30, borderRadius: R.sm, border: 'none', cursor: 'pointer', background: strokeWidth === w ? T.surface3 : 'transparent' }}>
                    <svg width={22} height={22}><line x1={4} y1={11} x2={18} y2={11} stroke={T.text1} strokeWidth={Math.min(w, 7)} strokeLinecap="round" /></svg>
                  </button>
                ))}
              </div>
              <input type="range" min={1} max={20} value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginTop: 12 }}>
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', background: c, border: activeColor === c ? `2px solid var(--accent)` : `1px solid ${T.border}` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 6px 8px' }}>
                {CATEGORY_META.find(c => c.id === openCat)?.label}
              </div>
              {toolsByCategory(openCat as ToolDef['category']).map(t => (
                <ToolRow key={t.id} t={t} active={activeTool === t.id} onClick={() => pick(t.id)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const ToolRow: React.FC<{ t: ToolDef; active: boolean; onClick: () => void }> = ({ t, active, onClick }) => (
  <button
    onClick={onClick} title={t.description ?? t.label}
    style={{
      display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px',
      borderRadius: R.md, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 13,
      background: active ? T.accentSoft : 'transparent', color: active ? 'var(--accent-text)' : T.text2,
      transition: 'background var(--dur-fast) var(--ease)',
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.hoverBg }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
  >
    <span style={{ color: active ? 'var(--accent-text)' : T.text3, flexShrink: 0, display: 'flex' }}>{t.icon}</span>
    {t.label}
  </button>
)

export default VerticalToolbar
