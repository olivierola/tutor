/* ============================================================
   Auth screen — sign in / sign up with email + password, plus a
   "continue as guest" escape hatch so the app never blocks. Shown
   while status is not 'authed' and the user hasn't chosen guest.
   ============================================================ */
import React, { useState } from 'react'
import { Hexagon, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import { useAuthStore } from './authStore'
import { T, R } from '../theme/tokens'

const AuthScreen: React.FC = () => {
  const { signIn, signUp, continueAsGuest, error, clearError } = useAuthStore()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    if (mode === 'in') await signIn(email, password)
    else await signUp(email, password, name)
    setBusy(false)
  }

  const field = (icon: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 14px', borderRadius: R.md, background: T.surface2, border: `1px solid ${T.border}` }}>
      <span style={{ color: T.text3, flexShrink: 0 }}>{icon}</span>
      <input {...props} onFocus={clearError}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: T.text1, fontSize: 14, fontFamily: 'inherit' }} />
    </div>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <div style={{ width: 'min(400px, 92vw)', padding: 32, borderRadius: R.xl, background: '#ffffff', border: `1px solid ${T.border}`, boxShadow: T.shadowPop }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: R.lg, background: 'var(--accent)', color: 'var(--text-on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Hexagon size={26} strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: 0, letterSpacing: '-0.02em' }}>Tutor&nbsp;AI</h1>
          <p style={{ fontSize: 13.5, color: T.text3, margin: '6px 0 0' }}>
            {mode === 'in' ? 'Connecte-toi pour retrouver tes cours' : 'Crée un compte pour sauvegarder tes cours'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'up' && field(<User size={17} />, { placeholder: 'Nom', value: name, onChange: (e) => setName(e.target.value) })}
          {field(<Mail size={17} />, { type: 'email', placeholder: 'Email', value: email, onChange: (e) => setEmail(e.target.value), required: true })}
          {field(<Lock size={17} />, { type: 'password', placeholder: 'Mot de passe', value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 6 })}

          {error && <div style={{ fontSize: 12.5, color: '#f87171', padding: '2px 4px' }}>{error}</div>}

          <button type="submit" disabled={busy}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginTop: 4, borderRadius: R.md, border: 'none', cursor: busy ? 'default' : 'pointer', background: 'var(--accent)', color: 'var(--text-on-accent)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
            {busy ? <Loader2 size={18} className="spin" /> : <>{mode === 'in' ? 'Se connecter' : 'Créer mon compte'} <ArrowRight size={17} /></>}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, fontSize: 13, color: T.text3 }}>
          {mode === 'in' ? 'Pas de compte ?' : 'Déjà un compte ?'}
          <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); clearError() }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-text)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            {mode === 'in' ? 'Inscris-toi' : 'Connecte-toi'}
          </button>
        </div>

        <div style={{ height: 1, background: T.border, margin: '20px 0 14px' }} />
        <button onClick={continueAsGuest}
          style={{ width: '100%', height: 40, borderRadius: R.md, border: `1px solid ${T.border}`, cursor: 'pointer', background: 'transparent', color: T.text2, fontSize: 13.5, fontFamily: 'inherit' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          Continuer sans compte
        </button>
      </div>
    </div>
  )
}

export default AuthScreen
