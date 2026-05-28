import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { DragPoint, DragSize, PointerDragState } from '../types'

interface StartDragOptions<TItem> {
  item: TItem
  size: DragSize
  onDrop?: (point: DragPoint, item: TItem) => void
  onCancel?: (item: TItem) => void
}

export function usePointerDrag<TItem>() {
  const [dragState, setDragState] = useState<PointerDragState<TItem> | null>(null)
  const dragStateRef = useRef<PointerDragState<TItem> | null>(null)
  const onDropRef = useRef<((point: DragPoint, item: TItem) => void) | null>(null)
  const onCancelRef = useRef<((item: TItem) => void) | null>(null)

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  useEffect(() => {
    if (dragState === null) {
      return undefined
    }

    const handlePointerMove = (event: PointerEvent) => {
      setDragState((current: PointerDragState<TItem> | null) =>
        current === null
          ? null
          : {
              ...current,
              pointer: { x: event.clientX, y: event.clientY },
            },
      )
    }

    const handlePointerUp = (event: PointerEvent) => {
      const current = dragStateRef.current

      if (current === null) {
        return
      }

      setDragState(null)
      dragStateRef.current = null
      onDropRef.current?.({ x: event.clientX, y: event.clientY }, current.item)
      onDropRef.current = null
      onCancelRef.current = null
    }

    const handlePointerCancel = () => {
      const current = dragStateRef.current

      if (current === null) {
        return
      }

      setDragState(null)
      dragStateRef.current = null
      onCancelRef.current?.(current.item)
      onDropRef.current = null
      onCancelRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [dragState])

  const startDrag = useCallback((event: ReactPointerEvent<HTMLElement>, options: StartDragOptions<TItem>) => {
    event.preventDefault()

    const bounds = event.currentTarget.getBoundingClientRect()
    const pointer = { x: event.clientX, y: event.clientY }

    onDropRef.current = options.onDrop ?? null
    onCancelRef.current = options.onCancel ?? null

    setDragState({
      item: options.item,
      origin: { x: bounds.left, y: bounds.top },
      offset: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      pointer,
      size: options.size,
    })
  }, [])

  const cancelDrag = useCallback(() => {
    const current = dragStateRef.current

    if (current !== null) {
      onCancelRef.current?.(current.item)
    }

    onDropRef.current = null
    onCancelRef.current = null
    dragStateRef.current = null
    setDragState(null)
  }, [])

  return {
    dragState,
    startDrag,
    cancelDrag,
  }
}
