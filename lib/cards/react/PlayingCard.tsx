import type { CSSProperties, PointerEventHandler } from 'react'
import { getCardAssetPath, getCardBackAssetPath } from '../assets'
import { getCardColor } from '../deck'
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
  const cardColor = getCardColor(card.suit)

  return (
    <div
      className={joinClassNames(
        'relative aspect-[179/250] w-full select-none overflow-hidden border border-black/20 bg-white',
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
      {faceUp ? (
        <span className={joinClassNames('sr-only', cardColor === 'red' && 'text-red-700')}>
          {card.rank} of {card.suit}
        </span>
      ) : null}
    </div>
  )
}