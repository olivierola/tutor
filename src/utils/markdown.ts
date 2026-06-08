/* ============================================================
   Tiny inline/block markdown → HTML, shared by the rich-text and
   course-card renderers so AI content (**bold**, *italic*,
   `code`, "- " lists) displays formatted, not raw.
   ============================================================ */

/** Inline: **bold**, *italic*, `code`. Escapes HTML first. */
export function inlineMd(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(127,127,127,0.18);padding:1px 4px;border-radius:4px;font-family:monospace;font-size:0.92em">$1</code>')
}

/** Block: blank-line paragraphs + "- " bullet lists. */
export function renderMd(body: string): string {
  const blocks = body.split(/\n\s*\n/)
  return blocks.map((block) => {
    const lines = block.split('\n')
    const isList = lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l))
    if (isList) {
      const items = lines.map((l) => `<li>${inlineMd(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')
      return `<ul style="margin:0 0 0 18px;padding:0">${items}</ul>`
    }
    return `<p style="margin:0 0 8px">${inlineMd(block).replace(/\n/g, '<br/>')}</p>`
  }).join('')
}
