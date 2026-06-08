import React, { memo, useCallback, useRef } from 'react'
import type { RulerInstrument } from '../../types/canvas'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  instrument: RulerInstrument
}

// 1 cm = 37.8 px at 96dpi; for our canvas we treat 1 unit = ~2px → 1cm = 40 canvas units
const CM_PX = 40

const Ruler = memo(({ instrument }: Props) => {
  const updateInstrument = useCanvasStore((s) => s.updateInstrument)
  const removeInstrument = useCanvasStore((s) => s.removeInstrument)

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const rotateRef = useRef<{ startAngle: number; origAngle: number } | null>(null)

  const totalWidth = instrument.length * CM_PX
  const rulerH = 28

  // ── drag body ────────────────────────────────────────────────
  const onBodyMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: instrument.x,
      origY: instrument.y,
    }

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      const dx = me.clientX - dragRef.current.startX
      const dy = me.clientY - dragRef.current.startY
      updateInstrument(instrument.id, {
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [instrument, updateInstrument])

  // ── rotate handle ────────────────────────────────────────────
  const onRotateMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    rotateRef.current = {
      startAngle: Math.atan2(e.clientY - instrument.y, e.clientX - instrument.x) * 180 / Math.PI,
      origAngle: instrument.angle,
    }

    const onMove = (me: MouseEvent) => {
      if (!rotateRef.current) return
      const currentAngle = Math.atan2(me.clientY - instrument.y, me.clientX - instrument.x) * 180 / Math.PI
      const delta = currentAngle - rotateRef.current.startAngle
      updateInstrument(instrument.id, { angle: rotateRef.current.origAngle + delta })
    }
    const onUp = () => {
      rotateRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [instrument, updateInstrument])

  // Generate tick marks
  const ticks: React.ReactNode[] = []
  const totalMm = instrument.length * 10

  for (let mm = 0; mm <= totalMm; mm++) {
    const x = (mm / 10) * CM_PX
    const isCm = mm % 10 === 0
    const isMidCm = mm % 5 === 0 && !isCm
    const tickH = isCm ? rulerH * 0.65 : isMidCm ? rulerH * 0.45 : rulerH * 0.25

    ticks.push(
      <line
        key={`tick-${mm}`}
        x1={x} y1={0}
        x2={x} y2={tickH}
        stroke="#7c6b4e"
        strokeWidth={isCm ? 1.2 : 0.7}
        opacity={isCm ? 1 : 0.6}
      />
    )

    if (isCm && mm > 0) {
      ticks.push(
        <text
          key={`label-${mm}`}
          x={x}
          y={rulerH * 0.88}
          textAnchor="middle"
          fontSize={7}
          fill="#5a4a2e"
          fontFamily="sans-serif"
          fontWeight="500"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {mm / 10}
        </text>
      )
    }
  }

  return (
    <g
      transform={`translate(${instrument.x}, ${instrument.y}) rotate(${instrument.angle})`}
      className="ruler-body"
    >
      {/* Ruler body */}
      <rect
        width={totalWidth}
        height={rulerH}
        rx={3}
        fill="url(#rulerGrad)"
        stroke="#b8a07c"
        strokeWidth={1}
        onMouseDown={onBodyMouseDown}
        style={{ cursor: 'move' }}
      />
      {/* Ruler gradient definition */}
      <defs>
        <linearGradient id="rulerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5e6c8" />
          <stop offset="40%" stopColor="#e8d4a0" />
          <stop offset="100%" stopColor="#c9a96e" />
        </linearGradient>
      </defs>

      {/* Tick marks */}
      <g style={{ pointerEvents: 'none' }}>
        {ticks}
      </g>

      {/* Unit label */}
      <text
        x={totalWidth - 6}
        y={rulerH - 5}
        textAnchor="end"
        fontSize={6.5}
        fill="#7c6b4e"
        fontFamily="sans-serif"
        opacity={0.8}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        cm
      </text>

      {/* Rotate handle (right end) */}
      <circle
        cx={totalWidth + 10}
        cy={rulerH / 2}
        r={7}
        fill="#3b82f6"
        fillOpacity={0.85}
        stroke="white"
        strokeWidth={1.5}
        onMouseDown={onRotateMouseDown}
        style={{ cursor: 'ew-resize' }}
      />
      <text
        x={totalWidth + 10}
        y={rulerH / 2 + 3}
        textAnchor="middle"
        fontSize={8}
        fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        ↻
      </text>

      {/* Close button */}
      <g
        transform={`translate(-14, ${rulerH / 2 - 8})`}
        onClick={() => removeInstrument(instrument.id)}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={8} cy={8} r={8} fill="#ef4444" fillOpacity={0.85} stroke="white" strokeWidth={1} />
        <text x={8} y={12} textAnchor="middle" fontSize={10} fill="white" style={{ userSelect: 'none' }}>×</text>
      </g>
    </g>
  )
})

Ruler.displayName = 'Ruler'
export default Ruler
