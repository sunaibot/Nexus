import { useState, useEffect, useCallback, useRef } from 'react'
import { Bookmark, Category, CustomIcon } from '../types/bookmark'
import * as api from '../lib/api'
import { STORAGE_KEYS } from '../lib/storage-keys'

// 自定义图标本地存储 Key
const CUSTOM_ICONS_KEY = STORAGE_KEYS.CUSTOM.ICONS

export function useBookmarkStore() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 使用 ref 保存最新的 bookmarks，避免 useCallback 依赖问题
  const bookmarksRef = useRef(bookmarks)
  bookmarksRef.current = bookmarks

  // 加载自定义图标
  const loadCustomIcons = useCallback(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_ICONS_KEY)
      if (stored) {
        setCustomIcons(JSON.parse(stored))
      }
    } catch (err) {
      console.error('加载自定义图标失败:', err)
    }
  }, [])

  // 保存自定义图标到本地存储
  const saveCustomIcons = useCallback((icons: CustomIcon[]) => {
    try {
      localStorage.setItem(CUSTOM_ICONS_KEY, JSON.stringify(icons))
    } catch (err) {
      console.error('保存自定义图标失败:', err)
    }
  }, [])

  // 加载数据函数
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [bookmarksData, categoriesData] = await Promise.all([
        api.fetchPublicBookmarks(),
        api.fetchPublicCategories(),
      ])
      setBookmarks(bookmarksData)
      setCategories(categoriesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败'
      setError(errorMessage)
      console.error('加载数据失败:', err)
      // 不清空已有数据，避免页面闪烁
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始加载数据
  useEffect(() => {
    loadData()
    loadCustomIcons()
  }, [loadData, loadCustomIcons])

  // 刷新数据（导入后调用）
  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  // 添加书签
  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBookmark = await api.createBookmark({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        favicon: bookmark.favicon,
        icon: bookmark.icon,
        iconUrl: bookmark.iconUrl,
        ogImage: bookmark.ogImage,
        category: bookmark.category,
        tags: Array.isArray(bookmark.tags) ? bookmark.tags : bookmark.tags ? [bookmark.tags] : undefined,
        isReadLater: bookmark.isReadLater,
      })
      
      setBookmarks(prev => [...prev, newBookmark])
      
      // 标记新添加的书签
      setNewlyAddedId(newBookmark.id)
      setTimeout(() => setNewlyAddedId(null), 2000)
      
      return newBookmark
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加书签失败'
      console.error('添加书签失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 更新书签
  const updateBookmark = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    try {
      const updated = await api.updateBookmark(id, updates)
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新书签失败'
      console.error('更新书签失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 删除书签
  const deleteBookmark = useCallback(async (id: string) => {
    try {
      await api.deleteBookmark(id)
      setBookmarks(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除书签失败'
      console.error('删除书签失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 重排序书签
  const reorderBookmarks = useCallback(async (reorderedBookmarks: Bookmark[]) => {
    try {
      const items = reorderedBookmarks.map((b, index) => ({
        id: b.id,
        orderIndex: index,
      }))
      await api.reorderBookmarks(items)
      setBookmarks(reorderedBookmarks.map((b, index) => ({ ...b, orderIndex: index })))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重排序失败'
      console.error('重排序失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 切换置顶
  const togglePin = useCallback(async (id: string) => {
    const bookmark = bookmarksRef.current.find(b => b.id === id)
    if (!bookmark) return
    
    try {
      const updated = await api.updateBookmark(id, { isPinned: !bookmark.isPinned })
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败'
      console.error('切换置顶失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 切换稍后阅读
  const toggleReadLater = useCallback(async (id: string) => {
    const bookmark = bookmarksRef.current.find(b => b.id === id)
    if (!bookmark) return
    
    try {
      const updated = await api.updateBookmark(id, { isReadLater: !bookmark.isReadLater })
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败'
      console.error('切换稍后阅读失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 标记为已读
  const markAsRead = useCallback(async (id: string) => {
    try {
      const updated = await api.updateBookmark(id, { isRead: true })
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '标记已读失败'
      console.error('标记已读失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 添加分类
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCategory = await api.createCategory({
        name: category.name,
        icon: category.icon,
        color: category.color || '#3b82f6',
      })
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加分类失败'
      console.error('添加分类失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 更新分类
  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const updated = await api.updateCategory(id, updates)
      setCategories(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新分类失败'
      console.error('更新分类失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 删除分类
  const deleteCategory = useCallback(async (id: string) => {
    try {
      await api.deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      // 将该分类下的书签设为未分类
      setBookmarks(prev => prev.map(b => b.category === id ? { ...b, category: undefined } : b))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除分类失败'
      console.error('删除分类失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 重排序分类
  const reorderCategories = useCallback(async (reorderedCategories: Category[]) => {
    try {
      const items = reorderedCategories.map((c, index) => ({
        id: c.id,
        orderIndex: index,
      }))
      await api.reorderCategories(items)
      setCategories(reorderedCategories.map((c, index) => ({ ...c, orderIndex: index })))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重排序失败'
      console.error('分类重排序失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 添加自定义图标
  const addCustomIcon = useCallback((icon: Omit<CustomIcon, 'id' | 'createdAt'>) => {
    const newIcon: CustomIcon = {
      ...icon,
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
    }
    const updated = [...customIcons, newIcon]
    setCustomIcons(updated)
    saveCustomIcons(updated)
    return newIcon
  }, [customIcons, saveCustomIcons])

  // 删除自定义图标
  const deleteCustomIcon = useCallback((id: string) => {
    const updated = customIcons.filter(i => i.id !== id)
    setCustomIcons(updated)
    saveCustomIcons(updated)
  }, [customIcons, saveCustomIcons])

  return {
    bookmarks,
    categories,
    customIcons,
    isLoading,
    error,
    newlyAddedId,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    markAsRead,
    reorderBookmarks,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addCustomIcon,
    deleteCustomIcon,
    refreshData,
  }
}
