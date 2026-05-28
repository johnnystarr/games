export const pieceKinds = ['R', 'H', 'E', 'C', 'A', 'G', 'P'] as const

export type PieceKind = (typeof pieceKinds)[number]
export type Side = 'red' | 'black'
export type MoveOperator = '+' | '-' | '='

export interface BoardCoord {
  row: number
  col: number
}

export interface Piece extends BoardCoord {
  id: string
  side: Side
  kind: PieceKind
  captured: boolean
}

export interface ResolvedMove {
  pieceId: string
  pieceKind: PieceKind
  side: Side
  from: BoardCoord
  to: BoardCoord
  captureId?: string
}

export interface MoveRecord extends ResolvedMove {
  rawNotation: string
  normalizedNotation: string
  ply: number
}

export interface GameState {
  activeSide: Side
  pieces: Piece[]
  history: MoveRecord[]
}

export interface ParsedNotation {
  raw: string
  normalized: string
  pieceKind: PieceKind
  sourceFile: number
  operator: MoveOperator
  value: number
}

export interface NotationPreview {
  sourcePieceIds: string[]
  destination?: BoardCoord
  capturePieceId?: string
}

export interface ParseNotationSuccess {
  ok: true
  value: ParsedNotation
}

export interface ParseNotationFailure {
  ok: false
  error: string
}

export type ParseNotationResult = ParseNotationSuccess | ParseNotationFailure

export interface ResolveNotationSuccess {
  ok: true
  value: {
    move: ResolvedMove
    notation: ParsedNotation
  }
}

export interface ResolveNotationFailure {
  ok: false
  code: 'syntax' | 'illegal' | 'ambiguous'
  error: string
}

export type ResolveNotationResult =
  | ResolveNotationSuccess
  | ResolveNotationFailure