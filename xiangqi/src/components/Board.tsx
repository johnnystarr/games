import type { CSSProperties } from 'react'
import { boardAssets } from '../lib/xiangqi/assets'
import {
  boardArt,
  interpolateBoardCoord,
  toBoardPercentX,
  toBoardPercentY,
  toBoardPlacement,
} from '../lib/xiangqi/boardMetrics'
import type { AnimatorSnapshot } from '../lib/xiangqi/animation'
import type { GameState, NotationPreview, Piece } from '../lib/xiangqi/types'
import { PieceToken } from './PieceToken'

interface BoardProps {
  state: GameState
  animation: AnimatorSnapshot
  preview: NotationPreview | null
}

function getLinesStyle(): CSSProperties {
  return {
    left: toBoardPercentX(boardArt.overlay.left),
    top: toBoardPercentY(boardArt.overlay.top),
    width: toBoardPercentX(boardArt.overlay.width),
    height: toBoardPercentY(boardArt.overlay.height),
  }
}

export function Board({ state, animation, preview }: BoardProps) {
  const movingPieceId = animation.movingPiece?.pieceId
  const livePieces = state.pieces.filter((piece) => !piece.captured)
  const livePieceById = new Map(livePieces.map((piece) => [piece.id, piece]))
  const previewSourcePieces = (preview?.sourcePieceIds ?? [])
    .map((pieceId) => livePieceById.get(pieceId))
    .filter((piece): piece is Piece => Boolean(piece))
  const previewCapturePiece = preview?.capturePieceId
    ? livePieceById.get(preview.capturePieceId)
    : undefined

  return (
    <div
      className="relative mx-auto aspect-[698/754] w-full max-w-[min(40rem,calc((100svh-14rem)*0.925729443))]"
      role="img"
      aria-label={`Xiangqi board, ${state.activeSide} to move`}
    >
      <img
        className="absolute inset-0 h-full w-full select-none shadow-[0_18px_38px_rgba(77,46,20,0.2)]"
        src={boardAssets.wood}
        alt=""
      />
      <img
        className="pointer-events-none absolute z-10 select-none"
        src={boardAssets.lines}
        style={getLinesStyle()}
        alt=""
      />

      <div className="absolute inset-0 z-20" aria-hidden="true">
        {livePieces.map((piece) => {
          if (piece.id === movingPieceId) {
            return null
          }

          return (
            <PieceToken
              key={piece.id}
              kind={piece.kind}
              side={piece.side}
              style={toBoardPlacement(piece)}
            />
          )
        })}

        {animation.movingPiece ? (
          <PieceToken
            className="z-30 drop-shadow-[0_12px_18px_rgba(77,46,20,0.28)]"
            kind={animation.movingPiece.kind}
            side={animation.movingPiece.side}
            style={toBoardPlacement(
              interpolateBoardCoord(
                animation.movingPiece.from,
                animation.movingPiece.to,
                animation.movingPiece.progress,
              ),
            )}
          />
        ) : null}

        {animation.captureGhost ? (
          <PieceToken
            className="z-20 saturate-[0.82]"
            kind={animation.captureGhost.kind}
            side={animation.captureGhost.side}
            opacity={1 - animation.captureGhost.progress}
            scale={1 - animation.captureGhost.progress * 0.3}
            style={toBoardPlacement(animation.captureGhost.at)}
          />
        ) : null}

        {previewSourcePieces.map((piece) => (
          <div
            key={`preview-source-${piece.id}`}
            className="pointer-events-none absolute z-30 aspect-square w-[10.4%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#8b5cf6]"
            style={toBoardPlacement(piece)}
          />
        ))}

        {previewCapturePiece ? (
          <div
            className="pointer-events-none absolute z-30 aspect-square w-[10.4%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#dc2626]"
            style={toBoardPlacement(previewCapturePiece)}
          />
        ) : null}

        {preview?.destination && !previewCapturePiece ? (
          <div
            className="pointer-events-none absolute z-30 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b5cf6]"
            style={toBoardPlacement(preview.destination)}
          />
        ) : null}
      </div>
    </div>
  )
}