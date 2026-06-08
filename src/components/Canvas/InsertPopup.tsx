import React, { useEffect, useRef, useState } from 'react'
import {
  Square, Circle, Type, Triangle, Crosshair, FunctionSquare, GitBranch,
  Sigma, Minus, Zap, Waves, FlipHorizontal2, AlignHorizontalJustifyCenter,
  Activity, ToggleLeft, Move, Atom, Hexagon, Grid3x3,
  Wind, Circle as CircleIcon,
  FlaskConical, Flame, Thermometer, TestTube2, Microscope, Droplets,
} from 'lucide-react'
import { createElement } from '../../utils/placeElement'
import { toolsByCategory } from '../../tools/registry'
import type { ToolCategory } from '../../tools/types'
import type { CanvasElement, GridVariant } from '../../types/canvas'

interface InsertPopupProps {
  screenX: number
  screenY: number
  canvasX: number
  canvasY: number
  activeColor: string
  fillColor: string
  strokeWidth: number
  atomSymbol: string
  gridVariant: GridVariant
  onPlace: (el: CanvasElement, startEditing?: boolean) => void
  onClose: () => void
}

interface ItemDef {
  tool: string
  label: string
  icon: React.ReactNode
  startEditing?: boolean
}

const CATEGORIES: { id: string; label: string; accent: string; items: ItemDef[] }[] = [
  {
    id: 'math', label: 'Maths', accent: '#818cf8',
    items: [
      { tool: 'triangle',       label: 'Triangle',    icon: <Triangle size={13} /> },
      { tool: 'axes',           label: 'Repère',      icon: <Crosshair size={13} /> },
      { tool: 'function-graph', label: 'Graphe',      icon: <FunctionSquare size={13} /> },
      { tool: 'angle-marker',   label: 'Angle',       icon: <GitBranch size={13} style={{ transform: 'rotate(-90deg)' }} /> },
      { tool: 'fraction',       label: 'Fraction',    icon: <Sigma size={13} /> },
      { tool: 'number-line',    label: 'Droite',      icon: <Minus size={13} /> },
    ],
  },
  {
    id: 'phys', label: 'Physique', accent: '#fbbf24',
    items: [
      { tool: 'force-vector',      label: 'Force',        icon: <Zap size={13} /> },
      { tool: 'spring',            label: 'Ressort',      icon: <Waves size={13} /> },
      { tool: 'inclined-plane',    label: 'Plan incliné', icon: <FlipHorizontal2 size={13} /> },
      { tool: 'lens',              label: 'Lentille',     icon: <AlignHorizontalJustifyCenter size={13} /> },
      { tool: 'circuit-resistor',  label: 'Résistance',   icon: <Activity size={13} /> },
      { tool: 'circuit-battery',   label: 'Pile',         icon: <Zap size={13} /> },
      { tool: 'circuit-bulb',      label: 'Lampe',        icon: <CircleIcon size={12} /> },
      { tool: 'circuit-switch',    label: 'Interrupteur', icon: <ToggleLeft size={13} /> },
      { tool: 'circuit-capacitor', label: 'Condensateur', icon: <Move size={13} /> },
      { tool: 'circuit-voltmeter', label: 'Voltmètre',    icon: <Wind size={13} /> },
      { tool: 'circuit-ammeter',   label: 'Ampèremètre',  icon: <Activity size={13} /> },
      { tool: 'circuit-ground',    label: 'Masse',        icon: <Minus size={13} /> },
    ],
  },
  {
    id: 'chem', label: 'Chimie', accent: '#34d399',
    items: [
      { tool: 'atom',         label: 'Atome',   icon: <Atom size={13} /> },
      { tool: 'benzene-ring', label: 'Benzène', icon: <Hexagon size={13} /> },
    ],
  },
  {
    id: 'lab', label: 'Labo', accent: '#22d3ee',
    items: [
      { tool: 'lab-burette',           label: 'Burette',        icon: <Minus size={13} style={{ transform: 'rotate(90deg)' }} /> },
      { tool: 'lab-erlenmeyer',        label: 'Erlenmeyer',     icon: <FlaskConical size={13} /> },
      { tool: 'lab-beaker',            label: 'Bécher',         icon: <FlaskConical size={13} /> },
      { tool: 'lab-test-tube',         label: 'Tube essai',     icon: <TestTube2 size={13} /> },
      { tool: 'lab-bunsen-burner',     label: 'Bunsen',         icon: <Flame size={13} /> },
      { tool: 'lab-condenser',         label: 'Réfrigérant',    icon: <Waves size={13} /> },
      { tool: 'lab-retort-stand',      label: 'Support',        icon: <Microscope size={13} /> },
      { tool: 'lab-round-flask',       label: 'Ballon',         icon: <CircleIcon size={13} /> },
      { tool: 'lab-distillation-flask',label: 'Ballon distil.', icon: <FlaskConical size={13} /> },
      { tool: 'lab-thermometer',       label: 'Thermomètre',    icon: <Thermometer size={13} /> },
      { tool: 'lab-ph-meter',          label: 'pH-mètre',       icon: <Thermometer size={13} /> },
      { tool: 'lab-graduated-cylinder',label: 'Éprouvette',     icon: <TestTube2 size={13} /> },
      { tool: 'lab-funnel',            label: 'Entonnoir',      icon: <FlaskConical size={13} /> },
      { tool: 'lab-dropper',           label: 'Compte-gouttes', icon: <Droplets size={13} /> },
      { tool: 'lab-pipette',           label: 'Pipette',        icon: <Minus size={13} /> },
      { tool: 'lab-tripod',            label: 'Trépied',        icon: <Triangle size={13} /> },
      { tool: 'lab-separatory-funnel', label: 'Ampoule',        icon: <FlaskConical size={13} /> },
      { tool: 'lab-magnetic-stirrer',  label: 'Agitateur',      icon: <Activity size={13} /> },
      { tool: 'lab-evaporating-dish',  label: "Capsule évap.",  icon: <Wind size={13} /> },
      { tool: 'lab-watch-glass',       label: 'V. montre',      icon: <Activity size={13} /> },
      { tool: 'lab-petri-dish',        label: 'B. Pétri',       icon: <Circle size={13} /> },
    ],
  },
  {
    id: 'draw', label: 'Formes', accent: '#f472b6',
    items: [
      { tool: 'rect',   label: 'Rectangle', icon: <Square size={13} /> },
      { tool: 'circle', label: 'Cercle',    icon: <Circle size={13} /> },
      { tool: 'text',   label: 'Texte',     icon: <Type size={13} />,   startEditing: true },
      { tool: 'grid',   label: 'Grille',    icon: <Grid3x3 size={13} /> },
    ],
  },
  ...domainCategory('diagram', 'Schémas',       '#94a3b8'),
  ...domainCategory('cs',      'Info',          '#60a5fa'),
  ...domainCategory('network', 'Réseaux',       '#2dd4bf'),
  ...domainCategory('security','Cyber',         '#f87171'),
  ...domainCategory('data',    'Data/IA',       '#c084fc'),
  ...domainCategory('law',     'Droit',         '#d6a567'),
  ...domainCategory('architecture', 'Archi',    '#818cf8'),
]

/** Build an insert-popup category straight from the tool registry. */
function domainCategory(cat: ToolCategory, label: string, accent: string) {
  const items = toolsByCategory(cat)
    .filter(t => t.interaction === 'click' || t.interaction === 'drag')
    .map(t => ({ tool: t.id, label: t.label.length > 14 ? t.label.slice(0, 13) + '…' : t.label, icon: t.icon }))
  return items.length ? [{ id: cat, label, accent, items }] : []
}

const InsertPopup: React.FC<InsertPopupProps> = ({
  screenX, screenY, canvasX, canvasY,
  activeColor, fillColor, strokeWidth, atomSymbol, gridVariant,
  onPlace, onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState('math')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleItem = (item: ItemDef) => {
    const el = createElement(item.tool, { cx: canvasX, cy: canvasY, activeColor, fillColor, strokeWidth, gridVariant, atomSymbol })
    if (el) onPlace(el, item.startEditing)
    onClose()
  }

  const category = CATEGORIES.find(c => c.id === activeCategory) ?? CATEGORIES[0]

  const POPUP_W = 252
  const POPUP_H = 300
  const left = Math.min(screenX, window.innerWidth - POPUP_W - 12)
  const top  = Math.min(screenY - 16, window.innerHeight - POPUP_H - 12)

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left,
        top,
        width: POPUP_W,
        background: '#0a0b10',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14,
        boxShadow: '0 16px 56px rgba(0,0,0,0.85), 0 2px 12px rgba(0,0,0,0.6)',
        zIndex: 200,
        overflow: 'hidden',
        animation: 'dropIn 0.13s ease-out',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '9px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: 4,
          background: 'var(--accent)', flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(220,225,255,0.8)', letterSpacing: '0.02em' }}>
          Insérer un élément
        </span>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#08090e',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '7px 10px',
              border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 11,
              fontWeight: activeCategory === cat.id ? 700 : 400,
              fontFamily: 'inherit',
              color: activeCategory === cat.id ? cat.accent : 'rgba(160,170,210,0.5)',
              borderBottom: activeCategory === cat.id ? `2px solid ${cat.accent}` : '2px solid transparent',
              transition: 'all 0.12s',
              letterSpacing: '0.01em',
              marginBottom: -1,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 5,
        maxHeight: 192,
        overflowY: 'auto',
      }}>
        {category.items.map(item => (
          <button
            key={item.tool}
            onClick={() => handleItem(item)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 5, padding: '10px 4px 8px',
              borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.07)',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(200,210,255,0.65)',
              fontSize: 10, fontFamily: 'inherit', fontWeight: 500,
              lineHeight: 1.2, textAlign: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = `${category.accent}18`
              el.style.borderColor = `${category.accent}55`
              el.style.color = category.accent
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = `0 4px 12px rgba(0,0,0,0.3)`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.03)'
              el.style.borderColor = 'rgba(255,255,255,0.07)'
              el.style.color = 'rgba(200,210,255,0.65)'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '5px 12px 8px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 9,
        color: 'rgba(255,255,255,0.2)',
        textAlign: 'center',
        letterSpacing: '0.03em',
      }}>
        CLIC DROIT → INSÉRER · ÉCHAP FERME
      </div>
    </div>
  )
}

export default InsertPopup
