// ============================================================
// Edge function: `save-course`
//
//   POST { course: { id?, title, description, color, subject },
//          pages: [{ id?, title, position, document }] }
//   →    { course, pages }
//
// Upserts a whole course and its pages in one call, scoped to the
// authenticated user (RLS enforces ownership). Pages removed by the
// client are deleted. Uses the caller's JWT, so it can only ever
// touch rows the user owns.
//
// NOT DEPLOYED.
// ============================================================
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

interface PageInput {
  id?: string
  title: string
  position: number
  document: unknown
}
interface SaveRequest {
  course: { id?: string; title: string; description?: string; color?: string; subject?: string }
  pages: PageInput[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Non authentifié.' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return json({ error: 'Session invalide.' }, 401)

  let body: SaveRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400)
  }
  if (!body.course) return json({ error: 'course manquant.' }, 400)

  // ── upsert the course (owner enforced by RLS) ──────────────
  const { data: course, error: cErr } = await supabase
    .from('courses')
    .upsert({
      id: body.course.id,
      owner_id: user.id,
      title: body.course.title,
      description: body.course.description ?? '',
      color: body.course.color ?? 'blue',
      subject: body.course.subject ?? null,
    })
    .select()
    .single()
  if (cErr || !course) return json({ error: cErr?.message ?? 'Échec course.' }, 400)

  // ── upsert pages, then prune the ones the client dropped ───
  const rows = body.pages.map((p) => ({
    id: p.id,
    course_id: course.id,
    title: p.title,
    position: p.position,
    document: p.document ?? {},
  }))

  const { data: pages, error: pErr } = await supabase
    .from('pages')
    .upsert(rows)
    .select()
  if (pErr) return json({ error: pErr.message }, 400)

  const keepIds = (pages ?? []).map((p) => p.id)
  if (keepIds.length) {
    await supabase
      .from('pages')
      .delete()
      .eq('course_id', course.id)
      .not('id', 'in', `(${keepIds.join(',')})`)
  }

  return json({ course, pages })
})
