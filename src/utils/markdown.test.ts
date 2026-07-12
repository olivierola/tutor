import { describe, it, expect } from 'vitest'
import { inlineMd, renderMd } from './markdown'

// ---------------------------------------------------------------------------
// inlineMd
// ---------------------------------------------------------------------------

describe('inlineMd', () => {
  it('returns empty string for empty input', () => {
    expect(inlineMd('')).toBe('')
  })

  it('escapes HTML', () => {
    expect(inlineMd('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  it('renders **bold**', () => {
    expect(inlineMd('hello **world**')).toContain('<strong>world</strong>')
  })

  it('renders *italic*', () => {
    expect(inlineMd('hello *world*')).toContain('<em>world</em>')
  })

  it('renders `code`', () => {
    const result = inlineMd('use `foo()`')
    expect(result).toContain('<code')
    expect(result).toContain('foo()')
  })

  it('renders inline LaTeX with $...$', () => {
    const result = inlineMd('solve $x^2$')
    expect(result).toContain('x^2')
    // KaTeX produces a span with class "katex"
    expect(result).toContain('katex')
  })

  it('renders display LaTeX with $$...$$', () => {
    const result = inlineMd('$$\\frac{a}{b}$$')
    expect(result).toContain('katex')
    expect(result).toContain('frac')
  })

  it('renders inline LaTeX with \\(...\\)', () => {
    const result = inlineMd('\\(E=mc^2\\)')
    expect(result).toContain('katex')
  })

  it('renders display LaTeX with \\[...\\]', () => {
    const result = inlineMd('\\[\\int_0^1 x\\,dx\\]')
    expect(result).toContain('katex')
  })

  it('handles mixed bold and italic', () => {
    const result = inlineMd('**bold** and *italic*')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<em>italic</em>')
  })

  it('handles code with backticks inside math', () => {
    const result = inlineMd('`const x = 1`')
    expect(result).toContain('const x = 1')
  })
})

// ---------------------------------------------------------------------------
// renderMd (block-level)
// ---------------------------------------------------------------------------

describe('renderMd', () => {
  it('returns empty string for empty input', () => {
    expect(renderMd('')).toBe('')
  })

  it('wraps text in paragraphs', () => {
    const result = renderMd('Hello world')
    expect(result).toMatch(/<p[^>]*>.*Hello world.*<\/p>/)
  })

  it('splits blank-line-separated blocks into paragraphs', () => {
    const result = renderMd('First paragraph\n\nSecond paragraph')
    expect(result).toContain('<p')
    expect(result.match(/<p[^>]*>/g)?.length).toBe(2)
  })

  it('renders bullet lists', () => {
    const result = renderMd('- item one\n- item two\n- item three')
    expect(result).toContain('<ul')
    expect(result).toContain('<li>item one</li>')
    expect(result).toContain('<li>item two</li>')
    expect(result).toContain('<li>item three</li>')
  })

  it('renders headings (#, ##, ###)', () => {
    const result = renderMd('# Title\n\n## Subtitle\n\n### Section')
    expect(result).toContain('Title')
    expect(result).toContain('Subtitle')
    expect(result).toContain('Section')
    // Headings are rendered as <div> with font-weight:700
    expect(result.match(/font-weight:700/g)?.length).toBe(3)
  })

  it('renders inline formatting inside paragraphs', () => {
    const result = renderMd('This is **bold** and *italic*')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<em>italic</em>')
  })

  it('renders LaTeX in block context', () => {
    const result = renderMd('Formula: $E=mc^2$')
    expect(result).toContain('katex')
  })

  it('handles mixed content: heading, list, paragraph', () => {
    const result = renderMd('# Notes\n\n- point one\n- point two\n\nConclusion.')
    expect(result).toContain('Notes')
    expect(result).toContain('point one')
    expect(result).toContain('Conclusion.')
  })

  it('escapes HTML in block context', () => {
    const result = renderMd('<div>injected</div>')
    expect(result).not.toContain('<div>')
    expect(result).toContain('&lt;div&gt;')
  })
})
