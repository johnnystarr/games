// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createCardFromCode } from '@cards'
import type { FreeCellState } from './lib/freecell'

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

beforeAll(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

  if (globalThis.PointerEvent === undefined) {
    // jsdom still lacks a full PointerEvent implementation in some environments.
    globalThis.PointerEvent = MouseEvent as unknown as typeof PointerEvent
  }
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

function renderApp(initialState: FreeCellState) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(<App initialState={initialState} />)
  })

  return {
    container,
    unmount() {
      act(() => {
        root.unmount()
      })
    },
  }
}

describe('FreeCell interactions', () => {
  it('moves a card into a free cell with drag and drop', () => {
    const initialState = createState({
      cascades: [[createCardFromCode('7H')], [], [], [], [], [], [], []],
    })
    const { container, unmount } = renderApp(initialState)
    const source = container.querySelector('[data-testid="cascade-card-0-0"] [role="button"]') as HTMLElement
    const dropZone = container.querySelector('[data-testid="cell-0"]') as Element

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => dropZone),
    })

    act(() => {
      source.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 24, clientY: 24, button: 0 }))
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 32, clientY: 32 }))
    })

    expect(container.querySelector('[data-testid="cell-card-0"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="cascade-card-0-0"]')).toBeNull()

    unmount()
  })

  it('rejects an illegal cascade drop', () => {
    const initialState = createState({
      cascades: [[createCardFromCode('7D')], [createCardFromCode('8H')], [], [], [], [], [], []],
    })
    const { container, unmount } = renderApp(initialState)
    const source = container.querySelector('[data-testid="cascade-card-0-0"] [role="button"]') as HTMLElement
    const dropZone = container.querySelector('[data-testid="cascade-1"]') as Element

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => dropZone),
    })

    act(() => {
      source.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 24, clientY: 24, button: 0 }))
    })

    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 32, clientY: 32 }))
    })

    expect(container.querySelector('[data-testid="cascade-card-0-0"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-testid^="cascade-card-1-"]')).toHaveLength(1)

    unmount()
  })
})