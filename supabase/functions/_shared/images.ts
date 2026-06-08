// ============================================================
// Image search — resolves a free-text query into a real, openly
// licensed image URL. Uses Openverse (no API key required) with
// a Wikimedia Commons fallback. Returns null on failure so the
// caller can simply drop the image rather than crash.
// ============================================================

export interface FoundImage {
  url: string
  attribution?: string
  width?: number
  height?: number
}

const OPENVERSE = 'https://api.openverse.org/v1/images/'
const WIKIMEDIA = 'https://commons.wikimedia.org/w/api.php'

/** Search Openverse for a freely licensed image. */
async function searchOpenverse(query: string): Promise<FoundImage | null> {
  try {
    const url = `${OPENVERSE}?q=${encodeURIComponent(query)}&page_size=1` +
      `&license_type=all&mature=false`
    const res = await fetch(url, { headers: { 'User-Agent': 'tutor-ai/1.0' } })
    if (!res.ok) return null
    const data = await res.json()
    const hit = data?.results?.[0]
    if (!hit?.url) return null
    return {
      url: hit.url,
      attribution: hit.creator
        ? `${hit.creator} — ${hit.license ?? ''} (Openverse)`.trim()
        : 'Openverse',
      width: hit.width,
      height: hit.height,
    }
  } catch {
    return null
  }
}

/** Fallback: a thumbnail from Wikimedia Commons. */
async function searchWikimedia(query: string): Promise<FoundImage | null> {
  try {
    const url = `${WIKIMEDIA}?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`
    const res = await fetch(url, { headers: { 'User-Agent': 'tutor-ai/1.0' } })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    const first = Object.values(pages)[0] as any
    const info = first?.imageinfo?.[0]
    const src = info?.thumburl ?? info?.url
    if (!src) return null
    return { url: src, attribution: 'Wikimedia Commons', width: info?.thumbwidth, height: info?.thumbheight }
  } catch {
    return null
  }
}

/** Resolve a query to one image, trying Openverse then Wikimedia. */
export async function findImage(query: string): Promise<FoundImage | null> {
  if (!query?.trim()) return null
  return (await searchOpenverse(query)) ?? (await searchWikimedia(query))
}
