import React, { memo } from 'react'
import type { LabElement } from '../../../types/canvas'

interface Props {
  element: LabElement
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}

// ── Reusable animations ───────────────────────────────────────

const Bubbles: React.FC<{ cx: number; bottom: number; color: string; count?: number }> = ({ cx, bottom, color, count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const delay = (i * 0.55).toFixed(2)
      const ox = (i - Math.floor(count / 2)) * 7
      return (
        <circle key={i} cx={cx + ox} cy={bottom - 5} r={2 + i * 0.5} fill="none" stroke={color} strokeWidth={0.8}>
          <animate attributeName="cy" from={bottom - 5} to={bottom - 30} dur="1.5s" begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.9;0" keyTimes="0;0.4;1" dur="1.5s" begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="r" from={2 + i * 0.5} to={4} dur="1.5s" begin={`${delay}s`} repeatCount="indefinite" />
        </circle>
      )
    })}
  </>
)

const Drip: React.FC<{ cx: number; y: number; color: string }> = ({ cx, y, color }) => (
  <ellipse cx={cx} cy={y} rx={3} ry={4} fill={color} opacity={0.9}>
    <animate attributeName="cy" from={y} to={y + 30} dur="2.2s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.8;1" dur="2.2s" repeatCount="indefinite" />
  </ellipse>
)

const Flame: React.FC<{ cx: number; y: number; scale?: number }> = ({ cx, y, scale = 1 }) => {
  const h = 20 * scale, w = 10 * scale
  return (
    <g>
      <ellipse cx={cx} cy={y - h * 0.55} rx={w * 0.8} ry={h * 0.7} fill="#fb923c" opacity={0.88}>
        <animate attributeName="ry" values={`${h * 0.7};${h * 0.85};${h * 0.6};${h * 0.78};${h * 0.7}`} dur="0.35s" repeatCount="indefinite" />
        <animate attributeName="cy" values={`${y - h * 0.55};${y - h * 0.65};${y - h * 0.5};${y - h * 0.58};${y - h * 0.55}`} dur="0.35s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx={cx} cy={y - h * 0.45} rx={w * 0.5} ry={h * 0.55} fill="#3b82f6" opacity={0.5}>
        <animate attributeName="ry" values={`${h * 0.55};${h * 0.65};${h * 0.48};${h * 0.6};${h * 0.55}`} dur="0.28s" repeatCount="indefinite" />
      </ellipse>
    </g>
  )
}

const Steam: React.FC<{ cx: number; top: number }> = ({ cx, top }) => (
  <>
    {[-10, 0, 10].map((ox, i) => (
      <path key={i} d={`M${cx + ox},${top} Q${cx + ox + 5},${top - 10} ${cx + ox},${top - 20} Q${cx + ox - 5},${top - 30} ${cx + ox},${top - 40}`}
        fill="none" stroke="rgba(200,220,255,0.4)" strokeWidth={2} strokeLinecap="round">
        <animate attributeName="opacity" values="0;0.5;0" dur={`${1.4 + i * 0.3}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
        <animate attributeName="transform" type="translate"
          values={`0,0;${ox > 0 ? 4 : -4},-20;0,-40`}
          dur={`${1.4 + i * 0.3}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
      </path>
    ))}
  </>
)

// ── Instrument renderers ──────────────────────────────────────

function renderBurette(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated, solution } = el
  const tw = Math.max(10, W * 0.32), tx = (W - tw) / 2
  const tubeH = H * 0.76, liquidH = tubeH * liquidLevel
  const scY = tubeH, scH = H * 0.055
  const tipBottom = H - 2
  const clipId = `bu-${el.id}`
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={tx} y={0} width={tw} height={tubeH} /></clipPath></defs>
      {liquidLevel > 0 && <rect x={tx + 1} y={1} width={tw - 2} height={liquidH - 1} fill={liquidColor} opacity={0.6} clipPath={`url(#${clipId})`} />}
      <rect x={tx} y={0} width={tw} height={tubeH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {[.1,.2,.3,.4,.5,.6,.7,.8,.9].map(f => (
        <line key={f} x1={tx + tw} y1={tubeH * f} x2={tx + tw + (Math.round(f * 10) % 2 === 0 ? 8 : 5)} y2={tubeH * f} stroke={strokeColor} strokeWidth={0.7} />
      ))}
      <rect x={tx - W * .12} y={scY} width={tw + W * .24} height={scH} fill={strokeColor} rx={2} />
      <line x1={W / 2} y1={scY + scH} x2={W / 2} y2={tipBottom} stroke={strokeColor} strokeWidth={strokeWidth} />
      <ellipse cx={W / 2} cy={tipBottom} rx={2} ry={1.5} fill={strokeColor} />
      {animated && liquidLevel > 0 && <Drip cx={W / 2} y={tipBottom + 2} color={liquidColor} />}
      {solution.isBoiling && <Steam cx={W / 2} top={2} />}
    </g>
  )
}

function renderErlenmeyer(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated, solution } = el
  const nW = W * 0.28, nX = (W - nW) / 2, neckH = H * 0.28
  const path = `M${nX},0 L${nX},${neckH} L${W * .04},${H * .92} L0,${H} L${W},${H} L${W * .96},${H * .92} L${nX + nW},${neckH} L${nX + nW},0 Z`
  const clipId = `er-${el.id}`
  return (
    <g>
      <defs><clipPath id={clipId}><path d={path} /></clipPath></defs>
      {liquidLevel > 0 && (
        <rect x={0} y={H * (1 - liquidLevel)} width={W} height={H * liquidLevel}
          fill={liquidColor} opacity={0.55} clipPath={`url(#${clipId})`} />
      )}
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {animated && liquidLevel > 0.05 && (
        <g clipPath={`url(#${clipId})`}>
          <Bubbles cx={W / 2} bottom={H - 4} color="rgba(255,255,255,0.7)" />
        </g>
      )}
      {solution.isBoiling && <Steam cx={W / 2} top={2} />}
      {solution.isHeated && !solution.isBoiling && (
        <g clipPath={`url(#${clipId})`}>
          <Bubbles cx={W / 2} bottom={H - 4} color="rgba(255,200,100,0.5)" count={2} />
        </g>
      )}
    </g>
  )
}

function renderBeaker(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated, solution } = el
  const botW = W * 0.88, botX = (W - botW) / 2
  const path = `M0,0 L${botX},${H} L${botX + botW},${H} L${W},0`
  const clipId = `bk-${el.id}`
  return (
    <g>
      <defs><clipPath id={clipId}><polygon points={`1,1 ${botX + 1},${H - 1} ${botX + botW - 1},${H - 1} ${W - 1},1`} /></clipPath></defs>
      {liquidLevel > 0 && (
        <rect x={0} y={H * (1 - liquidLevel)} width={W} height={H * liquidLevel + 1}
          fill={liquidColor} opacity={0.55} clipPath={`url(#${clipId})`} />
      )}
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <line x1={0} y1={0} x2={W} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} />
      <path d={`M${W * .75},0 Q${W + 6},${-H * .04} ${W * .85},-${H * .07}`} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {[.3,.5,.7].map(f => (
        <line key={f} x1={W * .88} y1={H * f} x2={W} y2={H * f} stroke={strokeColor} strokeWidth={0.7} />
      ))}
      {(animated || solution.isBoiling) && liquidLevel > 0.05 && (
        <g clipPath={`url(#${clipId})`}>
          <Bubbles cx={W / 2} bottom={H - 4} color="rgba(255,255,255,0.7)" count={solution.isBoiling ? 6 : 3} />
        </g>
      )}
      {solution.isBoiling && <Steam cx={W / 2} top={0} />}
    </g>
  )
}

function renderTestTube(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated, solution } = el
  const r = W / 2, bodyH = H - r
  const path = `M0,0 L0,${bodyH} Q0,${H} ${r},${H} Q${W},${H} ${W},${bodyH} L${W},0`
  const clipId = `tt-${el.id}`
  return (
    <g>
      <defs><clipPath id={clipId}><path d={path + ' Z'} /></clipPath></defs>
      {liquidLevel > 0 && (
        <rect x={1} y={bodyH * (1 - liquidLevel)} width={W - 2} height={H - bodyH * (1 - liquidLevel)}
          fill={liquidColor} opacity={0.6} clipPath={`url(#${clipId})`} />
      )}
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <line x1={0} y1={0} x2={W} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} />
      {(animated || solution.isBoiling) && liquidLevel > 0.1 && (
        <g clipPath={`url(#${clipId})`}>
          <Bubbles cx={W / 2} bottom={H - 8} color="rgba(255,255,255,0.7)" count={2} />
        </g>
      )}
      {solution.isBoiling && <Steam cx={W / 2} top={0} />}
    </g>
  )
}

function renderBunsenBurner(el: LabElement): React.ReactNode {
  const { width: W, height: H, strokeColor, strokeWidth, animated } = el
  const baseH = H * 0.18, barrelW = W * 0.28, barrelX = (W - barrelW) / 2, barrelH = H * 0.65
  return (
    <g transform={`translate(0,${baseH})`}>
      <rect x={barrelX} y={-barrelH} width={barrelW} height={barrelH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <rect x={barrelX - 1} y={-barrelH + barrelH * 0.35} width={barrelW + 2} height={8} fill="white" stroke={strokeColor} strokeWidth={0.7} />
      <rect x={barrelX + barrelW} y={-barrelH * .4} width={W * .25} height={5} fill={strokeColor} rx={2} />
      <rect x={0} y={0} width={W} height={baseH} fill={strokeColor} rx={3} />
      {animated ? <Flame cx={W / 2} y={-barrelH} /> : (
        <path d={`M${W/2-5},${-barrelH} Q${W/2},${-barrelH-14} ${W/2},${-barrelH-18} Q${W/2},${-barrelH-14} ${W/2+5},${-barrelH}`}
          fill="none" stroke="#fb923c" strokeWidth={2} opacity={0.5} />
      )}
    </g>
  )
}

function renderCondenser(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth } = el
  const innerW = W * 0.4, innerX = (W - innerW) / 2, portSize = W * 0.25
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="none" rx={W / 2} stroke={strokeColor} strokeWidth={strokeWidth} />
      <rect x={1} y={H * .1} width={W - 2} height={H * .8} fill="#bfdbfe" opacity={0.25} rx={W / 2 - 1} />
      <rect x={innerX} y={0} width={innerW} height={H} fill="none" stroke={strokeColor} strokeWidth={strokeWidth * .8} />
      {liquidLevel > 0 && (
        <rect x={innerX + 1} y={(1 - liquidLevel) * H} width={innerW - 2} height={liquidLevel * H - 1}
          fill={liquidColor} opacity={0.55} />
      )}
      {[0, 1].map((_side, i) => (
        <g key={i}>
          <line x1={-portSize} y1={H * (i === 0 ? .25 : .75)} x2={0} y2={H * (i === 0 ? .25 : .75)} stroke={strokeColor} strokeWidth={strokeWidth} />
          <ellipse cx={-portSize} cy={H * (i === 0 ? .25 : .75)} rx={3} ry={2} fill="none" stroke={strokeColor} strokeWidth={strokeWidth * .7} />
        </g>
      ))}
    </g>
  )
}

function renderRetortStand(el: LabElement): React.ReactNode {
  const { width: W, height: H, strokeColor, strokeWidth } = el
  const poleX = W * .22, poleW = W * .07
  const ringY = H * .35, ringR = W * .2
  const bH = H * .1
  return (
    <g>
      <rect x={0} y={H - bH} width={W} height={bH} fill={strokeColor} opacity={0.85} rx={3} />
      <rect x={poleX} y={0} width={poleW} height={H - bH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth * 1.2} />
      <rect x={poleX - W * .05} y={H * .2} width={poleW + W * .1} height={H * .04} fill={strokeColor} rx={2} opacity={0.8} />
      <line x1={poleX + poleW} y1={ringY} x2={poleX + poleW + W * .12} y2={ringY} stroke={strokeColor} strokeWidth={strokeWidth} />
      <circle cx={poleX + poleW + W * .12 + ringR} cy={ringY} r={ringR} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <line x1={poleX + poleW + W * .12} y1={ringY} x2={poleX + poleW + W * .12 + ringR * 2} y2={ringY}
        stroke={strokeColor} strokeWidth={strokeWidth * .6} strokeDasharray="3 2" />
    </g>
  )
}

function renderRoundFlask(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated, solution } = el
  const cr = W * .42, cx = W / 2, cy = H * .58
  const neckW = W * .22, neckX = (W - neckW) / 2
  const neckH = H * .35 + cr - Math.sqrt(Math.max(0, cr * cr - (neckW / 2) ** 2))
  const clipId = `rf-${el.id}`
  return (
    <g>
      <defs><clipPath id={clipId}><circle cx={cx} cy={cy} r={cr} /></clipPath></defs>
      {liquidLevel > 0 && (
        <rect x={cx - cr} y={cy + cr - cr * 2 * liquidLevel} width={cr * 2} height={cr * 2 * liquidLevel}
          fill={liquidColor} opacity={0.55} clipPath={`url(#${clipId})`} />
      )}
      <circle cx={cx} cy={cy} r={cr} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <rect x={neckX} y={0} width={neckW} height={neckH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <line x1={neckX} y1={0} x2={neckX + neckW} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} />
      {(animated || solution.isBoiling) && liquidLevel > 0.05 && (
        <g clipPath={`url(#${clipId})`}>
          <Bubbles cx={cx} bottom={cy + cr - 4} color="rgba(255,255,255,0.7)" count={solution.isBoiling ? 5 : 2} />
        </g>
      )}
      {solution.isBoiling && <Steam cx={cx} top={0} />}
    </g>
  )
}

function renderThermometer(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, solution } = el
  const r = W * .38, tubeW = W * .35, tubeX = (W - tubeW) / 2, bulbY = H - r * 2, tubeH = bulbY
  const liquidH = tubeH * liquidLevel
  const displayTemp = solution.temperature
  return (
    <g>
      <rect x={tubeX} y={0} width={tubeW} height={tubeH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} rx={tubeW / 2} />
      {liquidLevel > 0 && (
        <rect x={tubeX + 2} y={tubeH - liquidH} width={tubeW - 4} height={liquidH} fill={liquidColor} rx={1} />
      )}
      <circle cx={W / 2} cy={H - r} r={r} fill={liquidColor} opacity={0.8} stroke={strokeColor} strokeWidth={strokeWidth} />
      {[.2,.4,.6,.8].map(f => (
        <line key={f} x1={tubeX + tubeW} y1={tubeH * f} x2={tubeX + tubeW + (f === .4 || f === .8 ? 7 : 4)} y2={tubeH * f} stroke={strokeColor} strokeWidth={0.7} />
      ))}
      {/* Temperature readout */}
      <text x={tubeX + tubeW + 10} y={H * .5} fontSize={9} fill={strokeColor} fontFamily="monospace">
        {displayTemp}°C
      </text>
    </g>
  )
}

function renderWatchGlass(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth } = el
  return (
    <g>
      {liquidLevel > 0 && (
        <ellipse cx={W / 2} cy={H * .15} rx={W / 2 * liquidLevel * .9} ry={H * .7 * liquidLevel * .6}
          fill={liquidColor} opacity={0.55} />
      )}
      <path d={`M0,${H * .3} Q${W / 2},${-H * .25} ${W},${H * .3}`} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <line x1={0} y1={H * .3} x2={W} y2={H * .3} stroke={strokeColor} strokeWidth={strokeWidth} />
    </g>
  )
}

function renderPetriDish(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth } = el
  const rx = W / 2, ry = H * .35
  return (
    <g>
      <ellipse cx={W / 2} cy={H * .28} rx={rx} ry={ry} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} opacity={0.5} />
      <ellipse cx={W / 2} cy={H * .65} rx={rx * .9} ry={ry * .85} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {liquidLevel > 0 && (
        <ellipse cx={W / 2} cy={H * .65} rx={rx * .88 * liquidLevel} ry={ry * .8 * liquidLevel}
          fill={liquidColor} opacity={0.5} />
      )}
      <path d={`M${W * .05},${H * .65} L${W * .05},${H} L${W * .95},${H} L${W * .95},${H * .65}`} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <ellipse cx={W / 2} cy={H} rx={rx * .9} ry={ry * .3} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
    </g>
  )
}

function renderGraduatedCylinder(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, solution } = el
  const tw = W * 0.65, tx = (W - tw) / 2
  const baseH = H * .07, baseW = W
  const clipId = `gc-${el.id}`
  const liqH = (H - baseH) * liquidLevel
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={tx} y={0} width={tw} height={H - baseH} /></clipPath></defs>
      {liquidLevel > 0 && (
        <rect x={tx + 1} y={(H - baseH) - liqH} width={tw - 2} height={liqH}
          fill={liquidColor} opacity={0.55} clipPath={`url(#${clipId})`} />
      )}
      <rect x={tx} y={0} width={tw} height={H - baseH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Spout lip */}
      <path d={`M${tx - 4},-2 Q${tx + tw / 2},${-H * .04} ${tx + tw + 4},-2`} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Base */}
      <rect x={0} y={H - baseH} width={baseW} height={baseH} fill={strokeColor} opacity={0.7} rx={2} />
      {/* Graduations */}
      {[.1,.2,.3,.4,.5,.6,.7,.8,.9].map(f => (
        <line key={f} x1={tx + tw} y1={(H - baseH) * f} x2={tx + tw + (Math.round(f * 10) % 5 === 0 ? 8 : 5)} y2={(H - baseH) * f}
          stroke={strokeColor} strokeWidth={0.7} />
      ))}
      {solution.isBoiling && <Steam cx={W / 2} top={0} />}
    </g>
  )
}

function renderFunnel(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth } = el
  const stemW = W * .12, stemX = (W - stemW) / 2, funnelH = H * .7, stemH = H * .3
  const clipId = `fn-${el.id}`
  const path = `M0,0 L${stemX},${funnelH} L${stemX},${funnelH + stemH} L${stemX + stemW},${funnelH + stemH} L${stemX + stemW},${funnelH} L${W},0 Z`
  return (
    <g>
      <defs><clipPath id={clipId}><path d={path} /></clipPath></defs>
      {liquidLevel > 0 && (
        <rect x={0} y={H * (1 - liquidLevel)} width={W} height={H * liquidLevel}
          fill={liquidColor} opacity={0.5} clipPath={`url(#${clipId})`} />
      )}
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <line x1={0} y1={0} x2={W} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} />
    </g>
  )
}

function renderDropper(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated } = el
  const bulbW = W * .7, bulbH = H * .3
  const tubeW = W * .22, tubeX = (W - tubeW) / 2, tubeH = H * .62
  const tipY = H * .92
  const clipId = `dr-${el.id}`
  return (
    <g>
      <defs><clipPath id={clipId}><rect x={tubeX} y={bulbH} width={tubeW} height={tubeH} /></clipPath></defs>
      {/* Rubber bulb */}
      <ellipse cx={W / 2} cy={bulbH / 2} rx={bulbW / 2} ry={bulbH / 2} fill={strokeColor} opacity={0.25} stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Glass tube */}
      <rect x={tubeX} y={bulbH} width={tubeW} height={tubeH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Liquid */}
      {liquidLevel > 0 && (
        <rect x={tubeX + 1} y={bulbH + tubeH * (1 - liquidLevel)} width={tubeW - 2} height={tubeH * liquidLevel}
          fill={liquidColor} opacity={0.6} clipPath={`url(#${clipId})`} />
      )}
      {/* Tapered tip */}
      <path d={`M${tubeX},${bulbH + tubeH} L${W / 2 - 2},${tipY} L${W / 2 + 2},${tipY} L${tubeX + tubeW},${bulbH + tubeH}`}
        fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {animated && liquidLevel > 0 && <Drip cx={W / 2} y={tipY + 2} color={liquidColor} />}
    </g>
  )
}

function renderPipette(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth } = el
  const bulbW = W * .55, bulbH = H * .2
  const tubeW = W * .18, tubeX = (W - tubeW) / 2
  const markY = H * .55
  const clipId = `pp-${el.id}`
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={tubeX} y={bulbH} width={tubeW} height={H - bulbH} />
        </clipPath>
      </defs>
      {/* Top tube */}
      <rect x={tubeX} y={0} width={tubeW} height={bulbH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Bulge */}
      <ellipse cx={W / 2} cy={bulbH + bulbH / 2} rx={bulbW / 2} ry={bulbH * .6} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Lower tube */}
      <rect x={tubeX} y={bulbH + bulbH} width={tubeW} height={H - bulbH * 2} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Liquid */}
      {liquidLevel > 0 && (
        <rect x={tubeX + 1} y={bulbH + (H - bulbH) * (1 - liquidLevel)} width={tubeW - 2} height={(H - bulbH) * liquidLevel}
          fill={liquidColor} opacity={0.6} clipPath={`url(#${clipId})`} />
      )}
      {/* Volume mark */}
      <line x1={tubeX - 4} y1={markY} x2={tubeX + tubeW + 4} y2={markY} stroke={strokeColor} strokeWidth={1.2} />
      <text x={tubeX + tubeW + 6} y={markY + 4} fontSize={8} fill={strokeColor} fontFamily="monospace">25</text>
    </g>
  )
}

function renderTripod(el: LabElement): React.ReactNode {
  const { width: W, height: H, strokeColor, strokeWidth } = el
  const cx = W / 2, ringR = W * .38, ringY = H * .22
  return (
    <g>
      {/* Ring */}
      <circle cx={cx} cy={ringY} r={ringR} fill="none" stroke={strokeColor} strokeWidth={strokeWidth * 1.2} />
      {/* Wire gauze */}
      <circle cx={cx} cy={ringY} r={ringR * .9} fill="none" stroke={strokeColor} strokeWidth={0.5} strokeDasharray="3 3" />
      <line x1={cx - ringR * .85} y1={ringY} x2={cx + ringR * .85} y2={ringY} stroke={strokeColor} strokeWidth={0.5} />
      <line x1={cx} y1={ringY - ringR * .85} x2={cx} y2={ringY + ringR * .85} stroke={strokeColor} strokeWidth={0.5} />
      {/* Three legs */}
      {[0, 1, 2].map(i => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 6
        const lx = cx + Math.cos(angle) * ringR * .85
        const ly = ringY + Math.sin(angle) * ringR * .3
        const bx = cx + Math.cos(angle) * W * .45
        const by = H
        return <line key={i} x1={lx} y1={ly} x2={bx} y2={by} stroke={strokeColor} strokeWidth={strokeWidth * 1.1} />
      })}
    </g>
  )
}

function renderSeparatoryFunnel(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated } = el
  const fH = H * .65, stemH = H * .2, stopH = H * .08
  const stemW = W * .12, stemX = (W - stemW) / 2
  const path = `M${W * .1},0 L0,${fH} L${stemX},${fH} L${stemX},${fH + stopH + stemH} L${stemX + stemW},${fH + stopH + stemH} L${stemX + stemW},${fH} L${W},${fH} L${W * .9},0 Z`
  const clipId = `sf-${el.id}`
  const liqY = H * (1 - liquidLevel) * (fH / H)
  return (
    <g>
      <defs><clipPath id={clipId}><path d={path} /></clipPath></defs>
      {/* Two-layer liquid (lighter on top = immiscible layers) */}
      {liquidLevel > 0 && (
        <>
          <rect x={0} y={liqY} width={W} height={fH - liqY} fill={liquidColor} opacity={0.5} clipPath={`url(#${clipId})`} />
          <rect x={0} y={liqY + (fH - liqY) * .55} width={W} height={(fH - liqY) * .45}
            fill={liquidColor.slice(0, 7) + '99'} opacity={0.55} clipPath={`url(#${clipId})`} />
        </>
      )}
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
      {/* Top opening */}
      <line x1={W * .1} y1={0} x2={W * .9} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Stopcock */}
      <rect x={stemX - W * .12} y={fH} width={stemW + W * .24} height={stopH} fill={strokeColor} rx={2} />
      {animated && liquidLevel > 0 && <Drip cx={W / 2} y={fH + stopH + stemH + 2} color={liquidColor} />}
    </g>
  )
}

function renderMagneticStirrer(el: LabElement): React.ReactNode {
  const { width: W, height: H, strokeColor, strokeWidth, animated } = el
  const platH = H * .12
  return (
    <g>
      {/* Display/control panel */}
      <rect x={0} y={H * .3} width={W} height={H * .7} fill={strokeColor} opacity={0.15} rx={4} stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Heating plate */}
      <rect x={W * .05} y={H * .3 - platH} width={W * .9} height={platH} fill={strokeColor} opacity={0.6} rx={3} />
      {/* Control knobs */}
      {[.28, .58].map((x, i) => (
        <circle key={i} cx={W * x} cy={H * .72} r={W * .09} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      ))}
      {/* Display */}
      <rect x={W * .55} y={H * .4} width={W * .38} height={H * .2} fill="rgba(0,200,100,0.1)" stroke={strokeColor} strokeWidth={0.7} rx={2} />
      {/* Stir bar indicator */}
      {animated && (
        <ellipse cx={W / 2} cy={H * .28} rx={W * .15} ry={4} fill={strokeColor} opacity={0.7}>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${W / 2} ${H * .28}`} to={`360 ${W / 2} ${H * .28}`}
            dur="1s" repeatCount="indefinite" />
        </ellipse>
      )}
    </g>
  )
}

function renderPhMeter(el: LabElement): React.ReactNode {
  const { width: W, height: H, strokeColor, strokeWidth, solution } = el
  const meterH = H * .55, probeH = H * .45
  const probeX = W * .3
  const pH = solution.pH
  const pHColor = pH < 3 ? '#ef4444' : pH < 6 ? '#f97316' : pH < 8 ? '#22c55e' : pH < 11 ? '#3b82f6' : '#a855f7'
  return (
    <g>
      {/* Meter body */}
      <rect x={0} y={0} width={W} height={meterH} fill={strokeColor} opacity={0.12} rx={6} stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Screen */}
      <rect x={W * .1} y={H * .06} width={W * .8} height={H * .28} fill="#0f172a" rx={4} />
      {/* pH readout */}
      <text x={W / 2} y={H * .24} textAnchor="middle" fontSize={H * .14} fill={pHColor}
        fontFamily="monospace" fontWeight="bold">
        pH {pH.toFixed(1)}
      </text>
      {/* Power button */}
      <circle cx={W * .78} cy={meterH * .78} r={W * .07} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Probe cable */}
      <path d={`M${probeX + W * .05},${meterH} Q${probeX - W * .15},${H * .65} ${probeX},${H}`}
        fill="none" stroke={strokeColor} strokeWidth={strokeWidth * .8} />
      {/* Probe */}
      <rect x={probeX - W * .05} y={meterH} width={W * .1} height={probeH * .7} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <ellipse cx={probeX} cy={meterH + probeH * .7} rx={W * .05} ry={W * .07}
        fill={pHColor} opacity={0.6} stroke={strokeColor} strokeWidth={strokeWidth * .7} />
    </g>
  )
}

function renderEvaporatingDish(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated, solution } = el
  const rx = W / 2, ry = H * .45
  const clipId = `ev-${el.id}`
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={W / 2} cy={H * .6} rx={rx * .9} ry={ry * .85} />
        </clipPath>
      </defs>
      {/* Dish body */}
      <path d={`M0,${H * .25} Q${W / 2},${H * 1.1} ${W},${H * .25}`} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <line x1={0} y1={H * .25} x2={W} y2={H * .25} stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Liquid */}
      {liquidLevel > 0 && (
        <ellipse cx={W / 2} cy={H * .55} rx={rx * .85 * liquidLevel} ry={ry * .6 * liquidLevel}
          fill={liquidColor} opacity={0.55} clipPath={`url(#${clipId})`} />
      )}
      {(animated || solution.isEvaporating || solution.isBoiling) && (
        <Steam cx={W / 2} top={H * .2} />
      )}
    </g>
  )
}

function renderDistillationFlask(el: LabElement): React.ReactNode {
  const { width: W, height: H, liquidColor, liquidLevel, strokeColor, strokeWidth, animated, solution } = el
  const cr = W * .38, cx = W / 2, cy = H * .6
  const neckW = W * .2, neckX = (W - neckW) / 2
  const neckH = H * .35
  const armAngle = -35 * Math.PI / 180
  const armL = W * .7
  const clipId = `df-${el.id}`
  return (
    <g>
      <defs><clipPath id={clipId}><circle cx={cx} cy={cy} r={cr} /></clipPath></defs>
      {liquidLevel > 0 && (
        <rect x={cx - cr} y={cy + cr - cr * 2 * liquidLevel} width={cr * 2} height={cr * 2 * liquidLevel}
          fill={liquidColor} opacity={0.5} clipPath={`url(#${clipId})`} />
      )}
      <circle cx={cx} cy={cy} r={cr} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Neck */}
      <rect x={neckX} y={0} width={neckW} height={neckH} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      <line x1={neckX} y1={0} x2={neckX + neckW} y2={0} stroke={strokeColor} strokeWidth={strokeWidth} />
      {/* Side arm */}
      <line x1={cx + cr * .6} y1={cy - cr * .65}
            x2={cx + cr * .6 + armL * Math.cos(armAngle)} y2={cy - cr * .65 + armL * Math.sin(armAngle)}
        stroke={strokeColor} strokeWidth={strokeWidth} />
      {(animated || solution.isBoiling) && liquidLevel > 0.05 && (
        <g clipPath={`url(#${clipId})`}>
          <Bubbles cx={cx} bottom={cy + cr - 4} color="rgba(255,255,255,0.7)" count={4} />
        </g>
      )}
      {solution.isBoiling && <Steam cx={cx} top={0} />}
    </g>
  )
}

// ── Main component ────────────────────────────────────────────

const LabElementComp: React.FC<Props> = memo(({ element: el, isSelected, onClick }) => {
  const { x, y, width: W, height: H, strokeColor, label } = el
  let body: React.ReactNode = null

  switch (el.component) {
    case 'burette':           body = renderBurette(el); break
    case 'erlenmeyer':        body = renderErlenmeyer(el); break
    case 'beaker':            body = renderBeaker(el); break
    case 'test-tube':         body = renderTestTube(el); break
    case 'bunsen-burner':     body = renderBunsenBurner(el); break
    case 'condenser':         body = renderCondenser(el); break
    case 'retort-stand':      body = renderRetortStand(el); break
    case 'round-flask':       body = renderRoundFlask(el); break
    case 'thermometer':       body = renderThermometer(el); break
    case 'watch-glass':       body = renderWatchGlass(el); break
    case 'petri-dish':        body = renderPetriDish(el); break
    case 'graduated-cylinder': body = renderGraduatedCylinder(el); break
    case 'funnel':            body = renderFunnel(el); break
    case 'dropper':           body = renderDropper(el); break
    case 'pipette':           body = renderPipette(el); break
    case 'tripod':            body = renderTripod(el); break
    case 'separatory-funnel': body = renderSeparatoryFunnel(el); break
    case 'magnetic-stirrer':  body = renderMagneticStirrer(el); break
    case 'ph-meter':          body = renderPhMeter(el); break
    case 'evaporating-dish':  body = renderEvaporatingDish(el); break
    case 'distillation-flask':body = renderDistillationFlask(el); break
  }

  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'default' }}>
      <rect x={0} y={0} width={W} height={H} fill="transparent" stroke="none" />
      {body}
      {label && (
        <text x={W / 2} y={H + 14} textAnchor="middle" dominantBaseline="central"
          fontSize={10} fill={strokeColor} fontFamily="sans-serif" style={{ pointerEvents: 'none' }}>
          {label}
        </text>
      )}
      {isSelected && (
        <rect x={-5} y={-5} width={W + 10} height={H + 10}
          fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 3"
          rx={4} style={{ pointerEvents: 'none' }} opacity={0.7} />
      )}
    </g>
  )
})

LabElementComp.displayName = 'LabElementComp'
export default LabElementComp
