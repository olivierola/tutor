import React, { memo } from 'react'
import type { InclinedPlaneElement } from '../../../types/canvas'

interface Props {
  element: InclinedPlaneElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const InclinedPlaneElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, angle, fill, strokeColor, strokeWidth, showAngleLabel } = element

  const rad = (angle * Math.PI) / 180
  const height = width * Math.tan(rad)

  // Triangle: (0, height), (width, height), (0, 0) where (0,0) is top-left of the incline
  // Base at bottom, slope goes from bottom-right to top-left
  const pts = `${x},${y + height} ${x + width},${y + height} ${x},${y}`

  // Angle arc at bottom-left corner
  const arcR = Math.min(40, width * 0.2)
  const arcPath = `M ${x + arcR} ${y + height} A ${arcR} ${arcR} 0 0 0 ${x + arcR * Math.cos(Math.PI - rad)} ${y + height + arcR * Math.sin(Math.PI - rad)}`

  return (
    <g onClick={onClick}>
      {/* Hit area */}
      <polygon points={pts} fill="transparent" stroke="transparent" strokeWidth={12} />

      {/* Plane */}
      <polygon points={pts} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />

      {/* Right angle marker at bottom-right */}
      <path
        d={`M ${x + width - 12} ${y + height} L ${x + width - 12} ${y + height - 12} L ${x + width} ${y + height - 12}`}
        fill="none" stroke={strokeColor} strokeWidth={strokeWidth * 0.7}
        style={{ pointerEvents: 'none' }}
      />

      {/* Angle label */}
      {showAngleLabel && (
        <>
          <path d={arcPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth * 0.8}
            style={{ pointerEvents: 'none' }} />
          <text
            x={x + arcR * 1.8}
            y={y + height - 8}
            fontSize={Math.max(12, strokeWidth * 4)}
            fill={strokeColor}
            fontFamily="serif"
            fontStyle="italic"
            style={{ pointerEvents: 'none' }}
          >
            {angle}°
          </text>
        </>
      )}

      {/* Selection */}
      {isSelected && (
        <polygon points={pts} fill="none" stroke="#3b82f6" strokeWidth={strokeWidth + 3}
          strokeDasharray="6 3" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  )
})

InclinedPlaneElementComp.displayName = 'InclinedPlaneElementComp'
export default InclinedPlaneElementComp
