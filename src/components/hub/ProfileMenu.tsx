/* ============================================================
   Profile menu — avatar button that opens a small dropdown
   with the account identity, a theme toggle and (placeholder)
   account actions.
   ============================================================ */
import React, { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Settings, LogOut, LogIn, ChevronDown } from 'lucide-react'
import { useThemeStore } from '../../theme/useTheme'
import { useNavStore } from '../../store/navStore'
import { useAuthStore } from '../../auth/authStore'
import { T, R } from '../../theme/tokens'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const ProfileMenu: React.FC = () => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const resolved = useThemeStore((s) => s.resolved)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const goHub = useNavStore((s) => s.goHub)

  const authStatus = useAuthStore((s) => s.status)
  const authedUser = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const isGuest = authStatus !== 'authed'
  const name = authedUser?.name || (isGuest ? 'Invité' : 'Utilisateur')
  const email = authedUser?.email || (isGuest ? 'Mode invité' : undefined)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const item = (icon: React.ReactNode, label: string, fn: () => void, right?: React.ReactNode) => (
    <button
      onClick={() => { fn() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%',
        padding: '8px 10px', borderRadius: R.sm, border: 'none', cursor: 'pointer',
        background: 'transparent', color: T.text2, fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}<span style={{ flex: 1 }}>{label}</span>{right}
    </button>
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 6px 0 4px',
          borderRadius: R.full, border: `1px solid ${open ? T.borderStrong : T.border}`,
          cursor: 'pointer', background: T.surface2,
          transition: 'border-color var(--dur-fast) var(--ease)',
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)', color: 'var(--text-on-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>
          {initials(name)}
        </span>
        <ChevronDown size={14} style={{ color: T.text3 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, zIndex: 60, minWidth: 220,
          background: T.surface1, border: `1px solid ${T.border}`, borderRadius: R.md,
          boxShadow: T.shadowPop, padding: 6,
        }}>
          {/* Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 10px' }}>
            <span style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent)', color: 'var(--text-on-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>
              {initials(name)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              {email && <div style={{ fontSize: 12, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>}
            </div>
          </div>

          <div style={{ height: 1, background: T.border, margin: '2px 0 4px' }} />

          {item(
            resolved === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
            resolved === 'dark' ? 'Thème clair' : 'Thème sombre',
            toggleTheme,
          )}
          {item(<Settings size={15} />, 'Réglages', () => { setOpen(false); goHub('settings') })}

          <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
          {isGuest
            ? item(<LogIn size={15} />, 'Se connecter', () => { setOpen(false); sessionStorage.removeItem('tutor-ai:guest'); window.location.reload() })
            : item(<LogOut size={15} />, 'Se déconnecter', async () => { setOpen(false); await signOut(); window.location.reload() })}
        </div>
      )}
    </div>
  )
}

export default ProfileMenu
