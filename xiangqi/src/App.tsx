import { useEffect, useMemo, useRef, useState } from 'react'
import { Board } from './components/Board'
import { NotationBar } from './components/NotationBar'
import { MoveAnimator, idleAnimatorSnapshot } from './lib/xiangqi/animation'
import { pieceNames } from './lib/xiangqi/assets'
import {
  applyResolvedMove,
  createInitialGameState,
  generateLegalMoves,
  isInCheck,
  previewNotation,
  resolveNotationMove,
  type GameState,
} from './lib/xiangqi'

function App() {
  const [gameState, setGameState] = useState(createInitialGameState)
  const [undoStack, setUndoStack] = useState<GameState[]>([])
  const [notationInput, setNotationInput] = useState('')
  const [feedback, setFeedback] = useState<{
    tone: 'neutral' | 'success' | 'error'
    message: string
  }>({
    tone: 'neutral',
    message: '',
  })
  const [animation, setAnimation] = useState(idleAnimatorSnapshot)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const animatorRef = useRef<MoveAnimator | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (!animatorRef.current) {
    animatorRef.current = new MoveAnimator(setAnimation)
  }

  const isAnimating = animation.phase !== 'idle'
  const preview = useMemo(
    () => (isAnimating ? null : previewNotation(gameState, notationInput)),
    [gameState, isAnimating, notationInput],
  )

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  useEffect(() => {
    focusInput()
  }, [])

  const handleSubmit = () => {
    if (isAnimating) {
      focusInput()
      return
    }

    const resolution = resolveNotationMove(gameState, notationInput)

    if (!resolution.ok) {
      setFeedback({
        tone: 'error',
        message: resolution.error,
      })
      focusInput()
      return
    }

    const { move, notation } = resolution.value
    const movingPiece = gameState.pieces.find((piece) => piece.id === move.pieceId)

    if (!movingPiece) {
      setFeedback({
        tone: 'error',
        message: 'The moving piece could not be found in the current position.',
      })
      return
    }

    const capturedPiece = move.captureId
      ? gameState.pieces.find((piece) => piece.id === move.captureId)
      : undefined
    const projectedState = applyResolvedMove(gameState, move, notation)

    setFeedback({
      tone: 'success',
      message: `${notation.normalized} accepted. Animating the ${pieceNames[move.pieceKind].toLowerCase()} now.`,
    })
    setNotationInput('')
    focusInput()

    const animator = animatorRef.current

    if (!animator) {
      return
    }

    void animator
      .enqueue({
        move,
        movingPiece,
        capturedPiece,
        commit: () => {
          setUndoStack((stack) => [...stack, gameState])
          setGameState(projectedState)
        },
      })
      .then(() => {
        const nextMoves = generateLegalMoves(projectedState)
        const checked = isInCheck(projectedState, projectedState.activeSide)
        const nextSideLabel = projectedState.activeSide === 'red' ? 'Red' : 'Black'
        let message = `${notation.normalized} complete. ${nextSideLabel} to move.`

        if (nextMoves.length === 0) {
          message = checked
            ? `${notation.normalized} complete. Checkmate: ${nextSideLabel} has no legal replies.`
            : `${notation.normalized} complete. ${nextSideLabel} has no legal replies.`
        } else if (checked) {
          message = `${notation.normalized} complete. ${nextSideLabel} is in check.`
        }

        setFeedback({
          tone: 'neutral',
          message,
        })
        focusInput()
      })
  }

  const handleUndo = () => {
    if (isAnimating) {
      return
    }

    const previousState = undoStack[undoStack.length - 1]
    const lastMove = gameState.history[gameState.history.length - 1]

    if (!previousState || !lastMove) {
      focusInput()
      return
    }

    setUndoStack((stack) => stack.slice(0, -1))
    setGameState(previousState)
    setAnimation(idleAnimatorSnapshot)
    setFeedback({
      tone: 'neutral',
      message: `${lastMove.normalizedNotation} undone. ${previousState.activeSide === 'red' ? 'Red' : 'Black'} to move.`,
    })
    focusInput()
  }

  const openResetModal = () => {
    if (isAnimating || gameState.history.length === 0) {
      focusInput()
      return
    }

    setIsResetModalOpen(true)
  }

  const closeResetModal = () => {
    setIsResetModalOpen(false)
    focusInput()
  }

  const handleReset = () => {
    if (isAnimating) {
      return
    }

    setGameState(createInitialGameState())
    setUndoStack([])
    setNotationInput('')
    setAnimation(idleAnimatorSnapshot)
    setIsResetModalOpen(false)
    setFeedback({
      tone: 'neutral',
      message:
        'Board reset to the standard opening setup. Enter the next move when you are ready.',
    })
    focusInput()
  }

  return (
    <main className="min-h-screen bg-white px-3 py-3 text-[#2f241c] sm:px-4 sm:py-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <section className="w-full p-0">
          <Board state={gameState} animation={animation} preview={preview} />

          <div className="mx-auto mt-4 w-full max-w-[min(40rem,calc((100svh-14rem)*0.925729443))]">
            <NotationBar
              activeSide={gameState.activeSide}
              actionsDisabled={isAnimating}
              canUndo={undoStack.length > 0}
              feedback={feedback}
              inputRef={inputRef}
              moveCount={gameState.history.length}
              onReset={openResetModal}
              onSubmit={handleSubmit}
              onUndo={handleUndo}
              onValueChange={setNotationInput}
              value={notationInput}
            />
          </div>
        </section>
      </div>

      {isResetModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b2119]/45 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            className="w-full max-w-md border border-[#ddd3c7] bg-white p-6 shadow-[0_20px_60px_rgba(34,25,19,0.2)]"
          >
            <h2 id="reset-dialog-title" className="text-lg font-semibold text-[#34261d]">
              Reset the board?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6e5842]">
              This clears the current position, move history, and undo stack. This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeResetModal}
                autoFocus
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-[#6a4b2d] transition hover:text-[#3f2b17]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center bg-[#3f2b17] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2d1f12]"
              >
                Reset board
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
