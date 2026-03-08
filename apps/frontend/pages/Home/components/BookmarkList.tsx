/**
 * 书签列表组件
 * 包含拖拽排序和空状态处理
 */

import React from 'react'

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
  onChangeCategory?: (bookmarkId: string, categoryId: string) => void
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
  onChangeCategory,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return <EmptyState onAddBookmark={() => {}} isLoggedIn={isLoggedIn} />
  }

  return (
    <BookmarkGrid
      bookmarks={bookmarks}
      categories={categories}
      isLoading={isLoading}
      newlyAddedId={null}
      onEdit={onEdit}
      onDelete={onDelete}
      onTogglePin={onTogglePin}
      onToggleReadLater={onToggleReadLater}
      onReorder={onReorder}
      onChangeCategory={onChangeCategory}
      isLoggedIn={isLoggedIn}
      isEditMode={isEditMode}
    />
  )
}
