import React, { memo, useCallback, useRef } from 'react'
import type { CompassInstrument, CircleElement } from '../../types/canvas'
import { useCanvasStore } from '../../store/canvasStore'
import { generateId } from '../../utils/canvasUtils'

interface Props {
  instrument: CompassInstrument
}

const Compass = memo(({ instrument }: Props) => {
  const updateInstrument = useCanvasStore((s) => s.updateInstrument)
  const removeInstrument = useCanvasStore((s) => s.removeInstrument)
  const addElement = useCanvasStore((s) => s.addElement)
  const activeColor = useCanvasStore((s) => s.activeColor)

  const dragPivotRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const dragRadiusRef = useRef<{ startX: number; startY: number; origRadius: number } | null>(null)

  // ── drag pivot ────────────────────────────────────────────────
  const onPivotDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dragPivotRef.current = { sx: e.clientX, sy: e.clientY, ox: instrument.cx, oy: instrument.cy }
    const onMove = (me: MouseEvent) => {
      if (!dragPivotRef.current) return
      updateInstrument(instrument.id, {
        cx: dragPivotRef.current.ox + me.clientX - dragPivotRef.current.sx,
        cy: dragPivotRef.current.oy + me.clientY - dragPivotRef.current.sy,
      })
    }
    const onUp = () => { dragPivotRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [instrument, updateInstrument])

  // ── drag radius (pencil tip) ──────────────────────────────────
  const onTipDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dragRadiusRef.current = { startX: e.clientX, startY: e.clientY, origRadius: instrument.radius }
    const onMove = (me: MouseEvent) => {
      if (!dragRadiusRef.current) return
      const dx = me.clientX - instrument.cx
      const dy = me.clientY - instrument.cy
      const r = Math.sqrt(dx * dx + dy * dy)
      updateInstrument(instrument.id, {
        radius: Math.max(20, r),
        arcEnd: Math.atan2(dy, dx) * 180 / Math.PI,
      })
    }
    const onUp = () => { dragRadiusRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [instrument, updateInstrument])

  // ── draw arc onto canvas ──────────────────────────────────────
  const drawArc = useCallback(() => {
    const el: CircleElement = {
      id: generateId('circle'),
      type: 'circle',
      x: instrument.cx,
      y: instrument.cy,
      rx: instrument.radius,
      ry: instrument.radius,
      fill: 'transparent',
      strokeColor: activeColor,
      strokeWidth: 2,
      rotation: 0,
      selected: false,
      locked: false,
      createdBy: 'user',
    }
    addElement(el)
  }, [instrument, activeColor, addElement])

  const r = instrument.radius
  const armAngle = (instrument.arcEnd ?? -45) * Math.PI / 180

  // Pencil arm tip position (relative to pivot)
  const tipX = Math.cos(armAngle) * r
  const tipY = Math.sin(armAngle) * r

  // Center arm length
  const armLen = r + 18

  // Draw arc preview (partial circle based on arcStart/arcEnd)
  const arcStart = instrument.arcStart ?? 0
  const arcEnd = instrument.arcEnd ?? 360

  let arcPath = ''
  if (Math.abs(arcEnd - arcStart) >= 359) {
    arcPath = `M ${r} 0 A ${r} ${r} 0 1 1 ${r - 0.001} 0.001`
  } else {
    const a1 = arcStart * Math.PI / 180
    const a2 = arcEnd * Math.PI / 180
    const x1 = Math.cos(a1) * r
    const y1 = Math.sin(a1) * r
    const x2 = Math.cos(a2) * r
    const y2 = Math.sin(a2) * r
    const large = Math.abs(arcEnd - arcStart) > 180 ? 1 : 0
    arcPath = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <g transform={`translate(${instrument.cx}, ${instrument.cy})`}>
      {/* Radius preview arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(59,130,246,0.4)"
        strokeWidth={1.5}
        strokeDasharray="6 3"
        style={{ pointerEvents: 'none' }}
      />

      {/* Fixed pivot arm (vertical) */}
      <line
        x1={0} y1={0}
        x2={0} y2={-armLen * 0.35}
        stroke="#6b7280"
        strokeWidth={3}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />

      {/* Pencil arm */}
      <line
        x1={0} y1={0}
        x2={tipX} y2={tipY}
        stroke="#4b5563"
        strokeWidth={3}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />

      {/* Joint/hinge */}
      <circle
        cx={0} cy={0}
        r={10}
        fill="#374151"
        stroke="#9ca3af"
        strokeWidth={2}
        onMouseDown={onPivotDown}
        style={{ cursor: 'move' }}
      />
      <circle cx={0} cy={0} r={3} fill="#3b82f6" style={{ pointerEvents: 'none' }} />

      {/* Pencil tip handle */}
      <circle
        cx={tipX} cy={tipY}
        r={8}
        fill="#fbbf24"
        stroke="#92400e"
        strokeWidth={2}
        onMouseDown={onTipDown}
        style={{ cursor: 'crosshair' }}
      />
      {/* Pencil tip triangle */}
      <path
        d={`M ${tipX} ${tipY} l -3 -6 l 6 0 Z`}
        fill="#92400e"
        style={{ pointerEvents: 'none' }}
      />

      {/* Radius label */}
      <text
        x={tipX / 2}
        y={tipY / 2 - 10}
        textAnchor="middle"
        fontSize={11}
        fill="#4b5563"
        fontFamily="monospace"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        r = {Math.round(r)}
      </text>

      {/* Draw arc button */}
      <g
        transform={`translate(${tipX + 14}, ${tipY - 14})`}
        onClick={drawArc}
        style={{ cursor: 'pointer' }}
      >
        <rect x={0} y={0} width={58} height={20} rx={6}
          fill="#3b82f6" stroke="white" strokeWidth={1} opacity={0.9} />
        <text x={29} y={14} textAnchor="middle" fontSize={10} fill="white"
          fontWeight="600" style={{ userSelect: 'none' }}>
          Draw Arc
        </text>
      </g>

      {/* Close */}
      <g
        transform={`translate(-22, -22)`}
        onClick={() => removeInstrument(instrument.id)}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={8} cy={8} r={8} fill="#ef4444" fillOpacity={0.85} stroke="white" strokeWidth={1} />
        <text x={8} y={12} textAnchor="middle" fontSize={10} fill="white" style={{ userSelect: 'none' }}>×</text>
      </g>
    </g>
  )
})

Compass.displayName = 'Compass'
export default Compass
