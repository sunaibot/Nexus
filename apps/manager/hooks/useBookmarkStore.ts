/**
 * 书签状态管理 Hook（重构版）
 * 
 * 改进点：
 * 1. 使用 useAsync 统一处理异步状态
 * 2. 分离 bookmarks 和 categories 管理
 * 3. 使用乐观更新 Hook
 * 4. 更好的错误处理和回滚
 */

import { useState, useCallback, useMemo } from 'react'
import { Bookmark, Category, CustomIcon } from '../types/bookmark'
import * as api from '../lib/api'
import { useAsync, useOptimistic } from './useAsync'

// 自定义图标本地存储 Key
const CUSTOM_ICONS_KEY = 'zen-garden-custom-icons'

/**
 * 自定义图标管理 Hook
 */
function useCustomIcons() {
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_ICONS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const saveCustomIcons = useCallback((icons: CustomIcon[]) => {
    try {
      localStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(icons))
    } catch (err) {
      console.error('保存自定义图标失败:', err)
    }
  }, [])

  const addCustomIcon = useCallback((icon: Omit<CustomIcon, 'id' | 'createdAt'>) => {
    const newIcon: CustomIcon = {
      id: `custom-${Date.now()}`,
      name: icon.name,
      url: icon.url,
      createdAt: Date.now(),
    }
    setCustomIcons(prev => {
      const updated = [...prev, newIcon]
      saveCustomIcons(updated)
      return updated
    })
    return newIcon
  }, [saveCustomIcons])

  const deleteCustomIcon = useCallback((id: string) => {
    setCustomIcons(prev => {
      const updated = prev.filter(icon => icon.id !== id)
      saveCustomIcons(updated)
      return updated
    })
  }, [saveCustomIcons])

  const updateCustomIcon = useCallback((id: string, updates: Partial<CustomIcon>) => {
    setCustomIcons(prev => {
      const updated = prev.map(icon => 
        icon.id === id ? { ...icon, ...updates } : icon
      )
      saveCustomIcons(updated)
      return updated
    })
  }, [saveCustomIcons])

  return {
    customIcons,
    addCustomIcon,
    deleteCustomIcon,
    updateCustomIcon,
  }
}

/**
 * 书签状态管理 Hook
 */
export function useBookmarkStore() {
  // 书签数据
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  // 分类数据
  const [categories, setCategories] = useState<Category[]>([])
  // 新添加的书签 ID（用于动画效果）
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)

  // 自定义图标管理
  const { customIcons, addCustomIcon, deleteCustomIcon, updateCustomIcon } = useCustomIcons()

  // 乐观更新工具
  const { executeOptimistic: optimisticBookmarks } = useOptimistic(bookmarks, setBookmarks)
  const { executeOptimistic: optimisticCategories } = useOptimistic(categories, setCategories)

  // 加载数据
  const {
    isLoading,
    error,
    execute: loadData,
  } = useAsync<[Bookmark[], Category[]], []>(
    async () => {
      const [bookmarksData, categoriesData] = await Promise.all([
        api.fetchBookmarks(),
        api.fetchCategories(),
      ])
      return [
        Array.isArray(bookmarksData) ? bookmarksData : [],
        Array.isArray(categoriesData) ? categoriesData : [],
      ]
    },
    {
      immediate: true,
      onSuccess: ([bookmarksData, categoriesData]) => {
        setBookmarks(bookmarksData)
        setCategories(categoriesData)
      },
    }
  )

  // 刷新数据
  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  // 添加书签
  const addBookmark = useCallback(async (
    bookmark: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>
  ) => {
    const newBookmark = await api.createBookmark({
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      favicon: bookmark.favicon,
      icon: bookmark.icon,
      iconUrl: bookmark.iconUrl,
      ogImage: bookmark.ogImage,
      category: bookmark.category,
      tags: bookmark.tags ? JSON.stringify(bookmark.tags) : null,
      isReadLater: bookmark.isReadLater,
    })

    setBookmarks(prev => [...prev, newBookmark])
    setNewlyAddedId(newBookmark.id)
    setTimeout(() => setNewlyAddedId(null), 2000)

    return newBookmark
  }, [])

  // 更新书签
  const updateBookmark = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    const apiUpdates: api.UpdateBookmarkParams = {
      ...updates,
      tags: updates.tags ? JSON.stringify(updates.tags) : updates.tags === undefined ? undefined : null,
    }
    const updated = await api.updateBookmark(id, apiUpdates)
    setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    return updated
  }, [])

  // 删除书签
  const deleteBookmark = useCallback(async (id: string) => {
    await api.deleteBookmark(id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }, [])

  // 重排序书签
  const reorderBookmarks = useCallback(async (reorderedBookmarks: Bookmark[]) => {
    const items = reorderedBookmarks.map((b, index) => ({
      id: b.id,
      orderIndex: index,
    }))
    await api.reorderBookmarks(items)
    setBookmarks(reorderedBookmarks.map((b, index) => ({ ...b, orderIndex: index })))
  }, [])

  // 切换置顶（乐观更新）
  const togglePin = useCallback(async (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id)
    if (!bookmark) return

    const newIsPinned = !bookmark.isPinned
    const optimisticData = bookmarks.map(b => 
      b.id === id ? { ...b, isPinned: newIsPinned } : b
    )

    await optimisticBookmarks(
      optimisticData,
      async () => {
        const updated = await api.updateBookmark(id, { isPinned: newIsPinned })
        return bookmarks.map(b => b.id === id ? updated : b)
      },
      {
        onError: (err) => {
          console.error('切换置顶失败:', err)
        },
      }
    )
  }, [bookmarks, optimisticBookmarks])

  // 切换稍后阅读（乐观更新）
  const toggleReadLater = useCallback(async (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id)
    if (!bookmark) return

    const newIsReadLater = !bookmark.isReadLater
    const optimisticData = bookmarks.map(b => 
      b.id === id 
        ? { ...b, isReadLater: newIsReadLater, isRead: newIsReadLater ? false : b.isRead }
        : b
    )

    await optimisticBookmarks(
      optimisticData,
      async () => {
        const updated = await api.updateBookmark(id, { 
          isReadLater: newIsReadLater,
          isRead: newIsReadLater ? false : bookmark.isRead,
        })
        return bookmarks.map(b => b.id === id ? updated : b)
      },
      {
        onError: (err) => {
          console.error('切换稍后阅读失败:', err)
        },
      }
    )
  }, [bookmarks, optimisticBookmarks])

  // 标记已读/未读（乐观更新）
  const toggleRead = useCallback(async (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id)
    if (!bookmark) return

    const newIsRead = !bookmark.isRead
    const optimisticData = bookmarks.map(b => 
      b.id === id ? { ...b, isRead: newIsRead } : b
    )

    await optimisticBookmarks(
      optimisticData,
      async () => {
        const updated = await api.updateBookmark(id, { isRead: newIsRead })
        return bookmarks.map(b => b.id === id ? updated : b)
      },
      {
        onError: (err) => {
          console.error('切换已读失败:', err)
        },
      }
    )
  }, [bookmarks, optimisticBookmarks])

  // 添加分类
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'orderIndex'>) => {
    const newCategory = await api.createCategory({
      name: category.name,
      icon: category.icon,
      color: category.color || '#667eea',
    })
    setCategories(prev => [...prev, newCategory])
    return newCategory
  }, [])

  // 追加分类到本地状态
  const appendCategory = useCallback((category: Category) => {
    setCategories(prev => {
      if (prev.some(c => c.id === category.id)) {
        return prev
      }
      return [...prev, category]
    })
  }, [])

  // 更新分类
  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const updated = await api.updateCategory(id, updates)
    setCategories(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }, [])

  // 删除分类
  const deleteCategory = useCallback(async (id: string) => {
    await api.deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
    // 将该分类下的书签设为未分类
    setBookmarks(prev => prev.map(b => 
      b.category === id ? { ...b, category: undefined } : b
    ))
  }, [])

  // 重排序分类
  const reorderCategories = useCallback(async (reorderedCategories: Category[]) => {
    const items = reorderedCategories.map((c, index) => ({
      id: c.id,
      orderIndex: index,
    }))
    await api.reorderCategories(items)
    setCategories(reorderedCategories.map((c, index) => ({ ...c, orderIndex: index })))
  }, [])

  // 计算属性
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return a.orderIndex - b.orderIndex
    })
  }, [bookmarks])

  const bookmarksByCategory = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = sortedBookmarks.filter(b => b.category === category.id)
      return acc
    }, {} as Record<string, Bookmark[]>)
  }, [categories, sortedBookmarks])

  const uncategorizedBookmarks = useMemo(() => {
    return sortedBookmarks.filter(b => !b.category)
  }, [sortedBookmarks])

  const readLaterBookmarks = useMemo(() => {
    return sortedBookmarks.filter(b => b.isReadLater && !b.isRead)
  }, [sortedBookmarks])

  return {
    // 数据
    bookmarks: sortedBookmarks,
    categories,
    customIcons,
    // 状态
    isLoading,
    error,
    newlyAddedId,
    // 书签操作
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    togglePin,
    toggleReadLater,
    toggleRead,
    // 分类操作
    addCategory,
    appendCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    // 自定义图标操作
    addCustomIcon,
    deleteCustomIcon,
    updateCustomIcon,
    // 计算属性
    bookmarksByCategory,
    uncategorizedBookmarks,
    readLaterBookmarks,
    // 数据刷新
    refreshData,
  }
}

export default useBookmarkStore
