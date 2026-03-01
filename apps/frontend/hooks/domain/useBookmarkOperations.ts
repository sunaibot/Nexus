/**
 * 书签操作 Hook
 * 封装书签的增删改查操作
 */

import { useCallback } from 'react'
import { useBookmarkStore } from '../useBookmarkStore'
import type { Bookmark } from '../../types/bookmark'

export function useBookmarkOperations() {
  const {
    bookmarks,
    isLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    refreshData,
  } = useBookmarkStore()

  // 标记已读（从稍后阅读中移除）
  const markAsRead = useCallback((id: string) => {
    toggleReadLater(id)
  }, [toggleReadLater])

  // 移除书签
  const removeBookmark = useCallback((id: string) => {
    deleteBookmark(id)
  }, [deleteBookmark])

  // 编辑书签（打开编辑弹窗）
  const editBookmark = useCallback((bookmark: Bookmark) => {
    // 返回书签数据供弹窗使用
    return bookmark
  }, [])

  // 获取稍后阅读列表
  const getReadLaterBookmarks = useCallback(() => {
    return bookmarks.filter(b => b.isReadLater)
  }, [bookmarks])

  // 获取置顶书签
  const getPinnedBookmark = useCallback(() => {
    return bookmarks.find(b => b.isPinned) || null
  }, [bookmarks])

  return {
    bookmarks,
    isLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    markAsRead,
    removeBookmark,
    editBookmark,
    getReadLaterBookmarks,
    getPinnedBookmark,
    refreshData,
  }
}
