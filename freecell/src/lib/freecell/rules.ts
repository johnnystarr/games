import { getCardColor, getCardRankValue, type CardSuit, type PlayingCardModel } from '@cards'
import { cloneFreeCellState } from './state'
import type { FreeCellSource, FreeCellState, FreeCellTarget, MoveValidationResult } from './types'

function getCascade(state: FreeCellState, index: number) {
  return state.cascades[index]
}

function getCell(state: FreeCellState, index: number) {
  return state.cells[index]
}

function getFoundation(state: FreeCellState, suit: CardSuit) {
  return state.foundations[suit]
}

export function getTopCard(cards: readonly PlayingCardModel[]): PlayingCardModel | null {
  return cards.at(-1) ?? null
}

export function isAlternatingDescendingSequence(cards: readonly PlayingCardModel[]): boolean {
  return cards.every((card, index) => {
    if (index === cards.length - 1) {
      return true
    }

    const nextCard = cards[index + 1]

    return (
      getCardColor(card.suit) !== getCardColor(nextCard.suit) &&
      getCardRankValue(card.rank) === getCardRankValue(nextCard.rank) + 1
    )
  })
}

export function getMovableCards(state: FreeCellState, source: FreeCellSource): PlayingCardModel[] {
  if (source.kind === 'cell') {
    const card = getCell(state, source.index)
    return card === null ? [] : [card]
  }

  const cascade = getCascade(state, source.index)
  const cards = cascade.slice(source.startIndex)

  if (cards.length === 0 || !isAlternatingDescendingSequence(cards)) {
    return []
  }

  return cards
}

export function countEmptyCells(state: FreeCellState): number {
  return state.cells.filter((card) => card === null).length
}

export function countEmptyCascades(state: FreeCellState, excludingIndex?: number): number {
  return state.cascades.filter((cascade, cascadeIndex) => cascade.length === 0 && cascadeIndex !== excludingIndex).length
}

export function getMaxMovableCards(state: FreeCellState, target: FreeCellTarget): number {
  if (target.kind !== 'cascade') {
    return 1
  }

  const emptyCells = countEmptyCells(state)
  const emptyCascades = countEmptyCascades(state, state.cascades[target.index].length === 0 ? target.index : undefined)

  return (emptyCells + 1) * 2 ** emptyCascades
}

function canMoveToFoundation(card: PlayingCardModel, foundation: readonly PlayingCardModel[]): boolean {
  const topCard = getTopCard(foundation)

  if (topCard === null) {
    return card.rank === 'A'
  }

  return card.suit === topCard.suit && getCardRankValue(card.rank) === getCardRankValue(topCard.rank) + 1
}

function canMoveToCascade(cards: readonly PlayingCardModel[], cascade: readonly PlayingCardModel[]): boolean {
  const movingCard = cards[0]
  const destinationTopCard = getTopCard(cascade)

  if (destinationTopCard === null) {
    return true
  }

  return (
    getCardColor(movingCard.suit) !== getCardColor(destinationTopCard.suit) &&
    getCardRankValue(movingCard.rank) === getCardRankValue(destinationTopCard.rank) - 1
  )
}

export function validateMove(state: FreeCellState, source: FreeCellSource, target: FreeCellTarget): MoveValidationResult {
  if (source.kind === 'cascade' && target.kind === 'cascade' && source.index === target.index) {
    return {
      ok: false,
      cards: [],
      reason: 'Source and destination are the same cascade.',
    }
  }

  if (source.kind === 'cell' && target.kind === 'cell' && source.index === target.index) {
    return {
      ok: false,
      cards: [],
      reason: 'Source and destination are the same cell.',
    }
  }

  const cards = getMovableCards(state, source)

  if (cards.length === 0) {
    return {
      ok: false,
      cards: [],
      reason: 'No movable cards were selected.',
    }
  }

  if (cards.length > getMaxMovableCards(state, target)) {
    return {
      ok: false,
      cards,
      reason: 'That sequence is too long to move with the open cells and cascades available.',
    }
  }

  if (target.kind === 'cell') {
    if (cards.length !== 1) {
      return {
        ok: false,
        cards,
        reason: 'Only a single card can move into a free cell.',
      }
    }

    if (getCell(state, target.index) !== null) {
      return {
        ok: false,
        cards,
        reason: 'That free cell is occupied.',
      }
    }

    return { ok: true, cards }
  }

  if (target.kind === 'foundation') {
    if (cards.length !== 1) {
      return {
        ok: false,
        cards,
        reason: 'Only a single card can move to a foundation.',
      }
    }

    if (!canMoveToFoundation(cards[0], getFoundation(state, target.suit))) {
      return {
        ok: false,
        cards,
        reason: 'That card cannot move to its foundation yet.',
      }
    }

    return { ok: true, cards }
  }

  if (!canMoveToCascade(cards, getCascade(state, target.index))) {
    return {
      ok: false,
      cards,
      reason: 'That sequence does not fit on the destination cascade.',
    }
  }

  return { ok: true, cards }
}

function removeCardsFromSource(state: FreeCellState, source: FreeCellSource, cardCount: number) {
  if (source.kind === 'cell') {
    state.cells[source.index] = null
    return
  }

  state.cascades[source.index] = state.cascades[source.index].slice(0, state.cascades[source.index].length - cardCount)
}

function addCardsToTarget(state: FreeCellState, target: FreeCellTarget, cards: readonly PlayingCardModel[]) {
  if (target.kind === 'cell') {
    state.cells[target.index] = cards[0]
    return
  }

  if (target.kind === 'foundation') {
    state.foundations[target.suit] = [...state.foundations[target.suit], cards[0]]
    return
  }

  state.cascades[target.index] = [...state.cascades[target.index], ...cards]
}

export function applyMove(state: FreeCellState, source: FreeCellSource, target: FreeCellTarget): FreeCellState | null {
  const validation = validateMove(state, source, target)

  if (!validation.ok) {
    return null
  }

  const nextState = cloneFreeCellState(state)
  removeCardsFromSource(nextState, source, validation.cards.length)
  addCardsToTarget(nextState, target, validation.cards)
  return nextState
}

export function moveCardToFoundationIfPossible(state: FreeCellState, source: FreeCellSource): FreeCellState | null {
  const cards = getMovableCards(state, source)

  if (cards.length !== 1) {
    return null
  }

  return applyMove(state, source, {
    kind: 'foundation',
    suit: cards[0].suit,
  })
}

export function isGameWon(state: FreeCellState): boolean {
  return Object.values(state.foundations).every((foundation) => foundation.length === 13)
}