import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Plus,
  Filter,
  Settings,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Bookmark, Category, CustomIcon } from '../../../types/bookmark'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import { useBookmarks } from '../hooks'
import { BookmarkTable } from './BookmarkTable'

interface BookmarkManagerProps {
  categories: Category[]
  customIcons: CustomIcon[]
  onAddBookmark?: () => void
  onEditBookmark?: (bookmark: Bookmark) => void
  onAddCustomIcon?: (icon: Omit<CustomIcon, 'id' | 'createdAt'>) => void
  onDeleteCustomIcon?: (id: string) => void
  onDeleteBookmark?: (id: string) => void
  refreshTrigger?: number
}

type VisibilityFilter = 'all' | 'public' | 'personal' | 'private'
type HealthStatus = 'all' | 'healthy' | 'warning' | 'error' | 'unchecked'
type SortField = 'createdAt' | 'updatedAt' | 'title' | 'orderIndex'
type SortOrder = 'asc' | 'desc'

export function BookmarkManager({
  categories,
  customIcons,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  refreshTrigger,
}: BookmarkManagerProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  const {
    page,
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
    refresh,
    goToPage,
    updateBookmark,
    deleteBookmark: deleteBookmarkHook,
    changeVisibility,
    removePrivate,
    checkSingleLink,
    checkAllLinks,
    deleteDeadLinks,
  } = useBookmarks()

  // 监听 refreshTrigger 变化，刷新书签列表
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refresh()
    }
  }, [refreshTrigger, refresh])

  const handleDeleteBookmark = useCallback(async (id: string) => {
    const success = await deleteBookmarkHook(id)
    if (success) {
      if (onDeleteBookmark) {
        onDeleteBookmark(id)
      }
      showToast('success', t('admin.bookmark.deleted'))
    } else {
      showToast('error', '删除书签失败')
    }
    return success
  }, [deleteBookmarkHook, onDeleteBookmark, showToast, t])

  const handleTogglePin = useCallback(async (bookmark: Bookmark) => {
    const success = await updateBookmark(bookmark.id, { isPinned: !bookmark.isPinned })
    if (!success) {
      showToast('error', '操作失败')
    }
    return success
  }, [updateBookmark, showToast])

  const handleToggleReadLater = useCallback(async (bookmark: Bookmark) => {
    const success = await updateBookmark(bookmark.id, { 
      isReadLater: !bookmark.isReadLater,
      isRead: !bookmark.isReadLater ? false : bookmark.isRead,
    })
    if (!success) {
      showToast('error', '操作失败')
    }
    return success
  }, [updateBookmark, showToast])

  const handleChangeVisibility = useCallback(async (bookmark: Bookmark, visibility: 'public' | 'personal' | 'private') => {
    const success = await changeVisibility(bookmark.id, visibility)
    if (success) {
      showToast('success', '可见性已更新')
    } else {
      showToast('error', '更新失败')
    }
    return success
  }, [changeVisibility, showToast])

  const handleRemovePrivate = useCallback(async (bookmarkId: string) => {
    const success = await removePrivate(bookmarkId)
    if (success) {
      showToast('success', '私密已移除')
    } else {
      showToast('error', '移除私密失败')
    }
    return success
  }, [removePrivate, showToast])

  const handleDeleteDeadLinks = useCallback(async () => {
    const result = await deleteDeadLinks()
    if (result.success) {
      showToast('success', `已删除 ${result.count} 个死链`)
    } else {
      showToast('info', result.message)
    }
  }, [deleteDeadLinks, showToast])

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative" style={{ width: '200px', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="搜索书签..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); goToPage(1) }}
          className="w-full pl-3 pr-10 py-2.5 rounded-lg focus:outline-none transition-all text-sm"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="relative" style={{ width: '130px' }}>
        <select
          value={visibilityFilter}
          onChange={e => { setVisibilityFilter(e.target.value as VisibilityFilter); goToPage(1) }}
          className="appearance-none w-full pl-3 pr-9 py-2.5 rounded-lg cursor-pointer focus:outline-none text-sm"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="all">全部可见性</option>
          <option value="public">公开</option>
          <option value="personal">个人</option>
          <option value="private">私密</option>
        </select>
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="relative" style={{ width: '130px' }}>
        <select
          value={healthFilter}
          onChange={e => { setHealthFilter(e.target.value as HealthStatus); goToPage(1) }}
          className="appearance-none w-full pl-3 pr-9 py-2.5 rounded-lg cursor-pointer focus:outline-none text-sm"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="all">全部状态</option>
          <option value="healthy">正常</option>
          <option value="warning">警告</option>
          <option value="error">错误</option>
          <option value="unchecked">未检查</option>
        </select>
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="relative" style={{ width: '130px' }}>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); goToPage(1) }}
          className="appearance-none w-full pl-3 pr-9 py-2.5 rounded-lg cursor-pointer focus:outline-none text-sm"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="all">全部分类</option>
          <option value="uncategorized">未分类</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="relative" style={{ width: '130px' }}>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={e => {
            const [newSortBy, newSortOrder] = e.target.value.split('-')
            setSortBy(newSortBy as SortField)
            setSortOrder(newSortOrder as SortOrder)
            goToPage(1)
          }}
          className="appearance-none w-full pl-3 pr-9 py-2.5 rounded-lg cursor-pointer focus:outline-none text-sm"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="orderIndex-asc">排序 ↑</option>
          <option value="orderIndex-desc">排序 ↓</option>
          <option value="createdAt-desc">最新优先</option>
          <option value="createdAt-asc">最早优先</option>
          <option value="title-asc">标题 A-Z</option>
          <option value="title-desc">标题 Z-A</option>
        </select>
        <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <button
        onClick={checkAllLinks}
        disabled={isCheckingHealth}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 whitespace-nowrap"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
          color: 'var(--color-text-primary)',
        }}
      >
        <RefreshCw className={cn('w-3.5 h-3.5', isCheckingHealth && 'animate-spin')} />
        {isCheckingHealth ? '检查中...' : '检查链接'}
      </button>

      <button
        onClick={handleDeleteDeadLinks}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-red-500/20 whitespace-nowrap"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
          color: '#ef4444',
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        清理死链
      </button>

      {onAddBookmark && (
        <button
          onClick={onAddBookmark}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white font-medium text-xs whitespace-nowrap"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
        >
          <Plus className="w-3.5 h-3.5" />
          添加书签
        </button>
      )}
    </div>
  )

  return (
    <div>
      {renderFilters()}
      
      <BookmarkTable
        bookmarks={bookmarkData?.items || []}
        categories={categories}
        healthMap={healthMap}
        isLoading={isLoading}
        error={error}
        page={page}
        totalPages={bookmarkData?.pagination?.totalPages || 1}
        total={bookmarkData?.pagination?.total || 0}
        onRefresh={refresh}
        onGoToPage={goToPage}
        onEditBookmark={onEditBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onTogglePin={handleTogglePin}
        onToggleReadLater={handleToggleReadLater}
        onChangeVisibility={handleChangeVisibility}
        onRemovePrivate={handleRemovePrivate}
        onCheckSingleLink={checkSingleLink}
      />
    </div>
  )
}
