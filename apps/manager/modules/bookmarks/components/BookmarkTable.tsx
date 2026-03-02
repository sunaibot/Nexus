import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pin,
  BookMarked,
  ExternalLink,
  Edit2,
  Trash2,
  Globe,
  User,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { Bookmark, Category } from '../../../types/bookmark'
import { cn } from '../../../lib/utils'
import type { LinkHealth } from '../hooks'

interface BookmarkTableProps {
  bookmarks: Bookmark[]
  categories: Category[]
  healthMap: Record<string, LinkHealth>
  isLoading: boolean
  error: string | null
  page: number
  totalPages: number
  total: number
  onRefresh: () => void
  onGoToPage: (page: number) => void
  onEditBookmark?: (bookmark: Bookmark) => void
  onDeleteBookmark?: (id: string) => Promise<boolean>
  onTogglePin?: (bookmark: Bookmark) => Promise<boolean>
  onToggleReadLater?: (bookmark: Bookmark) => Promise<boolean>
  onChangeVisibility?: (bookmark: Bookmark, visibility: 'public' | 'personal' | 'private') => Promise<boolean>
  onRemovePrivate?: (id: string) => Promise<boolean>
  onCheckSingleLink?: (bookmark: Bookmark) => void
}

export function BookmarkTable({
  bookmarks,
  categories,
  healthMap,
  isLoading,
  error,
  page,
  totalPages,
  total,
  onRefresh,
  onGoToPage,
  onEditBookmark,
  onDeleteBookmark,
  onTogglePin,
  onToggleReadLater,
  onChangeVisibility,
  onRemovePrivate,
  onCheckSingleLink,
}: BookmarkTableProps) {
  const { t } = useTranslation()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [openVisibilityId, setOpenVisibilityId] = useState<string | null>(null)

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === bookmarks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(bookmarks.map(b => b.id)))
    }
  }, [bookmarks, selectedIds])

  const handleDeleteBookmark = useCallback(async (id: string) => {
    if (!confirm(t('admin.bookmark.delete_confirm'))) return
    if (onDeleteBookmark) {
      await onDeleteBookmark(id)
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }, [onDeleteBookmark, t])

  const handleTogglePin = useCallback(async (bookmark: Bookmark) => {
    if (onTogglePin) {
      await onTogglePin(bookmark)
    }
  }, [onTogglePin])

  const handleToggleReadLater = useCallback(async (bookmark: Bookmark) => {
    if (onToggleReadLater) {
      await onToggleReadLater(bookmark)
    }
  }, [onToggleReadLater])

  const handleChangeVisibility = useCallback(async (bookmark: Bookmark, visibility: 'public' | 'personal' | 'private') => {
    if (onChangeVisibility) {
      await onChangeVisibility(bookmark, visibility)
    }
  }, [onChangeVisibility])

  const handleCheckLink = useCallback(async (bookmark: Bookmark) => {
    if (onCheckSingleLink) {
      setCheckingId(bookmark.id)
      await onCheckSingleLink(bookmark)
      setCheckingId(null)
    }
  }, [onCheckSingleLink])

  const getVisibilityInfo = (visibility?: string) => {
    switch (visibility) {
      case 'public':
        return { icon: Globe, color: '#22c55e', label: '公开' }
      case 'private':
        return { icon: Shield, color: '#ef4444', label: '私密' }
      default:
        return { icon: User, color: '#3b82f6', label: '个人' }
    }
  }

  const getHealthInfo = (health?: LinkHealth) => {
    switch (health?.status) {
      case 'healthy':
        return { icon: CheckCircle2, color: '#22c55e', label: '正常', statusCode: health.statusCode, responseTime: health.responseTime }
      case 'warning':
        return { icon: AlertCircle, color: '#eab308', label: '警告', error: health.error }
      case 'error':
        return { icon: XCircle, color: '#ef4444', label: '错误', error: health.error }
      default:
        return { icon: Activity, color: 'var(--color-text-muted)', label: '未检查' }
    }
  }

  const renderPagination = () => {
    const pages = []
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          第 {page} / {totalPages} 页，共 {total} 条
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGoToPage(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-glass-hover)] transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onGoToPage(p)}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors',
                p === page 
                  ? 'text-white' 
                  : 'hover:bg-[var(--color-glass-hover)]'
              )}
              style={{
                background: p === page ? 'var(--color-primary)' : 'transparent',
                color: p === page ? 'white' : 'var(--color-text-primary)',
              }}
            >
              {p}
            </button>
          ))}
          
          <button
            onClick={() => onGoToPage(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-glass-hover)] transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  const renderBatchActions = () => (
    <AnimatePresence>
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-4 mb-4 p-4 rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
          }}
        >
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            已选择 <span style={{ color: 'var(--color-primary)' }} className="font-medium">{selectedIds.size}</span> 项
          </span>
          <div className="flex-1" />
          <button
            onClick={async () => {
              if (!confirm(t('admin.bookmark.batch_delete_confirm', { count: selectedIds.size }))) return
              if (onDeleteBookmark) {
                await Promise.all(Array.from(selectedIds).map(id => onDeleteBookmark(id)))
                setSelectedIds(new Set())
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            批量删除
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-current border-t-transparent rounded-full" style={{ color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-16 text-center">
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 rounded-lg"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          重试
        </button>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="p-16 text-center">
        <p style={{ color: 'var(--color-text-muted)' }}>暂无书签</p>
      </div>
    )
  }

  return (
    <>
      {renderBatchActions()}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}>
        {/* 表头 */}
        <div className="flex items-center px-5 py-3 text-sm font-medium" style={{ background: 'var(--color-bg-tertiary)', borderBottom: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)' }}>
          {/* 选择框 */}
          <div className="w-10 shrink-0">
            <button
              onClick={toggleSelectAll}
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-all',
                selectedIds.size === bookmarks.length && bookmarks.length > 0 ? 'text-white' : ''
              )}
              style={{
                background: selectedIds.size === bookmarks.length && bookmarks.length > 0 ? 'var(--color-primary)' : 'transparent',
                borderColor: selectedIds.size === bookmarks.length && bookmarks.length > 0 ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              {selectedIds.size === bookmarks.length && bookmarks.length > 0 && <Check className="w-3 h-3" />}
            </button>
          </div>
          {/* 书签 */}
          <div className="flex-1 min-w-[200px]">书签</div>
          {/* 分类 */}
          <div className="w-24 shrink-0">分类</div>
          {/* 链接检查 */}
          <div className="w-28 shrink-0">链接状态</div>
          {/* 可见性 */}
          <div className="w-20 shrink-0">可见性</div>
          {/* 状态 */}
          <div className="w-20 shrink-0">状态</div>
          {/* 操作 */}
          <div className="w-28 shrink-0 text-right">操作</div>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
          {bookmarks.map(bookmark => {
            const visibilityInfo = getVisibilityInfo(bookmark.visibility)
            const healthInfo = getHealthInfo(healthMap[bookmark.id])
            const isChecking = checkingId === bookmark.id
            return (
              <div key={bookmark.id} className="flex items-center px-5 py-4 hover:bg-[var(--color-glass-hover)] transition-colors">
                {/* 选择框 */}
                <div className="w-10 shrink-0">
                  <button
                    onClick={() => toggleSelect(bookmark.id)}
                    className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center transition-all',
                      selectedIds.has(bookmark.id) ? 'text-white' : ''
                    )}
                    style={{
                      background: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'transparent',
                      borderColor: selectedIds.has(bookmark.id) ? 'var(--color-primary)' : 'var(--color-border)',
                    }}
                  >
                    {selectedIds.has(bookmark.id) && <Check className="w-3 h-3" />}
                  </button>
                </div>

                {/* 书签 */}
                <div className="flex-1 min-w-[200px] flex items-center gap-3 pr-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-glass-border)' }}>
                    {bookmark.favicon ? (
                      <img src={bookmark.favicon} alt="" className="w-5 h-5 rounded" />
                    ) : (
                      <ExternalLink className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{bookmark.title}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {(() => {
                        try { return new URL(bookmark.url).hostname } catch { return bookmark.url }
                      })()}
                    </div>
                  </div>
                </div>

                {/* 分类 */}
                <div className="w-24 shrink-0 pr-2">
                  {bookmark.category ? (
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {categories.find(c => c.id === bookmark.category)?.name}
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>未分类</span>
                  )}
                </div>

                {/* 链接检查 */}
                <div className="w-28 shrink-0 pr-2">
                  <button
                    onClick={() => handleCheckLink(bookmark)}
                    disabled={isChecking}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: healthInfo.color + '20', color: healthInfo.color }}
                    title={healthInfo.error || healthInfo.label}
                  >
                    {isChecking ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <healthInfo.icon className="w-3.5 h-3.5" />
                    )}
                    {isChecking ? '检查中' : healthInfo.label}
                    {healthInfo.responseTime && !isChecking && (
                      <span className="ml-1 opacity-70">{healthInfo.responseTime}ms</span>
                    )}
                  </button>
                </div>

                {/* 可见性 */}
                <div className="w-20 shrink-0 pr-2">
                  <div className="relative">
                    <button 
                      onClick={() => setOpenVisibilityId(openVisibilityId === bookmark.id ? null : bookmark.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium" 
                      style={{ background: visibilityInfo.color + '20', color: visibilityInfo.color }}
                    >
                      <visibilityInfo.icon className="w-3.5 h-3.5" />
                      {visibilityInfo.label}
                    </button>
                    {openVisibilityId === bookmark.id && (
                      <div className="absolute right-0 top-full mt-1 p-1 rounded-lg shadow-lg z-10 whitespace-nowrap" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', minWidth: '90px' }}>
                        <button
                          onClick={() => { handleChangeVisibility(bookmark, 'public'); setOpenVisibilityId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-[var(--color-glass-hover)]"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          <Globe className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                          公开
                        </button>
                        <button
                          onClick={() => { handleChangeVisibility(bookmark, 'personal'); setOpenVisibilityId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-[var(--color-glass-hover)]"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          <User className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                          个人
                        </button>
                        <button
                          onClick={() => { handleChangeVisibility(bookmark, 'private'); setOpenVisibilityId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-[var(--color-glass-hover)]"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
                          私密
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 状态 */}
                <div className="w-20 shrink-0 pr-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(bookmark)}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        bookmark.isPinned ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-[var(--color-glass-hover)]'
                      )}
                      style={{ color: bookmark.isPinned ? undefined : 'var(--color-text-muted)' }}
                      title="置顶"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleReadLater(bookmark)}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        bookmark.isReadLater ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-[var(--color-glass-hover)]'
                      )}
                      style={{ color: bookmark.isReadLater ? undefined : 'var(--color-text-muted)' }}
                      title="稍后读"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 操作 */}
                <div className="w-28 shrink-0 flex items-center justify-end gap-1">
                  <button
                    onClick={() => window.open(bookmark.url, '_blank')}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="打开链接"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {onEditBookmark && (
                    <button
                      onClick={() => onEditBookmark(bookmark)}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-all"
                      style={{ color: 'var(--color-text-muted)' }}
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-all"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {renderPagination()}
    </>
  )
}
