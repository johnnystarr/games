import { cardRanks, cardSuits, type CardColor, type CardRank, type CardSuit, type PlayingCardModel } from './types'

const suitSymbols: Record<CardSuit, string> = {
  clubs: 'C',
  diamonds: 'D',
  hearts: 'H',
  spades: 'S',
}

const symbolToSuit: Record<string, CardSuit> = {
  C: 'clubs',
  D: 'diamonds',
  H: 'hearts',
  S: 'spades',
}

export function getCardColor(suit: CardSuit): CardColor {
  return suit === 'diamonds' || suit === 'hearts' ? 'red' : 'black'
}

export function getSuitSymbol(suit: CardSuit): string {
  return suitSymbols[suit]
}

export function getCardCode(rank: CardRank, suit: CardSuit): string {
  return `${rank}${getSuitSymbol(suit)}`
}

export function getCardLabel(card: Pick<PlayingCardModel, 'rank' | 'suit'>): string {
  return getCardCode(card.rank, card.suit)
}

export function createCardFromCode(code: string, options: { faceUp?: boolean } = {}): PlayingCardModel {
  const normalizedCode = code.trim().toUpperCase()
  const rank = normalizedCode.slice(0, -1) as CardRank
  const suitSymbol = normalizedCode.slice(-1)
  const suit = symbolToSuit[suitSymbol]

  if (!cardRanks.includes(rank) || suit === undefined) {
    throw new Error(`Invalid card code: ${code}`)
  }

  return {
    id: normalizedCode,
    rank,
    suit,
    faceUp: options.faceUp ?? true,
  }
}

export function getCardRankValue(rank: CardRank): number {
  return cardRanks.indexOf(rank) + 1
}

export function createStandardDeck(options: { faceUp?: boolean } = {}): PlayingCardModel[] {
  const { faceUp = false } = options

  return cardSuits.flatMap((suit) =>
    cardRanks.map((rank) => ({
      id: getCardCode(rank, suit),
      rank,
      suit,
      faceUp,
    })),
  )
}

export function shuffleCards<TCard>(cards: readonly TCard[], random = Math.random): TCard[] {
  const shuffled = [...cards]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]]
  }

  return shuffled
}

export function flipCard(card: PlayingCardModel, faceUp = !card.faceUp): PlayingCardModel {
  return {
    ...card,
    faceUp,
  }
}