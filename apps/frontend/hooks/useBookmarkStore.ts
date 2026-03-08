import { useState, useEffect, useCallback, useRef } from 'react'
import { Bookmark, Category, CustomIcon } from '../types/bookmark'
import { Tab } from '../types'
import {
  fetchBookmarks,
  fetchMergedBookmarks,
  fetchCategories,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
  createCategory,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
  reorderCategories as reorderCategoriesApi,
  fetchTabs,
  createTab,
  updateTab,
  deleteTab,
  reorderTabs,
} from '../lib/api-client'
import * as customIconsApi from '../lib/api-client/custom-icons'

// 加载状态类型
interface LoadingState {
  bookmarks: boolean
  categories: boolean
  icons: boolean
  tabs: boolean
}

// 错误状态类型
interface ErrorState {
  bookmarks: string | null
  categories: string | null
  icons: string | null
  tabs: string | null
}

export function useBookmarkStore() {
  // 数据状态
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([])
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // 加载状态
  const [isLoading, setIsLoading] = useState(true)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    bookmarks: false,
    categories: false,
    icons: false,
    tabs: false,
  })

  // 错误状态
  const [error, setError] = useState<string | null>(null)
  const [errorState, setErrorState] = useState<ErrorState>({
    bookmarks: null,
    categories: null,
    icons: null,
    tabs: null,
  })

  // 其他状态
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)

  // 使用 ref 保存最新的 bookmarks，避免 useCallback 依赖问题
  const bookmarksRef = useRef(bookmarks)
  bookmarksRef.current = bookmarks

  // 设置加载状态辅助函数
  const setLoading = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoadingState(prev => ({ ...prev, [key]: value }))
  }, [])

  // 设置错误状态辅助函数
  const setErrorFor = useCallback((key: keyof ErrorState, value: string | null) => {
    setErrorState(prev => ({ ...prev, [key]: value }))
  }, [])

  // 加载自定义图标
  const loadCustomIcons = useCallback(async () => {
    setLoading('icons', true)
    setErrorFor('icons', null)
    try {
      const icons = await customIconsApi.fetchCustomIcons()
      // 确保 icons 是数组
      const iconsArray = Array.isArray(icons) ? icons : []
      setCustomIcons(iconsArray.map(icon => ({
        id: icon.id,
        name: icon.name,
        url: icon.url,
        createdAt: new Date(icon.createdAt).getTime(),
      })))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载自定义图标失败'
      setErrorFor('icons', errorMessage)
      console.error('加载自定义图标失败:', err)
    } finally {
      setLoading('icons', false)
    }
  }, [setLoading, setErrorFor])

  // 加载数据函数
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setLoading('bookmarks', true)
    setLoading('categories', true)
    setErrorFor('bookmarks', null)
    setErrorFor('categories', null)

    try {
      const [bookmarksData, categoriesData] = await Promise.all([
        fetchMergedBookmarks(),
        fetchCategories(),
      ])
      setBookmarks(bookmarksData)
      setCategories(categoriesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败'
      setError(errorMessage)
      setErrorFor('bookmarks', errorMessage)
      setErrorFor('categories', errorMessage)
      console.error('加载数据失败:', err)
    } finally {
      setIsLoading(false)
      setLoading('bookmarks', false)
      setLoading('categories', false)
    }
  }, [setLoading, setErrorFor])

  // 加载 Tabs
  const loadTabs = useCallback(async () => {
    setLoading('tabs', true)
    setErrorFor('tabs', null)
    try {
      const tabsData = await fetchTabs()
      setTabs(tabsData)
      // 如果没有选中的 Tab，选择默认 Tab 或第一个
      if (!activeTabId && tabsData.length > 0) {
        const defaultTab = tabsData.find(t => t.isDefault) || tabsData[0]
        setActiveTabId(defaultTab.id)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载 Tab 失败'
      setErrorFor('tabs', errorMessage)
      console.error('加载 Tab 失败:', err)
    } finally {
      setLoading('tabs', false)
    }
  }, [activeTabId, setLoading, setErrorFor])

  // 初始加载数据
  useEffect(() => {
    loadData()
    loadCustomIcons()
    loadTabs()
  }, [loadData, loadCustomIcons, loadTabs])

  // 刷新数据（导入后调用）
  const refreshData = useCallback(async () => {
    await loadData()
    await loadCustomIcons()
    await loadTabs()
  }, [loadData, loadCustomIcons, loadTabs])

  // ========== Tab 操作 ==========

  // 切换 Tab
  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  // 添加 Tab
  const addTab = useCallback(async (tab: Omit<Tab, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTab = await createTab({
        name: tab.name,
        icon: tab.icon,
        color: tab.color,
        categoryIds: tab.categories?.map(c => c.id),
      })
      setTabs(prev => [...prev, newTab])
      return newTab
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加 Tab 失败'
      console.error('添加 Tab 失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 更新 Tab
  const updateTabFunc = useCallback(async (id: string, updates: Partial<Tab>) => {
    try {
      const updated = await updateTab(id, {
        name: updates.name,
        icon: updates.icon,
        color: updates.color,
        categoryIds: updates.categories?.map(c => c.id),
        isDefault: updates.isDefault,
      })
      setTabs(prev => prev.map(t => t.id === id ? updated : t))
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新 Tab 失败'
      console.error('更新 Tab 失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 删除 Tab
  const deleteTabFunc = useCallback(async (id: string) => {
    try {
      await deleteTab(id)
      setTabs(prev => prev.filter(t => t.id !== id))
      // 如果删除的是当前选中的 Tab，切换到第一个
      if (activeTabId === id) {
        const remaining = tabs.filter(t => t.id !== id)
        if (remaining.length > 0) {
          setActiveTabId(remaining[0].id)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除 Tab 失败'
      console.error('删除 Tab 失败:', err)
      throw new Error(errorMessage)
    }
  }, [activeTabId, tabs])

  // 重排序 Tab
  const reorderTabsFunc = useCallback(async (reorderedTabs: Tab[]) => {
    try {
      const items = reorderedTabs.map((t, index) => ({
        id: t.id,
        orderIndex: index,
      }))
      await reorderTabs(items)
      setTabs(reorderedTabs.map((t, index) => ({ ...t, orderIndex: index })))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重排序失败'
      console.error('Tab 重排序失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // ========== 书签操作 ==========

  // 添加书签
  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBookmark = await createBookmark({
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
  const updateBookmarkFunc = useCallback(async (id: string, updates: Partial<Bookmark>) => {
    try {
      const updated = await updateBookmark(id, updates)
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新书签失败'
      console.error('更新书签失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 删除书签
  const deleteBookmarkFunc = useCallback(async (id: string) => {
    try {
      await deleteBookmark(id)
      setBookmarks(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除书签失败'
      console.error('删除书签失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 重排序书签
  const reorderBookmarksFunc = useCallback(async (reorderedBookmarks: Bookmark[]) => {
    try {
      const items = reorderedBookmarks.map((b, index) => ({
        id: b.id,
        orderIndex: index,
      }))
      await reorderBookmarks(items)
      setBookmarks(reorderedBookmarks.map((b, index) => ({ ...b, orderIndex: index })))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重排序失败'
      console.error('重排序失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 切换置顶
  const togglePin = useCallback(async (id: string) => {
    // console.log('[togglePin] called with id:', id)
    const bookmark = bookmarksRef.current.find(b => b.id === id)
    if (!bookmark) {
      // console.log('[togglePin] bookmark not found')
      return
    }

    try {
      // console.log('[togglePin] calling updateBookmark with isPinned:', !bookmark.isPinned)
      const updated = await updateBookmark(id, { isPinned: !bookmark.isPinned })
      // console.log('[togglePin] updateBookmark success:', updated)
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败'
      console.error('[togglePin] 切换置顶失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 切换稍后阅读
  const toggleReadLater = useCallback(async (id: string) => {
    const bookmark = bookmarksRef.current.find(b => b.id === id)
    if (!bookmark) return

    try {
      const updated = await updateBookmark(id, { isReadLater: !bookmark.isReadLater })
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
      const updated = await updateBookmark(id, { isRead: true })
      setBookmarks(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '标记已读失败'
      console.error('标记已读失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // ========== 分类操作 ==========

  // 添加分类
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCategory = await createCategory({
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
      const updated = await updateCategoryApi(id, updates)
      setCategories(prev => prev.map(c => c.id === id ? updated : c))
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新分类失败'
      console.error('更新分类失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // 删除分类
  const deleteCategory = useCallback(async (id: string) => {
    try {
      await deleteCategoryApi(id)
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
      await reorderCategoriesApi(items)
      setCategories(reorderedCategories.map((c, index) => ({ ...c, orderIndex: index })))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重排序失败'
      console.error('分类重排序失败:', err)
      throw new Error(errorMessage)
    }
  }, [])

  // ========== 自定义图标操作 ==========

  // 添加自定义图标
  const addCustomIcon = useCallback(async (icon: Omit<CustomIcon, 'id' | 'createdAt'>) => {
    try {
      const newIcon = await customIconsApi.createCustomIcon({
        name: icon.name,
        url: icon.url,
        isPublic: false,
      })
      const customIcon: CustomIcon = {
        id: newIcon.id,
        name: newIcon.name,
        url: newIcon.url,
        createdAt: new Date(newIcon.createdAt).getTime(),
      }
      setCustomIcons(prev => [...prev, customIcon])
      return customIcon
    } catch (err) {
      console.error('添加自定义图标失败:', err)
      throw err
    }
  }, [])

  // 删除自定义图标
  const deleteCustomIcon = useCallback(async (id: string) => {
    try {
      await customIconsApi.deleteCustomIcon(id)
      setCustomIcons(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('删除自定义图标失败:', err)
      throw err
    }
  }, [])

  return {
    // 数据
    bookmarks,
    categories,
    customIcons,
    tabs,
    activeTabId,

    // 状态
    isLoading,
    error,
    loadingState,
    errorState,
    newlyAddedId,

    // 书签操作
    addBookmark,
    updateBookmark: updateBookmarkFunc,
    deleteBookmark: deleteBookmarkFunc,
    togglePin,
    toggleReadLater,
    markAsRead,
    reorderBookmarks: reorderBookmarksFunc,

    // 分类操作
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Tab 操作
    switchTab,
    addTab,
    updateTab: updateTabFunc,
    deleteTab: deleteTabFunc,
    reorderTabs: reorderTabsFunc,

    // 图标操作
    addCustomIcon,
    deleteCustomIcon,

    // 数据刷新
    refreshData,
  }
}
