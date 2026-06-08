import React, { memo, useCallback, useRef } from 'react'
import type { ProtractorInstrument } from '../../types/canvas'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  instrument: ProtractorInstrument
  cursorAngle?: number // current angle from canvas cursor, for highlighting
}

const Protractor = memo(({ instrument, cursorAngle }: Props) => {
  const updateInstrument = useCanvasStore((s) => s.updateInstrument)
  const removeInstrument = useCanvasStore((s) => s.removeInstrument)

  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const rotRef = useRef<{ startAngle: number; origBase: number } | null>(null)

  const R = 90 * instrument.scale // outer radius in canvas units
  const rInner = R * 0.88

  // ── drag center ─────────────────────────────────────────────
  const onBodyDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: instrument.cx, oy: instrument.cy }
    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      updateInstrument(instrument.id, {
        cx: dragRef.current.ox + me.clientX - dragRef.current.sx,
        cy: dragRef.current.oy + me.clientY - dragRef.current.sy,
      })
    }
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [instrument, updateInstrument])

  // ── rotate base ──────────────────────────────────────────────
  const onRotateDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const a0 = Math.atan2(e.clientY - instrument.cy, e.clientX - instrument.cx) * 180 / Math.PI
    rotRef.current = { startAngle: a0, origBase: instrument.baseAngle }
    const onMove = (me: MouseEvent) => {
      if (!rotRef.current) return
      const a = Math.atan2(me.clientY - instrument.cy, me.clientX - instrument.cx) * 180 / Math.PI
      updateInstrument(instrument.id, { baseAngle: rotRef.current.origBase + (a - rotRef.current.startAngle) })
    }
    const onUp = () => { rotRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [instrument, updateInstrument])

  // Build semicircle arc path
  const toRad = (d: number) => (d * Math.PI) / 180

  // Generate degree marks for 0–180
  const marks: React.ReactNode[] = []
  for (let deg = 0; deg <= 180; deg += 1) {
    const isMajor = deg % 10 === 0
    const isMid = deg % 5 === 0 && !isMajor
    const rOuter = R
    const rMarkInner = isMajor ? R * 0.82 : isMid ? R * 0.87 : R * 0.91
    // Protractor sits on flat bottom. degrees go L→R along flat edge.
    // Map so 0° is at left, 180° at right, arc up.
    const svgAngle = Math.PI - toRad(deg) // flip: 0 at left end, 180 at right
    const cx2 = Math.cos(svgAngle)
    const cy2 = -Math.sin(svgAngle) // negative because SVG y is flipped

    marks.push(
      <line
        key={`m${deg}`}
        x1={cx2 * rMarkInner}
        y1={cy2 * rMarkInner}
        x2={cx2 * rOuter}
        y2={cy2 * rOuter}
        stroke="rgba(30,58,120,0.7)"
        strokeWidth={isMajor ? 1.2 : isMid ? 0.8 : 0.5}
      />
    )

    if (isMajor) {
      marks.push(
        <text
          key={`l${deg}`}
          x={cx2 * (R * 0.74)}
          y={cy2 * (R * 0.74)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={R * 0.085}
          fill="rgba(15,40,100,0.85)"
          fontFamily="sans-serif"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {deg}
        </text>
      )
    }
  }

  // Highlighted angle arc
  let highlightArc: React.ReactNode = null
  if (cursorAngle !== undefined) {
    const angleClamped = Math.max(0, Math.min(180, cursorAngle))
    const svgA = Math.PI - toRad(angleClamped)
    const hx = Math.cos(svgA) * (R * 0.6)
    const hy = -Math.sin(svgA) * (R * 0.6)
    highlightArc = (
      <line
        x1={-R * 0.6} y1={0}
        x2={hx} y2={hy}
        stroke="#ef4444"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.8}
        style={{ pointerEvents: 'none' }}
      />
    )
  }

  return (
    <g transform={`translate(${instrument.cx}, ${instrument.cy}) rotate(${instrument.baseAngle})`}>
      {/* Flat base bar */}
      <rect
        x={-R} y={0}
        width={R * 2} height={10}
        fill="rgba(147,197,253,0.25)"
        stroke="rgba(59,130,246,0.5)"
        strokeWidth={1}
        onMouseDown={onBodyDown}
        style={{ cursor: 'move' }}
      />

      {/* Semicircle body */}
      <path
        d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0 Z`}
        fill="rgba(147,197,253,0.18)"
        stroke="rgba(59,130,246,0.6)"
        strokeWidth={1.5}
        onMouseDown={onBodyDown}
        style={{ cursor: 'move' }}
      />

      {/* Inner arc cutout visual */}
      <path
        d={`M ${-rInner} 0 A ${rInner} ${rInner} 0 0 1 ${rInner} 0`}
        fill="none"
        stroke="rgba(59,130,246,0.25)"
        strokeWidth={1}
        style={{ pointerEvents: 'none' }}
      />

      {/* Ticks & labels */}
      <g style={{ pointerEvents: 'none' }}>
        {marks}
      </g>

      {/* Highlight */}
      {highlightArc}

      {/* Center crosshair */}
      <circle cx={0} cy={0} r={3} fill="rgba(59,130,246,0.8)" style={{ pointerEvents: 'none' }} />
      <line x1={-8} y1={0} x2={8} y2={0} stroke="rgba(59,130,246,0.6)" strokeWidth={1} style={{ pointerEvents: 'none' }} />
      <line x1={0} y1={-8} x2={0} y2={8} stroke="rgba(59,130,246,0.6)" strokeWidth={1} style={{ pointerEvents: 'none' }} />

      {/* Rotate handle */}
      <circle
        cx={R + 14}
        cy={5}
        r={8}
        fill="#3b82f6"
        fillOpacity={0.85}
        stroke="white"
        strokeWidth={1.5}
        onMouseDown={onRotateDown}
        style={{ cursor: 'ew-resize' }}
      />
      <text
        x={R + 14}
        y={9}
        textAnchor="middle"
        fontSize={9}
        fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        ↻
      </text>

      {/* Close */}
      <g
        transform={`translate(${-R - 24}, -4)`}
        onClick={() => removeInstrument(instrument.id)}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={8} cy={8} r={8} fill="#ef4444" fillOpacity={0.85} stroke="white" strokeWidth={1} />
        <text x={8} y={12} textAnchor="middle" fontSize={10} fill="white" style={{ userSelect: 'none' }}>×</text>
      </g>
    </g>
  )
})

Protractor.displayName = 'Protractor'
export default Protractor
