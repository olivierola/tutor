// ============================================================
// Tool types
// ============================================================
export type ToolType =
  | 'select'
  | 'pen'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'text'
  | 'eraser'
  | 'pan'
  | 'grid'
  | 'connect'
  // Geometry & Math
  | 'triangle'
  | 'axes'
  | 'function-graph'
  | 'angle-marker'
  | 'fraction'
  | 'number-line'
  | 'force-vector'
  // Physics
  | 'spring'
  | 'inclined-plane'
  | 'lens'
  | 'light-ray'
  | 'circuit-resistor'
  | 'circuit-battery'
  | 'circuit-bulb'
  | 'circuit-switch'
  | 'circuit-capacitor'
  // Chemistry molecules
  | 'atom'
  | 'bond'
  | 'benzene-ring'
  // Chemistry lab instruments
  | 'lab-burette'
  | 'lab-erlenmeyer'
  | 'lab-beaker'
  | 'lab-test-tube'
  | 'lab-bunsen-burner'
  | 'lab-condenser'
  | 'lab-retort-stand'
  | 'lab-round-flask'
  | 'lab-thermometer'
  | 'lab-watch-glass'
  | 'lab-petri-dish'
  | 'lab-graduated-cylinder'
  | 'lab-funnel'
  | 'lab-dropper'
  | 'lab-pipette'
  | 'lab-tripod'
  | 'lab-separatory-funnel'
  | 'lab-magnetic-stirrer'
  | 'lab-ph-meter'
  | 'lab-evaporating-dish'
  | 'lab-distillation-flask'
  // Drawing instruments
  | 'ruler'
  | 'protractor'
  | 'compass'
  // ── Generic diagram primitives (CS, networks, cyber, law, architecture, AI/data) ──
  | 'node'          // flexible box/shape with icon + title + subtitle
  | 'edge'          // labelled connector between two points (arrowed/dashed)
  | 'code-block'    // syntax-styled code / pseudocode / terminal
  | 'table'         // rows × cols data / comparison / truth table
  | 'callout'       // info / warning / tip / numbered step box
  | 'tree'          // indented hierarchy (file tree, decision tree, org chart)
  | 'timeline'      // ordered milestones / process steps
  | 'packet'        // network packet / frame with fields (réseaux)

// ============================================================
// Base element shared by all canvas elements
// ============================================================
export type BaseElement = {
  id: string
  x: number
  y: number
  rotation: number
  selected: boolean
  locked: boolean
  createdBy: 'user' | 'ai'
  /** Optional figure-group id: elements sharing it move/delete together. */
  group?: string
}

// ============================================================
// Drawing elements
// ============================================================
export type PenElement = BaseElement & {
  type: 'pen'
  points: number[][]   // [[x,y], ...]
  strokeColor: string
  strokeWidth: number
  opacity: number
}

export type LineElement = BaseElement & {
  type: 'line'
  x2: number
  y2: number
  strokeColor: string
  strokeWidth: number
  dashed?: boolean
}

export type ArrowElement = BaseElement & {
  type: 'arrow'
  x2: number
  y2: number
  label?: string
  strokeColor: string
  strokeWidth: number
}

export type RectElement = BaseElement & {
  type: 'rect'
  width: number
  height: number
  fill: string
  strokeColor: string
  strokeWidth: number
  borderRadius?: number
}

export type CircleElement = BaseElement & {
  type: 'circle'
  rx: number
  ry: number
  fill: string
  strokeColor: string
  strokeWidth: number
}

export type FontStyle = 'sans' | 'serif' | 'mono' | 'handwriting'

export type TextElement = BaseElement & {
  type: 'text'
  content: string
  fontSize: number
  color: string
  fontFamily: string
  fontStyle: FontStyle
  latex?: boolean
}

// ============================================================
// Connector element (links two elements visually)
// ============================================================
export type ConnectorType = 'wire' | 'spring' | 'rod' | 'dashed' | 'double-wire'

export type ConnectorElement = BaseElement & {
  type: 'connector'
  fromId: string       // ID of source element (or '' for free)
  toId: string         // ID of target element (or '' for free)
  // Fallback absolute coords (used during creation or if element deleted)
  x2: number           // to-point x
  y2: number           // to-point y
  connectorType: ConnectorType
  color: string
  strokeWidth: number
  label?: string
  // spring params
  coils?: number
  amplitude?: number
}

// ============================================================
// Grid / quadrillage element
// ============================================================
export type GridVariant = 'square' | 'dot' | 'line-h' | 'line-v'

export type GridElement = BaseElement & {
  type: 'grid'
  width: number
  height: number
  cellSize: number           // spacing between lines in canvas units
  variant: GridVariant
  strokeColor: string
  strokeWidth: number
  bgColor: string            // fill of the background rect ('transparent' = none)
  opacity: number
}

// ============================================================
// Math-specific elements
// ============================================================
export type VectorElement = BaseElement & {
  type: 'vector'
  x2: number
  y2: number
  magnitude?: number
  angle?: number
  label?: string
  color: string
}

export type FormulaElement = BaseElement & {
  type: 'formula'
  latex: string
  fontSize: number
  color: string
}

export type TriangleElement = BaseElement & {
  type: 'triangle'
  // 3 vertices relative to (x,y)
  v1: [number, number]
  v2: [number, number]
  v3: [number, number]
  fill: string
  strokeColor: string
  strokeWidth: number
  showAngles: boolean
  showSides: boolean
}

export type AxesElement = BaseElement & {
  type: 'axes'
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  xStep: number
  yStep: number
  unitSize: number   // canvas pixels per unit
  strokeColor: string
  strokeWidth: number
  showGrid: boolean
  showLabels: boolean
  xLabel: string
  yLabel: string
}

export type FunctionGraphElement = BaseElement & {
  type: 'function-graph'
  expression: string  // e.g. "x^2", "Math.sin(x)", "2*x+1"
  xMin: number
  xMax: number
  unitSize: number    // canvas pixels per unit
  color: string
  strokeWidth: number
  showAxes: boolean
  label?: string
}

export type AngleMarkerElement = BaseElement & {
  type: 'angle-marker'
  ray1Angle: number   // degrees
  ray2Angle: number   // degrees
  radius: number
  color: string
  label?: string
  fill?: string
}

export type FractionElement = BaseElement & {
  type: 'fraction'
  numerator: string
  denominator: string
  fontSize: number
  color: string
}

export type NumberLineElement = BaseElement & {
  type: 'number-line'
  min: number
  max: number
  step: number
  length: number
  strokeColor: string
  strokeWidth: number
  marked: number[]
}

// ============================================================
// Physics elements
// ============================================================
export type ForceVectorElement = BaseElement & {
  type: 'force-vector'
  x2: number
  y2: number
  magnitude: number
  unit: string
  label: string
  color: string
  strokeWidth: number
}

export type SpringElement = BaseElement & {
  type: 'spring'
  x2: number
  y2: number
  coils: number
  amplitude: number
  strokeColor: string
  strokeWidth: number
}

export type InclinedPlaneElement = BaseElement & {
  type: 'inclined-plane'
  width: number
  angle: number   // degrees (0–89)
  fill: string
  strokeColor: string
  strokeWidth: number
  showAngleLabel: boolean
}

export type LensElement = BaseElement & {
  type: 'lens'
  height: number
  focalLength: number  // canvas units (positive = converging, negative = diverging)
  strokeColor: string
  strokeWidth: number
  showFocalPoints: boolean
  showAxis: boolean
}

export type LightRayElement = BaseElement & {
  type: 'light-ray'
  points: [number, number][]  // polyline
  strokeColor: string
  strokeWidth: number
}

export type CircuitComponentElement = BaseElement & {
  type: 'circuit-component'
  component: 'resistor' | 'battery' | 'bulb' | 'switch-open' | 'switch-closed' | 'capacitor' | 'ground' | 'voltmeter' | 'ammeter'
  width: number
  strokeColor: string
  strokeWidth: number
  label?: string
  value?: string
  /** Simulation state: true when current flows through this component. */
  energized?: boolean
}

// ============================================================
// Chemistry elements
// ============================================================

// Atom color map (CPK coloring convention) — extended
export const ATOM_COLORS: Record<string, string> = {
  H:  '#e8e8e8', He: '#d9ffff',
  Li: '#cc80ff', Be: '#c2ff00', B:  '#ffb5b5',
  C:  '#404040', N:  '#3050f8', O:  '#ff0d0d',
  F:  '#90e050', Ne: '#b3e3f5',
  Na: '#ab5cf2', Mg: '#8aff00', Al: '#bfa6a6',
  Si: '#f0c8a0', P:  '#ff8000', S:  '#ffff30',
  Cl: '#1ff01f', Ar: '#80d1e3',
  K:  '#8f40d4', Ca: '#3dff00',
  Fe: '#e06633', Co: '#f090a0', Ni: '#50d050',
  Cu: '#c88033', Zn: '#7d80b0', Ag: '#c0c0c0',
  Au: '#ffd123', Hg: '#b8b8d0', Pb: '#575961',
  Br: '#a62929', I:  '#940094',
  default: '#ff69b4',
}

// Atom radius map (van der Waals-inspired, in px at scale 1)
export const ATOM_RADII: Record<string, number> = {
  H: 14, He: 14, Li: 20, Be: 18, B: 18, C: 20, N: 18, O: 18,
  F: 16, Ne: 15, Na: 22, Mg: 21, Al: 21, Si: 21, P: 20, S: 20,
  Cl: 20, Ar: 19, K: 26, Ca: 24, Fe: 22, Co: 22, Ni: 22,
  Cu: 22, Zn: 22, Ag: 23, Au: 23, Hg: 23, Pb: 24, Br: 21, I: 23,
  default: 20,
}

// Grouped for the atom picker UI
export const ATOM_GROUPS: { label: string; color: string; elements: string[] }[] = [
  { label: 'Organiques', color: '#404040',   elements: ['C', 'H', 'N', 'O', 'S', 'P'] },
  { label: 'Halogènes',  color: '#1ff01f',   elements: ['F', 'Cl', 'Br', 'I'] },
  { label: 'Métaux',     color: '#c88033',   elements: ['Na', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Zn', 'Al', 'Ag', 'Au', 'Pb', 'Hg'] },
  { label: 'Autres',     color: '#94a3b8',   elements: ['Si', 'B', 'He', 'Ne', 'Ar', 'Li', 'Be', 'Co', 'Ni'] },
]

export type AtomElement = BaseElement & {
  type: 'atom'
  element: string    // 'H', 'C', 'O', 'N', etc.
  radius: number
  fillColor: string
  strokeColor: string
  showLabel: boolean
  charge?: string    // '2+', '-', etc.
}

export type BondElement = BaseElement & {
  type: 'bond'
  x2: number
  y2: number
  bondOrder: 1 | 2 | 3
  strokeColor: string
  strokeWidth: number
}

export type LabComponent =
  | 'burette' | 'erlenmeyer' | 'beaker' | 'test-tube'
  | 'bunsen-burner' | 'condenser' | 'retort-stand'
  | 'round-flask' | 'thermometer' | 'watch-glass' | 'petri-dish'
  | 'graduated-cylinder' | 'funnel' | 'dropper' | 'pipette'
  | 'tripod' | 'separatory-funnel' | 'magnetic-stirrer'
  | 'ph-meter' | 'evaporating-dish' | 'distillation-flask'

export type LabSolution = {
  name: string           // 'HCl', 'NaOH', 'H₂O distillée', etc.
  concentration: number  // mol/L
  temperature: number    // °C
  volume: number         // mL
  pH: number             // 0-14
  isBoiling: boolean
  isEvaporating: boolean
  isHeated: boolean      // set by Bunsen proximity
}

export const DEFAULT_SOLUTION: LabSolution = {
  name: 'H₂O',
  concentration: 0,
  temperature: 20,
  volume: 100,
  pH: 7,
  isBoiling: false,
  isEvaporating: false,
  isHeated: false,
}

export type LabElement = BaseElement & {
  type: 'lab-instrument'
  component: LabComponent
  width: number
  height: number
  liquidColor: string    // RGBA hex of the solution color
  liquidLevel: number    // 0..1 (fraction filled)
  label: string
  animated: boolean      // true = show drip/bubble/flame animations
  strokeColor: string
  strokeWidth: number
  solution: LabSolution
}

export type BenzeneRingElement = BaseElement & {
  type: 'benzene-ring'
  radius: number
  strokeColor: string
  strokeWidth: number
  fill: string
  aromatic: boolean   // true = inner circle, false = alternating double bonds
}

// ============================================================
// Generic diagram primitives
//   These cover informatique, réseaux, cybersécurité, droit,
//   architecture, IA/data and more by composition. The agent
//   builds rich figures step by step from a handful of flexible,
//   themeable primitives instead of dozens of bespoke shapes.
// ============================================================

/** Shapes a `node` can take. */
export type NodeShape =
  | 'rect' | 'rounded' | 'pill' | 'circle' | 'diamond'
  | 'hexagon' | 'parallelogram' | 'cylinder' | 'cloud'
  | 'document' | 'folder' | 'actor' | 'card' | 'note'

/** Named domain glyph drawn inside a node (lucide-backed). */
export type NodeGlyph =
  // computer science
  | 'cpu' | 'memory' | 'disk' | 'code' | 'terminal' | 'binary' | 'function' | 'variable'
  // networks
  | 'router' | 'switch' | 'server' | 'firewall' | 'wifi' | 'cloud' | 'globe' | 'laptop' | 'smartphone' | 'antenna'
  // cybersecurity
  | 'shield' | 'lock' | 'unlock' | 'key' | 'bug' | 'fingerprint' | 'eye' | 'alert'
  // data / AI
  | 'database' | 'table' | 'layers' | 'neuron' | 'pipeline' | 'chart' | 'filter' | 'brain' | 'gitbranch'
  // law
  | 'scales' | 'gavel' | 'contract' | 'building-law' | 'stamp'
  // architecture
  | 'building' | 'floorplan' | 'ruler' | 'column' | 'door' | 'window'
  // generic / org
  | 'user' | 'users' | 'box' | 'gear' | 'mail' | 'clock' | 'flag' | 'check' | 'cross' | 'none'

export type NodeElement = BaseElement & {
  type: 'node'
  shape: NodeShape
  width: number
  height: number
  title: string
  subtitle?: string
  glyph: NodeGlyph
  accent: string        // primary colour (border + glyph + header)
  fill: string          // body fill
  textColor: string
  /** input/output anchor dots, for wiring with edges */
  showPorts?: boolean
}

/** Arrowhead styles for edges. */
export type EdgeArrow = 'none' | 'end' | 'both'
export type EdgeStyle = 'solid' | 'dashed' | 'dotted'
export type EdgeRouting = 'straight' | 'orthogonal' | 'curved'

export type EdgeElement = BaseElement & {
  type: 'edge'
  fromId: string        // optional source node id ('' = free point at x,y)
  toId: string          // optional target node id ('' = free point at x2,y2)
  x2: number
  y2: number
  label?: string
  color: string
  strokeWidth: number
  arrow: EdgeArrow
  lineStyle: EdgeStyle
  routing: EdgeRouting
}

export type CodeBlockElement = BaseElement & {
  type: 'code-block'
  code: string
  language: string      // 'python', 'js', 'c', 'sql', 'bash', 'pseudo', 'json'…
  width: number
  title?: string
  showLineNumbers: boolean
  variant: 'editor' | 'terminal'
  highlightLines: number[]   // 1-based lines to highlight
  fontSize: number
}

export type TableElement = BaseElement & {
  type: 'table'
  rows: string[][]      // rows[0] = header row
  colWidths: number[]   // px per column
  rowHeight: number
  headerFill: string
  accent: string
  fontSize: number
  hasHeader: boolean
  zebra: boolean
}

export type CalloutKind = 'info' | 'warning' | 'tip' | 'danger' | 'success' | 'step' | 'definition' | 'example'

export type CalloutElement = BaseElement & {
  type: 'callout'
  kind: CalloutKind
  title: string
  body: string
  width: number
  /** for kind==='step': the step number shown in the badge */
  step?: number
}

export type TreeNode = {
  label: string
  children?: TreeNode[]
}

export type TreeElement = BaseElement & {
  type: 'tree'
  root: TreeNode
  orientation: 'vertical' | 'horizontal'
  nodeColor: string
  lineColor: string
  textColor: string
  fontSize: number
  rowHeight: number
  indent: number
}

export type TimelineStep = {
  label: string
  detail?: string
}

export type TimelineElement = BaseElement & {
  type: 'timeline'
  steps: TimelineStep[]
  orientation: 'horizontal' | 'vertical'
  accent: string
  textColor: string
  numbered: boolean
  length: number        // px along the main axis
}

export type PacketField = {
  label: string
  bits?: number         // relative width
  color?: string
}

export type PacketElement = BaseElement & {
  type: 'packet'
  title: string         // e.g. "Trame Ethernet", "Segment TCP"
  fields: PacketField[]
  width: number
  height: number
  accent: string
  textColor: string
}

// ============================================================
// Course-authoring elements (text, notes, images)
// ============================================================

/** Sticky note — coloured paper square with a slight tilt & shadow. */
export type StickyColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple'

export type StickyNoteElement = BaseElement & {
  type: 'sticky-note'
  text: string
  color: StickyColor
  width: number
  height: number
  fontSize: number
  /** small visual tilt in degrees, e.g. -3..3 */
  tilt: number
}

/** Rich text block — a heading + markdown-ish body for course content. */
export type RichTextElement = BaseElement & {
  type: 'rich-text'
  heading?: string
  /** body supports **bold**, *italic*, `code`, "- " bullet lines and blank-line paragraphs */
  body: string
  width: number
  fontSize: number
  color: string
  align: 'left' | 'center'
}

/** Image element — displays a remote URL, optional caption. */
export type ImageElement = BaseElement & {
  type: 'image'
  src: string
  width: number
  height: number
  caption?: string
  /** original source/attribution (e.g. Openverse/Wikimedia) */
  attribution?: string
  alt?: string
}

/** Course card — a titled, formatted lesson block (definition/example/à retenir…). */
export type CourseCardKind = 'definition' | 'example' | 'remember' | 'method' | 'objective' | 'note'

export type CourseCardElement = BaseElement & {
  type: 'course-card'
  kind: CourseCardKind
  title: string
  body: string
  width: number
  accent: string
}

// ============================================================
// Interactive exercise elements
// ============================================================

/** Shared interaction state for any exercise. */
export type ExerciseStatus = 'unanswered' | 'correct' | 'incorrect' | 'revealed'

/** QCM — a question with single- or multi-select options. */
export type QcmOption = { text: string; correct: boolean }
export type QcmElement = BaseElement & {
  type: 'qcm'
  question: string
  options: QcmOption[]
  multi: boolean            // allow several correct answers
  explanation?: string
  width: number
  // interaction state
  chosen: number[]          // indices the student picked
  status: ExerciseStatus
}

/** Flashcard — front (question) / back (answer), flipped on click. */
export type FlashcardElement = BaseElement & {
  type: 'flashcard'
  front: string
  back: string
  width: number
  height: number
  flipped: boolean
}

/** Fill-in-the-blanks — text with "{{answer}}" slots. */
export type FillBlankElement = BaseElement & {
  type: 'fill-blank'
  /** template with {{...}} marking each blank, the inner text is the expected answer */
  template: string
  width: number
  // per-blank student input + overall status
  filled: string[]
  status: ExerciseStatus
}

/** Short answer / calculation — type a value, auto-checked. */
export type ShortAnswerElement = BaseElement & {
  type: 'short-answer'
  question: string
  answer: string            // expected answer (string-compared, normalised)
  /** optional accepted alternatives */
  alternatives?: string[]
  unit?: string
  explanation?: string
  width: number
  // interaction state
  input: string
  status: ExerciseStatus
}

// ============================================================
// Union of all canvas elements
// ============================================================
export type CanvasElement =
  | GridElement
  | ConnectorElement
  | PenElement
  | LineElement
  | ArrowElement
  | RectElement
  | CircleElement
  | TextElement
  | VectorElement
  | FormulaElement
  | TriangleElement
  | AxesElement
  | FunctionGraphElement
  | AngleMarkerElement
  | FractionElement
  | NumberLineElement
  | ForceVectorElement
  | SpringElement
  | InclinedPlaneElement
  | LensElement
  | LightRayElement
  | CircuitComponentElement
  | AtomElement
  | BondElement
  | BenzeneRingElement
  | LabElement
  | NodeElement
  | EdgeElement
  | CodeBlockElement
  | TableElement
  | CalloutElement
  | TreeElement
  | TimelineElement
  | PacketElement
  | StickyNoteElement
  | RichTextElement
  | ImageElement
  | CourseCardElement
  | QcmElement
  | FlashcardElement
  | FillBlankElement
  | ShortAnswerElement

// ============================================================
// Instruments (visual overlays, not permanent canvas elements)
// ============================================================
export type RulerInstrument = {
  id: string
  type: 'tool_ruler'
  x: number
  y: number
  angle: number
  length: number           // in canvas units (1 unit ≈ 1px at zoom=1)
  unit: 'cm' | 'mm'
}

export type CompassInstrument = {
  id: string
  type: 'tool_compass'
  cx: number
  cy: number
  radius: number
  arcStart?: number
  arcEnd?: number
}

export type ProtractorInstrument = {
  id: string
  type: 'tool_protractor'
  cx: number
  cy: number
  baseAngle: number
  scale: number
}

export type Instrument = RulerInstrument | CompassInstrument | ProtractorInstrument

// ============================================================
// Viewport
// ============================================================
export type Viewport = {
  x: number
  y: number
  zoom: number
}

// ============================================================
// History entry
// ============================================================
export type HistoryEntry = {
  elements: CanvasElement[]
  instruments: Instrument[]
}
