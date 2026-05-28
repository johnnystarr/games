import type { DragPoint, PointerDragState } from './types'

export function getDragPreviewPosition(pointer: DragPoint, offset: DragPoint): DragPoint {
  return {
    x: pointer.x - offset.x,
    y: pointer.y - offset.y,
  }
}

export function findDropZoneId(element: Element | null, attributeName = 'data-drop-zone'): string | null {
  if (!(element instanceof HTMLElement)) {
    return null
  }

  const dropZone = element.closest<HTMLElement>(`[${attributeName}]`)
  return dropZone?.getAttribute(attributeName) ?? null
}

export function isDraggingItem<TItem>(dragState: PointerDragState<TItem> | null): dragState is PointerDragState<TItem> {
  return dragState !== null
}