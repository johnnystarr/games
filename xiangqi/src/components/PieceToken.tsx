import type { CSSProperties } from 'react'
import { pieceBaseAssets, pieceGlyphAssets, pieceNames } from '../lib/xiangqi/assets'
import type { PieceKind, Side } from '../lib/xiangqi/types'

interface PieceTokenProps {
  side: Side
  kind: PieceKind
  style: CSSProperties
  opacity?: number
  scale?: number
  className?: string
}

export function PieceToken({
  side,
  kind,
  style,
  opacity = 1,
  scale = 1,
  className = '',
}: PieceTokenProps) {
  const rotation = side === 'black' ? ' rotate(180deg)' : ''

  const tokenStyle = {
    ...style,
    opacity,
    transform: `translate(-50%, -50%) scale(${scale})${rotation}`,
  } as CSSProperties

  return (
    <div
      className={[
        'absolute z-10 aspect-square w-[8.8896848138%] will-change-transform will-change-opacity',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={tokenStyle}
      role="img"
      aria-label={`${side === 'red' ? 'Red' : 'Black'} ${pieceNames[kind]}`}
    >
      <img className="absolute inset-0 h-full w-full" src={pieceBaseAssets[side]} alt="" />
      <img
        className="absolute left-1/2 top-1/2 w-[54.8%] -translate-x-1/2 -translate-y-1/2"
        src={pieceGlyphAssets[side][kind]}
        alt=""
      />
    </div>
  )
}