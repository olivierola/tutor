// ============================================================
// Edge function: `agent`
//
//   POST { prompt, origin?, currentScene?, history? }
//   →    { text, scene? }
//
// Calls Groq Cloud (OpenAI-compatible chat API) with the Scene
// system prompt and returns the parsed JSON. The front-end then
// validates the scene with src/scene/validate.ts before touching
// the canvas, so a slightly malformed reply degrades gracefully
// instead of crashing.
//
// Secrets (set with `supabase secrets set …`):
//   GROQ_API_KEY   — your Groq Cloud API key
//   GROQ_MODEL     — optional, defaults to llama-3.3-70b-versatile
//
// Deploy with:
//   supabase functions deploy agent --no-verify-jwt   (or with JWT)
// ============================================================
import { corsHeaders, json } from '../_shared/cors.ts'
import { SCENE_SYSTEM_PROMPT, type AgentContext } from '../_shared/scenePrompt.ts'
import { findImage } from '../_shared/images.ts'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

interface AgentRequest extends AgentContext {
  prompt: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('GROQ_API_KEY')
  if (!apiKey) return json({ error: 'GROQ_API_KEY non configurée.' }, 500)

  let body: AgentRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Corps JSON invalide.' }, 400)
  }
  if (!body.prompt?.trim()) return json({ error: 'prompt manquant.' }, 400)

  // Build the conversation: prior turns + a context block + the new prompt.
  const contextBlock = [
    body.origin ? `Origine (centre de la vue) : x=${body.origin.x}, y=${body.origin.y}.` : '',
    body.currentScene
      ? `Contenu actuel du tableau (JSON) :\n${JSON.stringify(body.currentScene).slice(0, 6000)}`
      : 'Le tableau est vide.',
  ].filter(Boolean).join('\n')

  // OpenAI-compatible message list: system prompt first, then history,
  // then the contextualised student prompt.
  const messages = [
    { role: 'system' as const, content: SCENE_SYSTEM_PROMPT },
    ...(body.history ?? []).slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: `${contextBlock}\n\nDemande de l'élève : ${body.prompt}` },
  ]

  let res: Response
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL') ?? DEFAULT_MODEL,
        max_tokens: 16384,
        temperature: 0.5,
        // Force a single JSON object reply so parsing is reliable.
        response_format: { type: 'json_object' },
        messages,
      }),
    })
  } catch (e) {
    return json({ error: `Appel Groq échoué : ${String(e)}` }, 502)
  }

  if (!res.ok) {
    const detail = await res.text()
    return json({ error: `Groq ${res.status}`, detail }, 502)
  }

  const data = await res.json()
  const raw: string = data?.choices?.[0]?.message?.content ?? ''

  // With response_format=json_object the content is already a JSON
  // object string, but we still salvage prose-wrapped JSON just in case.
  const parsed = extractJson(raw)
  if (!parsed) {
    return json({ text: raw || "Je n'ai pas pu produire d'illustration.", scene: undefined })
  }

  // Resolve image queries → real, openly-licensed URLs.
  await resolveImages(parsed)

  return json({ text: parsed.text ?? '', scene: parsed.scene, lesson: parsed.lesson, ops: parsed.ops })
})

/** Collect every items[] array from a scene or lesson payload. */
function collectItemArrays(p: any): any[][] {
  const arrays: any[][] = []
  if (Array.isArray(p?.scene?.items)) arrays.push(p.scene.items)
  if (Array.isArray(p?.lesson?.pages)) {
    for (const page of p.lesson.pages) if (Array.isArray(page?.items)) arrays.push(page.items)
  }
  return arrays
}

/**
 * For each image item that carries a `query` (and no usable src),
 * look up a real free-licence image and fill in src/caption/attr.
 * Items that can't be resolved are dropped from their array.
 */
async function resolveImages(parsed: any): Promise<void> {
  const arrays = collectItemArrays(parsed)
  for (const items of arrays) {
    // Gather pending image lookups.
    const tasks: { idx: number; query: string }[] = []
    items.forEach((it: any, idx: number) => {
      if (it?.type === 'image') {
        const hasSrc = typeof it.src === 'string' && /^https?:\/\//.test(it.src)
        const q = typeof it.query === 'string' ? it.query : (!hasSrc && typeof it.caption === 'string' ? it.caption : '')
        if (!hasSrc && q) tasks.push({ idx, query: q })
      }
    })
    if (tasks.length === 0) continue

    const results = await Promise.all(tasks.map((t) => findImage(t.query)))
    const drop = new Set<number>()
    tasks.forEach((t, i) => {
      const found = results[i]
      const it = items[t.idx]
      if (found) {
        it.src = found.url
        it.attribution = found.attribution
        if (!it.caption) it.caption = t.query
        delete it.query
      } else {
        drop.add(t.idx) // no image found → remove the placeholder
      }
    })
    if (drop.size) {
      const kept = items.filter((_: any, i: number) => !drop.has(i))
      items.length = 0
      items.push(...kept)
    }
  }
}

function extractJson(raw: string): { text?: string; scene?: unknown; lesson?: unknown; ops?: unknown } | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (!m) return null
    try { return JSON.parse(m[0]) } catch { return null }
  }
}
