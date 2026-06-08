/* ============================================================
   Top navbar — three zones:
     • left:   brand + breadcrumb
     • center: primary section tabs (absolutely centered)
     • right:  search + profile menu
   ============================================================ */
import React from 'react'
import {
  Hexagon, LayoutDashboard, BookOpen, Settings, Search,
} from 'lucide-react'
import { useNavStore, type HubSection } from '../../store/navStore'
import ProfileMenu from './ProfileMenu'
import { T, R } from '../../theme/tokens'

const TABS: { section: HubSection; icon: React.ReactNode; label: string }[] = [
  { section: 'dashboard', icon: <LayoutDashboard size={16} />, label: 'Tableau de bord' },
  { section: 'courses', icon: <BookOpen size={16} />, label: 'Cours' },
  { section: 'settings', icon: <Settings size={16} />, label: 'Réglages' },
]

const SECTION_LABEL: Record<HubSection, string> = {
  dashboard: 'Tableau de bord',
  courses: 'Cours',
  settings: 'Réglages',
}

interface Props {
  onOpenSearch?: () => void
}

const NavBar: React.FC<Props> = ({ onOpenSearch }) => {
  const view = useNavStore((s) => s.view)
  const goHub = useNavStore((s) => s.goHub)
  const activeSection = view.kind === 'hub' ? view.section : null

  const breadcrumb = ['Mon espace', SECTION_LABEL[activeSection ?? 'courses']]

  return (
    <header
      style={{
        position: 'relative', height: 56, flexShrink: 0, zIndex: 10,
        background: T.surface1, borderBottom: `1px solid ${T.borderStrong}`,
        boxShadow: 'var(--navbar-shadow)',
        display: 'flex', alignItems: 'center', padding: '0 18px',
      }}
    >
      {/* ── Left: brand + breadcrumb ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          onClick={() => goHub('courses')}
          title="Accueil"
          style={{
            width: 30, height: 30, borderRadius: R.md, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: 'var(--text-on-accent)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
          }}
        >
          <Hexagon size={17} strokeWidth={2.2} />
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, minWidth: 0 }}>
          {breadcrumb.map((crumb, i) => {
            const last = i === breadcrumb.length - 1
            return (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: T.text3 }}>/</span>}
                <span style={{
                  color: last ? T.text1 : T.text3, fontWeight: last ? 600 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {crumb}
                </span>
              </React.Fragment>
            )
          })}
        </nav>
      </div>

      {/* ── Center: section tabs (absolutely centered) ─────────── */}
      <nav style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        display: 'flex', alignItems: 'center', gap: 2,
        background: T.surface0, border: `1px solid ${T.border}`, borderRadius: R.full, padding: 3,
      }}>
        {TABS.map((t) => {
          const active = activeSection === t.section
          return (
            <button
              key={t.section}
              onClick={() => goHub(t.section)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                height: 30, padding: '0 14px', borderRadius: R.full,
                border: active ? `1px solid ${T.border}` : '1px solid transparent',
                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                background: active ? T.surface2 : 'transparent',
                color: active ? 'var(--accent-text)' : T.text2,
                fontWeight: active ? 600 : 400,
                boxShadow: active ? T.shadowSm : 'none',
                transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = T.text1 }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = T.text2 }}
            >
              {t.icon}{t.label}
            </button>
          )
        })}
      </nav>

      {/* ── Right: search + profile ────────────────────────────── */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onOpenSearch}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 34, padding: '0 12px', borderRadius: R.md, cursor: 'pointer',
            background: T.surface2, border: `1px solid ${T.border}`, color: T.text3,
            fontSize: 13, fontFamily: 'inherit', minWidth: 200,
            transition: 'border-color var(--dur-fast) var(--ease)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderStrong)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
        >
          <Search size={15} />
          <span style={{ flex: 1, textAlign: 'left' }}>Rechercher…</span>
          <kbd style={{
            fontSize: 11, fontFamily: 'monospace', color: T.text3,
            border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 5px',
          }}>⌘K</kbd>
        </button>

        <ProfileMenu email="lovableolivier@gmail.com" />
      </div>
    </header>
  )
}

export default NavBar
