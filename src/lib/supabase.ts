/* ============================================================
   Supabase client — lazily created from Vite env vars.

   The app must keep running with NO backend configured (local
   localStorage mode), so this module never throws at import time.
   `getSupabase()` returns null until the env vars are present and
   the `@supabase/supabase-js` package is installed.

   Required env (see .env.example):
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
   ============================================================ */
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the backend is configured for this build. */
export const isBackendEnabled = Boolean(url && anonKey)

let client: SupabaseClient | null = null
let initPromise: Promise<SupabaseClient | null> | null = null

/** Get (and lazily create) the Supabase client, or null if unconfigured. */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!isBackendEnabled) return null
  if (client) return client
  if (!initPromise) {
    initPromise = import('@supabase/supabase-js')
      .then(({ createClient }) => {
        client = createClient(url!, anonKey!, {
          auth: { persistSession: true, autoRefreshToken: true },
        })
        return client
      })
      .catch((e) => {
        console.warn('[supabase] package non installé ou init échouée :', e)
        return null
      })
  }
  return initPromise
}

/** Base URL for invoking edge functions (…/functions/v1/<name>). */
export function functionsUrl(name: string): string {
  return `${url ?? ''}/functions/v1/${name}`
}

export const supabaseAnonKey = anonKey ?? ''
