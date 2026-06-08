// ============================================================
// Edge function: `share`
//
//   POST { courseId, canEdit?, expiresInDays? }   (auth required)
//     → { token, url }                            create a share link
//
//   GET  ?token=xxxx                              (no auth)
//     → { course, pages }                         resolve a link (read-only)
//
// The GET path uses the SERVICE ROLE key to bypass RLS, but only
// ever returns a course that has a matching, non-expired share
// row — so it can't leak private courses.
//
// NOT DEPLOYED.
// ============================================================
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function randomToken(len = 10): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // ── resolve a share token (public, read-only) ──────────────
  if (req.method === 'GET') {
    const token = new URL(req.url).searchParams.get('token')?.trim()
    if (!token) return json({ error: 'token manquant.' }, 400)

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const { data: share } = await admin
      .from('shares')
      .select('course_id, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (!share) return json({ error: 'Lien introuvable.' }, 404)
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return json({ error: 'Lien expiré.' }, 410)
    }

    const { data: course } = await admin
      .from('courses').select('*').eq('id', share.course_id).single()
    const { data: pages } = await admin
      .from('pages').select('*').eq('course_id', share.course_id).order('position')

    return json({ course, pages })
  }

  // ── create a share token (auth required) ───────────────────
  if (req.method === 'POST') {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non authentifié.' }, 401)

    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return json({ error: 'Session invalide.' }, 401)

    const { courseId, canEdit, expiresInDays } = await req.json().catch(() => ({}))
    if (!courseId) return json({ error: 'courseId manquant.' }, 400)

    // RLS guarantees the user can only select a course they own.
    const { data: course } = await supabase
      .from('courses').select('id').eq('id', courseId).maybeSingle()
    if (!course) return json({ error: 'Cours introuvable ou non autorisé.' }, 403)

    const token = randomToken()
    const expires_at = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400_000).toISOString()
      : null

    const { error } = await supabase.from('shares').insert({
      token, course_id: courseId, owner_id: user.id,
      can_edit: !!canEdit, expires_at,
    })
    if (error) return json({ error: error.message }, 400)

    return json({ token, url: `/share/${token}` })
  }

  return json({ error: 'Method not allowed' }, 405)
})
