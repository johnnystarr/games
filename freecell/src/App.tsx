import {
  findDropZoneId,
  getDragPreviewPosition,
  PlayingCard,
  usePointerDrag,
  type CardSuit,
  type PlayingCardModel,
} from '@cards'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import kingAsset from '../../King.svg'
import {
  applyMove,
  cloneFreeCellState,
  createEmptyFreeCellState,
  createInitialFreeCellState,
  foundationOrder,
  getMovableCards,
  isGameWon,
  moveCardToFoundationIfPossible,
  type FreeCellSource,
  type FreeCellState,
  type FreeCellTarget,
} from './lib/freecell'

const cascadeCardOffset = 28
const cardFrameHeight = 156
const slotWidthClass = 'w-24 sm:w-28'
const cardShapeClass = 'aspect-[179/250] rounded-[0.55rem]'
const dealStepDelayMs = 22

const suitMarks: Record<CardSuit, string> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

function getSuitTextClass(suit: CardSuit) {
  return suit === 'diamonds' || suit === 'hearts' ? 'text-red-200' : 'text-slate-100'
}

function getZoneId(target: FreeCellTarget): string {
  if (target.kind === 'cascade') {
    return `cascade:${target.index}`
  }

  if (target.kind === 'cell') {
    return `cell:${target.index}`
  }

  return `foundation:${target.suit}`
}

function parseZoneId(zoneId: string): FreeCellTarget | null {
  const [kind, rawValue] = zoneId.split(':')

  if (kind === 'cascade') {
    return { kind, index: Number(rawValue) }
  }

  if (kind === 'cell') {
    return { kind, index: Number(rawValue) }
  }

  if (kind === 'foundation') {
    return { kind, suit: rawValue as CardSuit }
  }

  return null
}

function CardWell({
  zoneId,
  children,
  className,
  emptyLabel,
  testId,
}: {
  zoneId: string
  children?: React.ReactNode
  className?: string
  emptyLabel?: React.ReactNode
  testId?: string
}) {
  const hasCard = children !== undefined && children !== null

  return (
    <div
      data-drop-zone={zoneId}
      data-testid={testId}
      className={joinClassNames(
        slotWidthClass,
        'relative shrink-0',
        className,
      )}
    >
      {hasCard ? (
        children
      ) : (
        <div
          className={joinClassNames(
            cardShapeClass,
            'flex w-full items-center justify-center border border-dashed border-emerald-100/40 px-2 text-center text-xs font-medium uppercase tracking-wide text-emerald-50/60',
          )}
        >
          {emptyLabel}
        </div>
      )}
    </div>
  )
}

interface DragItem {
  source: FreeCellSource
  cards: PlayingCardModel[]
}

interface AppProps {
  initialState?: FreeCellState
  disableDealAnimation?: boolean
}

interface DealStep {
  cascadeIndex: number
  card: PlayingCardModel
}

function buildDealSteps(state: FreeCellState): DealStep[] {
  const longestCascade = Math.max(...state.cascades.map((cascade) => cascade.length))
  const steps: DealStep[] = []

  for (let rowIndex = 0; rowIndex < longestCascade; rowIndex += 1) {
    for (let cascadeIndex = 0; cascadeIndex < state.cascades.length; cascadeIndex += 1) {
      const card = state.cascades[cascadeIndex][rowIndex]

      if (card !== undefined) {
        steps.push({
          cascadeIndex,
          card,
        })
      }
    }
  }

  return steps
}

function App({ initialState, disableDealAnimation = false }: AppProps) {
  const initialGameStateRef = useRef<FreeCellState>(initialState ?? createInitialFreeCellState())
  const shouldAnimateInitialDeal = initialState === undefined && !disableDealAnimation
  const [gameState, setGameState] = useState<FreeCellState>(initialGameStateRef.current)
  const [displayState, setDisplayState] = useState<FreeCellState>(() =>
    shouldAnimateInitialDeal ? createEmptyFreeCellState() : cloneFreeCellState(initialGameStateRef.current),
  )
  const [undoStack, setUndoStack] = useState<FreeCellState[]>([])
  const [kingMirrored, setKingMirrored] = useState(false)
  const [isDealAnimating, setIsDealAnimating] = useState(shouldAnimateInitialDeal)
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false)
  const { dragState, startDrag, cancelDrag } = usePointerDrag<DragItem>()
  const kingRef = useRef<HTMLImageElement | null>(null)
  const dealTimeoutRef = useRef<number | null>(null)

  const hiddenCardIds = useMemo(
    () => new Set((dragState?.item.cards ?? []).map((card) => card.id)),
    [dragState],
  )

  const clearDealTimer = () => {
    if (dealTimeoutRef.current !== null) {
      window.clearTimeout(dealTimeoutRef.current)
      dealTimeoutRef.current = null
    }
  }

  const won = !isDealAnimating && isGameWon(gameState)

  const startDealAnimation = (nextState: FreeCellState, options?: { resetUndo?: boolean }) => {
    clearDealTimer()
    cancelDrag()

    if (options?.resetUndo) {
      setUndoStack([])
    }

    setGameState(nextState)

    if (disableDealAnimation) {
      setDisplayState(cloneFreeCellState(nextState))
      setIsDealAnimating(false)
      return
    }

    setDisplayState(createEmptyFreeCellState())
    setIsDealAnimating(true)

    const dealSteps = buildDealSteps(nextState)
    let stepIndex = 0

    const runStep = () => {
      const currentStep = dealSteps[stepIndex]

      setDisplayState((current) => {
        const next = cloneFreeCellState(current)
        next.cascades[currentStep.cascadeIndex] = [...next.cascades[currentStep.cascadeIndex], { ...currentStep.card }]
        return next
      })

      stepIndex += 1

      if (stepIndex < dealSteps.length) {
        dealTimeoutRef.current = window.setTimeout(runStep, dealStepDelayMs)
        return
      }

      dealTimeoutRef.current = window.setTimeout(() => {
        setDisplayState(cloneFreeCellState(nextState))
        setIsDealAnimating(false)
        dealTimeoutRef.current = null
      }, dealStepDelayMs)
    }

    if (dealSteps.length === 0) {
      setDisplayState(cloneFreeCellState(nextState))
      setIsDealAnimating(false)
      return
    }

    runStep()
  }

  useEffect(() => {
    if (!shouldAnimateInitialDeal) {
      return undefined
    }

    startDealAnimation(initialGameStateRef.current)

    return () => {
      clearDealTimer()
    }
  }, [])

  useEffect(() => {
    return () => {
      clearDealTimer()
    }
  }, [])

  const pushNextState = (nextState: FreeCellState | null) => {
    if (nextState === null) {
      return
    }

    setUndoStack((stack) => [...stack, gameState])
    setGameState(nextState)
    setDisplayState(cloneFreeCellState(nextState))
  }

  const handleRequestNewGame = () => {
    setIsNewGameModalOpen(true)
  }

  const handleCancelNewGame = () => {
    setIsNewGameModalOpen(false)
  }

  const handleConfirmNewGame = () => {
    setIsNewGameModalOpen(false)
    startDealAnimation(createInitialFreeCellState(), { resetUndo: true })
  }

  const handleUndo = () => {
    if (isDealAnimating) {
      return
    }

    cancelDrag()
    setUndoStack((stack) => {
      const previousState = stack.at(-1)

      if (previousState === undefined) {
        return stack
      }

      setGameState(previousState)
      setDisplayState(cloneFreeCellState(previousState))
      return stack.slice(0, -1)
    })
  }

  const handleAutoFoundation = (source: FreeCellSource) => {
    if (isDealAnimating) {
      return
    }

    pushNextState(moveCardToFoundationIfPossible(gameState, source))
  }

  const handleStartDrag = (event: ReactPointerEvent<HTMLDivElement>, source: FreeCellSource) => {
    if (event.button !== 0 || isDealAnimating) {
      return
    }

    const cards = getMovableCards(gameState, source)

    if (cards.length === 0) {
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()

    startDrag(event, {
      item: {
        source,
        cards,
      },
      size: {
        width: bounds.width,
        height: bounds.height + (cards.length - 1) * cascadeCardOffset,
      },
      onDrop: (point, item) => {
        const dropZoneId = findDropZoneId(document.elementFromPoint(point.x, point.y))

        if (dropZoneId === null) {
          return
        }

        pushNextState(applyMove(gameState, item.source, parseZoneId(dropZoneId) ?? { kind: 'cascade', index: -1 }))
      },
    })
  }

  const handleBoardPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const kingElement = kingRef.current

    if (kingElement === null) {
      return
    }

    const kingBounds = kingElement.getBoundingClientRect()
    const shouldMirror = event.clientX < kingBounds.left + kingBounds.width / 2

    setKingMirrored((current) => (current === shouldMirror ? current : shouldMirror))
  }

  const resetKingDirection = () => {
    setKingMirrored(false)
  }

  return (
    <main
      className="min-h-screen bg-emerald-700 px-4 py-5 text-white sm:px-6"
      onPointerMove={handleBoardPointerMove}
      onPointerLeave={resetKingDirection}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/30 pb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">FreeCell</h1>
            <p className="mt-1 text-sm text-emerald-50/80">Moves {undoStack.length}{won ? '  Won' : ''}</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={handleRequestNewGame}
              className="border border-emerald-100 px-3 py-1.5 hover:bg-emerald-600"
            >
              New Game
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0 || isDealAnimating}
              className="border border-emerald-100 px-3 py-1.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Undo
            </button>
          </div>
        </header>

        <section className="overflow-x-auto pb-4">
          <div className="mx-auto w-fit min-w-max">
            <div className="flex items-start justify-center gap-3">
              <div className="flex items-start gap-3">
                {displayState.cells.map((card, cellIndex) => {
                  const zoneId = getZoneId({ kind: 'cell', index: cellIndex })

                  return (
                    <CardWell
                      key={zoneId}
                      zoneId={zoneId}
                      emptyLabel={`Cell ${cellIndex + 1}`}
                      testId={`cell-${cellIndex}`}
                    >
                      {card === null ? null : (
                        <div data-testid={`cell-card-${cellIndex}`}>
                          <PlayingCard
                            card={card}
                            interactive
                            onPointerDown={(event) => handleStartDrag(event, { kind: 'cell', index: cellIndex })}
                            onDoubleClick={() => handleAutoFoundation({ kind: 'cell', index: cellIndex })}
                          />
                        </div>
                      )}
                    </CardWell>
                  )
                })}
              </div>

              <div className="flex min-h-[156px] w-20 shrink-0 items-center justify-center sm:w-24">
                <img
                  ref={kingRef}
                  src={kingAsset}
                  alt=""
                  aria-hidden="true"
                  className="block h-16 w-auto select-none transition-transform duration-100"
                  style={{ transform: kingMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                  draggable={false}
                />
              </div>

              <div className="flex items-start gap-3">
                {foundationOrder.map((suit) => {
                  const zoneId = getZoneId({ kind: 'foundation', suit })
                  const topCard = displayState.foundations[suit].at(-1) ?? null

                  return (
                    <CardWell
                      key={zoneId}
                      zoneId={zoneId}
                      emptyLabel={<span className={joinClassNames('text-3xl', getSuitTextClass(suit))}>{suitMarks[suit]}</span>}
                      testId={`foundation-${suit}`}
                    >
                      {topCard === null ? null : <PlayingCard card={topCard} />}
                    </CardWell>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex items-start justify-center gap-3">
              {displayState.cascades.map((cascade, cascadeIndex) => {
                const zoneId = getZoneId({ kind: 'cascade', index: cascadeIndex })
                const columnHeight = cardFrameHeight + Math.max(cascade.length - 1, 3) * cascadeCardOffset

                return (
                  <div
                    key={zoneId}
                    data-drop-zone={zoneId}
                    data-testid={`cascade-${cascadeIndex}`}
                    className={joinClassNames(slotWidthClass, 'relative shrink-0')}
                    style={{ height: `${columnHeight}px` }}
                  >
                    {cascade.length === 0 ? (
                      <div className="absolute inset-0 border border-dashed border-emerald-100/40" style={{ height: `${cardFrameHeight}px` }}></div>
                    ) : null}

                    {cascade.map((card, cardIndex) => {
                      const source: FreeCellSource = {
                        kind: 'cascade',
                        index: cascadeIndex,
                        startIndex: cardIndex,
                      }
                      const canDrag = getMovableCards(gameState, source).length > 0
                      const isTopCard = cardIndex === cascade.length - 1

                      return (
                        <div
                          key={card.id}
                          data-testid={`cascade-card-${cascadeIndex}-${cardIndex}`}
                          className="absolute inset-x-0"
                          style={{ top: `${cardIndex * cascadeCardOffset}px`, zIndex: cardIndex + 1 }}
                        >
                          <PlayingCard
                            card={card}
                            interactive={canDrag}
                            ghosted={hiddenCardIds.has(card.id)}
                            onPointerDown={canDrag ? (event) => handleStartDrag(event, source) : undefined}
                            onDoubleClick={isTopCard ? () => handleAutoFoundation(source) : undefined}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {dragState === null ? null : (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{
            width: `${dragState.size.width}px`,
            height: `${dragState.size.height}px`,
            transform: `translate(${getDragPreviewPosition(dragState.pointer, dragState.offset).x}px, ${getDragPreviewPosition(dragState.pointer, dragState.offset).y}px)`,
          }}
        >
          {dragState.item.cards.map((card, index) => (
            <div key={card.id} className="absolute inset-x-0" style={{ top: `${index * cascadeCardOffset}px`, zIndex: index + 1 }}>
              <PlayingCard card={card} />
            </div>
          ))}
        </div>
      )}

      {isNewGameModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm border border-slate-300 bg-white p-5 text-slate-900 shadow-xl">
            <h2 className="text-lg font-semibold tracking-tight">Start a new game?</h2>
            <p className="mt-2 text-sm text-slate-600">Your current deal will be replaced.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={handleCancelNewGame} className="border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmNewGame} className="bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800">
                New Game
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App