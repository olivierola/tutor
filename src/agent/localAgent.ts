/* ============================================================
   Local demo agent — a rule-based stand-in that maps a few
   French prompts to ready-made Scenes. It proves the full
   pipeline (prompt → Scene JSON → validate → canvas) without any
   network or key. Replace with a Claude-backed Agent later; the
   UI only depends on the `Agent` interface.
   ============================================================ */
import type { Agent, AgentContext, AgentResponse } from './types'
import type { Scene } from '../scene/types'

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w))

function build(prompt: string, origin: { x: number; y: number }): AgentResponse {
  const p = prompt.toLowerCase()
  const { x, y } = origin

  // ── Triangle ────────────────────────────────────────────────
  if (has(p, 'triangle')) {
    const rect = has(p, 'rectangle', 'rectang')
    const scene: Scene = {
      title: rect ? 'Triangle rectangle' : 'Triangle',
      items: [
        { type: 'triangle', x, y, showAngles: true, showSides: true, strokeColor: '#60a5fa' },
        { type: 'text', x: x - 10, y: y + 30, content: 'A', color: '#a1a1aa', fontSize: 16 },
        { type: 'text', x: x + 100, y: y + 30, content: 'B', color: '#a1a1aa', fontSize: 16 },
        { type: 'text', x: x + 40, y: y - 96, content: 'C', color: '#a1a1aa', fontSize: 16 },
      ],
    }
    return { text: rect
      ? "Voici un triangle rectangle ABC avec ses angles et côtés annotés."
      : "Voici un triangle ABC. Demande-moi de l'annoter ou d'ajouter des mesures.", scene }
  }

  // ── Repère + fonction ───────────────────────────────────────
  if (has(p, 'fonction', 'courbe', 'parabole', 'graphe', 'f(x)')) {
    let expr = 'x^2'
    if (has(p, 'sin')) expr = 'Math.sin(x)'
    else if (has(p, 'cos')) expr = 'Math.cos(x)'
    else if (has(p, 'racine')) expr = 'Math.sqrt(x)'
    else if (has(p, 'affine', 'droite', 'linéaire')) expr = '2*x+1'
    const scene: Scene = {
      title: `Graphe de ${expr}`,
      items: [{ type: 'function-graph', x, y, expression: expr, showAxes: true, color: '#34d399' }],
    }
    return { text: `J'ai tracé la courbe de **${expr}** dans un repère.`, scene }
  }

  if (has(p, 'repère', 'repere', 'axes', 'coordonnées')) {
    return {
      text: 'Voici un repère orthonormé.',
      scene: { title: 'Repère', items: [{ type: 'axes', x, y, showGrid: true, showLabels: true }] },
    }
  }

  // ── Eau / molécule ──────────────────────────────────────────
  if (has(p, 'eau', 'h2o', 'h₂o')) {
    const scene: Scene = {
      title: "Molécule d'eau (H₂O)",
      items: [
        { type: 'atom', x, y, element: 'O', group: 'h2o' },
        { type: 'atom', x: x - 40, y: y + 30, element: 'H', group: 'h2o' },
        { type: 'atom', x: x + 40, y: y + 30, element: 'H', group: 'h2o' },
        { type: 'bond', x, y, x2: x - 40, y2: y + 30, group: 'h2o' },
        { type: 'bond', x, y, x2: x + 40, y2: y + 30, group: 'h2o' },
      ],
    }
    return { text: "Voici la molécule d'eau H₂O : un oxygène lié à deux hydrogènes.", scene }
  }

  if (has(p, 'benzène', 'benzene')) {
    return {
      text: 'Voici un cycle benzénique aromatique.',
      scene: { title: 'Benzène', items: [{ type: 'benzene-ring', x, y, aromatic: true, strokeColor: '#34d399' }] },
    }
  }

  // ── Fraction ────────────────────────────────────────────────
  if (has(p, 'fraction')) {
    return {
      text: 'Voici une fraction. Dis-moi le numérateur et le dénominateur souhaités.',
      scene: { title: 'Fraction', items: [{ type: 'fraction', x, y, numerator: '1', denominator: '2' }] },
    }
  }

  // ── Droite numérique ────────────────────────────────────────
  if (has(p, 'droite numérique', 'droite graduée', 'droite numerique')) {
    return {
      text: 'Voici une droite numérique de −5 à 5.',
      scene: { title: 'Droite numérique', items: [{ type: 'number-line', x, y, min: -5, max: 5, step: 1 }] },
    }
  }

  // ── Circuit simple (interactif) ─────────────────────────────
  if (has(p, 'circuit', 'pile', 'lampe', 'interrupteur')) {
    const scene: Scene = {
      title: 'Circuit simple',
      items: [
        { type: 'circuit-battery', x, y: y + 80, group: 'circ1', label: 'Pile' },
        { type: 'circuit-switch', x: x + 80, y, group: 'circ1', label: 'K' },
        { type: 'circuit-bulb', x: x + 200, y: y + 80, group: 'circ1', label: 'L' },
      ],
    }
    return { text: "Voici une pile, un interrupteur et une lampe. **Clique sur l'interrupteur** pour fermer le circuit : la lampe s'allume.", scene }
  }

  // ── Réseau / topologie ──────────────────────────────────────
  if (has(p, 'réseau', 'reseau', 'routeur', 'lan', 'topologie', 'serveur')) {
    const scene: Scene = {
      title: 'Réseau local',
      items: [
        { type: 'net-cloud', x, y, title: 'Internet', group: 'net1' },
        { type: 'net-router', x, y: y + 120, group: 'net1' },
        { type: 'net-switch', x, y: y + 240, group: 'net1' },
        { type: 'net-client', x: x - 160, y: y + 360, title: 'PC 1', group: 'net1' },
        { type: 'net-server', x: x + 160, y: y + 360, group: 'net1' },
        { type: 'edge', x: x + 80, y: y + 50, x2: x + 80, y2: y + 120, arrow: 'none', group: 'net1' },
        { type: 'edge', x: x + 80, y: y + 170, x2: x + 80, y2: y + 240, arrow: 'none', group: 'net1' },
      ],
    }
    return { text: 'Voici une topologie réseau : Internet → routeur → commutateur → postes. Déplace ou renomme chaque nœud.', scene }
  }

  // ── Réseau de neurones / IA ─────────────────────────────────
  if (has(p, 'neurone', 'réseau de neurones', 'deep learning', 'couche', 'ia')) {
    const scene: Scene = {
      title: 'Réseau de neurones',
      items: [
        { type: 'data-layer', x, y, title: 'Entrée', subtitle: '784', group: 'nn' },
        { type: 'data-layer', x: x + 180, y, title: 'Cachée', subtitle: '128 · ReLU', group: 'nn' },
        { type: 'data-layer', x: x + 360, y, title: 'Sortie', subtitle: '10 · softmax', group: 'nn' },
        { type: 'edge', x: x + 80, y: y + 30, x2: x + 100, y2: y + 30, group: 'nn' },
        { type: 'edge', x: x + 260, y: y + 30, x2: x + 280, y2: y + 30, group: 'nn' },
      ],
    }
    return { text: "Un réseau de neurones simple : couche d'entrée → couche cachée → sortie. Modifie les tailles en double-cliquant.", scene }
  }

  // ── Code / algorithme ───────────────────────────────────────
  if (has(p, 'code', 'algorithme', 'fonction', 'programme', 'python')) {
    const scene: Scene = {
      title: 'Exemple de code',
      items: [
        { type: 'code-block', x, y, language: 'python', title: 'factorielle.py',
          code: 'def factorielle(n):\n    if n <= 1:\n        return 1\n    return n * factorielle(n - 1)\n\nprint(factorielle(5))  # 120' },
        { type: 'callout', x, y: y + 180, kind: 'tip', title: 'Récursivité',
          body: 'La fonction s’appelle elle-même jusqu’au cas de base n ≤ 1.' },
      ],
    }
    return { text: 'Voici une fonction récursive en Python. Double-clique le bloc pour l’éditer.', scene }
  }

  // ── Droit / hiérarchie des normes ───────────────────────────
  if (has(p, 'droit', 'norme', 'constitution', 'loi', 'hiérarchie des normes')) {
    const scene: Scene = {
      title: 'Hiérarchie des normes',
      items: [
        { type: 'tree', x, y, orientation: 'vertical' },
        { type: 'callout', x: x + 280, y, kind: 'definition', title: 'Pyramide de Kelsen',
          body: 'Chaque norme doit respecter celles qui lui sont supérieures.' },
      ],
    }
    return { text: 'Voici une hiérarchie (arbre) que tu peux adapter à la pyramide des normes.', scene }
  }

  // ── Fallback ────────────────────────────────────────────────
  return {
    text: "Je peux illustrer : un *triangle*, une *fonction* (« trace x² »), un *repère*, une *molécule*, un *circuit interactif*, un *réseau*, un *réseau de neurones*, du *code*, une *hiérarchie juridique*… Que veux-tu construire ?",
  }
}

export const localAgent: Agent = {
  name: 'Tuteur (démo locale)',
  async generate(prompt: string, ctx: AgentContext): Promise<AgentResponse> {
    // Tiny delay to mimic latency / let the UI show a pending state.
    await new Promise((r) => setTimeout(r, 250))
    return build(prompt, ctx.origin ?? { x: 0, y: 0 })
  },
}
