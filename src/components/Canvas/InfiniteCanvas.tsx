import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import {
  screenToCanvas,
  generateId,
} from '../../utils/canvasUtils'
import {
  ATOM_COLORS,
} from '../../types/canvas'
import InsertPopup from './InsertPopup'
import LabPropertyPanel from './LabPropertyPanel'
import GenericPropertyPanel from './GenericPropertyPanel'
import QuickActions from './QuickActions'
import { usePlaybackStore } from '../../agent/playbackStore'
import { createElement as createFromTool } from '../../utils/placeElement'
import { TOOLS } from '../../tools/registry'
import { isInteractive } from '../../utils/simulate'
import type { LabElement } from '../../types/canvas'
import type {
  CanvasElement,
  PenElement,
  LineElement,
  ArrowElement,
  RectElement,
  CircleElement,
  TextElement,
  TriangleElement,
  AxesElement,
  FunctionGraphElement,
  ForceVectorElement,
  SpringElement,
  InclinedPlaneElement,
  LensElement,
  CircuitComponentElement,
  AtomElement,
  BondElement,
  BenzeneRingElement,
  AngleMarkerElement,
  FractionElement,
  NumberLineElement,
  LightRayElement,
  GridElement,
  ConnectorElement,
  EdgeElement,
} from '../../types/canvas'

// Element components
import PenElementComp from './elements/PenElementComp'
import LineElementComp from './elements/LineElementComp'
import ArrowElementComp from './elements/ArrowElementComp'
import RectElementComp from './elements/RectElementComp'
import CircleElementComp from './elements/CircleElementComp'
import TextElementComp from './elements/TextElementComp'
import VectorElementComp from './elements/VectorElementComp'
import FormulaElementComp from './elements/FormulaElementComp'
import TriangleElementComp from './elements/TriangleElementComp'
import AxesElementComp from './elements/AxesElementComp'
import FunctionGraphElementComp from './elements/FunctionGraphElementComp'
import ForceVectorElementComp from './elements/ForceVectorElementComp'
import SpringElementComp from './elements/SpringElementComp'
import InclinedPlaneElementComp from './elements/InclinedPlaneElementComp'
import LensElementComp from './elements/LensElementComp'
import CircuitComponentElementComp from './elements/CircuitComponentElementComp'
import AtomElementComp from './elements/AtomElementComp'
import BondElementComp from './elements/BondElementComp'
import BenzeneRingElementComp from './elements/BenzeneRingElementComp'
import GridElementComp from './elements/GridElementComp'
import ConnectorElementComp from './elements/ConnectorElementComp'
import LabElementComp from './elements/LabElementComp'
import AngleMarkerElementComp from './elements/AngleMarkerElementComp'
import FractionElementComp from './elements/FractionElementComp'
import NumberLineElementComp from './elements/NumberLineElementComp'
import NodeElementComp from './elements/NodeElementComp'
import EdgeElementComp from './elements/EdgeElementComp'
import CodeBlockElementComp from './elements/CodeBlockElementComp'
import TableElementComp from './elements/TableElementComp'
import CalloutElementComp from './elements/CalloutElementComp'
import TreeElementComp from './elements/TreeElementComp'
import TimelineElementComp from './elements/TimelineElementComp'
import PacketElementComp from './elements/PacketElementComp'
import StickyNoteElementComp from './elements/StickyNoteElementComp'
import RichTextElementComp from './elements/RichTextElementComp'
import ImageElementComp from './elements/ImageElementComp'
import CourseCardElementComp from './elements/CourseCardElementComp'
import QcmElementComp from './elements/QcmElementComp'
import FlashcardElementComp from './elements/FlashcardElementComp'
import FillBlankElementComp from './elements/FillBlankElementComp'
import ShortAnswerElementComp from './elements/ShortAnswerElementComp'

// Instruments
import Ruler from '../instruments/Ruler'
import Protractor from '../instruments/Protractor'
import Compass from '../instruments/Compass'

const ZOOM_MIN = 0.05
const ZOOM_MAX = 20
const CANVAS_BG = 'var(--canvas-bg)'

// Tools that are placed with a single click (not drag)
// Derived from the registry: every tool committed by a single click.
// Domain presets (cs-*, net-*, …) are included automatically.
const CLICK_PLACE_TOOLS = new Set(
  TOOLS.filter(t => t.interaction === 'click').map(t => t.id)
)


function getCursorClass(tool: string, isPanning: boolean): string {
  if (isPanning) return 'cursor-grabbing'
  switch (tool) {
    case 'select': return 'cursor-default'
    case 'pen': return 'cursor-crosshair'
    case 'line': return 'cursor-crosshair'
    case 'arrow': return 'cursor-crosshair'
    case 'rect': return 'cursor-crosshair'
    case 'circle': return 'cursor-crosshair'
    case 'text': return 'cursor-text'
    case 'eraser': return 'cursor-eraser'
    case 'pan': return 'cursor-grab'
    default: return 'cursor-crosshair'
  }
}

function fontStyleToFamily(style: string): string {
  switch (style) {
    case 'serif':       return 'Georgia, serif'
    case 'mono':        return 'monospace'
    case 'handwriting': return "'Caveat', cursive"
    default:            return 'system-ui, sans-serif'
  }
}

// Elements that expose a width (and optionally height) can be resized
// from a bottom-right corner handle.
function getResizeBox(el: CanvasElement): { w: number; h: number; hasH: boolean } | null {
  const r = el as unknown as Record<string, unknown>
  if (typeof r.width !== 'number') return null
  const w = r.width as number
  const hasH = typeof r.height === 'number'
  return { w, h: hasH ? (r.height as number) : 0, hasH }
}

function getElementCenter(el: CanvasElement): { x: number; y: number } {
  if ('x2' in el && 'y2' in el) {
    const e2 = el as { x: number; y: number; x2: number; y2: number }
    return { x: (e2.x + e2.x2) / 2, y: (e2.y + e2.y2) / 2 }
  }
  if (el.type === 'rect' || el.type === 'grid') {
    const r = el as { x: number; y: number; width: number; height: number }
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }
  return { x: el.x, y: el.y }
}

const InfiniteCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)

  // ── store selectors ──────────────────────────────────────────
  const elements = useCanvasStore((s) => s.elements)
  const instruments = useCanvasStore((s) => s.instruments)
  const viewport = useCanvasStore((s) => s.viewport)
  const activeTool = useCanvasStore((s) => s.activeTool)
  const activeColor = useCanvasStore((s) => s.activeColor)
  const fillColor = useCanvasStore((s) => s.fillColor)
  const gridVariant = useCanvasStore((s) => s.gridVariant)
  const activeTextFont = useCanvasStore((s) => s.activeTextFont)
  const bondFromAtomId = useCanvasStore((s) => s.bondFromAtomId)
  const activeAtomSymbol = useCanvasStore((s) => s.activeAtomSymbol)
  const strokeWidth = useCanvasStore((s) => s.strokeWidth)
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const editingTextId = useCanvasStore((s) => s.editingTextId)

  const addElement = useCanvasStore((s) => s.addElement)
  const updateElement = useCanvasStore((s) => s.updateElement)
  const deleteElement = useCanvasStore((s) => s.deleteElement)
  const setViewport = useCanvasStore((s) => s.setViewport)
  const selectWithGroup = useCanvasStore((s) => s.selectWithGroup)
  const selectElements = useCanvasStore((s) => s.selectElements)
  const expandGroup = useCanvasStore((s) => s.expandGroup)
  const moveElementsBy = useCanvasStore((s) => s.moveElementsBy)
  const clearSelection = useCanvasStore((s) => s.clearSelection)
  const setEditingTextId = useCanvasStore((s) => s.setEditingTextId)
  const setBondFromAtomId = useCanvasStore((s) => s.setBondFromAtomId)
  const pushHistory = useCanvasStore((s) => s.pushHistory)
  const interactWithElement = useCanvasStore((s) => s.interactWithElement)

  // ── local drawing state ──────────────────────────────────────
  const [isPanning, setIsPanning] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const isSpacePressedRef = useRef(false)
  // Insert popup state
  const [insertPopup, setInsertPopup] = useState<{
    screenX: number; screenY: number; canvasX: number; canvasY: number
  } | null>(null)
  // Property panel: id of selected element (any type)
  const [panelElementId, setPanelElementId] = useState<string | null>(null)

  // Lasso (rubber-band) selection rectangle, in canvas space.
  const [lasso, setLasso] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  // Elements just revealed by the AI playback get a writing animation.
  const recentlyRevealed = usePlaybackStore((s) => s.recentlyRevealed)
  const aiCursor = usePlaybackStore((s) => s.cursor)

  // Drawing in-progress state
  const drawingRef = useRef<{
    active: boolean
    startX: number
    startY: number
    currentId: string | null
    points: number[][]
    panStart: { vx: number; vy: number; mx: number; my: number } | null
    // Multi-element drag: move the whole selection by mouse deltas.
    dragSel: {
      ids: string[]
      lastX: number
      lastY: number
      historyPushed: boolean
    } | null
    // Lasso in progress (canvas-space origin).
    lassoStart: { x: number; y: number } | null
    // Resize in progress (corner handle of a width/height element).
    resize: {
      id: string
      startW: number
      startH: number
      hasH: boolean
      mx: number
      my: number
      historyPushed: boolean
    } | null
  }>({
    active: false,
    startX: 0,
    startY: 0,
    currentId: null,
    points: [],
    panStart: null,
    dragSel: null,
    resize: null,
    lassoStart: null,
  })

  // ── SVG coordinate helper ────────────────────────────────────
  const getSvgPoint = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, viewport)
  }, [viewport])

  const getScreenPoint = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  // ── Zoom (wheel) ─────────────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = svg.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, viewport.zoom * zoomFactor))

      // Zoom centered on mouse
      const newX = mx - (mx - viewport.x) * (newZoom / viewport.zoom)
      const newY = my - (my - viewport.y) * (newZoom / viewport.zoom)

      setViewport({ x: newX, y: newY, zoom: newZoom })
    }

    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [viewport, setViewport])

  // Hold Space to pan temporarily, whatever the active tool is.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return
      if (e.code === 'Space') isSpacePressedRef.current = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpacePressedRef.current = false
    }
    const onBlur = () => {
      isSpacePressedRef.current = false
      setIsPanning(false)
      drawingRef.current.panStart = null
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // ── Place a click-to-drop element ────────────────────────────
  const placeClickElement = useCallback((tool: string, cx: number, cy: number, base: { id: string; rotation: number; selected: boolean; locked: boolean; createdBy: 'user' | 'ai' }) => {
    const common = { ...base, x: cx, y: cy }
    switch (tool) {
      case 'triangle':
        addElement({
          ...common, type: 'triangle',
          v1: [0, 0], v2: [100, 0], v3: [50, -86],
          fill: fillColor, strokeColor: activeColor, strokeWidth,
          showAngles: true, showSides: false,
        } as TriangleElement)
        break
      case 'axes':
        addElement({
          ...common, type: 'axes',
          xMin: -5, xMax: 5, yMin: -4, yMax: 4,
          xStep: 1, yStep: 1, unitSize: 40,
          strokeColor: activeColor, strokeWidth,
          showGrid: true, showLabels: true,
          xLabel: 'x', yLabel: 'y',
        } as AxesElement)
        break
      case 'function-graph':
        addElement({
          ...common, type: 'function-graph',
          expression: 'x^2',
          xMin: -5, xMax: 5, unitSize: 40,
          color: activeColor, strokeWidth,
          showAxes: true,
        } as FunctionGraphElement)
        break
      case 'angle-marker':
        addElement({
          ...common, type: 'angle-marker',
          ray1Angle: 0, ray2Angle: 60,
          radius: 50, color: activeColor,
          label: '', fill: activeColor + '33',
        } as AngleMarkerElement)
        break
      case 'fraction':
        addElement({
          ...common, type: 'fraction',
          numerator: 'a', denominator: 'b',
          fontSize: 28, color: activeColor,
        } as FractionElement)
        break
      case 'number-line':
        addElement({
          ...common, type: 'number-line',
          min: -5, max: 5, step: 1, length: 300,
          strokeColor: activeColor, strokeWidth, marked: [],
        } as NumberLineElement)
        break
      case 'inclined-plane':
        addElement({
          ...common, type: 'inclined-plane',
          width: 200, angle: 30,
          fill: fillColor, strokeColor: activeColor, strokeWidth,
          showAngleLabel: true,
        } as InclinedPlaneElement)
        break
      case 'lens':
        addElement({
          ...common, type: 'lens',
          height: 120, focalLength: 80,
          strokeColor: activeColor, strokeWidth,
          showFocalPoints: true, showAxis: true,
        } as LensElement)
        break
      case 'circuit-resistor':
        addElement({ ...common, type: 'circuit-component', component: 'resistor', width: 80, strokeColor: activeColor, strokeWidth, label: 'R', value: '' } as CircuitComponentElement)
        break
      case 'circuit-battery':
        addElement({ ...common, type: 'circuit-component', component: 'battery', width: 80, strokeColor: activeColor, strokeWidth, label: '', value: '' } as CircuitComponentElement)
        break
      case 'circuit-bulb':
        addElement({ ...common, type: 'circuit-component', component: 'bulb', width: 80, strokeColor: activeColor, strokeWidth, label: 'L', value: '' } as CircuitComponentElement)
        break
      case 'circuit-switch':
        addElement({ ...common, type: 'circuit-component', component: 'switch-open', width: 80, strokeColor: activeColor, strokeWidth, label: 'K', value: '' } as CircuitComponentElement)
        break
      case 'circuit-capacitor':
        addElement({ ...common, type: 'circuit-component', component: 'capacitor', width: 80, strokeColor: activeColor, strokeWidth, label: 'C', value: '' } as CircuitComponentElement)
        break
      case 'atom': {
        const sym = activeAtomSymbol || 'C'
        const atomRadii: Record<string, number> = {
          H: 14, He: 14, Li: 20, Be: 18, B: 18, C: 20, N: 18, O: 18,
          F: 16, Ne: 15, Na: 22, Mg: 21, Al: 21, Si: 21, P: 20, S: 20,
          Cl: 20, Ar: 19, K: 26, Ca: 24, Fe: 22, Co: 22, Ni: 22,
          Cu: 22, Zn: 22, Ag: 23, Au: 23, Hg: 23, Pb: 24, Br: 21, I: 23,
        }
        const r = atomRadii[sym] ?? 20
        addElement({
          ...common, type: 'atom',
          element: sym,
          radius: r,
          fillColor: ATOM_COLORS[sym] ?? ATOM_COLORS['default'],
          strokeColor: 'rgba(0,0,0,0.25)',
          showLabel: true,
        } as AtomElement)
        break
      }
      case 'benzene-ring':
        addElement({
          ...common, type: 'benzene-ring',
          radius: 50, strokeColor: activeColor, strokeWidth,
          fill: fillColor, aromatic: true,
        } as BenzeneRingElement)
        break
      default: {
        // Handles lab-* and any other tools defined in placeElement.ts
        const el = createFromTool(tool, {
          cx, cy, activeColor, fillColor, strokeWidth,
          gridVariant, atomSymbol: activeAtomSymbol,
        })
        if (el) addElement(el)
      }
    }
  }, [addElement, activeColor, fillColor, strokeWidth, activeAtomSymbol, gridVariant])

  // ── Mouse Down ───────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && (activeTool === 'pan' || isSpacePressedRef.current))) {
      // Middle button or pan tool → start pan
      e.preventDefault()
      setIsPanning(true)
      drawingRef.current.panStart = { vx: viewport.x, vy: viewport.y, mx: e.clientX, my: e.clientY }
      return
    }
    if (e.button !== 0) return

    const cp = getSvgPoint(e)

    const d = drawingRef.current
    d.active = true
    d.startX = cp.x
    d.startY = cp.y
    d.points = [[cp.x, cp.y]]

    // Space + drag = pan (handled in keydown).
    // Plain drag on empty canvas = lasso (rubber-band) selection.
    if (activeTool === 'select') {
      drawingRef.current.lassoStart = { x: cp.x, y: cp.y }
      setLasso({ x0: cp.x, y0: cp.y, x1: cp.x, y1: cp.y })
      return
    }

    // ── CONNECT tool: no drag, only click-on-element (handled in onElementClick)
    if (activeTool === 'connect') {
      d.active = false
      return
    }

    if (activeTool === 'eraser') {
      // Erase will be handled in mousemove
      return
    }

    if (activeTool === 'text') {
      // Place a text element
      const id = generateId('text')
      const el: TextElement = {
        id,
        type: 'text',
        x: cp.x,
        y: cp.y,
        content: '',
        fontSize: 20,
        color: activeColor,
        fontFamily: fontStyleToFamily(activeTextFont),
        fontStyle: activeTextFont,
        rotation: 0,
        selected: false,
        locked: false,
        createdBy: 'user',
      }
      addElement(el)
      setEditingTextId(id)
      d.active = false
      return
    }

    // For shape tools, start a preview element
    const baseEl = {
      id: generateId(),
      rotation: 0,
      selected: false,
      locked: false,
      createdBy: 'user' as const,
      x: cp.x,
      y: cp.y,
    }

    if (activeTool === 'pen') {
      const el: PenElement = {
        ...baseEl,
        type: 'pen',
        points: [[cp.x, cp.y]],
        strokeColor: activeColor,
        strokeWidth,
        opacity: 1,
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'line') {
      const el: LineElement = {
        ...baseEl,
        type: 'line',
        x2: cp.x,
        y2: cp.y,
        strokeColor: activeColor,
        strokeWidth,
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'arrow') {
      const el: ArrowElement = {
        ...baseEl,
        type: 'arrow',
        x2: cp.x,
        y2: cp.y,
        strokeColor: activeColor,
        strokeWidth,
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'edge') {
      const el: EdgeElement = {
        ...baseEl,
        type: 'edge',
        x2: cp.x,
        y2: cp.y,
        fromId: '', toId: '',
        label: '', color: activeColor, strokeWidth,
        arrow: 'end', lineStyle: 'solid', routing: 'straight',
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'rect') {
      const el: RectElement = {
        ...baseEl,
        type: 'rect',
        width: 0,
        height: 0,
        fill: fillColor,
        strokeColor: activeColor,
        strokeWidth,
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'circle') {
      const el: CircleElement = {
        ...baseEl,
        type: 'circle',
        rx: 0,
        ry: 0,
        fill: fillColor,
        strokeColor: activeColor,
        strokeWidth,
      }
      d.currentId = el.id
      addElement(el)

    } else if (activeTool === 'grid') {
      const el: GridElement = {
        ...baseEl,
        type: 'grid',
        width: 0,
        height: 0,
        cellSize: 40,
        variant: gridVariant,
        strokeColor: '#c4b9ae',
        strokeWidth: 0.8,
        bgColor: '#fffdf8',
        opacity: 1,
      }
      d.currentId = el.id
      addElement(el)

    // ── DRAG LINE-LIKE NEW TOOLS ──────────────────────────────
    } else if (activeTool === 'force-vector') {
      const el: ForceVectorElement = {
        ...baseEl,
        type: 'force-vector',
        x2: cp.x, y2: cp.y,
        magnitude: 0, unit: 'N', label: '',
        color: activeColor, strokeWidth,
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'bond') {
      const el: BondElement = {
        ...baseEl,
        type: 'bond',
        x2: cp.x, y2: cp.y,
        bondOrder: 1,
        strokeColor: activeColor, strokeWidth,
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'spring') {
      const el: SpringElement = {
        ...baseEl,
        type: 'spring',
        x2: cp.x, y2: cp.y,
        coils: 8, amplitude: 12,
        strokeColor: activeColor, strokeWidth,
      }
      d.currentId = el.id
      addElement(el)
    } else if (activeTool === 'light-ray') {
      const el: LightRayElement = {
        ...baseEl,
        type: 'light-ray',
        points: [[cp.x, cp.y], [cp.x, cp.y]],
        strokeColor: '#fbbf24', strokeWidth,
      }
      d.currentId = el.id
      addElement(el)

    // ── CLICK-TO-PLACE TOOLS ─────────────────────────────────
    } else if (CLICK_PLACE_TOOLS.has(activeTool)) {
      placeClickElement(activeTool, cp.x, cp.y, baseEl)
      d.active = false
    }
  }, [activeTool, viewport, getSvgPoint, getScreenPoint, activeColor, fillColor, strokeWidth, addElement, setEditingTextId, placeClickElement])

  // ── Mouse Move ───────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const cp = getSvgPoint(e)
    setCursorPos(cp)

    // Panning
    if (isPanning && drawingRef.current.panStart) {
      const { vx, vy, mx, my } = drawingRef.current.panStart
      setViewport({ x: vx + e.clientX - mx, y: vy + e.clientY - my })
      return
    }

    // Resizing via corner handle
    const rz = drawingRef.current.resize
    if (rz) {
      if (!rz.historyPushed) { pushHistory(); rz.historyPushed = true }
      const dx = cp.x - rz.mx
      const dy = cp.y - rz.my
      const patch: Record<string, number> = { width: Math.max(24, rz.startW + dx) }
      if (rz.hasH) patch.height = Math.max(24, rz.startH + dy)
      updateElement(rz.id, patch as Partial<CanvasElement>)
      return
    }

    // Element dragging (group-aware, via select tool)
    const dSel = drawingRef.current.dragSel
    if (dSel) {
      let dx = cp.x - dSel.lastX
      let dy = cp.y - dSel.lastY
      if (e.shiftKey) {
        // Constrain to the dominant axis (relative to drag start).
        if (Math.abs(cp.x - drawingRef.current.startX) >= Math.abs(cp.y - drawingRef.current.startY)) dy = -(dSel.lastY - drawingRef.current.startY)
        else dx = -(dSel.lastX - drawingRef.current.startX)
      }
      if (dx === 0 && dy === 0) return
      if (!dSel.historyPushed) {
        pushHistory()
        dSel.historyPushed = true
      }
      moveElementsBy(dSel.ids, dx, dy)
      dSel.lastX = cp.x
      dSel.lastY = cp.y
      return
    }

    // Lasso (rubber-band) selection
    if (drawingRef.current.lassoStart) {
      const { x, y } = drawingRef.current.lassoStart
      setLasso({ x0: x, y0: y, x1: cp.x, y1: cp.y })
      return
    }

    const d = drawingRef.current
    if (!d.active || !d.currentId) return

    if (activeTool === 'pen') {
      d.points.push([cp.x, cp.y])
      updateElement(d.currentId, { points: [...d.points] } as Partial<CanvasElement>)
    } else if (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'edge') {
      const snap = e.shiftKey
      let x2 = cp.x, y2 = cp.y
      if (snap) {
        const dx = cp.x - d.startX
        const dy = cp.y - d.startY
        if (Math.abs(dx) > Math.abs(dy)) y2 = d.startY
        else x2 = d.startX
      }
      updateElement(d.currentId, { x2, y2 } as Partial<CanvasElement>)
    } else if (activeTool === 'rect' || activeTool === 'grid') {
      const w = cp.x - d.startX
      const h = e.shiftKey ? (Math.sign(cp.y - d.startY) * Math.abs(w)) : (cp.y - d.startY)
      updateElement(d.currentId, { width: w, height: h } as Partial<CanvasElement>)
    } else if (activeTool === 'circle') {
      const dx = cp.x - d.startX
      const dy = cp.y - d.startY
      const r = Math.sqrt(dx * dx + dy * dy)
      updateElement(d.currentId, { rx: r, ry: r } as Partial<CanvasElement>)
    } else if (activeTool === 'force-vector' || activeTool === 'bond' || activeTool === 'spring') {
      updateElement(d.currentId, { x2: cp.x, y2: cp.y } as Partial<CanvasElement>)
    } else if (activeTool === 'light-ray') {
      // Update last point of polyline
      const el = elements.find(e => e.id === d.currentId)
      if (el && el.type === 'light-ray') {
        const newPts = [...el.points]
        newPts[newPts.length - 1] = [cp.x, cp.y]
        updateElement(d.currentId, { points: newPts } as Partial<CanvasElement>)
      }
    } else if (activeTool === 'eraser') {
      // Erase elements near cursor
      const threshold = 12 / viewport.zoom
      const el = elements.find((el) => {
        if (el.type === 'pen') {
          return el.points.some(([px, py]) => {
            const dist = Math.sqrt((px - cp.x) ** 2 + (py - cp.y) ** 2)
            return dist < threshold
          })
        }
        // Simple proximity for other types
        const dx = el.x - cp.x
        const dy = el.y - cp.y
        return Math.sqrt(dx * dx + dy * dy) < threshold
      })
      if (el) deleteElement(el.id)
    }
  }, [activeTool, isPanning, viewport, getSvgPoint, updateElement, deleteElement, elements, setViewport, pushHistory])

  // ── Mouse Up ─────────────────────────────────────────────────
  const onMouseUp = useCallback((_e: React.MouseEvent<SVGSVGElement>) => {
    setIsPanning(false)
    drawingRef.current.panStart = null

    // End a resize cleanly.
    if (drawingRef.current.resize) {
      drawingRef.current.resize = null
      return
    }

    // Finalize lasso selection (group-expanded).
    if (drawingRef.current.lassoStart && lasso) {
      const minX = Math.min(lasso.x0, lasso.x1), maxX = Math.max(lasso.x0, lasso.x1)
      const minY = Math.min(lasso.y0, lasso.y1), maxY = Math.max(lasso.y0, lasso.y1)
      const moved = Math.abs(maxX - minX) > 3 || Math.abs(maxY - minY) > 3
      if (moved) {
        const hits = elements.filter((el) => {
          const c = getElementCenter(el)
          return c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY
        }).map((el) => el.id)
        selectElements(expandGroup(hits))
        setPanelElementId(null)
      } else {
        clearSelection()
        setPanelElementId(null)
      }
      drawingRef.current.lassoStart = null
      setLasso(null)
      drawingRef.current.active = false
      return
    }

    // Proximity auto-connect + Bunsen heating on single-element drag end
    const dragSel = drawingRef.current.dragSel
    if (dragSel && dragSel.historyPushed && activeTool === 'select' && dragSel.ids.length === 1) {
      const movedEl = elements.find(el => el.id === dragSel.ids[0])
      if (movedEl && movedEl.type !== 'connector' && movedEl.type !== 'grid') {
        const center = getElementCenter(movedEl)
        const THRESHOLD = 70

        // Bunsen proximity heating
        const isBunsen = movedEl.type === 'lab-instrument' && (movedEl as LabElement).component === 'bunsen-burner'
        const movedIsBunsen = isBunsen

        for (const other of elements) {
          if (other.id === movedEl.id) continue
          if (other.type === 'connector' || other.type === 'grid') continue

          const oc = getElementCenter(other)
          const dist = Math.sqrt((center.x - oc.x) ** 2 + (center.y - oc.y) ** 2)

          // Bunsen heating: if Bunsen is dragged near a container, heat it
          if (dist < THRESHOLD * 1.5) {
            const otherIsLab = other.type === 'lab-instrument' && (other as LabElement).component !== 'bunsen-burner'
            const bunsenNearOther = movedIsBunsen && otherIsLab
            const otherIsBunsen = other.type === 'lab-instrument' && (other as LabElement).component === 'bunsen-burner'
            const bunsenNearMoved = otherIsBunsen && movedEl.type === 'lab-instrument'

            if (bunsenNearOther) {
              const lab = other as LabElement
              const newTemp = Math.min(150, (lab.solution.temperature || 20) + 40)
              updateElement(other.id, {
                solution: {
                  ...lab.solution,
                  temperature: newTemp,
                  isHeated: true,
                  isBoiling: newTemp >= 100,
                },
                animated: newTemp >= 100,
              } as Partial<LabElement>)
            } else if (bunsenNearMoved && movedEl.type === 'lab-instrument') {
              const lab = movedEl as LabElement
              const newTemp = Math.min(150, (lab.solution.temperature || 20) + 40)
              updateElement(movedEl.id, {
                solution: {
                  ...lab.solution,
                  temperature: newTemp,
                  isHeated: true,
                  isBoiling: newTemp >= 100,
                },
                animated: newTemp >= 100,
              } as Partial<LabElement>)
            }
          }

          // Auto-connect (non-lab or lab pairs)
          if (dist < THRESHOLD) {
            const alreadyLinked = elements.some(el =>
              el.type === 'connector' && (
                ((el as ConnectorElement).fromId === movedEl.id && (el as ConnectorElement).toId === other.id) ||
                ((el as ConnectorElement).fromId === other.id && (el as ConnectorElement).toId === movedEl.id)
              )
            )
            if (!alreadyLinked) {
              addElement({
                id: generateId('conn'),
                type: 'connector',
                x: center.x, y: center.y,
                x2: oc.x, y2: oc.y,
                fromId: movedEl.id,
                toId: other.id,
                connectorType: 'wire',
                color: activeColor,
                strokeWidth,
                rotation: 0, selected: false, locked: false, createdBy: 'user',
              } as ConnectorElement)
              break
            }
          }
        }
      }
    }

    drawingRef.current.dragSel = null
    drawingRef.current.lassoStart = null
    drawingRef.current.active = false
    drawingRef.current.currentId = null
    drawingRef.current.points = []
  }, [activeTool, elements, activeColor, strokeWidth, addElement, lasso, selectElements, expandGroup, clearSelection])

  // ── Element click (select tool) ───────────────────────────────
  const onElementClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    // ── BOND tool: click atom → atom ──────────────────────────
    if (activeTool === 'bond') {
      const clickedEl = elements.find(el => el.id === id)
      if (clickedEl?.type === 'atom') {
        if (!bondFromAtomId) {
          setBondFromAtomId(id)
        } else if (bondFromAtomId !== id) {
          const fromAtom = elements.find(el => el.id === bondFromAtomId)
          const toAtom   = clickedEl
          if (fromAtom && toAtom) {
            addElement({
              id: generateId('bond'),
              type: 'bond',
              x: fromAtom.x, y: fromAtom.y,
              x2: toAtom.x, y2: toAtom.y,
              bondOrder: 1,
              strokeColor: activeColor, strokeWidth,
              rotation: 0, selected: false, locked: false, createdBy: 'user',
            })
          }
          setBondFromAtomId(null)
        } else {
          setBondFromAtomId(null)
        }
        return
      }
    }

    if (activeTool !== 'select') return

    // ── Functional interactivity: a plain click (no shift) on an
    //    interactive element acts on it (e.g. flips a switch and
    //    re-runs the circuit simulation) instead of just selecting.
    const clicked = elements.find(el => el.id === id)
    if (clicked && !e.shiftKey && isInteractive(clicked)) {
      interactWithElement(id)
      selectWithGroup(id, false)
      setPanelElementId(id)
      return
    }

    selectWithGroup(id, e.shiftKey)
    // Open property panel for clicked element
    setPanelElementId(id)
  }, [activeTool, selectWithGroup, bondFromAtomId,
      setBondFromAtomId, elements, activeColor, strokeWidth, addElement, interactWithElement])

  // ── Element drag start (single click + drag in select mode) ───
  const onElementMouseDown = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation()
    if (activeTool !== 'select') return

    // If the clicked element isn't already selected, select it (+ its group).
    // Keep an existing multi-selection so you can drag the whole set.
    let ids = selectedIds
    if (!selectedIds.includes(el.id)) {
      selectWithGroup(el.id, e.shiftKey)
      ids = expandGroup(e.shiftKey ? [...selectedIds, el.id] : [el.id])
    } else {
      ids = expandGroup(selectedIds)
    }
    setPanelElementId(el.id)

    const cp = getSvgPoint(e)
    drawingRef.current.dragSel = {
      ids,
      lastX: cp.x,
      lastY: cp.y,
      historyPushed: false,
    }
  }, [activeTool, getSvgPoint, selectWithGroup, selectedIds, expandGroup])

  // ── Resize handle drag start ──────────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation()
    const box = getResizeBox(el)
    if (!box) return
    const cp = getSvgPoint(e)
    drawingRef.current.resize = {
      id: el.id, startW: box.w, startH: box.h, hasH: box.hasH,
      mx: cp.x, my: cp.y, historyPushed: false,
    }
  }, [getSvgPoint])

  // ── Click on SVG background (deselect) ───────────────────────
  const onSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).tagName === 'svg' || (e.target as Element).classList.contains('canvas-bg')) {
      clearSelection()
      setPanelElementId(null)
    }
  }, [clearSelection])

  // ── Right-click on empty canvas → insert popup ────────────────
  const onContextMenu = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const isBackground = (e.target as Element).tagName === 'svg' || (e.target as Element).classList.contains('canvas-bg')
    if (!isBackground) return
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const cp = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, viewport)
    setInsertPopup({ screenX: e.clientX, screenY: e.clientY, canvasX: cp.x, canvasY: cp.y })
  }, [viewport])

  // ── Text editing complete ─────────────────────────────────────
  const onTextEditComplete = useCallback((id: string, content: string) => {
    updateElement(id, { content } as Partial<CanvasElement>)
    setEditingTextId(null)
  }, [updateElement, setEditingTextId])

  // ── Insert popup handler ──────────────────────────────────────
  const handleInsertPlace = useCallback((el: CanvasElement, startEditing?: boolean) => {
    addElement(el)
    if (startEditing && el.type === 'text') {
      setEditingTextId(el.id)
    }
  }, [addElement, setEditingTextId])

  // ── Render element ────────────────────────────────────────────
  const renderElement = (el: CanvasElement) => {
    const isSelected = selectedIds.includes(el.id)

    const elMouseDown = (e: React.MouseEvent) => onElementMouseDown(e, el)
    const elClick = (e: React.MouseEvent) => onElementClick(e, el.id)

    switch (el.type) {
      case 'grid':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <GridElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'connector':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <ConnectorElementComp element={el} elements={elements} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'pen':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <PenElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'line':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <LineElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'arrow':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <ArrowElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'rect':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <RectElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'circle':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <CircleElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'text':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <TextElementComp
              element={el}
              isSelected={isSelected}
              isEditing={editingTextId === el.id}
              onClick={elClick}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingTextId(el.id) }}
              onEditComplete={(content) => onTextEditComplete(el.id, content)}
              zoom={viewport.zoom}
            />
          </g>
        )
      case 'vector':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <VectorElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'formula':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <FormulaElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'triangle':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <TriangleElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'axes':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <AxesElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'function-graph':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <FunctionGraphElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'angle-marker':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <AngleMarkerElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'fraction':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <FractionElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'number-line':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <NumberLineElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'force-vector':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <ForceVectorElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'spring':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <SpringElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'inclined-plane':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <InclinedPlaneElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'lens':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <LensElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'light-ray':
        return (
          <g key={el.id} onMouseDown={elMouseDown} onClick={elClick}>
            <polyline
              points={el.points.map(p => p.join(',')).join(' ')}
              stroke={el.strokeColor} strokeWidth={el.strokeWidth}
              fill="none" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="8 4"
              markerEnd="url(#light-arrow)"
            />
            {isSelected && (
              <polyline
                points={el.points.map(p => p.join(',')).join(' ')}
                stroke="#3b82f6" strokeWidth={el.strokeWidth + 4}
                fill="none" strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
            )}
          </g>
        )
      case 'circuit-component':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <CircuitComponentElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'atom':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <AtomElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'bond':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <BondElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'benzene-ring':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <BenzeneRingElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'lab-instrument':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <LabElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'node':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <NodeElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'edge':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <EdgeElementComp element={el} elements={elements} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'code-block':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <CodeBlockElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'table':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <TableElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'callout':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <CalloutElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'tree':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <TreeElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'timeline':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <TimelineElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'packet':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <PacketElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'sticky-note':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <StickyNoteElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'rich-text':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <RichTextElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'image':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <ImageElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'course-card':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <CourseCardElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'qcm':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <QcmElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'flashcard':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <FlashcardElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'fill-blank':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <FillBlankElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      case 'short-answer':
        return (
          <g key={el.id} onMouseDown={elMouseDown}>
            <ShortAnswerElementComp element={el} isSelected={isSelected} onClick={elClick} />
          </g>
        )
      default:
        return null
    }
  }

  // ── Render instruments ────────────────────────────────────────
  const renderInstrument = (inst: (typeof instruments)[0]) => {
    switch (inst.type) {
      case 'tool_ruler':
        return <Ruler key={inst.id} instrument={inst} />
      case 'tool_protractor':
        return <Protractor key={inst.id} instrument={inst} />
      case 'tool_compass':
        return <Compass key={inst.id} instrument={inst} />
    }
  }

  const cursorClass = getCursorClass(activeTool, isPanning)

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ background: CANVAS_BG }}>
      <svg
        ref={svgRef}
        className={`w-full h-full ${cursorClass}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={onSvgClick}
        onContextMenu={onContextMenu}
      >
        <defs>
          <marker id="light-arrow" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L6,3 L0,6 Z" fill="#fbbf24" />
          </marker>
        </defs>

        {/* Canvas background */}
        <rect className="canvas-bg" x={-99999} y={-99999} width={199998} height={199998} fill={CANVAS_BG} />

        {/* Main transform group */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Grids rendered first (below everything) */}
          {elements.filter(el => el.type === 'grid').map((el) => (
            <g key={el.id} className={recentlyRevealed.has(el.id) ? 'el-appear' : undefined}>{renderElement(el)}</g>
          ))}
          {/* All other elements */}
          {elements.filter(el => el.type !== 'grid').map((el) => (
            <g key={el.id} className={recentlyRevealed.has(el.id) ? 'el-appear' : undefined}>{renderElement(el)}</g>
          ))}
          {instruments.map(renderInstrument)}

          {/* Lasso selection rectangle */}
          {lasso && (
            <rect
              className="selection-box"
              x={Math.min(lasso.x0, lasso.x1)}
              y={Math.min(lasso.y0, lasso.y1)}
              width={Math.abs(lasso.x1 - lasso.x0)}
              height={Math.abs(lasso.y1 - lasso.y0)}
            />
          )}

          {/* AI pen cursor during live writing */}
          {aiCursor && (
            <g style={{ transition: 'transform 0.4s var(--ease)', transform: `translate(${aiCursor.x}px, ${aiCursor.y}px)`, pointerEvents: 'none' }}>
              {/* glow */}
              <circle r={14 / viewport.zoom} fill="var(--accent)" opacity={0.18} className="ai-cursor-pulse" />
              {/* pen nib */}
              <g transform={`scale(${1 / viewport.zoom})`}>
                <path d="M2 22 L5 13 L13 5 L19 11 L11 19 L2 22 Z" fill="var(--accent)" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" />
                <circle cx={3.5} cy={20.5} r={1.6} fill="#fff" />
                <line x1={13} y1={5} x2={19} y2={11} stroke="#fff" strokeWidth={1.2} />
              </g>
            </g>
          )}

          {/* Resize handle — only when a single resizable element is selected */}
          {selectedIds.length === 1 && (() => {
            const el = elements.find((e) => e.id === selectedIds[0])
            if (!el) return null
            const box = getResizeBox(el)
            if (!box) return null
            const hx = el.x + box.w
            const hy = el.y + (box.hasH ? box.h : 120)
            const s = 9 / viewport.zoom
            return (
              <rect
                x={hx - s / 2} y={hy - s / 2} width={s} height={s}
                rx={2 / viewport.zoom}
                fill="var(--accent)" stroke="#fff" strokeWidth={1.5 / viewport.zoom}
                style={{ cursor: 'nwse-resize' }}
                onMouseDown={(e) => onResizeStart(e, el)}
              />
            )
          })()}
        </g>
      </svg>

      {/* Cursor HUD */}
      <div className="absolute bottom-5 left-5 pointer-events-none"
        style={{ color: '#b8a898', fontSize: 11, fontFamily: 'monospace' }}>
        {Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}
      </div>

      {/* Quick action bar above the selected element (when panel is closed) */}
      {selectedIds.length === 1 && !panelElementId && (() => {
        const el = elements.find((e) => e.id === selectedIds[0])
        if (!el || el.type === 'lab-instrument') return null
        const box = getResizeBox(el)
        const w = box?.w ?? 80
        const left = Math.round((el.x + w / 2) * viewport.zoom + viewport.x)
        const top = Math.round(el.y * viewport.zoom + viewport.y) - 10
        return (
          <QuickActions
            element={el}
            left={left}
            top={Math.max(48, top)}
            onEdit={() => setPanelElementId(el.id)}
            onAfterDelete={() => clearSelection()}
          />
        )
      })()}

      {/* Element property panel (lab + math/physics) */}
      {panelElementId && (() => {
        const panelEl = elements.find(el => el.id === panelElementId)
        if (!panelEl) return null
        // Convert canvas coords → screen coords for panel placement
        const elW = ('width' in panelEl ? (panelEl as { width: number }).width : 80)
        const sx = Math.round(panelEl.x * viewport.zoom + viewport.x)
        const sy = Math.round(panelEl.y * viewport.zoom + viewport.y)
        const sw = Math.round(elW * viewport.zoom)
        const panelLeft = Math.min(sx + sw + 14, window.innerWidth - 256)
        const panelTop  = Math.max(8, Math.min(sy, window.innerHeight - 540))
        return (
          <div style={{ position: 'fixed', left: panelLeft, top: panelTop, zIndex: 300 }}>
            {panelEl.type === 'lab-instrument'
              ? <LabPropertyPanel element={panelEl as LabElement} onClose={() => setPanelElementId(null)} />
              : <GenericPropertyPanel element={panelEl} onClose={() => setPanelElementId(null)} />
            }
          </div>
        )
      })()}

      {/* Insert popup */}
      {insertPopup && (
        <InsertPopup
          screenX={insertPopup.screenX}
          screenY={insertPopup.screenY}
          canvasX={insertPopup.canvasX}
          canvasY={insertPopup.canvasY}
          activeColor={activeColor}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          atomSymbol={activeAtomSymbol}
          gridVariant={gridVariant}
          onPlace={handleInsertPlace}
          onClose={() => setInsertPopup(null)}
        />
      )}

      {/* Bond-from-atom hint */}
      {activeTool === 'bond' && bondFromAtomId && (
        <div className="absolute top-5 left-1/2 pointer-events-none"
          style={{ transform: 'translateX(-50%)', background: 'rgba(255,248,240,0.92)',
            border: '1px solid #e5dbd0', borderRadius: 10, padding: '6px 16px',
            fontSize: 12, color: '#92400e', fontFamily: 'sans-serif',
            boxShadow: '0 2px 12px rgba(120,90,60,0.10)' }}>
          ✓ Atome source — cliquez sur l'atome cible pour créer la liaison
        </div>
      )}
    </div>
  )
}

export default InfiniteCanvas
