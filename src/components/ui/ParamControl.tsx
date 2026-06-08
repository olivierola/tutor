/* ============================================================
   Generic, token-themed control that renders the right input
   for any ParamSpec and reports changes back. Drives both the
   pre-placement options bar and the post-placement property
   panel — so a tool's parameters are described once, in the
   registry, and edited everywhere from that single schema.
   ============================================================ */
import React from 'react'
import type { ParamSpec } from '../../tools/types'
import { T, R } from '../../theme/tokens'

interface Props {
  spec: ParamSpec
  value: unknown
  onChange: (value: unknown) => void
  /** Compact layout for the inline options bar. */
  compact?: boolean
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: T.text2, marginBottom: 4, display: 'block',
}

const fieldBase: React.CSSProperties = {
  width: '100%', padding: '6px 9px', borderRadius: R.sm, fontSize: 12,
  background: T.surface2, border: `1px solid ${T.border}`,
  color: T.text1, outline: 'none', boxSizing: 'border-box',
}

const ParamControl: React.FC<Props> = ({ spec, value, onChange, compact }) => {
  const id = `p_${spec.key}`

  const body = (() => {
    switch (spec.kind) {
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value) || 0
        const showSlider = spec.min !== undefined && spec.max !== undefined && !compact
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id={id} type="number" value={num}
                min={spec.min} max={spec.max} step={spec.step ?? 1}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ ...fieldBase, width: showSlider ? 64 : '100%', flexShrink: 0 }}
              />
              {spec.unit && <span style={{ fontSize: 11, color: T.text3 }}>{spec.unit}</span>}
              {showSlider && (
                <input
                  type="range" value={num} min={spec.min} max={spec.max} step={spec.step ?? 1}
                  onChange={(e) => onChange(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
              )}
            </div>
          </div>
        )
      }
      case 'text':
      case 'latex':
        return (
          <input
            id={id} type="text" value={String(value ?? '')}
            placeholder={'placeholder' in spec ? spec.placeholder : undefined}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...fieldBase, fontFamily: spec.kind === 'latex' ? 'monospace' : 'inherit' }}
          />
        )
      case 'boolean': {
        const on = Boolean(value)
        return (
          <button
            id={id} onClick={() => onChange(!on)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 9px', borderRadius: R.sm, cursor: 'pointer',
              border: `1px solid ${on ? 'var(--accent)' : T.border}`,
              background: on ? T.accentSoft : T.surface2,
              color: on ? T.accentText : T.text2, fontSize: 12, fontFamily: 'inherit',
              justifyContent: 'space-between', transition: 'all var(--dur-fast) var(--ease)',
            }}
          >
            <span>{on ? 'Activé' : 'Désactivé'}</span>
            <span style={{
              width: 30, height: 16, borderRadius: 999, position: 'relative', flexShrink: 0,
              background: on ? 'var(--accent)' : T.border, transition: 'background var(--dur-fast)',
            }}>
              <span style={{
                position: 'absolute', top: 2, left: on ? 16 : 2, width: 12, height: 12,
                borderRadius: '50%', background: '#fff', transition: 'left var(--dur-fast) var(--ease)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }} />
            </span>
          </button>
        )
      }
      case 'color': {
        const col = String(value ?? '#000000')
        const swatch = col === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' : col
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{
              width: 26, height: 26, borderRadius: R.sm, flexShrink: 0, cursor: 'pointer',
              border: `1px solid ${T.borderStrong}`, background: swatch, position: 'relative', overflow: 'hidden',
            }}>
              <input
                type="color" value={col === 'transparent' ? '#ffffff' : col}
                onChange={(e) => onChange(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </label>
            <input
              type="text" value={col}
              onChange={(e) => onChange(e.target.value)}
              style={{ ...fieldBase, fontFamily: 'monospace', fontSize: 11 }}
            />
          </div>
        )
      }
      case 'select':
        return (
          <select
            id={id} value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...fieldBase, cursor: 'pointer' }}
          >
            {spec.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )
    }
  })()

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{spec.label}</span>
        {body}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <label htmlFor={id} style={labelStyle}>{spec.label}</label>
      {body}
    </div>
  )
}

export default ParamControl
