/**
 * 首页业务逻辑 Hook
 * 整合首页所需的所有状态和逻辑
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBookmarkStore } from './useBookmarkStore'
import { useAuth } from './useAuth'
import { useSiteSettings } from './useSiteSettings'
import { useThemeContext } from './useTheme'
import { useTime } from './useTime'
import { useWeather } from './useWeather'
import type { Bookmark } from '../types/bookmark'

export function useHomePage() {
  // 书签数据
  const {
    bookmarks,
    categories,
    customIcons,
    tabs,
    activeTabId,
    isLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    reorderBookmarks,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addCustomIcon,
    deleteCustomIcon,
    refreshData,
    switchTab,
    addTab,
    updateTab,
    deleteTab,
    reorderTabs,
  } = useBookmarkStore()

  // 认证状态
  const {
    currentPage,
    adminUsername,
    isLoggedIn,
    setCurrentPage,
    handleAdminLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,
  } = useAuth()

  // 主题和设置
  const { isDark, setTheme, themeId } = useThemeContext()
  const { isLiteMode, siteSettings, settingsLoaded, widgetVisibility } = useSiteSettings()

  // 时间和天气
  const { formattedTime, formattedDate, lunarDate, greeting } = useTime()
  const { weather, loading: weatherLoading, refresh: refreshWeather } = useWeather()

  // 本地状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showPrivateBookmarks, setShowPrivateBookmarks] = useState(false)
  const [showReadLaterOnly, setShowReadLaterOnly] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  // 同步主题设置
  useEffect(() => {
    if (settingsLoaded && siteSettings.themeId && siteSettings.themeId !== themeId) {
      console.log('[HomePage] Syncing theme from siteSettings:', siteSettings.themeId)
      setTheme(siteSettings.themeId as any)
    }
  }, [settingsLoaded, siteSettings.themeId, themeId, setTheme])

  // 登出时退出编辑模式
  useEffect(() => {
    if (!isLoggedIn) {
      setIsEditMode(false)
      setShowPrivateBookmarks(false)
    }
  }, [isLoggedIn])

  // 登录后自动显示私密书签
  useEffect(() => {
    if (isLoggedIn) {
      setShowPrivateBookmarks(true)
    }
  }, [isLoggedIn])

  // 壁纸设置
  const wallpaper = siteSettings.wallpaper
  const hasWallpaper = wallpaper?.enabled && (wallpaper?.imageUrl || wallpaper?.imageData)

  // 背景样式
  const backgroundStyle = useMemo<React.CSSProperties>(() => {
    if (!hasWallpaper) return {}
    return {
      backgroundImage: `url(${wallpaper?.imageUrl || wallpaper?.imageData})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }
  }, [hasWallpaper, wallpaper])

  // 遮罩样式
  const overlayStyle = useMemo<React.CSSProperties>(() => {
    if (!hasWallpaper) return {}
    return {
      position: 'fixed',
      inset: 0,
      backgroundColor: `rgba(0, 0, 0, ${(wallpaper?.overlay ?? 30) / 100})`,
      backdropFilter: `blur(${wallpaper?.blur ?? 0}px)`,
      zIndex: 0,
      pointerEvents: 'none',
    }
  }, [hasWallpaper, wallpaper])

  // 稍后阅读书签
  const readLaterBookmarks = useMemo(() => {
    return bookmarks.filter(b => b.isReadLater)
  }, [bookmarks])

  // 置顶书签（排除稍后阅读的书签）
  const pinnedBookmark = useMemo(() => {
    return bookmarks.find(b => b.isPinned && !b.isReadLater) || null
  }, [bookmarks])

  // 根据当前 Tab 过滤分类
  const filteredCategories = useMemo(() => {
    if (!activeTabId) return categories
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (!activeTab || !activeTab.categories) return categories
    // 获取 Tab 关联的分类 ID 列表
    const tabCategoryIds = activeTab.categories.map(c => c.id)
    // 返回包含这些分类的书签
    return categories.filter(c => tabCategoryIds.includes(c.id))
  }, [categories, tabs, activeTabId])

  // 过滤后的书签（根据 Tab 和稍后阅读模式）
  const filteredBookmarks = useMemo(() => {
    // 稍后阅读模式：显示所有稍后阅读的书签（不受 Tab 限制）
    if (showReadLaterOnly) {
      return bookmarks.filter(b => b.isReadLater)
    }
    
    let result = bookmarks
    
    // 根据 Tab 过滤
    if (activeTabId) {
      const activeTab = tabs.find(t => t.id === activeTabId)
      if (activeTab && activeTab.categories) {
        const tabCategoryIds = activeTab.categories.map(c => c.id)
        result = result.filter(b => {
          // 如果书签没有分类，显示在第一个 Tab 或默认 Tab
          if (!b.category) {
            return activeTab.isDefault || tabs[0]?.id === activeTabId
          }
          return tabCategoryIds.includes(b.category)
        })
      }
    }
    
    // 正常模式：排除稍后阅读的书签（它们只在稍后阅读标签页显示）
    return result.filter(b => {
      // 排除稍后阅读的书签
      if (b.isReadLater) return false
      // 私密书签过滤
      const matchesPrivate = b.visibility !== 'private' || showPrivateBookmarks
      return matchesPrivate
    })
  }, [bookmarks, tabs, activeTabId, showReadLaterOnly, showPrivateBookmarks])

  // 事件处理
  const handleLogin = useCallback(async (username: string) => {
    handleAdminLogin(username, false)
  }, [handleAdminLogin])

  const handleMarkRead = useCallback((id: string) => {
    toggleReadLater(id)
  }, [toggleReadLater])

  const handleRemoveBookmark = useCallback((id: string) => {
    deleteBookmark(id)
  }, [deleteBookmark])

  const handleAddBookmarkFromPalette = useCallback((_url: string) => {
    setShowCommandPalette(false)
    setShowAddModal(true)
  }, [])

  const handleCategoryAdded = useCallback((category: any) => {
    addCategory(category)
  }, [addCategory])

  const handleOpenSearch = useCallback(() => {
    setShowCommandPalette(true)
  }, [])

  const handleBookmarkEdit = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setShowAddModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false)
    setEditingBookmark(null)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 计算当前显示的 activeTabId（包含稍后阅读虚拟 TAB）
  const displayActiveTabId = useMemo(() => {
    if (showReadLaterOnly) {
      return '__read_later__'
    }
    return activeTabId
  }, [showReadLaterOnly, activeTabId])

  return {
    // 数据
    bookmarks,
    categories,
    customIcons,
    tabs,
    activeTabId: displayActiveTabId,
    filteredCategories,
    filteredBookmarks,
    readLaterBookmarks,
    pinnedBookmark,
    isLoading,

    // 状态
    isDark,
    isLiteMode,
    isLoggedIn,
    isEditMode,
    adminUsername,
    currentPage,
    showPrivateBookmarks,
    showReadLaterOnly,
    widgetVisibility,
    siteSettings,

    // 时间和天气
    formattedTime,
    formattedDate,
    lunarDate,
    greeting,
    weather,
    weatherLoading,

    // UI 状态
    showAddModal,
    showCommandPalette,
    backgroundStyle,
    overlayStyle,
    hasWallpaper,
    editingBookmark,

    // 操作
    setShowAddModal,
    setShowCommandPalette,
    setIsEditMode,
    setShowPrivateBookmarks,
    setShowReadLaterOnly,
    setCurrentPage,
    refreshWeather,
    handleCloseModal,

    // 书签操作
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    reorderBookmarks,

    // 分类操作
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Tab 操作
    switchTab,
    addTab,
    updateTab,
    deleteTab,
    reorderTabs,

    // 图标操作
    addCustomIcon,
    deleteCustomIcon,
    refreshData,

    // 认证操作
    handleLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,

    // 事件处理
    handleMarkRead,
    handleRemoveBookmark,
    handleAddBookmarkFromPalette,
    handleCategoryAdded,
    handleOpenSearch,
    handleBookmarkEdit,
  }
}
