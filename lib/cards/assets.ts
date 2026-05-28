import { getCardCode, getCardColor, getSuitSymbol } from './deck'
import type { CardColor, CardRank, CardSuit, PlayingCardModel } from './types'

const deployedAssetRoot = '/assets/cards'

export function getCardAssetPath(card: Pick<PlayingCardModel, 'rank' | 'suit'>): string {
  return `${deployedAssetRoot}/face/${getCardCode(card.rank, card.suit)}.svg`
}

export function getCardBackAssetPath(): string {
  return `${deployedAssetRoot}/back/bicycle_blue.svg`
}

export function getRankAssetPath(rank: CardRank, color: CardColor): string {
  return `${deployedAssetRoot}/rank/${color}-${rank}.svg`
}

export function getSuitAssetPath(suit: CardSuit): string {
  return `${deployedAssetRoot}/suit/${getSuitSymbol(suit)}.svg`
}

export function getAssetColorForSuit(suit: CardSuit): CardColor {
  return getCardColor(suit)
}