// ============================================================
// Edge function: `lesson-plan` — the "prompteur" (planner).
//
//   POST { topic, level? }
//   →    { title, pages: [{ title, objective, brief }] }
//
// Produces a detailed lesson outline. Each page carries a rich
// "brief" — an ultra-detailed instruction telling the generator
// exactly what that page must contain (notions, examples,
// figures, exercises). The front-end then calls `agent` once per
// page with its brief, so each part is focused and complete
// instead of one overloaded generation.
//
// Secrets: GROQ_API_KEY, GROQ_MODEL (optional).
// ============================================================
import { corsHeaders, json } from '../_shared/cors.ts'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'openai/gpt-oss-120b'

const PLANNER_PROMPT = `Tu es un concepteur pédagogique expert. On te donne un SUJET de cours.
Tu produis un PLAN détaillé, structuré et progressif, sous forme d'un objet JSON :
{
  "title": "<titre du cours>",
  "pages": [
    {
      "title": "<titre court de la page>",
      "objective": "<ce que l'élève doit savoir après cette page, 1 phrase>",
      "brief": "<instruction TRÈS détaillée pour générer cette page : notions
                 précises à expliquer, définitions exactes à donner, exemple(s)
                 chiffré(s) à résoudre, figure/schéma/graphe à tracer si utile,
                 et le type d'exercice interactif à proposer (QCM, calcul,
                 flashcard, texte à trous). Sois explicite et exhaustif.>"
    }
  ]
}

Règles :
- 5 à 7 pages, dans un ordre pédagogique logique (du général au particulier) :
  Introduction & objectifs, Notions/Définitions, Propriétés/Lois, Méthode,
  Exemples résolus, Exercices, Synthèse « à retenir ».
- Chaque "brief" doit être ASSEZ détaillé pour qu'un autre agent génère une
  page riche SANS avoir besoin du sujet global : rappelle le contexte dans le
  brief. Mentionne les formules (en LaTeX), les valeurs, les unités.
- Adapte au niveau fourni (collège / lycée / supérieur).
- Reste rigoureux et factuel. Renvoie UNIQUEMENT le JSON, sans texte autour.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('GROQ_API_KEY')
  if (!apiKey) return json({ error: 'GROQ_API_KEY non configurée.' }, 500)

  let body: { topic?: string; level?: string }
  try { body = await req.json() } catch { return json({ error: 'JSON invalide.' }, 400) }
  if (!body.topic?.trim()) return json({ error: 'topic manquant.' }, 400)

  const userMsg = `Sujet : ${body.topic}\nNiveau : ${body.level ?? 'lycée'}.\nProduis le plan JSON.`

  let res: Response
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL') ?? DEFAULT_MODEL,
        max_tokens: 4096,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PLANNER_PROMPT },
          { role: 'user', content: userMsg },
        ],
      }),
    })
  } catch (e) {
    return json({ error: `Appel Groq échoué : ${String(e)}` }, 502)
  }

  if (!res.ok) return json({ error: `Groq ${res.status}`, detail: await res.text() }, 502)

  const data = await res.json()
  const raw: string = data?.choices?.[0]?.message?.content ?? ''
  let plan: unknown
  try { plan = JSON.parse(raw) } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return json({ error: 'Plan illisible.' }, 502)
    try { plan = JSON.parse(m[0]) } catch { return json({ error: 'Plan illisible.' }, 502) }
  }
  return json(plan)
})
