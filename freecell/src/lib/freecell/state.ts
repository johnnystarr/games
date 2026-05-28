import { createStandardDeck, shuffleCards, type CardSuit, type PlayingCardModel } from '@cards'
import type { FreeCellState } from './types'

export const foundationOrder: CardSuit[] = ['clubs', 'diamonds', 'hearts', 'spades']

export function createEmptyFoundations(): Record<CardSuit, PlayingCardModel[]> {
  return {
    clubs: [],
    diamonds: [],
    hearts: [],
    spades: [],
  }
}

export function dealFreeCellCards(cards: readonly PlayingCardModel[]): PlayingCardModel[][] {
  return Array.from({ length: 8 }, (_, cascadeIndex) => {
    const cardsInCascade = cascadeIndex < 4 ? 7 : 6
    const startIndex = cascadeIndex < 4 ? cascadeIndex * 7 : 28 + (cascadeIndex - 4) * 6
    return cards.slice(startIndex, startIndex + cardsInCascade).map((card) => ({ ...card, faceUp: true }))
  })
}

export function createInitialFreeCellState(random = Math.random): FreeCellState {
  const deck = shuffleCards(createStandardDeck({ faceUp: true }), random)

  return {
    cascades: dealFreeCellCards(deck),
    cells: [null, null, null, null],
    foundations: createEmptyFoundations(),
  }
}

export function cloneFreeCellState(state: FreeCellState): FreeCellState {
  return {
    cascades: state.cascades.map((cascade) => cascade.map((card) => ({ ...card }))),
    cells: state.cells.map((card) => (card === null ? null : { ...card })),
    foundations: foundationOrder.reduce<Record<CardSuit, PlayingCardModel[]>>((next, suit) => {
      next[suit] = state.foundations[suit].map((card) => ({ ...card }))
      return next
    }, createEmptyFoundations()),
  }
}