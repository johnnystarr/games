import type { FormEvent, RefObject } from 'react'
import type { Side } from '../lib/xiangqi/types'

interface FeedbackState {
  tone: 'neutral' | 'success' | 'error'
  message: string
}

interface NotationBarProps {
  activeSide: Side
  actionsDisabled: boolean
  canUndo: boolean
  feedback: FeedbackState
  inputRef: RefObject<HTMLInputElement | null>
  moveCount: number
  onReset: () => void
  onSubmit: () => void
  onUndo: () => void
  onValueChange: (value: string) => void
  value: string
}

function feedbackClassName(tone: FeedbackState['tone']): string {
  switch (tone) {
    case 'success':
      return 'mt-3 text-sm text-[#30513b]'
    case 'error':
      return 'mt-3 text-sm text-[#7a3127]'
    default:
      return 'mt-3 text-sm text-[#6c5336]'
  }
}

function sideLabel(side: Side): string {
  return side === 'red' ? 'Red' : 'Black'
}

export function NotationBar({
  activeSide,
  actionsDisabled,
  canUndo,
  feedback,
  inputRef,
  moveCount,
  onReset,
  onSubmit,
  onUndo,
  onValueChange,
  value,
}: NotationBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="p-0" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.24em] text-[#8f6f4b]">
          <span className="inline-flex items-center gap-2 px-0 py-0 text-[0.72rem] font-semibold text-[#744d2b]">
            <span className={`h-2.5 w-2.5 ${activeSide === 'red' ? 'bg-[#b64533]' : 'bg-[#2d2b29]'}`}></span>
            {sideLabel(activeSide)} to move
          </span>
          <span className="text-[0.72rem] tracking-[0.24em] text-[#9d805d]">
            {moveCount === 0 ? 'Opening position' : `${moveCount} move${moveCount === 1 ? '' : 's'} entered`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onUndo}
            disabled={actionsDisabled || !canUndo}
            className="inline-flex items-center gap-2 px-0 py-0 text-sm font-semibold text-[#6a4b2d] transition hover:text-[#3f2b17] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-reply" aria-hidden="true" />
            Undo
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={actionsDisabled || moveCount === 0}
            className="inline-flex items-center gap-2 px-0 py-0 text-sm font-semibold text-[#6a4b2d] transition hover:text-[#3f2b17] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-rotate-left" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="relative block w-full">
          <span className="sr-only">Enter Xiangqi notation</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={activeSide === 'red' ? 'Type C2=5 or C2h5' : 'Type H8+7 or H8f7'}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="w-full border border-[#d7d7d7] bg-white px-4 py-2.5 text-lg text-[#3d2a18] outline-none transition placeholder:text-[#9c9c9c] focus:border-[#7d7d7d] focus:ring-1 focus:ring-[#d9d9d9] disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
      </div>

      {feedback.message ? <p className={feedbackClassName(feedback.tone)}>{feedback.message}</p> : null}
    </form>
  )
}