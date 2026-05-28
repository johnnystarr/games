import type { BoardCoord } from './types'

export const boardArt = {
  width: 698,
  height: 754,
  tokenSize: 73,
  overlay: {
    left: 63.5,
    top: 55.5,
    width: 571,
    height: 643,
  },
} as const

const gridColumns = [0.74, 72.04, 143.06, 214.35, 285.37, 356.63, 427.65, 498.94, 569.97]
const gridRows = [0.97, 72.21, 143.22, 214.45, 285.74, 357.14, 428.38, 499.39, 570.63, 641.95]

function sampleAxis(axis: number[], value: number): number {
  if (value <= 0) {
    return axis[0]
  }

  if (value >= axis.length - 1) {
    return axis[axis.length - 1]
  }

  const lowerIndex = Math.floor(value)
  const upperIndex = Math.ceil(value)

  if (lowerIndex === upperIndex) {
    return axis[lowerIndex]
  }

  const progress = value - lowerIndex
  const start = axis[lowerIndex]
  const end = axis[upperIndex]

  return start + (end - start) * progress
}

export function toBoardPercentX(value: number): string {
  return `${(value / boardArt.width) * 100}%`
}

export function toBoardPercentY(value: number): string {
  return `${(value / boardArt.height) * 100}%`
}

export function toBoardPlacement(coord: BoardCoord): { left: string; top: string } {
  const x = boardArt.overlay.left + sampleAxis(gridColumns, coord.col)
  const y = boardArt.overlay.top + sampleAxis(gridRows, coord.row)

  return {
    left: toBoardPercentX(x),
    top: toBoardPercentY(y),
  }
}

export function interpolateBoardCoord(
  from: BoardCoord,
  to: BoardCoord,
  progress: number,
): BoardCoord {
  return {
    row: from.row + (to.row - from.row) * progress,
    col: from.col + (to.col - from.col) * progress,
  }
}