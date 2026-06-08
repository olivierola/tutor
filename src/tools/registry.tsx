/* ============================================================
   Tool registry — the single source of truth for every tool.

   Adding a tool = add one entry here (+ a factory in
   placeElement.ts if it produces an element). The toolbar,
   insert menu, command palette, favourites and property panel
   all read from this list. No more duplicated tool arrays.
   ============================================================ */
import React from 'react'
import {
  MousePointer2, Hand, Pencil, Minus, ArrowRight, Square, Circle,
  Type, Eraser, Grid3x3,
  Triangle, Crosshair, FunctionSquare, GitBranch, Sigma,
  Ruler, ScanLine, Compass,
  Zap, Waves, FlipHorizontal2, AlignHorizontalJustifyCenter, Wind,
  Activity, ToggleLeft, Move, CircleDot, Gauge,
  Atom, Link2, Hexagon,
  FlaskConical, Flame, Thermometer, TestTube2, Microscope, Droplets,
  Beaker,
  // diagram & domain icons
  Box, Spline, Code2, Table2, Info, ListTree, GitCommitHorizontal, Workflow,
  Cpu, Server, Router, Network, ShieldAlert, Wifi, Cloud, Database, Layers,
  Brain, Shield, Lock, KeyRound, Bug, Fingerprint, Scale, Gavel, FileSignature,
  Landmark, Building2, LayoutDashboard, BarChart3, Binary, TerminalSquare, Boxes,
  // course-authoring icons
  StickyNote, FileText, Image as ImageIcon, GraduationCap,
  // exercise icons
  ListChecks, Layers as LayersIcon, TextCursorInput, Calculator,
} from 'lucide-react'
import type { ToolDef, ParamSpec, SelectParam, ToolCategory } from './types'
import type { Subject } from '../theme/tokens'

const ic = (Comp: typeof Minus, size = 16) => <Comp size={size} />

/* ── Reusable param fragments ──────────────────────────────── */
const P_STROKE: ParamSpec = { key: 'strokeWidth', label: 'Épaisseur', kind: 'number', min: 1, max: 20, step: 1, unit: 'px', inOptions: true }
const P_STROKE_COLOR: ParamSpec = { key: 'strokeColor', label: 'Trait', kind: 'color', inOptions: true }
const P_FILL: ParamSpec = { key: 'fill', label: 'Remplissage', kind: 'color', inOptions: true }
const P_COLOR: ParamSpec = { key: 'color', label: 'Couleur', kind: 'color', inOptions: true }

/* ── DRAW ──────────────────────────────────────────────────── */
const DRAW: ToolDef[] = [
  { id: 'select', label: 'Sélection', icon: ic(MousePointer2), category: 'draw', subject: 'draw', interaction: 'select', shortcut: 'V', keywords: ['curseur', 'pointer', 'move'] },
  { id: 'pan', label: 'Déplacer la vue', icon: ic(Hand), category: 'draw', subject: 'draw', interaction: 'select', shortcut: 'H', keywords: ['main', 'pan', 'naviguer'] },
  { id: 'pen', label: 'Stylo', icon: ic(Pencil), category: 'draw', subject: 'draw', interaction: 'freehand', shortcut: 'P', keywords: ['dessin', 'crayon', 'libre'],
    params: [P_STROKE_COLOR, P_STROKE] },
  { id: 'line', label: 'Ligne', icon: ic(Minus), category: 'draw', subject: 'draw', interaction: 'drag', shortcut: 'L',
    params: [P_STROKE_COLOR, P_STROKE, { key: 'dashed', label: 'Pointillés', kind: 'boolean' }] },
  { id: 'arrow', label: 'Flèche', icon: ic(ArrowRight), category: 'draw', subject: 'draw', interaction: 'drag', shortcut: 'A',
    params: [P_STROKE_COLOR, P_STROKE, { key: 'label', label: 'Étiquette', kind: 'text' }] },
  { id: 'rect', label: 'Rectangle', icon: ic(Square), category: 'draw', subject: 'draw', interaction: 'drag', shortcut: 'R',
    params: [P_FILL, P_STROKE_COLOR, P_STROKE, { key: 'borderRadius', label: 'Arrondi', kind: 'number', min: 0, max: 60, unit: 'px' }] },
  { id: 'circle', label: 'Cercle / Ellipse', icon: ic(Circle), category: 'draw', subject: 'draw', interaction: 'drag', shortcut: 'C',
    params: [P_FILL, P_STROKE_COLOR, P_STROKE] },
  { id: 'text', label: 'Texte', icon: ic(Type), category: 'draw', subject: 'draw', interaction: 'special', shortcut: 'T', keywords: ['écrire', 'libellé'],
    params: [P_COLOR, { key: 'fontSize', label: 'Taille', kind: 'number', min: 8, max: 120, unit: 'px', inOptions: true }] },
  { id: 'eraser', label: 'Gomme', icon: ic(Eraser), category: 'draw', subject: 'draw', interaction: 'special', shortcut: 'E', keywords: ['effacer', 'supprimer'] },
  { id: 'grid', label: 'Grille', icon: ic(Grid3x3), category: 'draw', subject: 'draw', interaction: 'drag', keywords: ['quadrillage', 'papier'],
    params: [
      { key: 'variant', label: 'Type', kind: 'select', inOptions: true, options: [
        { value: 'square', label: 'Quadrillé' }, { value: 'dot', label: 'Points' },
        { value: 'line-h', label: 'Lignes horiz.' }, { value: 'line-v', label: 'Lignes vert.' } ] },
      { key: 'cellSize', label: 'Maille', kind: 'number', min: 8, max: 120, unit: 'px', inOptions: true },
      { key: 'opacity', label: 'Opacité', kind: 'number', min: 0, max: 1, step: 0.05 },
    ] },
]

/* ── MATH ──────────────────────────────────────────────────── */
const MATH: ToolDef[] = [
  { id: 'axes', label: 'Repère / Axes', icon: ic(Crosshair), category: 'math', subject: 'math', interaction: 'click', keywords: ['graphique', 'coordonnées', 'plan'],
    params: [
      { key: 'xMin', label: 'x min', kind: 'number' }, { key: 'xMax', label: 'x max', kind: 'number' },
      { key: 'yMin', label: 'y min', kind: 'number' }, { key: 'yMax', label: 'y max', kind: 'number' },
      { key: 'unitSize', label: 'Unité', kind: 'number', min: 10, max: 120, unit: 'px', inOptions: true },
      { key: 'showGrid', label: 'Quadrillage', kind: 'boolean' }, { key: 'showLabels', label: 'Graduations', kind: 'boolean' },
      P_STROKE_COLOR ] },
  { id: 'function-graph', label: 'Graphe f(x)', icon: ic(FunctionSquare), category: 'math', subject: 'math', interaction: 'click', keywords: ['fonction', 'courbe'],
    params: [
      { key: 'expression', label: 'f(x) =', kind: 'text', placeholder: 'x^2', inOptions: true },
      { key: 'xMin', label: 'x min', kind: 'number' }, { key: 'xMax', label: 'x max', kind: 'number' },
      { key: 'unitSize', label: 'Unité', kind: 'number', min: 10, max: 120, unit: 'px' },
      { key: 'showAxes', label: 'Axes', kind: 'boolean' }, P_COLOR, P_STROKE ] },
  { id: 'fraction', label: 'Fraction', icon: ic(Sigma), category: 'math', subject: 'math', interaction: 'click', keywords: ['quotient', 'numérateur'],
    params: [
      { key: 'numerator', label: 'Numérateur', kind: 'text', inOptions: true },
      { key: 'denominator', label: 'Dénominateur', kind: 'text', inOptions: true },
      { key: 'fontSize', label: 'Taille', kind: 'number', min: 12, max: 80, unit: 'px' }, P_COLOR ] },
  { id: 'number-line', label: 'Droite numérique', icon: ic(Minus), category: 'math', subject: 'math', interaction: 'click', keywords: ['axe', 'graduée'],
    params: [
      { key: 'min', label: 'Min', kind: 'number', inOptions: true }, { key: 'max', label: 'Max', kind: 'number', inOptions: true },
      { key: 'step', label: 'Pas', kind: 'number', min: 0.1, step: 0.1 }, { key: 'length', label: 'Longueur', kind: 'number', min: 100, max: 800, unit: 'px' },
      P_STROKE_COLOR ] },
]

/* ── GEOMETRY ──────────────────────────────────────────────── */
const GEOMETRY: ToolDef[] = [
  { id: 'triangle', label: 'Triangle', icon: ic(Triangle), category: 'geometry', subject: 'geometry', interaction: 'click',
    params: [
      { key: 'showAngles', label: 'Angles', kind: 'boolean', inOptions: true },
      { key: 'showSides', label: 'Côtés', kind: 'boolean', inOptions: true },
      P_FILL, P_STROKE_COLOR, P_STROKE ] },
  { id: 'angle-marker', label: "Marqueur d'angle", icon: ic(GitBranch), category: 'geometry', subject: 'geometry', interaction: 'click', keywords: ['secteur', 'degrés'],
    params: [
      { key: 'ray1Angle', label: 'Angle 1', kind: 'number', min: 0, max: 360, unit: '°' },
      { key: 'ray2Angle', label: 'Angle 2', kind: 'number', min: 0, max: 360, unit: '°', inOptions: true },
      { key: 'radius', label: 'Rayon', kind: 'number', min: 10, max: 200, unit: 'px' },
      { key: 'label', label: 'Étiquette', kind: 'text' }, P_COLOR ] },
  // Instruments (overlays, not elements)
  { id: 'ruler', label: 'Règle', icon: ic(Ruler), category: 'geometry', subject: 'geometry', interaction: 'instrument', shortcut: 'U', keywords: ['mesure', 'cm'] },
  { id: 'protractor', label: 'Rapporteur', icon: ic(ScanLine), category: 'geometry', subject: 'geometry', interaction: 'instrument', shortcut: 'O', keywords: ['angle', 'degrés'] },
  { id: 'compass', label: 'Compas', icon: ic(Compass), category: 'geometry', subject: 'geometry', interaction: 'instrument', shortcut: 'M', keywords: ['cercle', 'arc'] },
]

/* ── PHYSICS ───────────────────────────────────────────────── */
const PHYSICS: ToolDef[] = [
  { id: 'force-vector', label: 'Vecteur force', icon: ic(Zap), category: 'physics', subject: 'physics', interaction: 'drag', keywords: ['flèche', 'newton'],
    params: [
      { key: 'label', label: 'Nom', kind: 'text', inOptions: true }, { key: 'magnitude', label: 'Intensité', kind: 'number', min: 0 },
      { key: 'unit', label: 'Unité', kind: 'text' }, P_COLOR, P_STROKE ] },
  { id: 'spring', label: 'Ressort', icon: ic(Waves), category: 'physics', subject: 'physics', interaction: 'drag',
    params: [
      { key: 'coils', label: 'Spires', kind: 'number', min: 2, max: 30, inOptions: true },
      { key: 'amplitude', label: 'Amplitude', kind: 'number', min: 2, max: 40, unit: 'px' }, P_STROKE_COLOR, P_STROKE ] },
  { id: 'inclined-plane', label: 'Plan incliné', icon: ic(FlipHorizontal2), category: 'physics', subject: 'physics', interaction: 'click',
    params: [
      { key: 'angle', label: 'Angle', kind: 'number', min: 1, max: 89, unit: '°', inOptions: true },
      { key: 'width', label: 'Largeur', kind: 'number', min: 50, max: 600, unit: 'px' },
      { key: 'showAngleLabel', label: "Afficher l'angle", kind: 'boolean' }, P_FILL, P_STROKE_COLOR ] },
  { id: 'lens', label: 'Lentille', icon: ic(AlignHorizontalJustifyCenter), category: 'physics', subject: 'physics', interaction: 'click', keywords: ['optique', 'focale'],
    params: [
      { key: 'focalLength', label: 'Focale', kind: 'number', unit: 'px', inOptions: true },
      { key: 'height', label: 'Hauteur', kind: 'number', min: 40, max: 300, unit: 'px' },
      { key: 'showFocalPoints', label: 'Foyers', kind: 'boolean' }, { key: 'showAxis', label: 'Axe optique', kind: 'boolean' }, P_STROKE_COLOR ] },
  { id: 'light-ray', label: 'Rayon lumineux', icon: ic(Wind), category: 'physics', subject: 'physics', interaction: 'drag', keywords: ['optique', 'lumière'],
    params: [P_STROKE_COLOR, P_STROKE] },
  // Circuit components
  { id: 'circuit-resistor', label: 'Résistance', icon: ic(Activity), category: 'physics', subject: 'physics', interaction: 'click', keywords: ['ohm', 'circuit'],
    params: [{ key: 'label', label: 'Nom', kind: 'text', inOptions: true }, { key: 'value', label: 'Valeur', kind: 'text' }, P_STROKE_COLOR] },
  { id: 'circuit-battery', label: 'Pile / Générateur', icon: ic(Zap), category: 'physics', subject: 'physics', interaction: 'click', keywords: ['tension', 'circuit'],
    params: [{ key: 'label', label: 'Nom', kind: 'text', inOptions: true }, { key: 'value', label: 'Valeur', kind: 'text' }, P_STROKE_COLOR] },
  { id: 'circuit-bulb', label: 'Lampe', icon: ic(CircleDot), category: 'physics', subject: 'physics', interaction: 'click', keywords: ['ampoule', 'circuit'],
    params: [{ key: 'label', label: 'Nom', kind: 'text', inOptions: true }, P_STROKE_COLOR] },
  { id: 'circuit-switch', label: 'Interrupteur', icon: ic(ToggleLeft), category: 'physics', subject: 'physics', interaction: 'click', keywords: ['circuit'],
    params: [{ key: 'label', label: 'Nom', kind: 'text', inOptions: true }, P_STROKE_COLOR] },
  { id: 'circuit-capacitor', label: 'Condensateur', icon: ic(Move), category: 'physics', subject: 'physics', interaction: 'click', keywords: ['circuit', 'farad'],
    params: [{ key: 'label', label: 'Nom', kind: 'text', inOptions: true }, { key: 'value', label: 'Valeur', kind: 'text' }, P_STROKE_COLOR] },
  { id: 'circuit-voltmeter', label: 'Voltmètre', icon: ic(Gauge), category: 'physics', subject: 'physics', interaction: 'click', advanced: true,
    params: [{ key: 'label', label: 'Nom', kind: 'text' }, P_STROKE_COLOR] },
  { id: 'circuit-ammeter', label: 'Ampèremètre', icon: ic(Gauge), category: 'physics', subject: 'physics', interaction: 'click', advanced: true,
    params: [{ key: 'label', label: 'Nom', kind: 'text' }, P_STROKE_COLOR] },
  { id: 'circuit-ground', label: 'Masse', icon: ic(Minus), category: 'physics', subject: 'physics', interaction: 'click', advanced: true,
    params: [P_STROKE_COLOR] },
]

/* ── CHEMISTRY ─────────────────────────────────────────────── */
const CHEMISTRY: ToolDef[] = [
  { id: 'atom', label: 'Atome', icon: ic(Atom), category: 'chemistry', subject: 'chemistry', interaction: 'click', keywords: ['élément', 'molécule'],
    params: [
      { key: 'element', label: 'Symbole', kind: 'text', inOptions: true },
      { key: 'radius', label: 'Rayon', kind: 'number', min: 8, max: 60, unit: 'px' },
      { key: 'showLabel', label: 'Étiquette', kind: 'boolean' },
      { key: 'charge', label: 'Charge', kind: 'text' }, { key: 'fillColor', label: 'Couleur', kind: 'color' } ] },
  { id: 'bond', label: 'Liaison', icon: ic(Link2), category: 'chemistry', subject: 'chemistry', interaction: 'special', keywords: ['molécule', 'covalente'],
    params: [
      { key: 'bondOrder', label: 'Ordre', kind: 'select', inOptions: true, options: [
        { value: '1', label: 'Simple' }, { value: '2', label: 'Double' }, { value: '3', label: 'Triple' } ] },
      P_STROKE_COLOR, P_STROKE ] },
  { id: 'benzene-ring', label: 'Cycle benzénique', icon: ic(Hexagon), category: 'chemistry', subject: 'chemistry', interaction: 'click', keywords: ['aromatique', 'hexagone'],
    params: [
      { key: 'radius', label: 'Rayon', kind: 'number', min: 20, max: 120, unit: 'px', inOptions: true },
      { key: 'aromatic', label: 'Aromatique', kind: 'boolean', inOptions: true }, P_FILL, P_STROKE_COLOR ] },
]

/* ── LAB ───────────────────────────────────────────────────── */
const labGlass = (id: string, label: string, icon: React.ReactNode, advanced = false): ToolDef => ({
  id, label, icon, category: 'lab', subject: 'lab', interaction: 'click', advanced,
  keywords: ['verrerie', 'chimie', 'expérience'],
  params: [
    { key: 'liquidLevel', label: 'Niveau', kind: 'number', min: 0, max: 1, step: 0.05, inOptions: true },
    { key: 'liquidColor', label: 'Liquide', kind: 'color', inOptions: true },
    { key: 'label', label: 'Étiquette', kind: 'text' },
    { key: 'animated', label: 'Animation', kind: 'boolean' },
  ],
})

const LAB: ToolDef[] = [
  labGlass('lab-beaker', 'Bécher', ic(FlaskConical)),
  labGlass('lab-erlenmeyer', 'Erlenmeyer', ic(FlaskConical)),
  labGlass('lab-test-tube', 'Tube à essai', ic(TestTube2)),
  labGlass('lab-graduated-cylinder', 'Éprouvette graduée', ic(TestTube2)),
  labGlass('lab-round-flask', 'Ballon', ic(Beaker)),
  labGlass('lab-burette', 'Burette', ic(Minus)),
  { id: 'lab-bunsen-burner', label: 'Bec Bunsen', icon: ic(Flame), category: 'lab', subject: 'lab', interaction: 'click',
    keywords: ['feu', 'chauffer', 'flamme'],
    params: [{ key: 'animated', label: 'Flamme', kind: 'boolean', inOptions: true }, { key: 'label', label: 'Étiquette', kind: 'text' }] },
  labGlass('lab-condenser', 'Réfrigérant', ic(Waves), true),
  labGlass('lab-distillation-flask', 'Ballon à distiller', ic(FlaskConical), true),
  labGlass('lab-separatory-funnel', 'Ampoule à décanter', ic(FlaskConical), true),
  labGlass('lab-funnel', 'Entonnoir', ic(FlaskConical), true),
  labGlass('lab-dropper', 'Compte-gouttes', ic(Droplets), true),
  labGlass('lab-pipette', 'Pipette jaugée', ic(Minus), true),
  { id: 'lab-thermometer', label: 'Thermomètre', icon: ic(Thermometer), category: 'lab', subject: 'lab', interaction: 'click', advanced: true,
    params: [{ key: 'label', label: 'Étiquette', kind: 'text' }] },
  { id: 'lab-ph-meter', label: 'pH-mètre', icon: ic(Thermometer), category: 'lab', subject: 'lab', interaction: 'click', advanced: true,
    params: [{ key: 'label', label: 'Étiquette', kind: 'text' }] },
  { id: 'lab-retort-stand', label: 'Support', icon: ic(Microscope), category: 'lab', subject: 'lab', interaction: 'click', advanced: true },
  { id: 'lab-tripod', label: 'Trépied', icon: ic(Triangle), category: 'lab', subject: 'lab', interaction: 'click', advanced: true },
  { id: 'lab-magnetic-stirrer', label: 'Agitateur magnétique', icon: ic(Activity), category: 'lab', subject: 'lab', interaction: 'click', advanced: true },
  labGlass('lab-evaporating-dish', "Capsule d'évaporation", ic(Wind), true),
  labGlass('lab-watch-glass', 'Verre de montre', ic(Activity), true),
  labGlass('lab-petri-dish', 'Boîte de Pétri', ic(Circle), true),
]

/* ── Shared param fragments for generic primitives ─────────── */
const P_NODE_TITLE: ParamSpec = { key: 'title', label: 'Titre', kind: 'text', inOptions: true }
const P_NODE_SUB: ParamSpec = { key: 'subtitle', label: 'Sous-titre', kind: 'text' }
const P_NODE_ACCENT: ParamSpec = { key: 'accent', label: 'Accent', kind: 'color', inOptions: true }
const P_NODE_FILL: ParamSpec = { key: 'fill', label: 'Fond', kind: 'color' }
const NODE_SHAPE_OPTS: SelectParam = { key: 'shape', label: 'Forme', kind: 'select', inOptions: true, options: [
  { value: 'rounded', label: 'Arrondi' }, { value: 'rect', label: 'Rectangle' }, { value: 'pill', label: 'Pilule' },
  { value: 'circle', label: 'Cercle' }, { value: 'diamond', label: 'Losange (décision)' }, { value: 'hexagon', label: 'Hexagone' },
  { value: 'parallelogram', label: 'Parallélogramme (E/S)' }, { value: 'cylinder', label: 'Cylindre (BDD)' },
  { value: 'cloud', label: 'Nuage' }, { value: 'document', label: 'Document' }, { value: 'folder', label: 'Dossier' },
  { value: 'card', label: 'Carte' }, { value: 'note', label: 'Note' },
] }

/** Build a node-backed preset tool entry. */
function nodeTool(
  id: string, label: string, icon: React.ReactNode, category: ToolCategory, subject: Subject,
  keywords: string[], advanced = false,
): ToolDef {
  return {
    id, label, icon, category, subject, interaction: 'click', advanced, keywords,
    params: [P_NODE_TITLE, P_NODE_SUB, NODE_SHAPE_OPTS, P_NODE_ACCENT, P_NODE_FILL,
      { key: 'glyph', label: 'Icône', kind: 'text' }],
  }
}

/* ── DIAGRAM (generic primitives) ──────────────────────────── */
const DIAGRAM: ToolDef[] = [
  { id: 'node', label: 'Nœud / Bloc', icon: ic(Box), category: 'diagram', subject: 'diagram', interaction: 'click',
    keywords: ['boîte', 'bloc', 'étape', 'forme', 'uml'],
    params: [P_NODE_TITLE, P_NODE_SUB, NODE_SHAPE_OPTS, P_NODE_ACCENT, P_NODE_FILL,
      { key: 'glyph', label: 'Icône', kind: 'text' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 40, max: 600, unit: 'px' },
      { key: 'height', label: 'Hauteur', kind: 'number', min: 30, max: 400, unit: 'px' },
      { key: 'showPorts', label: 'Ancres', kind: 'boolean' }] },
  { id: 'edge', label: 'Connexion / Flèche', icon: ic(Spline), category: 'diagram', subject: 'diagram', interaction: 'drag',
    keywords: ['lien', 'flèche', 'relation', 'transition', 'arête'],
    params: [
      { key: 'label', label: 'Étiquette', kind: 'text', inOptions: true },
      { key: 'arrow', label: 'Flèche', kind: 'select', inOptions: true, options: [
        { value: 'end', label: '→ fin' }, { value: 'both', label: '↔ deux' }, { value: 'none', label: 'aucune' } ] },
      { key: 'lineStyle', label: 'Trait', kind: 'select', options: [
        { value: 'solid', label: 'Plein' }, { value: 'dashed', label: 'Tirets' }, { value: 'dotted', label: 'Points' } ] },
      { key: 'routing', label: 'Tracé', kind: 'select', options: [
        { value: 'straight', label: 'Droit' }, { value: 'orthogonal', label: 'Coudé' }, { value: 'curved', label: 'Courbe' } ] },
      P_COLOR, P_STROKE ] },
  { id: 'callout', label: 'Encadré / Étape', icon: ic(Info), category: 'diagram', subject: 'diagram', interaction: 'click',
    keywords: ['info', 'note', 'avertissement', 'astuce', 'définition', 'étape', 'exemple'],
    params: [
      { key: 'kind', label: 'Type', kind: 'select', inOptions: true, options: [
        { value: 'info', label: 'Info' }, { value: 'warning', label: 'Attention' }, { value: 'tip', label: 'Astuce' },
        { value: 'danger', label: 'Danger' }, { value: 'success', label: 'Réussi' }, { value: 'step', label: 'Étape' },
        { value: 'definition', label: 'Définition' }, { value: 'example', label: 'Exemple' } ] },
      { key: 'title', label: 'Titre', kind: 'text', inOptions: true },
      { key: 'body', label: 'Contenu', kind: 'text' },
      { key: 'step', label: 'N° étape', kind: 'number', min: 1, max: 99 },
      { key: 'width', label: 'Largeur', kind: 'number', min: 120, max: 600, unit: 'px' } ] },
  { id: 'table', label: 'Tableau', icon: ic(Table2), category: 'diagram', subject: 'diagram', interaction: 'click',
    keywords: ['grille', 'données', 'comparaison', 'vérité', 'matrice'],
    params: [
      { key: 'hasHeader', label: 'En-tête', kind: 'boolean', inOptions: true },
      { key: 'zebra', label: 'Lignes alternées', kind: 'boolean' },
      { key: 'accent', label: 'Accent', kind: 'color' },
      { key: 'fontSize', label: 'Taille', kind: 'number', min: 9, max: 24, unit: 'px' } ] },
  { id: 'tree', label: 'Arbre / Hiérarchie', icon: ic(ListTree), category: 'diagram', subject: 'diagram', interaction: 'click',
    keywords: ['hiérarchie', 'organigramme', 'arborescence', 'décision'],
    params: [
      { key: 'orientation', label: 'Sens', kind: 'select', inOptions: true, options: [
        { value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' } ] },
      { key: 'nodeColor', label: 'Nœuds', kind: 'color' },
      { key: 'fontSize', label: 'Taille', kind: 'number', min: 9, max: 24, unit: 'px' } ] },
  { id: 'timeline', label: 'Frise / Étapes', icon: ic(GitCommitHorizontal), category: 'diagram', subject: 'diagram', interaction: 'click',
    keywords: ['chronologie', 'processus', 'étapes', 'séquence'],
    params: [
      { key: 'orientation', label: 'Sens', kind: 'select', inOptions: true, options: [
        { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' } ] },
      { key: 'numbered', label: 'Numéroté', kind: 'boolean' },
      { key: 'accent', label: 'Accent', kind: 'color' },
      { key: 'length', label: 'Longueur', kind: 'number', min: 120, max: 900, unit: 'px' } ] },
]

/* ── INFORMATIQUE (CS) ─────────────────────────────────────── */
const CS: ToolDef[] = [
  { id: 'code-block', label: 'Bloc de code', icon: ic(Code2), category: 'cs', subject: 'cs', interaction: 'click',
    keywords: ['code', 'programme', 'pseudo', 'terminal', 'console'],
    params: [
      { key: 'language', label: 'Langage', kind: 'select', inOptions: true, options: [
        { value: 'python', label: 'Python' }, { value: 'js', label: 'JavaScript' }, { value: 'ts', label: 'TypeScript' },
        { value: 'c', label: 'C' }, { value: 'cpp', label: 'C++' }, { value: 'java', label: 'Java' },
        { value: 'sql', label: 'SQL' }, { value: 'bash', label: 'Bash' }, { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' }, { value: 'json', label: 'JSON' }, { value: 'pseudo', label: 'Pseudo-code' } ] },
      { key: 'variant', label: 'Style', kind: 'select', inOptions: true, options: [
        { value: 'editor', label: 'Éditeur' }, { value: 'terminal', label: 'Terminal' } ] },
      { key: 'code', label: 'Code', kind: 'text' },
      { key: 'title', label: 'Fichier', kind: 'text' },
      { key: 'showLineNumbers', label: 'N° lignes', kind: 'boolean' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 120, max: 900, unit: 'px' },
      { key: 'fontSize', label: 'Taille', kind: 'number', min: 9, max: 24, unit: 'px' } ] },
  nodeTool('cs-cpu', 'Processeur (CPU)', ic(Cpu), 'cs', 'cs', ['processeur', 'calcul']),
  nodeTool('cs-process', 'Processus', ic(Boxes), 'cs', 'cs', ['processus', 'thread', 'tâche']),
  nodeTool('cs-function', 'Fonction', ic(FunctionSquare), 'cs', 'cs', ['fonction', 'méthode']),
  nodeTool('cs-decision', 'Décision', ic(GitBranch), 'cs', 'cs', ['condition', 'si', 'branchement']),
  nodeTool('cs-binary', 'Bit / Binaire', ic(Binary), 'cs', 'cs', ['binaire', 'bit', 'octet'], true),
  nodeTool('cs-terminal', 'Terminal', ic(TerminalSquare), 'cs', 'cs', ['console', 'shell'], true),
]

/* ── RÉSEAUX ───────────────────────────────────────────────── */
const NETWORK: ToolDef[] = [
  nodeTool('net-router', 'Routeur', ic(Router), 'network', 'network', ['routeur', 'passerelle', 'ip']),
  nodeTool('net-switch', 'Commutateur', ic(Network), 'network', 'network', ['switch', 'commutateur']),
  nodeTool('net-server', 'Serveur', ic(Server), 'network', 'network', ['serveur', 'hôte']),
  nodeTool('net-cloud', 'Cloud / Internet', ic(Cloud), 'network', 'network', ['internet', 'cloud', 'wan']),
  nodeTool('net-wifi', "Point d'accès Wi-Fi", ic(Wifi), 'network', 'network', ['wifi', 'sans-fil', 'ap']),
  nodeTool('net-client', 'Poste client', ic(Box), 'network', 'network', ['client', 'pc', 'hôte']),
  { id: 'packet', label: 'Trame / Paquet', icon: ic(Layers), category: 'network', subject: 'network', interaction: 'click',
    keywords: ['paquet', 'trame', 'segment', 'tcp', 'ip', 'ethernet', 'en-tête'],
    params: [
      { key: 'title', label: 'Titre', kind: 'text', inOptions: true },
      { key: 'accent', label: 'Accent', kind: 'color' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 120, max: 800, unit: 'px' },
      { key: 'height', label: 'Hauteur', kind: 'number', min: 24, max: 120, unit: 'px' } ] },
]

/* ── CYBERSÉCURITÉ ─────────────────────────────────────────── */
const SECURITY: ToolDef[] = [
  nodeTool('sec-firewall', 'Pare-feu', ic(ShieldAlert), 'security', 'security', ['pare-feu', 'firewall', 'filtre']),
  nodeTool('sec-shield', 'Protection', ic(Shield), 'security', 'security', ['bouclier', 'défense', 'antivirus']),
  nodeTool('sec-lock', 'Chiffrement', ic(Lock), 'security', 'security', ['chiffrement', 'cryptographie', 'verrou']),
  nodeTool('sec-key', 'Clé', ic(KeyRound), 'security', 'security', ['clé', 'secret', 'token']),
  nodeTool('sec-threat', 'Menace / Malware', ic(Bug), 'security', 'security', ['virus', 'malware', 'attaque', 'menace']),
  nodeTool('sec-auth', 'Authentification', ic(Fingerprint), 'security', 'security', ['identité', 'login', 'mfa'], true),
]

/* ── DATA & IA ─────────────────────────────────────────────── */
const DATA: ToolDef[] = [
  nodeTool('data-db', 'Base de données', ic(Database), 'data', 'data', ['bdd', 'sql', 'stockage', 'table']),
  nodeTool('data-pipeline', 'Étape pipeline', ic(Workflow), 'data', 'data', ['etl', 'pipeline', 'flux']),
  nodeTool('data-model', 'Modèle IA', ic(Brain), 'data', 'data', ['modèle', 'ia', 'ml', 'réseau de neurones']),
  nodeTool('data-layer', 'Couche neuronale', ic(Layers), 'data', 'data', ['couche', 'neurone', 'dense', 'cnn']),
  nodeTool('data-chart', 'Visualisation', ic(BarChart3), 'data', 'data', ['graphique', 'dashboard', 'analyse']),
  nodeTool('data-dashboard', 'Tableau de bord', ic(LayoutDashboard), 'data', 'data', ['dashboard', 'kpi'], true),
]

/* ── DROIT ─────────────────────────────────────────────────── */
const LAW: ToolDef[] = [
  nodeTool('law-norm', 'Norme juridique', ic(Landmark), 'law', 'law', ['loi', 'constitution', 'règlement', 'hiérarchie']),
  nodeTool('law-scales', 'Justice / Équilibre', ic(Scale), 'law', 'law', ['justice', 'balance', 'tribunal']),
  nodeTool('law-court', 'Juridiction', ic(Gavel), 'law', 'law', ['tribunal', 'cour', 'juge']),
  nodeTool('law-contract', 'Contrat', ic(FileSignature), 'law', 'law', ['contrat', 'accord', 'clause']),
]

/* ── ARCHITECTURE ──────────────────────────────────────────── */
const ARCHITECTURE: ToolDef[] = [
  nodeTool('arch-building', 'Bâtiment', ic(Building2), 'architecture', 'architecture', ['immeuble', 'édifice']),
  nodeTool('arch-plan', "Plan / Pièce", ic(LayoutDashboard), 'architecture', 'architecture', ['plan', 'pièce', 'étage']),
  nodeTool('arch-structure', 'Élément structurel', ic(Boxes), 'architecture', 'architecture', ['poutre', 'colonne', 'mur'], true),
]

/* ── COURSE (authoring: text, notes, images, cards) ────────── */
const COURSE: ToolDef[] = [
  { id: 'rich-text', label: 'Bloc de texte', icon: ic(FileText), category: 'course', subject: 'course', interaction: 'click',
    keywords: ['texte', 'paragraphe', 'cours', 'rédiger', 'titre'],
    params: [
      { key: 'heading', label: 'Titre', kind: 'text', inOptions: true },
      { key: 'body', label: 'Contenu', kind: 'text' },
      { key: 'align', label: 'Alignement', kind: 'select', options: [
        { value: 'left', label: 'Gauche' }, { value: 'center', label: 'Centré' } ] },
      { key: 'fontSize', label: 'Taille', kind: 'number', min: 10, max: 40, unit: 'px' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 120, max: 800, unit: 'px' },
      { key: 'color', label: 'Couleur', kind: 'color' } ] },
  { id: 'sticky-note', label: 'Post-it / Note', icon: ic(StickyNote), category: 'course', subject: 'course', interaction: 'click',
    keywords: ['note', 'post-it', 'pense-bête', 'mémo', 'rappel'],
    params: [
      { key: 'color', label: 'Couleur', kind: 'select', inOptions: true, options: [
        { value: 'yellow', label: 'Jaune' }, { value: 'pink', label: 'Rose' }, { value: 'blue', label: 'Bleu' },
        { value: 'green', label: 'Vert' }, { value: 'orange', label: 'Orange' }, { value: 'purple', label: 'Violet' } ] },
      { key: 'text', label: 'Texte', kind: 'text', inOptions: true },
      { key: 'fontSize', label: 'Taille', kind: 'number', min: 10, max: 32, unit: 'px' },
      { key: 'tilt', label: 'Inclinaison', kind: 'number', min: -8, max: 8, unit: '°' } ] },
  { id: 'course-card', label: 'Carte de cours', icon: ic(GraduationCap), category: 'course', subject: 'course', interaction: 'click',
    keywords: ['définition', 'exemple', 'à retenir', 'méthode', 'objectif', 'leçon'],
    params: [
      { key: 'kind', label: 'Type', kind: 'select', inOptions: true, options: [
        { value: 'definition', label: 'Définition' }, { value: 'example', label: 'Exemple' }, { value: 'remember', label: 'À retenir' },
        { value: 'method', label: 'Méthode' }, { value: 'objective', label: 'Objectif' }, { value: 'note', label: 'Note' } ] },
      { key: 'title', label: 'Titre', kind: 'text', inOptions: true },
      { key: 'body', label: 'Contenu', kind: 'text' },
      { key: 'accent', label: 'Accent', kind: 'color' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 160, max: 640, unit: 'px' } ] },
  { id: 'image', label: 'Image', icon: ic(ImageIcon), category: 'course', subject: 'course', interaction: 'click',
    keywords: ['photo', 'illustration', 'figure', 'schéma', 'en ligne'],
    params: [
      { key: 'src', label: 'URL', kind: 'text', inOptions: true },
      { key: 'caption', label: 'Légende', kind: 'text' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 40, max: 1000, unit: 'px' },
      { key: 'height', label: 'Hauteur', kind: 'number', min: 40, max: 1000, unit: 'px' },
      { key: 'alt', label: 'Texte alt.', kind: 'text' } ] },
]

/* ── EXERCISE (interactive) ────────────────────────────────── */
const EXERCISE: ToolDef[] = [
  { id: 'qcm', label: 'QCM', icon: ic(ListChecks), category: 'exercise', subject: 'exercise', interaction: 'click',
    keywords: ['question', 'choix', 'quiz', 'réponse', 'qcm'],
    params: [
      { key: 'question', label: 'Question', kind: 'text', inOptions: true },
      { key: 'multi', label: 'Choix multiples', kind: 'boolean' },
      { key: 'explanation', label: 'Explication', kind: 'text' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 220, max: 600, unit: 'px' } ] },
  { id: 'flashcard', label: 'Flashcard', icon: ic(LayersIcon), category: 'exercise', subject: 'exercise', interaction: 'click',
    keywords: ['carte', 'recto', 'verso', 'mémoriser', 'révision'],
    params: [
      { key: 'front', label: 'Recto', kind: 'text', inOptions: true },
      { key: 'back', label: 'Verso', kind: 'text', inOptions: true },
      { key: 'width', label: 'Largeur', kind: 'number', min: 140, max: 400, unit: 'px' },
      { key: 'height', label: 'Hauteur', kind: 'number', min: 100, max: 320, unit: 'px' } ] },
  { id: 'fill-blank', label: 'Texte à trous', icon: ic(TextCursorInput), category: 'exercise', subject: 'exercise', interaction: 'click',
    keywords: ['compléter', 'lacune', 'blanc', 'remplir'],
    params: [
      { key: 'template', label: 'Texte ({{réponse}})', kind: 'text', inOptions: true },
      { key: 'width', label: 'Largeur', kind: 'number', min: 220, max: 700, unit: 'px' } ] },
  { id: 'short-answer', label: 'Calcul / Réponse', icon: ic(Calculator), category: 'exercise', subject: 'exercise', interaction: 'click',
    keywords: ['calcul', 'réponse courte', 'nombre', 'résultat'],
    params: [
      { key: 'question', label: 'Question', kind: 'text', inOptions: true },
      { key: 'answer', label: 'Réponse', kind: 'text', inOptions: true },
      { key: 'unit', label: 'Unité', kind: 'text' },
      { key: 'explanation', label: 'Explication', kind: 'text' },
      { key: 'width', label: 'Largeur', kind: 'number', min: 200, max: 560, unit: 'px' } ] },
]

/* ── Assembled registry ────────────────────────────────────── */
export const TOOLS: ToolDef[] = [
  ...EXERCISE,
  ...COURSE,
  ...DRAW, ...MATH, ...GEOMETRY, ...PHYSICS, ...CHEMISTRY, ...LAB,
  ...DIAGRAM, ...CS, ...NETWORK, ...SECURITY, ...DATA, ...LAW, ...ARCHITECTURE,
]

/* ── Indexes & helpers ─────────────────────────────────────── */
export const TOOLS_BY_ID: Record<string, ToolDef> =
  Object.fromEntries(TOOLS.map((t) => [t.id, t]))

export function getTool(id: string): ToolDef | undefined {
  return TOOLS_BY_ID[id]
}

export const CATEGORY_META: { id: ToolCategory; label: string; subject: Subject; icon: React.ReactNode }[] = [
  { id: 'exercise', label: 'Exercices', subject: 'exercise', icon: ic(ListChecks) },
  { id: 'course', label: 'Cours', subject: 'course', icon: ic(GraduationCap) },
  { id: 'draw', label: 'Dessin', subject: 'draw', icon: ic(Pencil) },
  { id: 'math', label: 'Maths', subject: 'math', icon: ic(FunctionSquare) },
  { id: 'geometry', label: 'Géométrie', subject: 'geometry', icon: ic(Triangle) },
  { id: 'physics', label: 'Physique', subject: 'physics', icon: ic(Zap) },
  { id: 'chemistry', label: 'Chimie', subject: 'chemistry', icon: ic(Atom) },
  { id: 'lab', label: 'Laboratoire', subject: 'lab', icon: ic(FlaskConical) },
  { id: 'diagram', label: 'Schémas', subject: 'diagram', icon: ic(Workflow) },
  { id: 'cs', label: 'Informatique', subject: 'cs', icon: ic(Code2) },
  { id: 'network', label: 'Réseaux', subject: 'network', icon: ic(Network) },
  { id: 'security', label: 'Cybersécurité', subject: 'security', icon: ic(Shield) },
  { id: 'data', label: 'Data & IA', subject: 'data', icon: ic(Brain) },
  { id: 'law', label: 'Droit', subject: 'law', icon: ic(Scale) },
  { id: 'architecture', label: 'Architecture', subject: 'architecture', icon: ic(Building2) },
]

export function toolsByCategory(cat: ToolCategory): ToolDef[] {
  return TOOLS.filter((t) => t.category === cat)
}

/** Fuzzy-ish search for the command palette. */
export function searchTools(query: string): ToolDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return TOOLS
  return TOOLS.filter((t) => {
    const hay = [t.label, t.id, t.description ?? '', ...(t.keywords ?? [])].join(' ').toLowerCase()
    return hay.includes(q)
  })
}
