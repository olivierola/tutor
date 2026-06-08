/* ============================================================
   Domain glyph map — a single lucide-backed icon set shared by
   the `node` primitive renderer, the tool registry and the
   insert UI. Adding a glyph = one entry here.

   These cover informatique, réseaux, cybersécurité, droit,
   architecture and IA/data so the generic `node` can represent
   anything the tutor needs.
   ============================================================ */
import React from 'react'
import {
  Cpu, MemoryStick, HardDrive, Code2, TerminalSquare, Binary, FunctionSquare, Variable,
  Router, Network, Server, ShieldAlert, Wifi, Cloud, Globe, Laptop, Smartphone, RadioTower,
  Shield, Lock, Unlock, KeyRound, Bug, Fingerprint, Eye, AlertTriangle,
  Database, Table2, Layers, Workflow, BarChart3, Filter, Brain, GitBranch, CircleDot,
  Scale, Gavel, FileSignature, Landmark, Stamp,
  Building2, LayoutDashboard, Ruler, Columns3, DoorOpen, AppWindow,
  User, Users, Box, Settings, Mail, Clock, Flag, Check, X,
} from 'lucide-react'
import type { NodeGlyph } from '../../../types/canvas'

type IconCmp = typeof Cpu

const MAP: Record<Exclude<NodeGlyph, 'none'>, IconCmp> = {
  // computer science
  cpu: Cpu, memory: MemoryStick, disk: HardDrive, code: Code2,
  terminal: TerminalSquare, binary: Binary, function: FunctionSquare, variable: Variable,
  // networks
  router: Router, switch: Network, server: Server, firewall: ShieldAlert,
  wifi: Wifi, cloud: Cloud, globe: Globe, laptop: Laptop, smartphone: Smartphone, antenna: RadioTower,
  // cyber
  shield: Shield, lock: Lock, unlock: Unlock, key: KeyRound,
  bug: Bug, fingerprint: Fingerprint, eye: Eye, alert: AlertTriangle,
  // data / AI
  database: Database, table: Table2, layers: Layers, neuron: CircleDot,
  pipeline: Workflow, chart: BarChart3, filter: Filter, brain: Brain, gitbranch: GitBranch,
  // law
  scales: Scale, gavel: Gavel, contract: FileSignature, 'building-law': Landmark, stamp: Stamp,
  // architecture
  building: Building2, floorplan: LayoutDashboard, ruler: Ruler,
  column: Columns3, door: DoorOpen, window: AppWindow,
  // generic / org
  user: User, users: Users, box: Box, gear: Settings, mail: Mail,
  clock: Clock, flag: Flag, check: Check, cross: X,
}

/** Render a glyph at a given size/colour, or nothing for 'none'. */
export function glyphIcon(glyph: NodeGlyph, size = 16, color?: string): React.ReactNode {
  if (glyph === 'none') return null
  const Cmp = MAP[glyph]
  if (!Cmp) return null
  return <Cmp size={size} color={color} strokeWidth={2} />
}

export const ALL_GLYPHS = Object.keys(MAP) as Exclude<NodeGlyph, 'none'>[]
