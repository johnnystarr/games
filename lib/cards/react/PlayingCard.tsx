import type { CSSProperties, PointerEventHandler } from 'react'
import { getCardAssetPath, getCardBackAssetPath } from '../assets'
import type { PlayingCardModel } from '../types'

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export interface PlayingCardProps {
  card: PlayingCardModel
  className?: string
  style?: CSSProperties
  onPointerDown?: PointerEventHandler<HTMLDivElement>
  onDoubleClick?: () => void
  ghosted?: boolean
  interactive?: boolean
  faceUp?: boolean
}

export function PlayingCard({
  card,
  className,
  style,
  onPointerDown,
  onDoubleClick,
  ghosted = false,
  interactive = false,
  faceUp = card.faceUp,
}: PlayingCardProps) {
  return (
    <div
      className={joinClassNames(
        'relative aspect-[179/250] w-full select-none overflow-hidden rounded-[0.55rem] bg-white shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.95)]',
        ghosted && 'opacity-0',
        interactive && 'cursor-grab active:cursor-grabbing',
        className,
      )}
      style={style}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <img
        src={faceUp ? getCardAssetPath(card) : getCardBackAssetPath()}
        alt={faceUp ? `${card.rank} of ${card.suit}` : 'Card back'}
        className="block h-full w-full object-contain"
        draggable={false}
      />
      {faceUp ? null : <div className="pointer-events-none absolute inset-0 border border-white/10" />}
    </div>
  )
}