import React, { memo } from 'react'
import type { ImageElement } from '../../../types/canvas'

interface Props {
  element: ImageElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

const ImageElementComp: React.FC<Props> = memo(({ element, isSelected, onClick }) => {
  const { x, y, width, height, src, caption, alt } = element
  const capH = caption ? 22 : 0

  return (
    <g transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* frame */}
      <rect x={-1} y={-1} width={width + 2} height={height + capH + 2} rx={8}
        fill="var(--surface-1)" stroke={isSelected ? '#3b82f6' : 'var(--border)'} strokeWidth={isSelected ? 2 : 1} />

      {/* the image (clipped corners) */}
      <clipPath id={`clip-${element.id}`}>
        <rect x={0} y={0} width={width} height={height} rx={7} />
      </clipPath>
      {src ? (
        <image
          href={src} x={0} y={0} width={width} height={height}
          preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${element.id})`}
          style={{ pointerEvents: 'none' }}
        >
          {alt && <title>{alt}</title>}
        </image>
      ) : (
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="var(--text-3)" fontSize={13} style={{ pointerEvents: 'none' }}>
          Image manquante
        </text>
      )}

      {/* caption */}
      {caption && (
        <foreignObject x={0} y={height} width={width} height={capH} style={{ overflow: 'hidden' }}>
          <div
            // @ts-expect-error xmlns
            xmlns="http://www.w3.org/1999/xhtml"
            style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '3px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}
          >
            {caption}
          </div>
        </foreignObject>
      )}
    </g>
  )
})

ImageElementComp.displayName = 'ImageElementComp'
export default ImageElementComp
