/**
 * Centralized element-creation logic.
 * Used by both InfiniteCanvas (tool drag/click) and InsertPopup (direct placement).
 */
import { generateId } from './canvasUtils'
import { DEFAULT_SOLUTION } from '../types/canvas'
import type {
  CanvasElement, TriangleElement, AxesElement, FunctionGraphElement,
  AngleMarkerElement, FractionElement, NumberLineElement, ForceVectorElement,
  SpringElement, InclinedPlaneElement, LensElement, CircuitComponentElement,
  AtomElement, BenzeneRingElement, GridElement, GridVariant,
  RectElement, CircleElement, LabElement,
  NodeElement, EdgeElement, CodeBlockElement, TableElement,
  CalloutElement, TreeElement, TimelineElement, PacketElement,
  StickyNoteElement, RichTextElement, ImageElement, CourseCardElement,
  QcmElement, FlashcardElement, FillBlankElement, ShortAnswerElement,
} from '../types/canvas'
import { ATOM_COLORS } from '../types/canvas'

type BaseProps = { rotation: 0; selected: false; locked: false; createdBy: 'user' }

const BASE: BaseProps = { rotation: 0, selected: false, locked: false, createdBy: 'user' }

export interface PlaceOptions {
  cx: number
  cy: number
  activeColor: string
  fillColor: string
  strokeWidth: number
  gridVariant: GridVariant
  atomSymbol: string
}

type PlaceFn = (opts: PlaceOptions) => CanvasElement | null

const ATOM_RADII: Record<string, number> = {
  H: 14, He: 14, Li: 20, Be: 18, B: 18, C: 20, N: 18, O: 18,
  F: 16, Ne: 15, Na: 22, Mg: 21, Al: 21, Si: 21, P: 20, S: 20,
  Cl: 20, Ar: 19, K: 26, Ca: 24, Fe: 22, Co: 22, Ni: 22,
  Cu: 22, Zn: 22, Ag: 23, Au: 23, Hg: 23, Pb: 24, Br: 21, I: 23,
}

export const PLACE_FNS: Record<string, PlaceFn> = {
  triangle: ({ cx, cy, strokeWidth, activeColor, fillColor }) => ({
    ...BASE, id: generateId('tri'), type: 'triangle', x: cx, y: cy,
    v1: [0, 0], v2: [100, 0], v3: [50, -86],
    fill: fillColor, strokeColor: activeColor, strokeWidth,
    showAngles: true, showSides: false,
  } as TriangleElement),

  axes: ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('axes'), type: 'axes', x: cx, y: cy,
    xMin: -5, xMax: 5, yMin: -4, yMax: 4,
    xStep: 1, yStep: 1, unitSize: 40,
    strokeColor: activeColor, strokeWidth,
    showGrid: true, showLabels: true, xLabel: 'x', yLabel: 'y',
  } as AxesElement),

  'function-graph': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('fn'), type: 'function-graph', x: cx, y: cy,
    expression: 'x^2', xMin: -5, xMax: 5, unitSize: 40,
    color: activeColor, strokeWidth, showAxes: true,
  } as FunctionGraphElement),

  'angle-marker': ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('ang'), type: 'angle-marker', x: cx, y: cy,
    ray1Angle: 0, ray2Angle: 60, radius: 50,
    color: activeColor, label: '', fill: activeColor + '33',
  } as AngleMarkerElement),

  fraction: ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('frac'), type: 'fraction', x: cx, y: cy,
    numerator: 'a', denominator: 'b', fontSize: 28, color: activeColor,
  } as FractionElement),

  'number-line': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('nl'), type: 'number-line', x: cx, y: cy,
    min: -5, max: 5, step: 1, length: 300,
    strokeColor: activeColor, strokeWidth, marked: [],
  } as NumberLineElement),

  'force-vector': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('fv'), type: 'force-vector', x: cx, y: cy,
    x2: cx + 100, y2: cy,
    magnitude: 10, unit: 'N', label: 'F',
    color: activeColor, strokeWidth,
  } as ForceVectorElement),

  spring: ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('spr'), type: 'spring', x: cx, y: cy,
    x2: cx + 120, y2: cy, coils: 8, amplitude: 12,
    strokeColor: activeColor, strokeWidth,
  } as SpringElement),

  'inclined-plane': ({ cx, cy, strokeWidth, activeColor, fillColor }) => ({
    ...BASE, id: generateId('inc'), type: 'inclined-plane', x: cx, y: cy,
    width: 200, angle: 30, fill: fillColor,
    strokeColor: activeColor, strokeWidth, showAngleLabel: true,
  } as InclinedPlaneElement),

  lens: ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('lens'), type: 'lens', x: cx, y: cy,
    height: 120, focalLength: 80, strokeColor: activeColor, strokeWidth,
    showFocalPoints: true, showAxis: true,
  } as LensElement),

  'circuit-resistor': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('cir'), type: 'circuit-component', component: 'resistor',
    x: cx, y: cy, width: 80, strokeColor: activeColor, strokeWidth, label: 'R', value: '',
  } as CircuitComponentElement),

  'circuit-battery': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('bat'), type: 'circuit-component', component: 'battery',
    x: cx, y: cy, width: 80, strokeColor: activeColor, strokeWidth, label: '', value: '',
  } as CircuitComponentElement),

  'circuit-bulb': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('bul'), type: 'circuit-component', component: 'bulb',
    x: cx, y: cy, width: 80, strokeColor: activeColor, strokeWidth, label: 'L', value: '',
  } as CircuitComponentElement),

  'circuit-switch': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('sw'), type: 'circuit-component', component: 'switch-open',
    x: cx, y: cy, width: 80, strokeColor: activeColor, strokeWidth, label: 'K', value: '',
  } as CircuitComponentElement),

  'circuit-capacitor': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('cap'), type: 'circuit-component', component: 'capacitor',
    x: cx, y: cy, width: 80, strokeColor: activeColor, strokeWidth, label: 'C', value: '',
  } as CircuitComponentElement),

  'circuit-ground': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('gnd'), type: 'circuit-component', component: 'ground',
    x: cx, y: cy, width: 60, strokeColor: activeColor, strokeWidth, label: '', value: '',
  } as CircuitComponentElement),

  'circuit-voltmeter': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('vm'), type: 'circuit-component', component: 'voltmeter',
    x: cx, y: cy, width: 80, strokeColor: activeColor, strokeWidth, label: 'V', value: '',
  } as CircuitComponentElement),

  'circuit-ammeter': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('am'), type: 'circuit-component', component: 'ammeter',
    x: cx, y: cy, width: 80, strokeColor: activeColor, strokeWidth, label: 'A', value: '',
  } as CircuitComponentElement),

  atom: ({ cx, cy, atomSymbol }) => {
    const sym = atomSymbol || 'C'
    const r = ATOM_RADII[sym] ?? 20
    return {
      ...BASE, id: generateId('atom'), type: 'atom', x: cx, y: cy,
      element: sym, radius: r,
      fillColor: ATOM_COLORS[sym] ?? ATOM_COLORS['default'],
      strokeColor: 'rgba(0,0,0,0.2)', showLabel: true,
    } as AtomElement
  },

  'benzene-ring': ({ cx, cy, strokeWidth, activeColor, fillColor }) => ({
    ...BASE, id: generateId('benz'), type: 'benzene-ring', x: cx, y: cy,
    radius: 50, strokeColor: activeColor, strokeWidth, fill: fillColor, aromatic: true,
  } as BenzeneRingElement),

  grid: ({ cx, cy, gridVariant }) => ({
    ...BASE, id: generateId('grid'), type: 'grid', x: cx, y: cy,
    width: 300, height: 240, cellSize: 40, variant: gridVariant,
    strokeColor: '#c4b9ae', strokeWidth: 0.8, bgColor: '#fffdf8', opacity: 1,
  } as GridElement),

  rect: ({ cx, cy, strokeWidth, activeColor, fillColor }) => ({
    ...BASE, id: generateId('rect'), type: 'rect', x: cx - 50, y: cy - 40,
    width: 100, height: 80,
    fill: fillColor, strokeColor: activeColor, strokeWidth,
  } as RectElement),

  circle: ({ cx, cy, strokeWidth, activeColor, fillColor }) => ({
    ...BASE, id: generateId('circ'), type: 'circle', x: cx, y: cy,
    rx: 50, ry: 50,
    fill: fillColor, strokeColor: activeColor, strokeWidth,
  } as CircleElement),

  // ── Chemistry Lab Instruments ──────────────────────────────
  'lab-burette': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('bur'), type: 'lab-instrument', component: 'burette',
    x: cx - 20, y: cy - 100, width: 40, height: 200,
    liquidColor: '#93c5fd88', liquidLevel: 0.75, label: 'Burette', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 50 },
  } as LabElement),

  'lab-erlenmeyer': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('erl'), type: 'lab-instrument', component: 'erlenmeyer',
    x: cx - 40, y: cy - 50, width: 80, height: 100,
    liquidColor: '#4ade8088', liquidLevel: 0.4, label: 'Erlenmeyer', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 150 },
  } as LabElement),

  'lab-beaker': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('bkr'), type: 'lab-instrument', component: 'beaker',
    x: cx - 40, y: cy - 40, width: 80, height: 80,
    liquidColor: '#a78bfa88', liquidLevel: 0.5, label: 'Bécher', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 200 },
  } as LabElement),

  'lab-test-tube': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('tt'), type: 'lab-instrument', component: 'test-tube',
    x: cx - 15, y: cy - 45, width: 30, height: 90,
    liquidColor: '#fbbf2488', liquidLevel: 0.45, label: 'Tube à essai', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 15 },
  } as LabElement),

  'lab-bunsen-burner': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('bsn'), type: 'lab-instrument', component: 'bunsen-burner',
    x: cx - 25, y: cy - 40, width: 50, height: 80,
    liquidColor: '#fb923c', liquidLevel: 0, label: 'Bec Bunsen', animated: true,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-condenser': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('cnd'), type: 'lab-instrument', component: 'condenser',
    x: cx - 15, y: cy - 60, width: 30, height: 120,
    liquidColor: '#93c5fd88', liquidLevel: 0.6, label: 'Réfrigérant', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-retort-stand': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('rst'), type: 'lab-instrument', component: 'retort-stand',
    x: cx - 45, y: cy - 80, width: 90, height: 160,
    liquidColor: '#6b7280', liquidLevel: 0, label: 'Support', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-round-flask': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('rf'), type: 'lab-instrument', component: 'round-flask',
    x: cx - 35, y: cy - 45, width: 70, height: 90,
    liquidColor: '#f8717188', liquidLevel: 0.35, label: 'Ballon', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 100 },
  } as LabElement),

  'lab-thermometer': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('thm'), type: 'lab-instrument', component: 'thermometer',
    x: cx - 10, y: cy - 65, width: 20, height: 130,
    liquidColor: '#ef444488', liquidLevel: 0.5, label: 'Thermomètre', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-watch-glass': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('wg'), type: 'lab-instrument', component: 'watch-glass',
    x: cx - 30, y: cy - 15, width: 60, height: 30,
    liquidColor: '#fde04788', liquidLevel: 0.5, label: 'Verre de montre', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 5 },
  } as LabElement),

  'lab-petri-dish': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('pd'), type: 'lab-instrument', component: 'petri-dish',
    x: cx - 35, y: cy - 17, width: 70, height: 35,
    liquidColor: '#bbf7d088', liquidLevel: 0.8, label: 'Boîte de Pétri', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 10 },
  } as LabElement),

  'lab-graduated-cylinder': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('gc'), type: 'lab-instrument', component: 'graduated-cylinder',
    x: cx - 20, y: cy - 60, width: 40, height: 120,
    liquidColor: '#93c5fd88', liquidLevel: 0.6, label: 'Éprouvette', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 100 },
  } as LabElement),

  'lab-funnel': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('fun'), type: 'lab-instrument', component: 'funnel',
    x: cx - 30, y: cy - 45, width: 60, height: 90,
    liquidColor: '#fbbf2488', liquidLevel: 0.3, label: 'Entonnoir', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-dropper': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('drop'), type: 'lab-instrument', component: 'dropper',
    x: cx - 12, y: cy - 40, width: 24, height: 80,
    liquidColor: '#fbbf2488', liquidLevel: 0.55, label: 'Compte-gouttes', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 2 },
  } as LabElement),

  'lab-pipette': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('pip'), type: 'lab-instrument', component: 'pipette',
    x: cx - 10, y: cy - 60, width: 20, height: 130,
    liquidColor: '#93c5fd88', liquidLevel: 0.6, label: 'Pipette jaugée', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 25 },
  } as LabElement),

  'lab-tripod': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('tri'), type: 'lab-instrument', component: 'tripod',
    x: cx - 45, y: cy - 55, width: 90, height: 110,
    liquidColor: '#6b7280', liquidLevel: 0, label: 'Trépied', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-separatory-funnel': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('sep'), type: 'lab-instrument', component: 'separatory-funnel',
    x: cx - 30, y: cy - 55, width: 60, height: 110,
    liquidColor: '#4ade8088', liquidLevel: 0.55, label: 'Ampoule décante', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 50 },
  } as LabElement),

  'lab-magnetic-stirrer': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('mag'), type: 'lab-instrument', component: 'magnetic-stirrer',
    x: cx - 45, y: cy - 30, width: 90, height: 60,
    liquidColor: '#6b7280', liquidLevel: 0, label: 'Agitateur magnétique', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-ph-meter': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('phm'), type: 'lab-instrument', component: 'ph-meter',
    x: cx - 25, y: cy - 55, width: 50, height: 110,
    liquidColor: '#22c55e88', liquidLevel: 0, label: 'pH-mètre', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION },
  } as LabElement),

  'lab-evaporating-dish': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('evap'), type: 'lab-instrument', component: 'evaporating-dish',
    x: cx - 35, y: cy - 20, width: 70, height: 40,
    liquidColor: '#fbbf2488', liquidLevel: 0.5, label: "Capsule d'évaporation", animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 30, isEvaporating: false },
  } as LabElement),

  'lab-distillation-flask': ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('dst'), type: 'lab-instrument', component: 'distillation-flask',
    x: cx - 40, y: cy - 55, width: 80, height: 110,
    liquidColor: '#93c5fd88', liquidLevel: 0.4, label: 'Ballon distillation', animated: false,
    strokeColor: activeColor, strokeWidth, solution: { ...DEFAULT_SOLUTION, volume: 200 },
  } as LabElement),

  // ── Generic diagram primitives ─────────────────────────────
  node: ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('node'), type: 'node',
    x: cx - 80, y: cy - 30, width: 160, height: 60,
    shape: 'rounded', title: 'Nœud', subtitle: '', glyph: 'box',
    accent: activeColor, fill: 'var(--surface-1)', textColor: 'var(--text-1)',
    showPorts: false,
  } as NodeElement),

  edge: ({ cx, cy, strokeWidth, activeColor }) => ({
    ...BASE, id: generateId('edge'), type: 'edge',
    x: cx, y: cy, x2: cx + 140, y2: cy, fromId: '', toId: '',
    label: '', color: activeColor, strokeWidth,
    arrow: 'end', lineStyle: 'solid', routing: 'straight',
  } as EdgeElement),

  'code-block': ({ cx, cy }) => ({
    ...BASE, id: generateId('code'), type: 'code-block',
    x: cx - 150, y: cy - 60, width: 300,
    code: '// Écris ton code ici\nfunction hello() {\n  return 42\n}',
    language: 'js', title: '', showLineNumbers: true,
    variant: 'editor', highlightLines: [], fontSize: 13,
  } as CodeBlockElement),

  table: ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('tbl'), type: 'table',
    x: cx - 150, y: cy - 60,
    rows: [['Colonne A', 'Colonne B', 'Colonne C'], ['', '', ''], ['', '', '']],
    colWidths: [110, 110, 110], rowHeight: 34,
    headerFill: 'var(--surface-2)', accent: activeColor,
    fontSize: 13, hasHeader: true, zebra: true,
  } as TableElement),

  callout: ({ cx, cy }) => ({
    ...BASE, id: generateId('call'), type: 'callout',
    x: cx - 150, y: cy - 40, width: 300, kind: 'info',
    title: 'À retenir', body: 'Saisis ton explication ici.', step: 1,
  } as CalloutElement),

  tree: ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('tree'), type: 'tree',
    x: cx - 100, y: cy - 60, orientation: 'vertical',
    root: { label: 'racine', children: [
      { label: 'enfant 1', children: [{ label: 'feuille' }] },
      { label: 'enfant 2' },
    ] },
    nodeColor: activeColor, lineColor: 'var(--text-3)', textColor: 'var(--text-1)',
    fontSize: 13, rowHeight: 28, indent: 22,
  } as TreeElement),

  timeline: ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('tl'), type: 'timeline',
    x: cx - 160, y: cy, orientation: 'horizontal',
    steps: [
      { label: 'Étape 1', detail: '' },
      { label: 'Étape 2', detail: '' },
      { label: 'Étape 3', detail: '' },
    ],
    accent: activeColor, textColor: 'var(--text-1)', numbered: true, length: 360,
  } as TimelineElement),

  // ── Course authoring ───────────────────────────────────────
  'sticky-note': ({ cx, cy }) => ({
    ...BASE, id: generateId('note'), type: 'sticky-note',
    x: cx - 80, y: cy - 80, width: 160, height: 160,
    text: 'Note…', color: 'yellow', fontSize: 16, tilt: -2,
  } as StickyNoteElement),

  'rich-text': ({ cx, cy }) => ({
    ...BASE, id: generateId('rt'), type: 'rich-text',
    x: cx - 180, y: cy - 40, width: 360,
    heading: 'Titre', body: 'Écris ton **cours** ici.\n\n- premier point\n- second point',
    fontSize: 15, color: 'var(--text-1)', align: 'left',
  } as RichTextElement),

  image: ({ cx, cy }) => ({
    ...BASE, id: generateId('img'), type: 'image',
    x: cx - 120, y: cy - 90, width: 240, height: 180,
    src: '', caption: '', alt: '',
  } as ImageElement),

  'course-card': ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('cc'), type: 'course-card',
    x: cx - 160, y: cy - 50, width: 320, kind: 'definition',
    title: 'Définition', body: 'Saisis le contenu de la carte.',
    accent: activeColor,
  } as CourseCardElement),

  // ── Interactive exercises ──────────────────────────────────
  qcm: ({ cx, cy }) => ({
    ...BASE, id: generateId('qcm'), type: 'qcm',
    x: cx - 170, y: cy - 90, width: 340, multi: false,
    question: 'Question ?',
    options: [
      { text: 'Réponse A', correct: true },
      { text: 'Réponse B', correct: false },
      { text: 'Réponse C', correct: false },
    ],
    explanation: '', chosen: [], status: 'unanswered',
  } as QcmElement),

  flashcard: ({ cx, cy }) => ({
    ...BASE, id: generateId('flash'), type: 'flashcard',
    x: cx - 110, y: cy - 75, width: 220, height: 150,
    front: 'Question', back: 'Réponse', flipped: false,
  } as FlashcardElement),

  'fill-blank': ({ cx, cy }) => ({
    ...BASE, id: generateId('fb'), type: 'fill-blank',
    x: cx - 180, y: cy - 50, width: 360,
    template: "L'eau bout à {{100}} °C et gèle à {{0}} °C.",
    filled: ['', ''], status: 'unanswered',
  } as FillBlankElement),

  'short-answer': ({ cx, cy }) => ({
    ...BASE, id: generateId('sa'), type: 'short-answer',
    x: cx - 160, y: cy - 60, width: 320,
    question: 'Combien font 7 × 8 ?', answer: '56', alternatives: [], unit: '',
    explanation: '', input: '', status: 'unanswered',
  } as ShortAnswerElement),

  packet: ({ cx, cy, activeColor }) => ({
    ...BASE, id: generateId('pkt'), type: 'packet',
    x: cx - 170, y: cy - 25, width: 340, height: 50,
    title: 'Segment TCP',
    fields: [
      { label: 'Port src', bits: 2 },
      { label: 'Port dst', bits: 2 },
      { label: 'Séq', bits: 3 },
      { label: 'Données', bits: 5 },
    ],
    accent: activeColor, textColor: 'var(--text-1)',
  } as PacketElement),
}

/* ── Node presets ──────────────────────────────────────────────
   Domain tools (cs-*, net-*, sec-*, data-*, law-*, arch-*) are all
   backed by the generic `node` element with a tuned glyph / shape /
   accent / default title. One table here keeps them declarative. */
type NodePreset = {
  title: string
  glyph: NodeElement['glyph']
  shape?: NodeElement['shape']
  accent?: string
}

const NODE_PRESETS: Record<string, NodePreset> = {
  // informatique
  'cs-cpu':       { title: 'CPU', glyph: 'cpu', accent: 'var(--subject-cs)' },
  'cs-process':   { title: 'Processus', glyph: 'box', accent: 'var(--subject-cs)' },
  'cs-function':  { title: 'fonction()', glyph: 'function', shape: 'rounded', accent: 'var(--subject-cs)' },
  'cs-decision':  { title: 'Condition ?', glyph: 'gitbranch', shape: 'diamond', accent: 'var(--subject-cs)' },
  'cs-binary':    { title: '0101', glyph: 'binary', accent: 'var(--subject-cs)' },
  'cs-terminal':  { title: 'Terminal', glyph: 'terminal', accent: 'var(--subject-cs)' },
  // réseaux
  'net-router':   { title: 'Routeur', glyph: 'router', accent: 'var(--subject-network)' },
  'net-switch':   { title: 'Switch', glyph: 'switch', accent: 'var(--subject-network)' },
  'net-server':   { title: 'Serveur', glyph: 'server', accent: 'var(--subject-network)' },
  'net-cloud':    { title: 'Internet', glyph: 'cloud', shape: 'cloud', accent: 'var(--subject-network)' },
  'net-wifi':     { title: 'Point d’accès', glyph: 'wifi', accent: 'var(--subject-network)' },
  'net-client':   { title: 'Client', glyph: 'laptop', accent: 'var(--subject-network)' },
  // cybersécurité
  'sec-firewall': { title: 'Pare-feu', glyph: 'firewall', accent: 'var(--subject-security)' },
  'sec-shield':   { title: 'Protection', glyph: 'shield', accent: 'var(--subject-security)' },
  'sec-lock':     { title: 'Chiffrement', glyph: 'lock', accent: 'var(--subject-security)' },
  'sec-key':      { title: 'Clé', glyph: 'key', accent: 'var(--subject-security)' },
  'sec-threat':   { title: 'Menace', glyph: 'bug', accent: 'var(--subject-security)' },
  'sec-auth':     { title: 'Auth', glyph: 'fingerprint', accent: 'var(--subject-security)' },
  // data & IA
  'data-db':        { title: 'Base de données', glyph: 'database', shape: 'cylinder', accent: 'var(--subject-data)' },
  'data-pipeline':  { title: 'Étape', glyph: 'pipeline', accent: 'var(--subject-data)' },
  'data-model':     { title: 'Modèle IA', glyph: 'brain', accent: 'var(--subject-data)' },
  'data-layer':     { title: 'Couche', glyph: 'layers', accent: 'var(--subject-data)' },
  'data-chart':     { title: 'Visualisation', glyph: 'chart', accent: 'var(--subject-data)' },
  'data-dashboard': { title: 'Dashboard', glyph: 'box', accent: 'var(--subject-data)' },
  // droit
  'law-norm':     { title: 'Norme', glyph: 'building-law', accent: 'var(--subject-law)' },
  'law-scales':   { title: 'Justice', glyph: 'scales', accent: 'var(--subject-law)' },
  'law-court':    { title: 'Juridiction', glyph: 'gavel', accent: 'var(--subject-law)' },
  'law-contract': { title: 'Contrat', glyph: 'contract', shape: 'document', accent: 'var(--subject-law)' },
  // architecture
  'arch-building':  { title: 'Bâtiment', glyph: 'building', accent: 'var(--subject-architecture)' },
  'arch-plan':      { title: 'Plan', glyph: 'floorplan', accent: 'var(--subject-architecture)' },
  'arch-structure': { title: 'Structure', glyph: 'box', accent: 'var(--subject-architecture)' },
}

function makeNodePreset(preset: NodePreset, opts: PlaceOptions): NodeElement {
  const { cx, cy } = opts
  return {
    ...BASE, id: generateId('node'), type: 'node',
    x: cx - 80, y: cy - 30, width: 160, height: 60,
    shape: preset.shape ?? 'rounded', title: preset.title, subtitle: '',
    glyph: preset.glyph, accent: preset.accent ?? opts.activeColor,
    fill: 'var(--surface-1)', textColor: 'var(--text-1)', showPorts: false,
  } as NodeElement
}

/** Create and return a CanvasElement for the given tool, or null if unknown */
export function createElement(tool: string, opts: PlaceOptions): CanvasElement | null {
  const fn = PLACE_FNS[tool]
  if (fn) return fn(opts)
  const preset = NODE_PRESETS[tool]
  if (preset) return makeNodePreset(preset, opts)
  return null
}
