import { colToRelativeFile, listActivePieces } from './state'
import { generateLegalMoves } from './rules'
import type {
  GameState,
  MoveOperator,
  NotationPreview,
  ParseNotationResult,
  ParsedNotation,
  PieceKind,
  ResolveNotationResult,
  ResolvedMove,
  Side,
} from './types'

const notationPattern = /^\s*([RHECAGP])\s*([1-9])\s*([+=\-fFbBhH])\s*([1-9])\s*$/i

const operatorAliases: Record<string, MoveOperator> = {
  '+': '+',
  '-': '-',
  '=': '=',
  f: '+',
  b: '-',
  h: '=',
}

const notationDraftPattern =
  /^\s*([RHECAGP])?\s*([1-9])?\s*([+=\-fFbBhH])?\s*([1-9])?\s*$/i

interface ParsedNotationDraft {
  pieceKind: PieceKind
  sourceFile?: number
  operator?: MoveOperator
  value?: number
}

function normalizeNotation(
  pieceKind: PieceKind,
  sourceFile: number,
  operator: MoveOperator,
  value: number,
): string {
  return `${pieceKind}${sourceFile}${operator}${value}`
}

function isFileTargetMove(kind: PieceKind): boolean {
  return kind === 'H' || kind === 'E' || kind === 'A'
}

function getSignedRowDelta(move: ResolvedMove, side: Side): number {
  const rawDelta = move.to.row - move.from.row
  return side === 'red' ? -rawDelta : rawDelta
}

function parseNotationDraft(input: string): ParsedNotationDraft | null {
  const trimmedInput = input.trim()

  if (!trimmedInput) {
    return null
  }

  const match = trimmedInput.match(notationDraftPattern)

  if (!match || !match[1]) {
    return null
  }

  return {
    pieceKind: match[1].toUpperCase() as PieceKind,
    sourceFile: match[2] ? Number(match[2]) : undefined,
    operator: match[3] ? operatorAliases[match[3].toLowerCase()] : undefined,
    value: match[4] ? Number(match[4]) : undefined,
  }
}

function collectSourcePieceIds(
  state: GameState,
  pieceKind: PieceKind,
  sourceFile?: number,
): string[] {
  const pieces = listActivePieces(state, state.activeSide, pieceKind)

  return pieces
    .filter((piece) => {
      if (!sourceFile) {
        return true
      }

      return colToRelativeFile(piece.side, piece.col) === sourceFile
    })
    .map((piece) => piece.id)
}

function createParsedNotationFromDraft(
  input: string,
  draft: ParsedNotationDraft,
): ParsedNotation | null {
  if (!draft.sourceFile || !draft.operator || !draft.value) {
    return null
  }

  return {
    raw: input,
    normalized: normalizeNotation(
      draft.pieceKind,
      draft.sourceFile,
      draft.operator,
      draft.value,
    ),
    pieceKind: draft.pieceKind,
    sourceFile: draft.sourceFile,
    operator: draft.operator,
    value: draft.value,
  }
}

export function parseNotation(input: string): ParseNotationResult {
  const match = input.match(notationPattern)

  if (!match) {
    return {
      ok: false,
      error:
        'Enter romanized Xiangqi notation with R/H/E/C/A/G/P, a source file, and +, -, =, f, b, or h.',
    }
  }

  const pieceKind = match[1].toUpperCase() as PieceKind
  const sourceFile = Number(match[2])
  const operator = operatorAliases[match[3].toLowerCase()]
  const value = Number(match[4])

  const notation: ParsedNotation = {
    raw: input,
    normalized: normalizeNotation(pieceKind, sourceFile, operator, value),
    pieceKind,
    sourceFile,
    operator,
    value,
  }

  return { ok: true, value: notation }
}

export function moveMatchesNotation(
  move: ResolvedMove,
  notation: ParsedNotation,
): boolean {
  if (move.pieceKind !== notation.pieceKind) {
    return false
  }

  if (colToRelativeFile(move.side, move.from.col) !== notation.sourceFile) {
    return false
  }

  if (notation.operator === '=') {
    return (
      move.from.row === move.to.row &&
      colToRelativeFile(move.side, move.to.col) === notation.value
    )
  }

  const signedRowDelta = getSignedRowDelta(move, move.side)
  const isForward = signedRowDelta > 0
  const isBackward = signedRowDelta < 0

  if (notation.operator === '+' && !isForward) {
    return false
  }

  if (notation.operator === '-' && !isBackward) {
    return false
  }

  if (isFileTargetMove(move.pieceKind)) {
    return colToRelativeFile(move.side, move.to.col) === notation.value
  }

  return move.from.col === move.to.col && Math.abs(signedRowDelta) === notation.value
}

export function resolveNotationMove(
  state: GameState,
  input: string,
): ResolveNotationResult {
  const parsedResult = parseNotation(input)

  if (!parsedResult.ok) {
    return {
      ok: false,
      code: 'syntax',
      error: parsedResult.error,
    }
  }

  const notation = parsedResult.value
  const candidates = generateLegalMoves(state).filter((move) =>
    moveMatchesNotation(move, notation),
  )

  if (candidates.length === 1) {
    return {
      ok: true,
      value: {
        move: candidates[0],
        notation,
      },
    }
  }

  if (candidates.length > 1) {
    return {
      ok: false,
      code: 'ambiguous',
      error: `${notation.normalized} matches more than one legal move for ${state.activeSide}.`,
    }
  }

  const matchingPieces = listActivePieces(state, state.activeSide, notation.pieceKind).filter(
    (piece) => colToRelativeFile(piece.side, piece.col) === notation.sourceFile,
  )

  if (matchingPieces.length === 0) {
    return {
      ok: false,
      code: 'illegal',
      error: `There is no ${state.activeSide} ${notation.pieceKind} on file ${notation.sourceFile}.`,
    }
  }

  return {
    ok: false,
    code: 'illegal',
    error: `No legal move matches ${notation.normalized} for ${state.activeSide}.`,
  }
}

export function previewNotation(
  state: GameState,
  input: string,
): NotationPreview | null {
  const draft = parseNotationDraft(input)

  if (!draft || !draft.sourceFile) {
    return null
  }

  const parsedNotation = createParsedNotationFromDraft(input, draft)

  if (!parsedNotation) {
    const sourcePieceIds = collectSourcePieceIds(
      state,
      draft.pieceKind,
      draft.sourceFile,
    )

    return sourcePieceIds.length > 0 ? { sourcePieceIds } : null
  }

  const candidates = generateLegalMoves(state).filter((move) =>
    moveMatchesNotation(move, parsedNotation),
  )

  if (candidates.length === 1) {
    const [move] = candidates

    return {
      sourcePieceIds: [move.pieceId],
      destination: move.to,
      capturePieceId: move.captureId,
    }
  }

  if (candidates.length > 1) {
    return {
      sourcePieceIds: [...new Set(candidates.map((move) => move.pieceId))],
    }
  }

  const sourcePieceIds = collectSourcePieceIds(
    state,
    draft.pieceKind,
    draft.sourceFile,
  )

  return sourcePieceIds.length > 0 ? { sourcePieceIds } : null
}