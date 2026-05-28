import { describe, expect, it } from 'vitest'
import { toBoardPlacement } from './boardMetrics'

function toNumber(percent: string): number {
  return Number.parseFloat(percent.replace('%', ''))
}

describe('toBoardPlacement', () => {
  it('supports fractional board coordinates for animation frames', () => {
    const start = toBoardPlacement({ row: 7, col: 1 })
    const end = toBoardPlacement({ row: 7, col: 4 })
    const midpoint = toBoardPlacement({ row: 7, col: 2.5 })

    expect(toNumber(midpoint.left)).toBeGreaterThan(toNumber(start.left))
    expect(toNumber(midpoint.left)).toBeLessThan(toNumber(end.left))
    expect(midpoint.top).toBe(start.top)
  })
})