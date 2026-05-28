import { createCardFromCode } from '@cards'
import { describe, expect, it } from 'vitest'
import { applyMove, createInitialFreeCellState, dealFreeCellCards, getMaxMovableCards, isGameWon, moveCardToFoundationIfPossible, validateMove } from './index'
import type { FreeCellState } from './types'

function createState(overrides: Partial<FreeCellState>): FreeCellState {
  return {
    cascades: [[], [], [], [], [], [], [], []],
    cells: [null, null, null, null],
    foundations: {
      clubs: [],
      diamonds: [],
      hearts: [],
      spades: [],
    },
    ...overrides,
  }
}

describe('FreeCell dealing', () => {
  it('deals 52 face-up cards into four 7-card cascades and four 6-card cascades', () => {
    const deck = createInitialFreeCellState(() => 0)

    expect(deck.cascades.map((cascade) => cascade.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6])
    expect(deck.cascades.flat()).toHaveLength(52)
    expect(deck.cascades.flat().every((card) => card.faceUp)).toBe(true)
  })

  it('deals an ordered deck into the expected cascade sizes', () => {
    const dealt = dealFreeCellCards(Array.from({ length: 52 }, (_, index) => createCardFromCode(`${['A','2','3','4','5','6','7','8','9','T','J','Q','K'][index % 13]}${['C','D','H','S'][Math.floor(index / 13)]}`)))

    expect(dealt.map((cascade) => cascade.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6])
  })
})

describe('FreeCell rules', () => {
  it('allows a card to move to an empty free cell', () => {
    const state = createState({
      cascades: [[createCardFromCode('7H')], [], [], [], [], [], [], []],
    })

    expect(
      validateMove(
        state,
        { kind: 'cascade', index: 0, startIndex: 0 },
        { kind: 'cell', index: 0 },
      ).ok,
    ).toBe(true)
  })

  it('rejects moving multiple cards into a free cell', () => {
    const state = createState({
      cascades: [[createCardFromCode('8C'), createCardFromCode('7H')], [], [], [], [], [], [], []],
    })

    expect(
      validateMove(
        state,
        { kind: 'cascade', index: 0, startIndex: 0 },
        { kind: 'cell', index: 0 },
      ).ok,
    ).toBe(false)
  })

  it('allows alternating descending cascade moves', () => {
    const state = createState({
      cascades: [[createCardFromCode('7H')], [createCardFromCode('8C')], [], [], [], [], [], []],
    })

    expect(
      validateMove(
        state,
        { kind: 'cascade', index: 0, startIndex: 0 },
        { kind: 'cascade', index: 1 },
      ).ok,
    ).toBe(true)
  })

  it('rejects invalid cascade color matches', () => {
    const state = createState({
      cascades: [[createCardFromCode('7D')], [createCardFromCode('8H')], [], [], [], [], [], []],
    })

    expect(
      validateMove(
        state,
        { kind: 'cascade', index: 0, startIndex: 0 },
        { kind: 'cascade', index: 1 },
      ).ok,
    ).toBe(false)
  })

  it('limits supermoves by empty cells and cascades', () => {
    const state = createState({
      cascades: [
        [createCardFromCode('9C'), createCardFromCode('8H'), createCardFromCode('7S'), createCardFromCode('6D'), createCardFromCode('5C')],
        [],
        [createCardFromCode('KC')],
        [createCardFromCode('QD')],
        [createCardFromCode('JS')],
        [createCardFromCode('TH')],
        [createCardFromCode('9D')],
        [createCardFromCode('8S')],
      ],
      cells: [createCardFromCode('2C'), null, null, null],
    })

    expect(getMaxMovableCards(state, { kind: 'cascade', index: 1 })).toBe(4)
    expect(
      validateMove(
        state,
        { kind: 'cascade', index: 0, startIndex: 0 },
        { kind: 'cascade', index: 1 },
      ).ok,
    ).toBe(false)
  })

  it('moves aces and successors to foundations by suit', () => {
    const state = createState({
      cascades: [[createCardFromCode('AC')], [], [], [], [], [], [], []],
    })
    const movedToAceFoundation = moveCardToFoundationIfPossible(state, { kind: 'cascade', index: 0, startIndex: 0 })

    expect(movedToAceFoundation?.foundations.clubs.map((card) => card.id)).toEqual(['AC'])

    const nextState = createState({
      cascades: [[createCardFromCode('2C')], [], [], [], [], [], [], []],
      foundations: {
        clubs: [createCardFromCode('AC')],
        diamonds: [],
        hearts: [],
        spades: [],
      },
    })

    expect(moveCardToFoundationIfPossible(nextState, { kind: 'cascade', index: 0, startIndex: 0 })?.foundations.clubs.map((card) => card.id)).toEqual([
      'AC',
      '2C',
    ])
  })

  it('applies a legal move immutably', () => {
    const state = createState({
      cascades: [[createCardFromCode('7H')], [createCardFromCode('8C')], [], [], [], [], [], []],
    })

    const nextState = applyMove(
      state,
      { kind: 'cascade', index: 0, startIndex: 0 },
      { kind: 'cascade', index: 1 },
    )

    expect(nextState?.cascades[0]).toEqual([])
    expect(nextState?.cascades[1].map((card) => card.id)).toEqual(['8C', '7H'])
    expect(state.cascades[0].map((card) => card.id)).toEqual(['7H'])
  })

  it('detects a finished game', () => {
    const state = createState({
      foundations: {
        clubs: Array.from({ length: 13 }, (_, index) => createCardFromCode(`${['A','2','3','4','5','6','7','8','9','T','J','Q','K'][index]}C`)),
        diamonds: Array.from({ length: 13 }, (_, index) => createCardFromCode(`${['A','2','3','4','5','6','7','8','9','T','J','Q','K'][index]}D`)),
        hearts: Array.from({ length: 13 }, (_, index) => createCardFromCode(`${['A','2','3','4','5','6','7','8','9','T','J','Q','K'][index]}H`)),
        spades: Array.from({ length: 13 }, (_, index) => createCardFromCode(`${['A','2','3','4','5','6','7','8','9','T','J','Q','K'][index]}S`)),
      },
    })

    expect(isGameWon(state)).toBe(true)
  })
})