import type { CardSuit, PlayingCardModel } from '@cards'

export interface FreeCellState {
  cascades: PlayingCardModel[][]
  cells: Array<PlayingCardModel | null>
  foundations: Record<CardSuit, PlayingCardModel[]>
}

export interface CascadeSource {
  kind: 'cascade'
  index: number
  startIndex: number
}

export interface CellSource {
  kind: 'cell'
  index: number
}

export type FreeCellSource = CascadeSource | CellSource

export interface CascadeTarget {
  kind: 'cascade'
  index: number
}

export interface CellTarget {
  kind: 'cell'
  index: number
}

export interface FoundationTarget {
  kind: 'foundation'
  suit: CardSuit
}

export type FreeCellTarget = CascadeTarget | CellTarget | FoundationTarget

export interface MoveValidationResult {
  ok: boolean
  cards: PlayingCardModel[]
  reason?: string
}