/**
 * 书签列表组件
 * 包含拖拽排序和空状态处理
 */

import React, { useCallback } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { BookmarkGrid } from '../../../components/features/bookmark'
import { EmptyState } from '../../../components/home/EmptyState'
import type { Bookmark, Category } from '../../../types/bookmark'

interface BookmarkListProps {
  bookmarks: Bookmark[]
  categories: Category[]
  isLoading: boolean
  isEditMode: boolean
  isLoggedIn: boolean
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleReadLater: (id: string) => void
  onReorder?: (bookmarks: Bookmark[]) => void
}

export function BookmarkList({
  bookmarks,
  categories,
  isLoading,
  isEditMode,
  isLoggedIn,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleReadLater,
  onReorder,
}: BookmarkListProps) {
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 拖拽结束处理
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = bookmarks.findIndex(b => b.id === active.id)
    const newIndex = bookmarks.findIndex(b => b.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newBookmarks = arrayMove(bookmarks, oldIndex, newIndex)
      onReorder?.(newBookmarks)
    }
  }, [bookmarks, onReorder])

  if (bookmarks.length === 0) {
    return <EmptyState onAddBookmark={() => {}} />
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={bookmarks.map(b => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <BookmarkGrid
          bookmarks={bookmarks}
          categories={categories}
          isLoading={isLoading}
          newlyAddedId={null}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onToggleReadLater={onToggleReadLater}
          isLoggedIn={isLoggedIn}
        />
      </SortableContext>
    </DndContext>
  )
}
