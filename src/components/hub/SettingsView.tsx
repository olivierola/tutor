/* ============================================================
   Settings view — appearance (theme), and data management.
   ============================================================ */
import React from 'react'
import { Sun, Moon, Monitor, Trash2 } from 'lucide-react'
import { useThemeStore, type ThemeMode } from '../../theme/useTheme'
import { useCoursesStore } from '../../store/coursesStore'
import { T, R } from '../../theme/tokens'

const Row: React.FC<{ title: string; desc: string; children: React.ReactNode }> = ({ title, desc, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
    padding: '18px 0', borderBottom: `1px solid ${T.border}`,
  }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text1 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: T.text3, marginTop: 3 }}>{desc}</div>
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
)

const SettingsView: React.FC = () => {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const courses = useCoursesStore((s) => s.courses)

  const themeOpts: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={15} />, label: 'Clair' },
    { value: 'dark', icon: <Moon size={15} />, label: 'Sombre' },
    { value: 'system', icon: <Monitor size={15} />, label: 'Système' },
  ]

  const clearAll = () => {
    if (window.confirm('Effacer TOUS les cours et données locales ? Cette action est irréversible.')) {
      try { localStorage.removeItem('tutor-ai:courses') } catch { /* ignore */ }
      window.location.reload()
    }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0, letterSpacing: '-0.025em' }}>Réglages</h1>
      <p style={{ fontSize: 14, color: T.text3, margin: '6px 0 20px' }}>Préférences de l'application.</p>

      <Row title="Thème" desc="Apparence claire, sombre ou selon le système.">
        <div style={{ display: 'flex', gap: 4, background: T.surface2, padding: 4, borderRadius: R.md, border: `1px solid ${T.border}` }}>
          {themeOpts.map((o) => {
            const active = mode === o.value
            return (
              <button
                key={o.value}
                onClick={() => setMode(o.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: R.sm,
                  border: 'none', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit',
                  background: active ? T.surface3 : 'transparent', color: active ? T.text1 : T.text3,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {o.icon}{o.label}
              </button>
            )
          })}
        </div>
      </Row>

      <Row title="Données locales" desc={`${courses.length} cours stocké(s) dans ce navigateur.`}>
        <button
          onClick={clearAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: R.md,
            border: `1px solid ${T.border}`, cursor: 'pointer', background: 'transparent',
            color: '#f87171', fontSize: 13, fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
        >
          <Trash2 size={15} /> Tout effacer
        </button>
      </Row>
    </div>
  )
}

export default SettingsView
