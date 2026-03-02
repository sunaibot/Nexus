import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Category, CustomIcon, Bookmark, CreateBookmarkParams } from '../../../types/bookmark'
import { fetchCategories, createBookmark, updateBookmark } from '../../../lib/api'
import { BookmarkManager, BookmarkFormModal, SimpleBookmarkModal } from '../components'
import { useToast } from '../../../components/admin/Toast'
import { useAdmin } from '../../../contexts/AdminContext'

export default function BookmarksPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // 用于触发 BookmarkManager 刷新的状态
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // 从 AdminContext 获取弹窗状态
  const { 
    isAddModalOpen, 
    setIsAddModalOpen, 
    editingBookmark, 
    setEditingBookmark 
  } = useAdmin()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
      setCustomIcons([])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBookmark = useCallback(() => {
    setEditingBookmark(null)
    setIsAddModalOpen(true)
  }, [setEditingBookmark, setIsAddModalOpen])

  const handleEditBookmark = useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setIsAddModalOpen(true)
  }, [setEditingBookmark, setIsAddModalOpen])

  // 辅助函数：确保 URL 有协议前缀
  const ensureProtocol = (url: string | null | undefined): string | null => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `https://${url}`
  }

  const handleSubmitBookmark = useCallback(async (bookmarkData: Partial<Bookmark>) => {
    try {
      // 转换tags格式 - 确保是 string | null 类型
      const formattedTags = Array.isArray(bookmarkData.tags) 
        ? bookmarkData.tags.join(',') 
        : (bookmarkData.tags || null)
      
      // 确保 URL 有协议前缀
      const formattedUrl = ensureProtocol(bookmarkData.url)
      if (!formattedUrl) {
        showToast('error', 'URL不能为空')
        return
      }
      
      // 构建符合 CreateBookmarkParams 的数据
      // 注意：空字符串需要转换为 null，因为后端验证要求 URL 字段必须是有效 URL 或 null
      const formattedData: CreateBookmarkParams = {
        url: formattedUrl,
        title: bookmarkData.title!,
        internalUrl: ensureProtocol(bookmarkData.internalUrl),
        description: bookmarkData.description || null,
        notes: bookmarkData.notes || null,
        favicon: ensureProtocol(bookmarkData.favicon),
        ogImage: ensureProtocol(bookmarkData.ogImage),
        icon: bookmarkData.icon || null,
        iconUrl: ensureProtocol(bookmarkData.iconUrl),
        category: bookmarkData.category || null,
        tags: formattedTags,
        isReadLater: bookmarkData.isReadLater || false,
        visibility: bookmarkData.visibility || 'personal',
      }
      
      console.log('[BookmarksPage] Submitting bookmark data:', formattedData)
      
      if (editingBookmark) {
        // 编辑模式
        await updateBookmark(editingBookmark.id, formattedData)
        showToast('success', '书签已更新')
      } else {
        // 添加模式
        await createBookmark(formattedData)
        showToast('success', '书签添加成功')
      }
      // 刷新数据
      loadData()
      // 触发 BookmarkManager 刷新列表
      setRefreshTrigger(prev => prev + 1)
    } catch (err: any) {
      console.error('Failed to save bookmark:', err)
      // 显示详细的错误信息
      // ApiError 的 data 属性包含后端返回的完整错误信息
      const errorData = err.data || err
      if (errorData.details && Array.isArray(errorData.details)) {
        const errorMsg = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
        showToast('error', `验证失败: ${errorMsg}`)
      } else {
        showToast('error', editingBookmark ? '更新书签失败' : '添加书签失败')
      }
    }
  }, [editingBookmark, showToast])

  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false)
    setEditingBookmark(null)
  }, [setIsAddModalOpen, setEditingBookmark])

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-current border-t-transparent rounded-full" style={{ color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Debug: 显示弹窗状态 */}
      <div className="hidden">isAddModalOpen: {isAddModalOpen ? 'true' : 'false'}</div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {t('admin.bookmark.title')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          管理您的书签、分类和链接健康状态
        </p>
      </div>
      
      <BookmarkManager
        categories={categories}
        customIcons={customIcons}
        onAddBookmark={handleAddBookmark}
        onEditBookmark={handleEditBookmark}
        refreshTrigger={refreshTrigger}
      />

      {/* 添加/编辑书签弹窗 */}
      <SimpleBookmarkModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitBookmark}
        categories={categories}
        editBookmark={editingBookmark}
      />
    </div>
  )
}
