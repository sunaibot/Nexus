/**
 * 记忆化选择器 Hooks
 * 用于优化性能，避免不必要的重渲染
 */

import { useMemo, useCallback } from 'react'
import type { Bookmark, Category } from '../types/bookmark'

// ===== 书签选择器 =====

export function useBookmarkSelectors(bookmarks: Bookmark[]) {
  // 稍后阅读列表
  const readLaterBookmarks = useMemo(() => {
    return bookmarks.filter(b => b.isReadLater)
  }, [bookmarks])

  // 置顶书签
  const pinnedBookmark = useMemo(() => {
    return bookmarks.find(b => b.isPinned) || null
  }, [bookmarks])

  // 公开书签
  const publicBookmarks = useMemo(() => {
    return bookmarks.filter(b => b.visibility !== 'private')
  }, [bookmarks])

  // 私密书签
  const privateBookmarks = useMemo(() => {
    return bookmarks.filter(b => b.visibility === 'private')
  }, [bookmarks])

  // 按分类分组的书签
  const bookmarksByCategory = useMemo(() => {
    const grouped = new Map<string, Bookmark[]>()
    bookmarks.forEach(bookmark => {
      const categoryId = bookmark.category || 'uncategorized'
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, [])
      }
      grouped.get(categoryId)!.push(bookmark)
    })
    return grouped
  }, [bookmarks])

  // 获取书签总数
  const totalBookmarks = useMemo(() => bookmarks.length, [bookmarks])

  // 获取稍后阅读数量
  const readLaterCount = useMemo(() => readLaterBookmarks.length, [readLaterBookmarks])

  return {
    readLaterBookmarks,
    pinnedBookmark,
    publicBookmarks,
    privateBookmarks,
    bookmarksByCategory,
    totalBookmarks,
    readLaterCount,
  }
}

// ===== 分类选择器 =====

export function useCategorySelectors(categories: Category[]) {
  // 按 orderIndex 排序的分类
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
  }, [categories])

  // 分类名称映射
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach(cat => {
      map.set(cat.id, cat.name)
    })
    return map
  }, [categories])

  // 获取分类名称
  const getCategoryName = useCallback((categoryId: string | undefined) => {
    if (!categoryId) return '未分类'
    return categoryNameMap.get(categoryId) || '未分类'
  }, [categoryNameMap])

  // 分类数量
  const categoryCount = useMemo(() => categories.length, [categories])

  return {
    sortedCategories,
    categoryNameMap,
    getCategoryName,
    categoryCount,
  }
}

// ===== 过滤选择器 =====

interface FilterOptions {
  searchQuery?: string
  categoryId?: string
  showPrivate?: boolean
  showReadLaterOnly?: boolean
}

export function useFilteredBookmarks(
  bookmarks: Bookmark[],
  options: FilterOptions
) {
  const {
    searchQuery = '',
    categoryId,
    showPrivate = false,
    showReadLaterOnly = false,
  } = options

  return useMemo(() => {
    return bookmarks.filter(bookmark => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.description?.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // 分类过滤
      if (categoryId && bookmark.category !== categoryId) {
        return false
      }

      // 私密书签过滤
      if (bookmark.visibility === 'private' && !showPrivate) {
        return false
      }

      // 稍后阅读过滤
      if (showReadLaterOnly && !bookmark.isReadLater) {
        return false
      }

      return true
    })
  }, [bookmarks, searchQuery, categoryId, showPrivate, showReadLaterOnly])
}
