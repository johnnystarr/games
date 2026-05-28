import { describe, expect, it } from 'vitest'
import {
  applyResolvedMove,
  createInitialGameState,
  parseNotation,
  previewNotation,
  replacePieces,
  resolveNotationMove,
} from './index'

describe('parseNotation', () => {
  it('normalizes both operator and alias syntax', () => {
    const operatorMove = parseNotation('C4+1')
    const aliasMove = parseNotation('c4f1')

    expect(operatorMove.ok && operatorMove.value.normalized).toBe('C4+1')
    expect(aliasMove.ok && aliasMove.value.normalized).toBe('C4+1')
  })

  it('rejects malformed notation', () => {
    const result = parseNotation('cannon to center')

    expect(result.ok).toBe(false)
  })
})

describe('resolveNotationMove', () => {
  it('resolves a standard red central cannon opening', () => {
    const state = createInitialGameState()
    const result = resolveNotationMove(state, 'C2=5')

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.move.from).toEqual({ row: 7, col: 7 })
      expect(result.value.move.to).toEqual({ row: 7, col: 4 })
    }
  })

  it('resolves a black move from black perspective after red plays first', () => {
    const initialState = createInitialGameState()
    const redMove = resolveNotationMove(initialState, 'C2=5')

    expect(redMove.ok).toBe(true)

    if (!redMove.ok) {
      return
    }

    const nextState = applyResolvedMove(
      initialState,
      redMove.value.move,
      redMove.value.notation,
    )
    const blackMove = resolveNotationMove(nextState, 'H8+7')

    expect(blackMove.ok).toBe(true)

    if (blackMove.ok) {
      expect(blackMove.value.move.from).toEqual({ row: 0, col: 7 })
      expect(blackMove.value.move.to).toEqual({ row: 2, col: 6 })
    }
  })

  it('rejects illegal pawn retreats', () => {
    const state = createInitialGameState()
    const result = resolveNotationMove(state, 'P5-1')

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.code).toBe('illegal')
    }
  })

  it('rejects blocked horse moves', () => {
    const state = createInitialGameState()
    const blockedState = replacePieces(
      state,
      state.pieces.map((piece) =>
        piece.id === 'red-P-5' ? { ...piece, row: 8, col: 7 } : piece,
      ),
    )

    const result = resolveNotationMove(blockedState, 'H2+3')

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.code).toBe('illegal')
    }
  })

  it('rejects an ambiguous notation match', () => {
    const state = createInitialGameState()
    const ambiguousState = replacePieces(
      state,
      state.pieces.map((piece) => {
        if (piece.id === 'red-P-1') {
          return { ...piece, row: 4, col: 4 }
        }

        if (piece.id === 'red-P-3') {
          return { ...piece, row: 6, col: 4 }
        }

        return piece
      }),
    )

    const result = resolveNotationMove(ambiguousState, 'P5+1')

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.code).toBe('ambiguous')
    }
  })
})

describe('previewNotation', () => {
  it('highlights the source piece from a partial move prefix', () => {
    const state = createInitialGameState()
    const preview = previewNotation(state, 'C2')

    expect(preview).toEqual({
      sourcePieceIds: ['red-C-2'],
    })
  })

  it('previews an empty destination for a legal move before submit', () => {
    const state = createInitialGameState()
    const preview = previewNotation(state, 'C2=5')

    expect(preview).toEqual({
      sourcePieceIds: ['red-C-2'],
      destination: { row: 7, col: 4 },
      capturePieceId: undefined,
    })
  })

  it('previews a capture target when the typed move would capture', () => {
    const state = createInitialGameState()
    const previewState = replacePieces(
      state,
      state.pieces.map((piece) => {
        if (piece.id === 'red-R-2') {
          return { ...piece, row: 5, col: 7 }
        }

        if (piece.id === 'black-P-5') {
          return { ...piece, row: 4, col: 7 }
        }

        if (piece.id === 'red-H-2') {
          return { ...piece, captured: true }
        }

        return piece
      }),
    )
    const preview = previewNotation(previewState, 'R2+1')

    expect(preview).toEqual({
      sourcePieceIds: ['red-R-2'],
      destination: { row: 4, col: 7 },
      capturePieceId: 'black-P-5',
    })
  })
})