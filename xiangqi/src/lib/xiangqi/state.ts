import type {
  BoardCoord,
  GameState,
  MoveRecord,
  ParsedNotation,
  Piece,
  PieceKind,
  ResolvedMove,
  Side,
} from './types'

const initialPieceSeed: Array<Omit<Piece, 'id' | 'captured'>> = [
  { side: 'black', kind: 'R', row: 0, col: 0 },
  { side: 'black', kind: 'H', row: 0, col: 1 },
  { side: 'black', kind: 'E', row: 0, col: 2 },
  { side: 'black', kind: 'A', row: 0, col: 3 },
  { side: 'black', kind: 'G', row: 0, col: 4 },
  { side: 'black', kind: 'A', row: 0, col: 5 },
  { side: 'black', kind: 'E', row: 0, col: 6 },
  { side: 'black', kind: 'H', row: 0, col: 7 },
  { side: 'black', kind: 'R', row: 0, col: 8 },
  { side: 'black', kind: 'C', row: 2, col: 1 },
  { side: 'black', kind: 'C', row: 2, col: 7 },
  { side: 'black', kind: 'P', row: 3, col: 0 },
  { side: 'black', kind: 'P', row: 3, col: 2 },
  { side: 'black', kind: 'P', row: 3, col: 4 },
  { side: 'black', kind: 'P', row: 3, col: 6 },
  { side: 'black', kind: 'P', row: 3, col: 8 },
  { side: 'red', kind: 'R', row: 9, col: 0 },
  { side: 'red', kind: 'H', row: 9, col: 1 },
  { side: 'red', kind: 'E', row: 9, col: 2 },
  { side: 'red', kind: 'A', row: 9, col: 3 },
  { side: 'red', kind: 'G', row: 9, col: 4 },
  { side: 'red', kind: 'A', row: 9, col: 5 },
  { side: 'red', kind: 'E', row: 9, col: 6 },
  { side: 'red', kind: 'H', row: 9, col: 7 },
  { side: 'red', kind: 'R', row: 9, col: 8 },
  { side: 'red', kind: 'C', row: 7, col: 1 },
  { side: 'red', kind: 'C', row: 7, col: 7 },
  { side: 'red', kind: 'P', row: 6, col: 0 },
  { side: 'red', kind: 'P', row: 6, col: 2 },
  { side: 'red', kind: 'P', row: 6, col: 4 },
  { side: 'red', kind: 'P', row: 6, col: 6 },
  { side: 'red', kind: 'P', row: 6, col: 8 },
]

export const boardRows = 10
export const boardCols = 9

export function createInitialGameState(): GameState {
  const counts = new Map<string, number>()

  return {
    activeSide: 'red',
    history: [],
    pieces: initialPieceSeed.map((seed) => {
      const key = `${seed.side}:${seed.kind}`
      const nextIndex = (counts.get(key) ?? 0) + 1
      counts.set(key, nextIndex)

      return {
        ...seed,
        id: `${seed.side}-${seed.kind}-${nextIndex}`,
        captured: false,
      }
    }),
  }
}

export function clonePiece(piece: Piece): Piece {
  return { ...piece }
}

export function createBoardKey(coord: BoardCoord): string {
  return `${coord.row}:${coord.col}`
}

export function buildBoardMap(pieces: Piece[]): Map<string, Piece> {
  return new Map(
    pieces
      .filter((piece) => !piece.captured)
      .map((piece) => [createBoardKey(piece), piece]),
  )
}

export function getPieceAt(
  pieces: Piece[],
  row: number,
  col: number,
): Piece | undefined {
  return buildBoardMap(pieces).get(createBoardKey({ row, col }))
}

export function getOpposingSide(side: Side): Side {
  return side === 'red' ? 'black' : 'red'
}

export function relativeFileToCol(side: Side, fileNumber: number): number {
  return side === 'red' ? boardCols - fileNumber : fileNumber - 1
}

export function colToRelativeFile(side: Side, col: number): number {
  return side === 'red' ? boardCols - col : col + 1
}

export function getGeneral(pieces: Piece[], side: Side): Piece | undefined {
  return pieces.find(
    (piece) => piece.side === side && piece.kind === 'G' && !piece.captured,
  )
}

export function projectMove(state: GameState, move: ResolvedMove): GameState {
  return {
    ...state,
    pieces: state.pieces.map((piece) => {
      if (piece.id === move.captureId) {
        return { ...piece, captured: true }
      }

      if (piece.id === move.pieceId) {
        return { ...piece, row: move.to.row, col: move.to.col }
      }

      return piece
    }),
  }
}

export function applyResolvedMove(
  state: GameState,
  move: ResolvedMove,
  notation: ParsedNotation,
): GameState {
  const nextState = projectMove(state, move)

  const record: MoveRecord = {
    ...move,
    rawNotation: notation.raw,
    normalizedNotation: notation.normalized,
    ply: state.history.length + 1,
  }

  return {
    activeSide: getOpposingSide(state.activeSide),
    pieces: nextState.pieces,
    history: [...state.history, record],
  }
}

export function listActivePieces(
  state: GameState,
  side?: Side,
  kind?: PieceKind,
): Piece[] {
  return state.pieces.filter((piece) => {
    if (piece.captured) {
      return false
    }

    if (side && piece.side !== side) {
      return false
    }

    if (kind && piece.kind !== kind) {
      return false
    }

    return true
  })
}

export function replacePieces(state: GameState, pieces: Piece[]): GameState {
  return {
    ...state,
    pieces: pieces.map(clonePiece),
  }
}