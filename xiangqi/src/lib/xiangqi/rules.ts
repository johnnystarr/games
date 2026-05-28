import {
  boardCols,
  boardRows,
  buildBoardMap,
  getGeneral,
  getOpposingSide,
  listActivePieces,
  projectMove,
} from './state'
import type { GameState, Piece, ResolvedMove, Side } from './types'

interface DeltaRule {
  leg?: [number, number]
  eye?: [number, number]
  delta: [number, number]
}

const horseMoves: DeltaRule[] = [
  { leg: [-1, 0], delta: [-2, -1] },
  { leg: [-1, 0], delta: [-2, 1] },
  { leg: [0, -1], delta: [-1, -2] },
  { leg: [0, 1], delta: [-1, 2] },
  { leg: [0, -1], delta: [1, -2] },
  { leg: [0, 1], delta: [1, 2] },
  { leg: [1, 0], delta: [2, -1] },
  { leg: [1, 0], delta: [2, 1] },
]

const elephantMoves: DeltaRule[] = [
  { eye: [-1, -1], delta: [-2, -2] },
  { eye: [-1, 1], delta: [-2, 2] },
  { eye: [1, -1], delta: [2, -2] },
  { eye: [1, 1], delta: [2, 2] },
]

const advisorMoves: DeltaRule[] = [
  { delta: [-1, -1] },
  { delta: [-1, 1] },
  { delta: [1, -1] },
  { delta: [1, 1] },
]

function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < boardRows && col >= 0 && col < boardCols
}

function isInsidePalace(side: Side, row: number, col: number): boolean {
  const palaceRows = side === 'red' ? [7, 9] : [0, 2]
  return row >= palaceRows[0] && row <= palaceRows[1] && col >= 3 && col <= 5
}

function hasCrossedRiver(piece: Piece): boolean {
  return piece.side === 'red' ? piece.row <= 4 : piece.row >= 5
}

function createResolvedMove(
  piece: Piece,
  row: number,
  col: number,
  captureId?: string,
): ResolvedMove {
  return {
    pieceId: piece.id,
    pieceKind: piece.kind,
    side: piece.side,
    from: { row: piece.row, col: piece.col },
    to: { row, col },
    captureId,
  }
}

function collectRayMoves(
  piece: Piece,
  boardMap: Map<string, Piece>,
  deltas: Array<[number, number]>,
): ResolvedMove[] {
  const moves: ResolvedMove[] = []

  for (const [rowDelta, colDelta] of deltas) {
    let row = piece.row + rowDelta
    let col = piece.col + colDelta

    while (isInsideBoard(row, col)) {
      const occupant = boardMap.get(`${row}:${col}`)

      if (occupant) {
        if (occupant.side !== piece.side) {
          moves.push(createResolvedMove(piece, row, col, occupant.id))
        }

        break
      }

      moves.push(createResolvedMove(piece, row, col))
      row += rowDelta
      col += colDelta
    }
  }

  return moves
}

function collectCannonMoves(
  piece: Piece,
  boardMap: Map<string, Piece>,
): ResolvedMove[] {
  const moves: ResolvedMove[] = []
  const deltas: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  for (const [rowDelta, colDelta] of deltas) {
    let row = piece.row + rowDelta
    let col = piece.col + colDelta
    let screenSeen = false

    while (isInsideBoard(row, col)) {
      const occupant = boardMap.get(`${row}:${col}`)

      if (!screenSeen) {
        if (occupant) {
          screenSeen = true
        } else {
          moves.push(createResolvedMove(piece, row, col))
        }
      } else if (occupant) {
        if (occupant.side !== piece.side) {
          moves.push(createResolvedMove(piece, row, col, occupant.id))
        }

        break
      }

      row += rowDelta
      col += colDelta
    }
  }

  return moves
}

function collectJumpMoves(
  piece: Piece,
  boardMap: Map<string, Piece>,
  deltas: DeltaRule[],
  isTargetAllowed: (row: number, col: number) => boolean,
): ResolvedMove[] {
  const moves: ResolvedMove[] = []

  for (const { delta, eye, leg } of deltas) {
    const block = eye ?? leg

    if (block) {
      const [blockRowDelta, blockColDelta] = block
      if (boardMap.has(`${piece.row + blockRowDelta}:${piece.col + blockColDelta}`)) {
        continue
      }
    }

    const [rowDelta, colDelta] = delta
    const nextRow = piece.row + rowDelta
    const nextCol = piece.col + colDelta

    if (!isInsideBoard(nextRow, nextCol) || !isTargetAllowed(nextRow, nextCol)) {
      continue
    }

    const occupant = boardMap.get(`${nextRow}:${nextCol}`)

    if (!occupant) {
      moves.push(createResolvedMove(piece, nextRow, nextCol))
      continue
    }

    if (occupant.side !== piece.side) {
      moves.push(createResolvedMove(piece, nextRow, nextCol, occupant.id))
    }
  }

  return moves
}

function collectGeneralMoves(
  piece: Piece,
  boardMap: Map<string, Piece>,
  state: GameState,
): ResolvedMove[] {
  const moves: ResolvedMove[] = []
  const deltas: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  for (const [rowDelta, colDelta] of deltas) {
    const nextRow = piece.row + rowDelta
    const nextCol = piece.col + colDelta

    if (!isInsideBoard(nextRow, nextCol)) {
      continue
    }

    if (!isInsidePalace(piece.side, nextRow, nextCol)) {
      continue
    }

    const occupant = boardMap.get(`${nextRow}:${nextCol}`)

    if (!occupant) {
      moves.push(createResolvedMove(piece, nextRow, nextCol))
      continue
    }

    if (occupant.side !== piece.side) {
      moves.push(createResolvedMove(piece, nextRow, nextCol, occupant.id))
    }
  }

  const enemyGeneral = getGeneral(state.pieces, getOpposingSide(piece.side))

  if (enemyGeneral && enemyGeneral.col === piece.col) {
    const step = enemyGeneral.row > piece.row ? 1 : -1
    let row = piece.row + step
    let clear = true

    while (row !== enemyGeneral.row) {
      if (boardMap.has(`${row}:${piece.col}`)) {
        clear = false
        break
      }

      row += step
    }

    if (clear) {
      moves.push(
        createResolvedMove(
          piece,
          enemyGeneral.row,
          enemyGeneral.col,
          enemyGeneral.id,
        ),
      )
    }
  }

  return moves
}

function collectPawnMoves(
  piece: Piece,
  boardMap: Map<string, Piece>,
): ResolvedMove[] {
  const moves: ResolvedMove[] = []
  const forwardDelta = piece.side === 'red' ? -1 : 1
  const targets: Array<[number, number]> = [[piece.row + forwardDelta, piece.col]]

  if (hasCrossedRiver(piece)) {
    targets.push([piece.row, piece.col - 1], [piece.row, piece.col + 1])
  }

  for (const [row, col] of targets) {
    if (!isInsideBoard(row, col)) {
      continue
    }

    const occupant = boardMap.get(`${row}:${col}`)

    if (!occupant) {
      moves.push(createResolvedMove(piece, row, col))
      continue
    }

    if (occupant.side !== piece.side) {
      moves.push(createResolvedMove(piece, row, col, occupant.id))
    }
  }

  return moves
}

export function generatePseudoMovesForPiece(
  state: GameState,
  piece: Piece,
): ResolvedMove[] {
  const boardMap = buildBoardMap(state.pieces)

  switch (piece.kind) {
    case 'R':
      return collectRayMoves(piece, boardMap, [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ])
    case 'C':
      return collectCannonMoves(piece, boardMap)
    case 'H':
      return collectJumpMoves(piece, boardMap, horseMoves, () => true)
    case 'E':
      return collectJumpMoves(piece, boardMap, elephantMoves, (row) =>
        piece.side === 'red' ? row >= 5 : row <= 4,
      )
    case 'A':
      return collectJumpMoves(piece, boardMap, advisorMoves, (row, col) =>
        isInsidePalace(piece.side, row, col),
      )
    case 'G':
      return collectGeneralMoves(piece, boardMap, state)
    case 'P':
      return collectPawnMoves(piece, boardMap)
  }
}

export function isInCheck(state: GameState, side: Side): boolean {
  const general = getGeneral(state.pieces, side)

  if (!general) {
    return false
  }

  const opponent = getOpposingSide(side)

  return listActivePieces(state, opponent).some((piece) =>
    generatePseudoMovesForPiece(state, piece).some(
      (move) => move.to.row === general.row && move.to.col === general.col,
    ),
  )
}

export function generateLegalMoves(
  state: GameState,
  side: Side = state.activeSide,
): ResolvedMove[] {
  const moves: ResolvedMove[] = []

  for (const piece of listActivePieces(state, side)) {
    for (const move of generatePseudoMovesForPiece(state, piece)) {
      const projectedState = projectMove(state, move)

      if (!isInCheck(projectedState, side)) {
        moves.push(move)
      }
    }
  }

  return moves
}