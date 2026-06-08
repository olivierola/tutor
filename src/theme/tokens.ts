/* ============================================================
   Typed accessors for the CSS design tokens declared in
   tokens.css. Use these in inline styles so that JS-rendered
   UI flips with the theme exactly like CSS-driven UI.

   token('surface1')  ->  "var(--surface-1)"

   Because we emit `var(--…)`, the value is resolved live by the
   browser and reacts to the `.dark` class without re-rendering.
   ============================================================ */

export type TokenName =
  | 'accent' | 'accentHover' | 'accentSoft' | 'accentContrast' | 'accentText'
  | 'canvasBg' | 'rail'
  | 'surface0' | 'surface1' | 'surface2' | 'surface3' | 'surfaceOverlay'
  | 'border' | 'borderStrong' | 'borderSubtle'
  | 'text1' | 'text2' | 'text3' | 'textDisabled' | 'textOnAccent'
  | 'hoverBg' | 'activeBg' | 'focusRing'
  | 'shadowSm' | 'shadowMd' | 'shadowLg' | 'shadowPop'

const CSS_VAR: Record<TokenName, string> = {
  accent: '--accent',
  accentHover: '--accent-hover',
  accentSoft: '--accent-soft',
  accentContrast: '--accent-contrast',
  accentText: '--accent-text',
  canvasBg: '--canvas-bg',
  rail: '--rail',
  surface0: '--surface-0',
  surface1: '--surface-1',
  surface2: '--surface-2',
  surface3: '--surface-3',
  surfaceOverlay: '--surface-overlay',
  border: '--border',
  borderStrong: '--border-strong',
  borderSubtle: '--border-subtle',
  text1: '--text-1',
  text2: '--text-2',
  text3: '--text-3',
  textDisabled: '--text-disabled',
  textOnAccent: '--text-on-accent',
  hoverBg: '--hover-bg',
  activeBg: '--active-bg',
  focusRing: '--focus-ring',
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowPop: '--shadow-pop',
}

/** Returns a live CSS var() reference, e.g. token('surface1') -> "var(--surface-1)" */
export function token(name: TokenName): string {
  return `var(${CSS_VAR[name]})`
}

/** Shorthand: spread-friendly map of every token as var() refs. */
export const T: Record<TokenName, string> = Object.fromEntries(
  (Object.keys(CSS_VAR) as TokenName[]).map((k) => [k, token(k)])
) as Record<TokenName, string>

/* ── Subject accents (tool-family tinting) ─────────────────── */
export type Subject =
  | 'draw' | 'math' | 'physics' | 'chemistry' | 'lab' | 'geometry'
  | 'diagram' | 'cs' | 'network' | 'security' | 'data' | 'law' | 'architecture'
  | 'course' | 'exercise'

export function subjectAccent(subject: Subject): string {
  return `var(--subject-${subject})`
}

/* ── Radii / motion convenience refs ───────────────────────── */
export const R = {
  sm: 'var(--r-sm)',
  md: 'var(--r-md)',
  lg: 'var(--r-lg)',
  xl: 'var(--r-xl)',
  full: 'var(--r-full)',
} as const

export const MOTION = {
  ease: 'var(--ease)',
  fast: 'var(--dur-fast)',
  med: 'var(--dur-med)',
} as const
