import type { BoardCoord, Piece, PieceKind, ResolvedMove, Side } from './types'

export interface MovingPieceSnapshot {
  pieceId: string
  side: Side
  kind: PieceKind
  from: BoardCoord
  to: BoardCoord
  progress: number
}

export interface CaptureGhostSnapshot {
  pieceId: string
  side: Side
  kind: PieceKind
  at: BoardCoord
  progress: number
}

export interface AnimatorSnapshot {
  phase: 'idle' | 'moving' | 'capturing'
  movingPiece?: MovingPieceSnapshot
  captureGhost?: CaptureGhostSnapshot
}

export interface AnimationJob {
  move: ResolvedMove
  movingPiece: Piece
  capturedPiece?: Piece
  commit: () => void
}

interface QueuedJob extends AnimationJob {
  resolve: () => void
}

const defaultDurations = {
  moveMs: 320,
  captureMs: 180,
} as const

export const idleAnimatorSnapshot: AnimatorSnapshot = {
  phase: 'idle',
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

export class MoveAnimator {
  private queue: QueuedJob[] = []
  private running = false
  private readonly onUpdate: (snapshot: AnimatorSnapshot) => void
  private readonly durations: typeof defaultDurations

  constructor(
    onUpdate: (snapshot: AnimatorSnapshot) => void,
    durations = defaultDurations,
  ) {
    this.onUpdate = onUpdate
    this.durations = durations
  }

  enqueue(job: AnimationJob): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ ...job, resolve })
      void this.drainQueue()
    })
  }

  private async drainQueue(): Promise<void> {
    if (this.running) {
      return
    }

    this.running = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()

      if (!job) {
        break
      }

      await this.runJob(job)
      job.resolve()
    }

    this.running = false
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private animate(
    duration: number,
    render: (progress: number) => void,
  ): Promise<void> {
    if (this.prefersReducedMotion()) {
      render(1)
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const start = performance.now()

      const step = (now: number) => {
        const rawProgress = Math.min(1, (now - start) / duration)
        render(easeOutCubic(rawProgress))

        if (rawProgress >= 1) {
          resolve()
          return
        }

        requestAnimationFrame(step)
      }

      requestAnimationFrame(step)
    })
  }

  private async runJob(job: QueuedJob): Promise<void> {
    await this.animate(this.durations.moveMs, (progress) => {
      this.onUpdate({
        phase: 'moving',
        movingPiece: {
          pieceId: job.movingPiece.id,
          side: job.movingPiece.side,
          kind: job.movingPiece.kind,
          from: job.move.from,
          to: job.move.to,
          progress,
        },
      })
    })

    job.commit()

    if (job.capturedPiece) {
      await this.animate(this.durations.captureMs, (progress) => {
        this.onUpdate({
          phase: 'capturing',
          captureGhost: {
            pieceId: job.capturedPiece!.id,
            side: job.capturedPiece!.side,
            kind: job.capturedPiece!.kind,
            at: job.move.to,
            progress,
          },
        })
      })
    }

    this.onUpdate(idleAnimatorSnapshot)
  }
}