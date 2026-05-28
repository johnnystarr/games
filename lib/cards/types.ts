export const cardSuits = ['clubs', 'diamonds', 'hearts', 'spades'] as const

export const cardRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'] as const

export type CardSuit = (typeof cardSuits)[number]
export type CardRank = (typeof cardRanks)[number]
export type CardColor = 'black' | 'red'

export interface PlayingCardModel {
  id: string
  rank: CardRank
  suit: CardSuit
  faceUp: boolean
}

export interface DragPoint {
  x: number
  y: number
}

export interface DragSize {
  width: number
  height: number
}

export interface PointerDragState<TItem> {
  item: TItem
  pointer: DragPoint
  origin: DragPoint
  offset: DragPoint
  size: DragSize
}