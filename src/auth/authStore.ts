/* ============================================================
   Auth store — email/password authentication via Supabase Auth,
   with a first-class GUEST mode so the app stays fully usable
   without an account (everything lives in localStorage). Signing
   in later lets courses sync to the cloud.
   ============================================================ */
import { create } from 'zustand'
import { getSupabase, isBackendEnabled } from '../lib/supabase'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export type AuthStatus = 'loading' | 'guest' | 'authed'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  error: string | null
  /** Initialise from any existing Supabase session. Call once. */
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name?: string) => Promise<boolean>
  signOut: () => Promise<void>
  continueAsGuest: () => void
  clearError: () => void
}

function toUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): AuthUser | null {
  if (!u) return null
  return { id: u.id, email: u.email ?? '', name: (u.user_metadata?.name as string) ?? undefined }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  error: null,

  init: async () => {
    if (!isBackendEnabled) { set({ status: 'guest' }); return }
    const sb = await getSupabase()
    if (!sb) { set({ status: 'guest' }); return }
    const { data } = await sb.auth.getSession()
    const user = toUser(data.session?.user ?? null)
    set({ status: user ? 'authed' : 'guest', user })

    // Keep the store in sync with auth changes (token refresh, sign-out…).
    sb.auth.onAuthStateChange((_evt, session) => {
      const u = toUser(session?.user ?? null)
      set({ user: u, status: u ? 'authed' : (get().status === 'authed' ? 'guest' : get().status) })
    })
  },

  signIn: async (email, password) => {
    set({ error: null })
    const sb = await getSupabase()
    if (!sb) { set({ error: 'Backend indisponible.' }); return false }
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { set({ error: humanError(error.message) }); return false }
    set({ status: 'authed', user: toUser(data.user) })
    return true
  },

  signUp: async (email, password, name) => {
    set({ error: null })
    const sb = await getSupabase()
    if (!sb) { set({ error: 'Backend indisponible.' }); return false }
    const { data, error } = await sb.auth.signUp({
      email: email.trim(), password,
      options: { data: name ? { name } : undefined },
    })
    if (error) { set({ error: humanError(error.message) }); return false }
    // With email confirmation disabled, a session is returned immediately.
    if (data.session) { set({ status: 'authed', user: toUser(data.user) }); return true }
    set({ error: 'Vérifie ta boîte mail pour confirmer ton compte.' })
    return false
  },

  signOut: async () => {
    const sb = await getSupabase()
    if (sb) await sb.auth.signOut()
    set({ status: 'guest', user: null })
  },

  continueAsGuest: () => set({ status: 'guest', user: null }),
  clearError: () => set({ error: null }),
}))

function humanError(msg: string): string {
  if (/invalid login/i.test(msg)) return 'Email ou mot de passe incorrect.'
  if (/already registered/i.test(msg)) return 'Cet email a déjà un compte.'
  if (/password/i.test(msg) && /6/.test(msg)) return 'Le mot de passe doit faire au moins 6 caractères.'
  return msg
}
