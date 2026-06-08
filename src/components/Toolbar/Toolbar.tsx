import React, { useCallback, useEffect, useState } from 'react'
import {
  MousePointer2, Pencil, Minus, ArrowRight, Square, Circle, Type, Eraser,
  Ruler, Compass, ScanLine, ZoomIn, ZoomOut, Maximize2, Triangle, FunctionSquare,
  Zap, Waves, Activity, ToggleLeft, Atom, Link2, Hexagon, Wind,
  AlignCenter, Move, GitBranch, Sigma, FlipHorizontal2, Crosshair,
} from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import type { ToolType } from '../../types/canvas'
import { fitViewportToElements, generateId } from '../../utils/canvasUtils'
import type { RulerInstrument, ProtractorInstrument, CompassInstrument } from '../../types/canvas'

const PALETTE = [
  '#1e293b', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
  '#06b6d4', '#84cc16', '#f59e0b', '#ffffff',
]

// ─── Section header ───────────────────────────────────────────
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-full flex items-center gap-1 mt-2 mb-0.5 px-1">
    <div className="flex-1 h-px bg-slate-800" />
    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 shrink-0">{label}</span>
    <div className="flex-1 h-px bg-slate-800" />
  </div>
)

// ─── Tool button ─────────────────────────────────────────────
interface ToolBtnProps {
  icon: React.ReactNode
  label: string
  shortcut?: string
  active?: boolean
  color?: string
  onClick: () => void
}
const ToolBtn: React.FC<ToolBtnProps> = ({ icon, label, shortcut, active, color, onClick }) => (
  <button
    className={`toolbar-btn ${active ? 'active' : ''}`}
    onClick={onClick}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    style={active && color ? { background: color + '33', borderColor: color } : undefined}
  >
    {icon}
    <span className="tooltip">
      {label}
      {shortcut && (
        <span className="ml-2 opacity-60 font-mono text-[10px] border border-slate-600 px-1 rounded">
          {shortcut}
        </span>
      )}
    </span>
  </button>
)

// ─── Collapsible group ────────────────────────────────────────
interface GroupProps {
  label: string
  color: string
  defaultOpen?: boolean
  children: React.ReactNode
}
const Group: React.FC<GroupProps> = ({ label, color, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="w-full">
      <button
        className="w-full flex items-center gap-1 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors"
        onClick={() => setOpen(o => !o)}
        title={label}
      >
        <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
        <span className="text-[9px] font-bold uppercase tracking-widest flex-1 text-left" style={{ color }}>{label}</span>
        <span className="text-slate-600 text-[9px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="flex flex-col items-center gap-0.5">{children}</div>}
    </div>
  )
}

const Toolbar: React.FC = () => {
  const activeTool = useCanvasStore((s) => s.activeTool)
  const activeColor = useCanvasStore((s) => s.activeColor)
  const strokeWidth = useCanvasStore((s) => s.strokeWidth)
  const viewport = useCanvasStore((s) => s.viewport)
  const elements = useCanvasStore((s) => s.elements)

  const setActiveTool = useCanvasStore((s) => s.setActiveTool)
  const setColor = useCanvasStore((s) => s.setColor)
  const setStrokeWidth = useCanvasStore((s) => s.setStrokeWidth)
  const setViewport = useCanvasStore((s) => s.setViewport)
  const addInstrument = useCanvasStore((s) => s.addInstrument)

  const setTool = useCallback((t: ToolType) => setActiveTool(t), [setActiveTool])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
          (e.target as HTMLElement).tagName === 'TEXTAREA') return
      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break
        case 'p': setTool('pen'); break
        case 'l': setTool('line'); break
        case 'a': setTool('arrow'); break
        case 'r': setTool('rect'); break
        case 'c': setTool('circle'); break
        case 't': setTool('text'); break
        case 'e': setTool('eraser'); break
        case 'h': setTool('pan'); break
        case 'u': addRuler(); break
        case 'o': addProtractor(); break
        case 'm': addCompass(); break
        case '=': case '+': zoom(1.2); break
        case '-': zoom(0.8); break
        case '0': fitContent(); break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [viewport, elements])

  const zoom = (factor: number) => {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const newZoom = Math.min(20, Math.max(0.05, viewport.zoom * factor))
    setViewport({
      x: cx - (cx - viewport.x) * (newZoom / viewport.zoom),
      y: cy - (cy - viewport.y) * (newZoom / viewport.zoom),
      zoom: newZoom,
    })
  }

  const fitContent = () => {
    const vp = fitViewportToElements(elements, window.innerWidth - 64, window.innerHeight - 48)
    setViewport(vp)
  }

  const addRuler = () => {
    const inst: RulerInstrument = { id: generateId('ruler'), type: 'tool_ruler', x: 150, y: 200, angle: 0, length: 15, unit: 'cm' }
    addInstrument(inst)
  }
  const addProtractor = () => {
    const inst: ProtractorInstrument = { id: generateId('prot'), type: 'tool_protractor', cx: window.innerWidth / 2, cy: window.innerHeight / 2, baseAngle: 0, scale: 1 }
    addInstrument(inst)
  }
  const addCompass = () => {
    const inst: CompassInstrument = { id: generateId('comp'), type: 'tool_compass', cx: window.innerWidth / 2, cy: window.innerHeight / 2, radius: 80, arcStart: 0, arcEnd: 270 }
    addInstrument(inst)
  }

  const is = (t: ToolType) => activeTool === t

  return (
    <aside
      className="flex flex-col items-center gap-0.5 py-2 px-1.5 h-full overflow-y-auto no-scrollbar"
      style={{ background: '#0a0f1e', borderRight: '1px solid #1e293b', width: 58, minWidth: 58 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center w-8 h-8 rounded-xl mb-1 shrink-0"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
        <span className="text-white font-black text-sm">T</span>
      </div>

      {/* ── SELECTION & DRAWING ─────────────────────────────── */}
      <SectionLabel label="Dessin" />

      <ToolBtn icon={<MousePointer2 size={16} />} label="Sélection" shortcut="V" active={is('select')} onClick={() => setTool('select')} />
      <ToolBtn icon={<Pencil size={16} />} label="Stylo" shortcut="P" active={is('pen')} onClick={() => setTool('pen')} />
      <ToolBtn icon={<Minus size={16} />} label="Ligne" shortcut="L" active={is('line')} onClick={() => setTool('line')} />
      <ToolBtn icon={<ArrowRight size={16} />} label="Flèche" shortcut="A" active={is('arrow')} onClick={() => setTool('arrow')} />
      <ToolBtn icon={<Square size={16} />} label="Rectangle" shortcut="R" active={is('rect')} onClick={() => setTool('rect')} />
      <ToolBtn icon={<Circle size={16} />} label="Cercle" shortcut="C" active={is('circle')} onClick={() => setTool('circle')} />
      <ToolBtn icon={<Type size={16} />} label="Texte" shortcut="T" active={is('text')} onClick={() => setTool('text')} />
      <ToolBtn icon={<Eraser size={16} />} label="Gomme" shortcut="E" active={is('eraser')} onClick={() => setTool('eraser')} />

      {/* ── MATH ────────────────────────────────────────────── */}
      <SectionLabel label="Math" />
      <Group label="Géométrie" color="#3b82f6" defaultOpen>
        <ToolBtn icon={<Triangle size={16} />} label="Triangle" active={is('triangle')} onClick={() => setTool('triangle')} />
        <ToolBtn icon={<Crosshair size={16} />} label="Repère (axes)" active={is('axes')} onClick={() => setTool('axes')} />
        <ToolBtn icon={<GitBranch size={16} style={{ transform: 'rotate(-90deg)' }} />} label="Marqueur d'angle" active={is('angle-marker')} onClick={() => setTool('angle-marker')} />
        <ToolBtn icon={<Minus size={16} />} label="Droite numérique" active={is('number-line')} onClick={() => setTool('number-line')} />
      </Group>
      <Group label="Analyse" color="#8b5cf6" defaultOpen>
        <ToolBtn icon={<FunctionSquare size={16} />} label="Graphe f(x)" active={is('function-graph')} onClick={() => setTool('function-graph')} />
        <ToolBtn icon={<Sigma size={16} />} label="Fraction" active={is('fraction')} onClick={() => setTool('fraction')} />
      </Group>

      {/* ── PHYSICS ─────────────────────────────────────────── */}
      <SectionLabel label="Physique" />
      <Group label="Mécanique" color="#f97316" defaultOpen>
        <ToolBtn icon={<Zap size={16} />} label="Vecteur force (drag)" active={is('force-vector')} onClick={() => setTool('force-vector')} />
        <ToolBtn icon={<Waves size={16} />} label="Ressort (drag)" active={is('spring')} onClick={() => setTool('spring')} />
        <ToolBtn icon={<FlipHorizontal2 size={16} />} label="Plan incliné" active={is('inclined-plane')} onClick={() => setTool('inclined-plane')} />
      </Group>
      <Group label="Optique" color="#fbbf24">
        <ToolBtn icon={<AlignCenter size={16} />} label="Lentille" active={is('lens')} onClick={() => setTool('lens')} />
        <ToolBtn icon={<Wind size={16} />} label="Rayon lumineux (drag)" active={is('light-ray')} onClick={() => setTool('light-ray')} />
      </Group>
      <Group label="Électricité" color="#22c55e">
        <ToolBtn icon={<Activity size={16} />} label="Résistance" active={is('circuit-resistor')} onClick={() => setTool('circuit-resistor')} />
        <ToolBtn icon={<Zap size={16} />} label="Pile / Générateur" active={is('circuit-battery')} onClick={() => setTool('circuit-battery')} />
        <ToolBtn icon={<Circle size={14} />} label="Lampe" active={is('circuit-bulb')} onClick={() => setTool('circuit-bulb')} />
        <ToolBtn icon={<ToggleLeft size={16} />} label="Interrupteur" active={is('circuit-switch')} onClick={() => setTool('circuit-switch')} />
        <ToolBtn icon={<Move size={16} />} label="Condensateur" active={is('circuit-capacitor')} onClick={() => setTool('circuit-capacitor')} />
      </Group>

      {/* ── CHEMISTRY ───────────────────────────────────────── */}
      <SectionLabel label="Chimie" />
      <Group label="Molécules" color="#ec4899" defaultOpen>
        <ToolBtn icon={<Atom size={16} />} label="Atome (clic)" active={is('atom')} onClick={() => setTool('atom')} />
        <ToolBtn icon={<Link2 size={16} />} label="Liaison (drag)" active={is('bond')} onClick={() => setTool('bond')} />
        <ToolBtn icon={<Hexagon size={16} />} label="Benzène" active={is('benzene-ring')} onClick={() => setTool('benzene-ring')} />
      </Group>

      {/* ── INSTRUMENTS ─────────────────────────────────────── */}
      <SectionLabel label="Instruments" />
      <ToolBtn icon={<Ruler size={16} />} label="Règle" shortcut="U" onClick={addRuler} />
      <ToolBtn icon={<ScanLine size={16} />} label="Rapporteur" shortcut="O" onClick={addProtractor} />
      <ToolBtn icon={<Compass size={16} />} label="Compas" shortcut="M" onClick={addCompass} />

      {/* ── COLORS ──────────────────────────────────────────── */}
      <SectionLabel label="Couleur" />
      <div className="grid grid-cols-2 gap-1 px-1">
        {PALETTE.map((color) => (
          <button
            key={color}
            className={`color-swatch ${activeColor === color ? 'active' : ''}`}
            style={{
              background: color,
              border: color === '#ffffff' ? '2px solid #475569' : `2px solid ${activeColor === color ? 'white' : 'transparent'}`,
            }}
            onClick={() => setColor(color)}
            title={color}
          />
        ))}
      </div>

      {/* ── STROKE WIDTH ────────────────────────────────────── */}
      <SectionLabel label="Épaisseur" />
      <div className="flex flex-col items-center gap-1 w-full px-1">
        <span className="text-slate-400 text-[10px] font-mono tabular-nums">{strokeWidth}px</span>
        <input
          type="range" min={1} max={20} value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          style={{ writingMode: 'vertical-lr', direction: 'rtl', width: 6, height: 72, accentColor: '#3b82f6' }}
        />
      </div>

      {/* ── ZOOM ────────────────────────────────────────────── */}
      <SectionLabel label="Vue" />
      <ToolBtn icon={<ZoomIn size={16} />} label="Zoom +" shortcut="+" onClick={() => zoom(1.25)} />
      <ToolBtn icon={<ZoomOut size={16} />} label="Zoom −" shortcut="-" onClick={() => zoom(0.8)} />
      <ToolBtn icon={<Maximize2 size={16} />} label="Ajuster" shortcut="0" onClick={fitContent} />

      <div className="flex-1 min-h-4" />
    </aside>
  )
}

export default Toolbar
