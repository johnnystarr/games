import blackAdvisorGlyph from '@xiangqi-svg/cn-black-advisor-dark.svg'
import blackCannonGlyph from '@xiangqi-svg/cn-black-cannon-dark.svg'
import blackChariotGlyph from '@xiangqi-svg/cn-black-chariot-dark.svg'
import blackElephantGlyph from '@xiangqi-svg/cn-black-elephant-dark.svg'
import blackGeneralGlyph from '@xiangqi-svg/cn-black-king-dark.svg'
import blackHorseGlyph from '@xiangqi-svg/cn-black-horse-dark.svg'
import blackPawnGlyph from '@xiangqi-svg/cn-black-soldier-dark.svg'
import redAdvisorGlyph from '@xiangqi-svg/cn-red-advisor-dark.svg'
import redCannonGlyph from '@xiangqi-svg/cn-red-cannon-dark.svg'
import redChariotGlyph from '@xiangqi-svg/cn-red-chariot-dark.svg'
import redElephantGlyph from '@xiangqi-svg/cn-red-elephant-dark.svg'
import redGeneralGlyph from '@xiangqi-svg/cn-red-king-dark.svg'
import redHorseGlyph from '@xiangqi-svg/cn-red-horse-dark.svg'
import redPawnGlyph from '@xiangqi-svg/cn-red-soldier-dark.svg'
import blackPieceBase from '@xiangqi-svg/black-wooden-piece-bg.svg'
import boardLines from '@xiangqi-svg/board-lines.svg'
import redPieceBase from '@xiangqi-svg/red-wooden-piece-bg.svg'
import woodenBoard from '@xiangqi-svg/wooden-board-bg.svg'
import type { PieceKind, Side } from './types'

export const boardAssets = {
  wood: woodenBoard,
  lines: boardLines,
} as const

export const pieceBaseAssets: Record<Side, string> = {
  red: redPieceBase,
  black: blackPieceBase,
}

export const pieceGlyphAssets: Record<Side, Record<PieceKind, string>> = {
  red: {
    R: redChariotGlyph,
    H: redHorseGlyph,
    E: redElephantGlyph,
    C: redCannonGlyph,
    A: redAdvisorGlyph,
    G: redGeneralGlyph,
    P: redPawnGlyph,
  },
  black: {
    R: blackChariotGlyph,
    H: blackHorseGlyph,
    E: blackElephantGlyph,
    C: blackCannonGlyph,
    A: blackAdvisorGlyph,
    G: blackGeneralGlyph,
    P: blackPawnGlyph,
  },
}

export const pieceNames: Record<PieceKind, string> = {
  R: 'Chariot',
  H: 'Horse',
  E: 'Elephant',
  C: 'Cannon',
  A: 'Advisor',
  G: 'General',
  P: 'Pawn',
}