/* ============================================================
   Agent input — the main chat field (centred at the bottom of
   the editor). The student types a request; the agent answers
   with a drawing on the canvas and/or a reply in the floating
   ChatBubble (which also shows pending/playback state). This
   component is purely the input affordance.
   ============================================================ */
import React, { useState, useRef } from 'react'
import { Sparkles, ArrowUp, Loader2 } from 'lucide-react'
import { useAgent } from '../../agent/useAgent'
import { T, R } from '../../theme/tokens'

const AgentInput: React.FC = () => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { status, ask } = useAgent()

  const pending = status === 'pending'

  const submit = async () => {
    const text = value.trim()
    if (!text || pending) return
    setValue('')
    await ask(text)
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 48,
        padding: '0 8px 0 14px', borderRadius: R.full,
        background: T.surfaceOverlay, backdropFilter: 'blur(12px)',
        border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
        width: 'min(560px, 88vw)',
        transition: 'border-color var(--dur-fast) var(--ease)',
      }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlurCapture={(e) => (e.currentTarget.style.borderColor = T.border)}
      >
        <Sparkles size={17} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={value}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          placeholder="Demander au tuteur… (cours, explication, schéma)"
          style={{
            flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none',
            background: 'transparent', color: T.text1, fontSize: 14, fontFamily: 'inherit',
          }}
        />
        <button
          onClick={submit}
          disabled={pending || !value.trim()}
          title="Envoyer"
          style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: pending || !value.trim() ? 'default' : 'pointer',
            background: value.trim() && !pending ? 'var(--accent)' : T.surface3,
            color: value.trim() && !pending ? 'var(--text-on-accent)' : T.text3,
            transition: 'background var(--dur-fast) var(--ease)',
          }}
        >
          {pending ? <Loader2 size={16} className="spin" /> : <ArrowUp size={17} />}
        </button>
      </div>
    </div>
  )
}

export default AgentInput
