/**
 * 首页数据 Hook
 * 整合首页所需的各类数据
 */

import { useMemo, useEffect } from 'react'
import { useBookmarkOperations } from './useBookmarkOperations'
import { useCategoryOperations } from './useCategoryOperations'
import { useAuth } from '../useAuth'
import { useSiteSettings } from '../useSiteSettings'
import { useThemeContext } from '../useTheme'
import { useTime } from '../useTime'
import { useWeather } from '../useWeather'
import type { Bookmark } from '../../types/bookmark'

export function useHomePageData() {
  // 书签和分类数据
  const {
    bookmarks,
    isLoading: bookmarksLoading,
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
  } = useBookmarkOperations()

  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryName,
    getCategoryIcon,
  } = useCategoryOperations()

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

  // 同步主题设置
  useEffect(() => {
    if (settingsLoaded && siteSettings.themeId && siteSettings.themeId !== themeId) {
      console.log('[HomePage] Syncing theme from siteSettings:', siteSettings.themeId)
      setTheme(siteSettings.themeId as any)
    }
  }, [settingsLoaded, siteSettings.themeId, themeId, setTheme])

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

  // 数据计算
  const readLaterBookmarks = useMemo(() => getReadLaterBookmarks(), [getReadLaterBookmarks])
  const pinnedBookmark = useMemo(() => getPinnedBookmark(), [getPinnedBookmark])

  return {
    // 原始数据
    bookmarks,
    categories,
    isLoading: bookmarksLoading,

    // 计算数据
    readLaterBookmarks,
    pinnedBookmark,

    // 主题和设置
    isDark,
    isLiteMode,
    siteSettings,
    widgetVisibility,
    backgroundStyle,
    overlayStyle,
    hasWallpaper,

    // 认证
    currentPage,
    adminUsername,
    isLoggedIn,

    // 时间和天气
    formattedTime,
    formattedDate,
    lunarDate,
    greeting,
    weather,
    weatherLoading,

    // 操作
    setCurrentPage,
    setTheme,
    refreshWeather,
    refreshData,

    // 书签操作
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    markAsRead,
    removeBookmark,
    editBookmark,

    // 分类操作
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryName,
    getCategoryIcon,

    // 认证操作
    handleAdminLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,
  }
}
