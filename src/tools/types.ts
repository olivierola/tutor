/* ============================================================
   Tool registry — type definitions.

   A ToolDef is the single source of truth for everything the UI
   needs to know about a tool: how to show it (label, icon,
   category, subject accent), how it is placed on the canvas
   (interaction), and which of its parameters the user can edit
   — BEFORE placement (tool options) and AFTER (property panel).

   The actual element factory still lives in utils/placeElement.ts;
   the registry references tools by their `id`.
   ============================================================ */
import type { ReactNode } from 'react'
import type { Subject } from '../theme/tokens'

/** Top-level grouping shown in the toolbar / insert menu. */
export type ToolCategory =
  | 'draw'        // pen, shapes, text, eraser…
  | 'math'        // axes, graphs, fractions…
  | 'geometry'    // triangle, angle, instruments…
  | 'physics'     // vectors, springs, circuits…
  | 'chemistry'   // atoms, bonds, rings…
  | 'lab'         // glassware & apparatus
  | 'diagram'     // generic nodes, edges, callouts, tables, timelines…
  | 'cs'          // informatique : code, structures, organigrammes…
  | 'network'     // réseaux : routeur, switch, paquets, topologies…
  | 'security'    // cybersécurité : pare-feu, chiffrement, menaces…
  | 'data'        // data & IA : pipelines, bases, réseaux de neurones…
  | 'law'         // droit : hiérarchie des normes, contrats, procédures…
  | 'architecture'// architecture : bâtiments, plans, structures…
  | 'course'      // authoring : texte riche, notes, post-its, images, cartes…
  | 'exercise'    // interactif : QCM, flashcards, texte à trous, calcul…

/** How the tool is committed to the canvas. */
export type Interaction =
  | 'select'      // not a placing tool (selection, pan…)
  | 'click'       // single click drops a fixed-size element
  | 'drag'        // press-drag defines geometry (line, rect, vector…)
  | 'freehand'    // continuous capture (pen)
  | 'instrument'  // adds an overlay instrument, not an element
  | 'special'     // bespoke flow handled in canvas (bond, connect, text)

/* ── Editable parameter schema ─────────────────────────────── */

export type ParamKind = 'number' | 'text' | 'boolean' | 'color' | 'select' | 'latex'

export interface ParamSpecBase {
  /** Key on the element object this parameter maps to. */
  key: string
  label: string
  kind: ParamKind
  /** Show in the pre-placement tool options bar. */
  inOptions?: boolean
  /** Show in the post-placement property panel (defaults true). */
  inPanel?: boolean
  /** Optional grouping header in the panel. */
  group?: string
}

export interface NumberParam extends ParamSpecBase {
  kind: 'number'
  min?: number
  max?: number
  step?: number
  unit?: string
}
export interface TextParam extends ParamSpecBase { kind: 'text' | 'latex'; placeholder?: string }
export interface BoolParam extends ParamSpecBase { kind: 'boolean' }
export interface ColorParam extends ParamSpecBase { kind: 'color' }
export interface SelectParam extends ParamSpecBase {
  kind: 'select'
  options: { value: string; label: string }[]
}

export type ParamSpec = NumberParam | TextParam | BoolParam | ColorParam | SelectParam

/* ── Tool definition ───────────────────────────────────────── */

export interface ToolDef {
  /** Stable id — matches PLACE_FNS keys and the active-tool value. */
  id: string
  label: string
  /** Short description for tooltips / command palette. */
  description?: string
  icon: ReactNode
  category: ToolCategory
  subject: Subject
  interaction: Interaction
  /** Optional keyboard shortcut (single key). */
  shortcut?: string
  /** Search aliases for the command palette. */
  keywords?: string[]
  /** Editable parameters (drives options bar + property panel). */
  params?: ParamSpec[]
  /** Hidden from the main grid (still reachable via search). */
  advanced?: boolean
}
