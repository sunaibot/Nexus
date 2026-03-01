import { useState, useCallback, useEffect } from 'react'
import { Bookmark } from '../../../types/bookmark'
import {
  fetchBookmarksPaginated,
  updateBookmark,
  deleteBookmark,
  changeBookmarkVisibility,
  type PaginationParams,
  type PaginatedResponse,
  type UpdateBookmarkParams,
} from '../../../lib/api'

export interface LinkHealth {
  status: 'healthy' | 'warning' | 'error' | 'unchecked'
  statusCode?: number
  responseTime?: number
  lastChecked?: string
  error?: string
}

export interface UseBookmarksOptions {
  pageSize?: number
  defaultPage?: number
  defaultSortBy?: 'createdAt' | 'updatedAt' | 'title' | 'orderIndex'
  defaultSortOrder?: 'asc' | 'desc'
}

export function useBookmarks(options: UseBookmarksOptions = {}) {
  const { pageSize = 20, defaultPage = 1, defaultSortBy = 'orderIndex', defaultSortOrder = 'asc' } = options

  const [page, setPage] = useState(defaultPage)
  const [bookmarkData, setBookmarkData] = useState<PaginatedResponse<Bookmark> | null>(null)
  const [healthMap, setHealthMap] = useState<Record<string, LinkHealth>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'personal' | 'private'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'warning' | 'error' | 'unchecked'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title' | 'orderIndex'>(defaultSortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder)

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: PaginationParams = {
        page,
        pageSize,
        sortBy,
        sortOrder,
      }

      if (searchQuery) params.search = searchQuery
      if (categoryFilter !== 'all') params.category = categoryFilter

      const data = await fetchBookmarksPaginated(params)
      console.log('[useBookmarks] API response:', data)
      
      let items = data.items || []
      console.log('[useBookmarks] Items before filter:', items.length)
      
      if (visibilityFilter !== 'all') {
        items = items.filter((b: Bookmark) => b.visibility === visibilityFilter)
      }
      
      if (healthFilter !== 'all') {
        items = items.filter((b: Bookmark) => {
          const health = healthMap[b.id]?.status || 'unchecked'
          return health === healthFilter
        })
      }
      console.log('[useBookmarks] Items after filter:', items.length)

      setBookmarkData({
        ...data,
        items,
        pagination: {
          ...data.pagination,
          total: items.length,
        },
      })
    } catch (err: any) {
      setError(err.message || '加载书签失败')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, searchQuery, visibilityFilter, categoryFilter, healthFilter, sortBy, sortOrder, healthMap])

  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  const refresh = useCallback(() => {
    setPage(1)
    loadBookmarks()
  }, [loadBookmarks])

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && (!bookmarkData || !bookmarkData.pagination || newPage <= bookmarkData.pagination.totalPages)) {
      setPage(newPage)
    }
  }, [bookmarkData])

  const handleUpdateBookmark = useCallback(async (id: string, data: Partial<Bookmark>) => {
    try {
      // 转换 tags 从 string[] 为 string
      const apiData: UpdateBookmarkParams = {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : data.tags === undefined ? undefined : null,
      }
      await updateBookmark(id, apiData)
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || '更新书签失败')
      return false
    }
  }, [refresh])

  const handleDeleteBookmark = useCallback(async (id: string) => {
    try {
      await deleteBookmark(id)
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || '删除书签失败')
      return false
    }
  }, [refresh])

  const handleChangeVisibility = useCallback(async (id: string, visibility: 'public' | 'personal' | 'private') => {
    try {
      await changeBookmarkVisibility(id, visibility)
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || '更新可见性失败')
      return false
    }
  }, [refresh])

  const handleSetPrivate = useCallback(async (id: string) => {
    try {
      await changeBookmarkVisibility(id, 'private')
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || '设置私密失败')
      return false
    }
  }, [refresh])

  const handleRemovePrivate = useCallback(async (id: string) => {
    try {
      await changeBookmarkVisibility(id, 'personal')
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || '移除私密失败')
      return false
    }
  }, [refresh])

  const checkLinkHealth = useCallback(async (url: string): Promise<LinkHealth> => {
    const startTime = Date.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        statusCode: 200,
        responseTime,
        lastChecked: new Date().toISOString(),
      }
    } catch (err: any) {
      const responseTime = Date.now() - startTime
      return {
        status: 'warning',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: err.message,
      }
    }
  }, [])

  const checkSingleLink = useCallback(async (bookmark: Bookmark) => {
    const health = await checkLinkHealth(bookmark.url)
    setHealthMap(prev => ({ ...prev, [bookmark.id]: health }))
  }, [checkLinkHealth])

  const checkAllLinks = useCallback(async () => {
    if (!bookmarkData) return
    const items = bookmarkData.items || []
    if (items.length === 0) return

    setIsCheckingHealth(true)
    const newHealthMap: Record<string, LinkHealth> = { ...healthMap }

    try {
      for (const bookmark of items) {
        const health = await checkLinkHealth(bookmark.url)
        newHealthMap[bookmark.id] = health
        setHealthMap({ ...newHealthMap })
      }
    } catch (err: any) {
      setError(err.message || '链接检查失败')
    } finally {
      setIsCheckingHealth(false)
    }
  }, [bookmarkData, healthMap, checkLinkHealth])

  const deleteDeadLinks = useCallback(async () => {
    const items = bookmarkData?.items || []
    const deadLinks = items.filter(b => healthMap[b.id]?.status === 'error' || healthMap[b.id]?.status === 'warning')
    
    if (deadLinks.length === 0) {
      return { success: false, message: '没有发现死链' }
    }

    try {
      await Promise.all(deadLinks.map(b => deleteBookmark(b.id)))
      refresh()
      return { success: true, count: deadLinks.length }
    } catch (err: any) {
      setError(err.message || '删除死链失败')
      return { success: false, message: err.message || '删除死链失败' }
    }
  }, [bookmarkData, healthMap, refresh])

  return {
    page,
    setPage,
    bookmarkData,
    healthMap,
    isLoading,
    isCheckingHealth,
    error,
    searchQuery,
    setSearchQuery,
    visibilityFilter,
    setVisibilityFilter,
    categoryFilter,
    setCategoryFilter,
    healthFilter,
    setHealthFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    loadBookmarks,
    refresh,
    goToPage,
    updateBookmark: handleUpdateBookmark,
    deleteBookmark: handleDeleteBookmark,
    changeVisibility: handleChangeVisibility,
    setPrivate: handleSetPrivate,
    removePrivate: handleRemovePrivate,
    checkLinkHealth,
    checkSingleLink,
    checkAllLinks,
    deleteDeadLinks,
  }
}
