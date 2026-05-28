import {
  findDropZoneId,
  getDragPreviewPosition,
  PlayingCard,
  usePointerDrag,
  type CardSuit,
  type PlayingCardModel,
} from '@cards'
import { useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  applyMove,
  createInitialFreeCellState,
  foundationOrder,
  getMovableCards,
  isGameWon,
  moveCardToFoundationIfPossible,
  validateMove,
  type FreeCellSource,
  type FreeCellState,
  type FreeCellTarget,
} from './lib/freecell'

const cascadeCardOffset = 28
const cardFrameHeight = 156
const slotWidthClass = 'w-24 sm:w-28'
const cardShapeClass = 'aspect-[179/250] rounded-[0.55rem]'

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
  highlighted,
  children,
  className,
  emptyLabel,
  testId,
}: {
  zoneId: string
  highlighted: boolean
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
        highlighted && 'outline-2 outline-yellow-200 outline-offset-2 outline',
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
            highlighted && 'border-yellow-100 text-yellow-50',
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

function App({ initialState }: { initialState?: FreeCellState }) {
  const [gameState, setGameState] = useState<FreeCellState>(() => initialState ?? createInitialFreeCellState())
  const [undoStack, setUndoStack] = useState<FreeCellState[]>([])
  const { dragState, startDrag, cancelDrag } = usePointerDrag<DragItem>()

  const hiddenCardIds = useMemo(
    () => new Set((dragState?.item.cards ?? []).map((card) => card.id)),
    [dragState],
  )

  const legalDropZoneIds = useMemo(() => {
    if (dragState === null) {
      return new Set<string>()
    }

    const nextZoneIds = new Set<string>()

    for (let cellIndex = 0; cellIndex < gameState.cells.length; cellIndex += 1) {
      const target: FreeCellTarget = { kind: 'cell', index: cellIndex }

      if (validateMove(gameState, dragState.item.source, target).ok) {
        nextZoneIds.add(getZoneId(target))
      }
    }

    for (const suit of foundationOrder) {
      const target: FreeCellTarget = { kind: 'foundation', suit }

      if (validateMove(gameState, dragState.item.source, target).ok) {
        nextZoneIds.add(getZoneId(target))
      }
    }

    for (let cascadeIndex = 0; cascadeIndex < gameState.cascades.length; cascadeIndex += 1) {
      const target: FreeCellTarget = { kind: 'cascade', index: cascadeIndex }

      if (validateMove(gameState, dragState.item.source, target).ok) {
        nextZoneIds.add(getZoneId(target))
      }
    }

    return nextZoneIds
  }, [dragState, gameState])

  const won = isGameWon(gameState)

  const pushNextState = (nextState: FreeCellState | null) => {
    if (nextState === null) {
      return
    }

    setUndoStack((stack) => [...stack, gameState])
    setGameState(nextState)
  }

  const handleNewGame = () => {
    cancelDrag()
    setUndoStack([])
    setGameState(createInitialFreeCellState())
  }

  const handleUndo = () => {
    cancelDrag()
    setUndoStack((stack) => {
      const previousState = stack.at(-1)

      if (previousState === undefined) {
        return stack
      }

      setGameState(previousState)
      return stack.slice(0, -1)
    })
  }

  const handleAutoFoundation = (source: FreeCellSource) => {
    pushNextState(moveCardToFoundationIfPossible(gameState, source))
  }

  const handleStartDrag = (event: ReactPointerEvent<HTMLDivElement>, source: FreeCellSource) => {
    if (event.button !== 0) {
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

  return (
    <main className="min-h-screen bg-emerald-700 px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/30 pb-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">FreeCell</h1>
            <p className="mt-1 text-sm text-emerald-50/80">Moves {undoStack.length}{won ? '  Won' : ''}</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={handleNewGame} className="border border-emerald-100 px-3 py-1.5 hover:bg-emerald-600">
              New Game
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="border border-emerald-100 px-3 py-1.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Undo
            </button>
          </div>
        </header>

        <section className="overflow-x-auto pb-4">
          <div className="min-w-max">
            <div className="flex items-start gap-3">
              {gameState.cells.map((card, cellIndex) => {
                const zoneId = getZoneId({ kind: 'cell', index: cellIndex })
                const isEmpty = card === null

                return (
                  <CardWell
                    key={zoneId}
                    zoneId={zoneId}
                    highlighted={isEmpty && legalDropZoneIds.has(zoneId)}
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

              <div className="w-6 sm:w-10"></div>

              {foundationOrder.map((suit) => {
                const zoneId = getZoneId({ kind: 'foundation', suit })
                const topCard = gameState.foundations[suit].at(-1) ?? null
                const isEmpty = topCard === null

                return (
                  <CardWell
                    key={zoneId}
                    zoneId={zoneId}
                    highlighted={isEmpty && legalDropZoneIds.has(zoneId)}
                    emptyLabel={<span className={joinClassNames('text-3xl', getSuitTextClass(suit))}>{suitMarks[suit]}</span>}
                    testId={`foundation-${suit}`}
                  >
                    {topCard === null ? null : <PlayingCard card={topCard} />}
                  </CardWell>
                )
              })}
            </div>

            <div className="mt-5 flex items-start gap-3">
              {gameState.cascades.map((cascade, cascadeIndex) => {
                const zoneId = getZoneId({ kind: 'cascade', index: cascadeIndex })
                const columnHeight = cardFrameHeight + Math.max(cascade.length - 1, 3) * cascadeCardOffset

                return (
                  <div
                    key={zoneId}
                    data-drop-zone={zoneId}
                    data-testid={`cascade-${cascadeIndex}`}
                    className={joinClassNames(
                      slotWidthClass,
                      'relative shrink-0',
                      legalDropZoneIds.has(zoneId) && 'outline-2 outline-yellow-200 outline-offset-2 outline',
                    )}
                    style={{ height: `${columnHeight}px` }}
                  >
                    {cascade.length === 0 ? (
                      <div
                        className={joinClassNames(
                          'absolute inset-0 border border-dashed border-emerald-100/40',
                          legalDropZoneIds.has(zoneId) && 'border-yellow-100',
                        )}
                        style={{ height: `${cardFrameHeight}px` }}
                      ></div>
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
    </main>
  )
}

export default App