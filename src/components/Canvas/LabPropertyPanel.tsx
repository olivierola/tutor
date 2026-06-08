import React, { useCallback } from 'react'
import { Thermometer, Droplets, FlaskConical, Activity, Flame, Wind, X } from 'lucide-react'
import type { LabElement, LabSolution } from '../../types/canvas'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  element: LabElement
  onClose: () => void
}

// ── Preset solutions ──────────────────────────────────────────
const SOLUTIONS: { name: string; color: string; pH: number; label: string }[] = [
  { name: 'H₂O',           color: '#93c5fd55', pH: 7.0,  label: 'Eau distillée'     },
  { name: 'HCl',           color: '#fbbf2455', pH: 1.0,  label: 'Acide chlorhydrique'},
  { name: 'H₂SO₄',        color: '#fbbf2455', pH: 0.5,  label: 'Acide sulfurique'  },
  { name: 'CH₃COOH',      color: '#fde04755', pH: 2.9,  label: 'Acide acétique'    },
  { name: 'NaOH',          color: '#c4b5fd55', pH: 13.0, label: 'Soude'             },
  { name: 'NH₃',           color: '#86efac55', pH: 11.2, label: 'Ammoniac'          },
  { name: 'NaCl',          color: '#e2e8f055', pH: 7.0,  label: 'Chlorure de sodium'},
  { name: 'CuSO₄',         color: '#3b82f655', pH: 4.0,  label: 'Sulfate de cuivre' },
  { name: 'KMnO₄',         color: '#a855f755', pH: 7.0,  label: 'Permanganate K'    },
  { name: 'Phénolphtaléine',color: '#f9a8d455', pH: 7.0, label: 'Indicateur pH'     },
  { name: 'BBT',            color: '#fde04755', pH: 7.0, label: 'Bleu de bromothymol'},
  { name: 'Éthanol',        color: '#f0fdf455', pH: 7.0, label: 'Éthanol'           },
]

const pH_COLOR = (pH: number): string => {
  if (pH < 3) return '#ef4444'
  if (pH < 6) return '#f97316'
  if (pH < 8) return '#22c55e'
  if (pH < 11) return '#3b82f6'
  return '#a855f7'
}

// ── Tiny section header ───────────────────────────────────────
const SectionHead: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 10, fontWeight: 700, color: 'rgba(160,180,255,0.55)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 8, marginTop: 14,
  }}>
    <span style={{ color: 'rgba(160,180,255,0.4)' }}>{icon}</span>
    {label}
  </div>
)

// ── Slider row ────────────────────────────────────────────────
const Slider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number
  unit: string; accent: string
  onChange: (v: number) => void
}> = ({ label, value, min, max, step = 1, unit, accent, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: 'rgba(200,215,255,0.65)' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: accent, fontWeight: 600 }}>
        {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value} {unit}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: accent, cursor: 'pointer', height: 3 }}
    />
  </div>
)

// ── Toggle button ─────────────────────────────────────────────
const Toggle: React.FC<{
  label: string; active: boolean; accent: string; icon: React.ReactNode
  onClick: () => void
}> = ({ label, active, accent, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 8, border: '1px solid',
      borderColor: active ? accent : 'rgba(255,255,255,0.08)',
      background: active ? `${accent}22` : 'rgba(255,255,255,0.03)',
      color: active ? accent : 'rgba(160,180,255,0.5)',
      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
      transition: 'all 0.13s', flex: 1,
    }}
  >
    {icon}
    {label}
    {active && <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.7 }}>●</span>}
  </button>
)

// ── Main panel ────────────────────────────────────────────────
const LabPropertyPanel: React.FC<Props> = ({ element, onClose }) => {
  const updateElement = useCanvasStore(s => s.updateElement)

  const sol = element.solution
  const setField = useCallback((patch: Partial<LabSolution>) => {
    updateElement(element.id, {
      solution: { ...sol, ...patch },
    } as Partial<LabElement>)
    // If temperature ≥ 100 → auto-trigger boiling
    const newTemp = patch.temperature ?? sol.temperature
    if (newTemp >= 100 && !sol.isBoiling) {
      updateElement(element.id, {
        solution: { ...sol, ...patch, isBoiling: true },
        animated: true,
      } as Partial<LabElement>)
    }
  }, [element.id, sol, updateElement])

  const setLiquidColor = useCallback((color: string) => {
    updateElement(element.id, { liquidColor: color } as Partial<LabElement>)
  }, [element.id, updateElement])

  const setLiquidLevel = useCallback((level: number) => {
    updateElement(element.id, { liquidLevel: level } as Partial<LabElement>)
  }, [element.id, updateElement])

  const setLabel = useCallback((label: string) => {
    updateElement(element.id, { label } as Partial<LabElement>)
  }, [element.id, updateElement])

  const setAnimated = useCallback((animated: boolean) => {
    updateElement(element.id, { animated } as Partial<LabElement>)
  }, [element.id, updateElement])

  // Thermometer special: show reading in label area
  const isThermometer = element.component === 'thermometer'
  const isBunsen = element.component === 'bunsen-burner'

  return (
    <div style={{
      width: 232,
      background: '#090c16',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      boxShadow: '0 16px 56px rgba(0,0,0,0.85)',
      zIndex: 300,
      overflow: 'hidden',
      userSelect: 'none',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FlaskConical size={13} style={{ color: '#22d3ee' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(210,230,255,0.85)' }}>
            {element.component.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)', padding: 2,
        }}>
          <X size={13} />
        </button>
      </div>

      <div style={{ padding: '2px 14px 14px' }}>

        {/* ── Label ───────────────────────────────────────────── */}
        <SectionHead icon={<FlaskConical size={11} />} label="Étiquette" />
        <input
          value={element.label}
          onChange={e => setLabel(e.target.value)}
          placeholder="ex: Erlenmeyer A"
          style={{
            width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(210,230,255,0.85)', outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        {/* ── Solution (not for bunsen/retort/tripod/stirrer) ─── */}
        {!isBunsen && element.component !== 'retort-stand' && element.component !== 'tripod' && (
          <>
            <SectionHead icon={<Droplets size={11} />} label="Solution" />

            {/* Preset chooser */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {SOLUTIONS.map(s => (
                <button
                  key={s.name}
                  onClick={() => {
                    setField({ name: s.name, pH: s.pH })
                    setLiquidColor(s.color)
                  }}
                  title={s.label}
                  style={{
                    padding: '3px 7px', borderRadius: 6,
                    border: `1px solid ${sol.name === s.name ? '#22d3ee' : 'rgba(255,255,255,0.09)'}`,
                    background: sol.name === s.name ? '#22d3ee22' : `${s.color.slice(0,7)}22`,
                    color: sol.name === s.name ? '#22d3ee' : 'rgba(190,210,255,0.6)',
                    cursor: 'pointer', fontSize: 10, fontFamily: 'monospace',
                    transition: 'all 0.12s',
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Custom color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'rgba(200,215,255,0.6)', flex: 1 }}>Couleur</span>
              <input
                type="color"
                value={element.liquidColor.slice(0,7)}
                onChange={e => setLiquidColor(e.target.value + '88')}
                style={{ width: 28, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none' }}
              />
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                background: element.liquidColor.slice(0,7),
                border: '1px solid rgba(255,255,255,0.12)',
              }} />
            </div>

            {/* Level */}
            <Slider label="Niveau" value={Math.round(element.liquidLevel * 100)}
              min={0} max={100} unit="%" accent="#22d3ee"
              onChange={v => setLiquidLevel(v / 100)} />

            {/* Concentration */}
            <Slider label="Concentration" value={sol.concentration}
              min={0} max={10} step={0.1} unit="mol/L" accent="#a78bfa"
              onChange={v => setField({ concentration: v })} />

            {/* Volume */}
            <Slider label="Volume" value={sol.volume}
              min={0} max={1000} step={5} unit="mL" accent="#34d399"
              onChange={v => setField({ volume: v })} />

            {/* pH display */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 8, marginBottom: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(200,215,255,0.6)' }}>pH</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* pH gradient bar */}
                <div style={{
                  width: 60, height: 6, borderRadius: 3,
                  background: 'linear-gradient(to right, #ef4444, #f97316, #22c55e, #3b82f6, #a855f7)',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#fff',
                    border: `2px solid ${pH_COLOR(sol.pH)}`,
                    marginLeft: `calc(${(sol.pH / 14) * 100}% - 4px)`,
                    marginTop: -1,
                    transition: 'margin-left 0.2s',
                  }} />
                </div>
                <input
                  type="number" min={0} max={14} step={0.1}
                  value={sol.pH.toFixed(1)}
                  onChange={e => setField({ pH: Number(e.target.value) })}
                  style={{
                    width: 40, padding: '2px 4px', borderRadius: 6, fontSize: 11,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                    color: pH_COLOR(sol.pH), fontFamily: 'monospace', fontWeight: 700,
                    outline: 'none', textAlign: 'right',
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Temperature ─────────────────────────────────────── */}
        {!isBunsen && (
          <>
            <SectionHead icon={<Thermometer size={11} />} label="Température" />
            <Slider
              label={isThermometer ? "Lecture" : "Température"}
              value={sol.temperature} min={-20} max={400} unit="°C"
              accent={sol.temperature >= 100 ? '#ef4444' : sol.temperature >= 60 ? '#f97316' : '#60a5fa'}
              onChange={v => setField({ temperature: v, isBoiling: v >= 100, isHeated: v > 25 })}
            />
            {sol.temperature >= 100 && (
              <div style={{
                padding: '5px 10px', borderRadius: 7, marginBottom: 8,
                background: '#ef444418', border: '1px solid #ef444444',
                fontSize: 10, color: '#ef4444', textAlign: 'center',
              }}>
                🌡 Ébullition en cours ({sol.temperature}°C)
              </div>
            )}
          </>
        )}

        {/* ── États / animations ──────────────────────────────── */}
        <SectionHead icon={<Activity size={11} />} label="État & animation" />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <Toggle
            label="Animé" active={element.animated} accent="#fbbf24"
            icon={<Flame size={11} />}
            onClick={() => setAnimated(!element.animated)}
          />
          <Toggle
            label="Évaporation" active={sol.isEvaporating} accent="#94a3b8"
            icon={<Wind size={11} />}
            onClick={() => { setField({ isEvaporating: !sol.isEvaporating }); setAnimated(true) }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Toggle
            label="Ébullition" active={sol.isBoiling} accent="#ef4444"
            icon={<Activity size={11} />}
            onClick={() => {
              const next = !sol.isBoiling
              setField({ isBoiling: next, isHeated: next })
              if (next) setAnimated(true)
            }}
          />
          <Toggle
            label="Chauffé" active={sol.isHeated} accent="#f97316"
            icon={<Flame size={11} />}
            onClick={() => setField({ isHeated: !sol.isHeated })}
          />
        </div>

        {/* ── Bec Bunsen specifics ─────────────────────────────── */}
        {isBunsen && (
          <>
            <SectionHead icon={<Flame size={11} />} label="Flamme" />
            <Toggle
              label="Flamme active" active={element.animated} accent="#fb923c"
              icon={<Flame size={11} />}
              onClick={() => setAnimated(!element.animated)}
            />
            <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
              Approche le bec Bunsen d'un récipient pour le chauffer automatiquement.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LabPropertyPanel
