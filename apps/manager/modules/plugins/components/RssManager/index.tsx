import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Rss,
  Globe,
  Calendar,
  Tag,
  X,
  Settings,
  Eye,
  Play,
  Check,
  Power,
  Database,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'
import { getCurrentUserRole } from '../../../../lib/api-client/client'

// RSS订阅源数据类型
interface RssFeed {
  id: string
  title: string
  url: string
  description?: string
  category?: string
  isActive: boolean
  lastFetchedAt?: string
  createdAt: string
  updatedAt: string
}

// RSS文章数据类型
interface RssArticle {
  id: string
  feedId: string
  title: string
  link: string
  description?: string
  pubDate?: string
  isRead: boolean
  isStarred: boolean
  createdAt: string
}

interface RssFormData {
  title: string
  url: string
  description: string
  category: string
  isActive: boolean
}

interface RssManagerProps {
  plugin: UnifiedPlugin
  onPluginUpdate?: (plugin: UnifiedPlugin) => void
}

export default function RssManager({ plugin, onPluginUpdate }: RssManagerProps) {
  const { showToast } = useToast()

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'feeds' | 'articles' | 'config'>('feeds')

  // 插件状态
  const [isPluginEnabled, setIsPluginEnabled] = useState<boolean>(!!plugin.isEnabled || false)

  // RSS订阅源数据状态
  const [feeds, setFeeds] = useState<RssFeed[]>([])
  const [articles, setArticles] = useState<RssArticle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null)
  const [formData, setFormData] = useState<RssFormData>({
    title: '',
    url: '',
    description: '',
    category: '',
    isActive: true
  })

  // 加载RSS订阅源列表
  const loadFeeds = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v2/rss/feeds', {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setFeeds(result.data)
      } else {
        setFeeds([])
      }
    } catch (err: any) {
      showToast('error', err.message || '加载RSS订阅源失败')
      setFeeds([])
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // 加载RSS文章列表
  const loadArticles = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v2/rss/articles', {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setArticles(result.data)
      } else {
        setArticles([])
      }
    } catch (err: any) {
      showToast('error', err.message || '加载RSS文章失败')
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (isPluginEnabled) {
      loadFeeds()
      loadArticles()
    }
  }, [isPluginEnabled, loadFeeds, loadArticles])

  // 切换插件启用状态
  const handleTogglePlugin = async () => {
    const userRole = getCurrentUserRole()
    if (userRole !== 'admin') {
      showToast('error', '需要管理员权限才能启用/禁用插件')
      return
    }

    try {
      const response = await fetch(`/api/v2/plugins/${plugin.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ isEnabled: !isPluginEnabled })
      })

      if (response.ok) {
        setIsPluginEnabled(!isPluginEnabled)
        showToast('success', isPluginEnabled ? '插件已禁用' : '插件已启用')
        onPluginUpdate?.({ ...plugin, isEnabled: !isPluginEnabled ? 1 : 0 })
      } else if (response.status === 403) {
        showToast('error', '需要管理员权限')
      }
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      category: '',
      isActive: true
    })
    setEditingFeed(null)
  }

  // 打开添加弹窗
  const handleAdd = () => {
    resetForm()
    setShowModal(true)
  }

  // 打开编辑弹窗
  const handleEdit = (feed: RssFeed) => {
    setEditingFeed(feed)
    setFormData({
      title: feed.title,
      url: feed.url,
      description: feed.description || '',
      category: feed.category || '',
      isActive: feed.isActive
    })
    setShowModal(true)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.url.trim()) {
      showToast('error', '标题和URL不能为空')
      return
    }

    try {
      const url = editingFeed ? `/api/v2/rss/feeds/${editingFeed.id}` : '/api/v2/rss/feeds'
      const method = editingFeed ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        showToast('success', editingFeed ? 'RSS订阅源更新成功' : 'RSS订阅源创建成功')
        setShowModal(false)
        resetForm()
        loadFeeds()
      } else {
        showToast('error', result.error || '操作失败')
      }
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
    }
  }

  // 删除订阅源
  const handleDelete = async (feed: RssFeed) => {
    if (!confirm(`确定要删除这个RSS订阅源吗？\n\n"${feed.title}"`)) return

    try {
      const response = await fetch(`/api/v2/rss/feeds/${feed.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        showToast('success', 'RSS订阅源删除成功')
        loadFeeds()
      } else {
        showToast('error', result.error || '删除失败')
      }
    } catch (err: any) {
      showToast('error', err.message || '删除失败')
    }
  }

  // 刷新订阅源
  const handleRefresh = async (feed: RssFeed) => {
    try {
      const response = await fetch(`/api/v2/rss/feeds/${feed.id}/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        showToast('success', 'RSS订阅源刷新成功')
        loadFeeds()
        loadArticles()
      } else {
        showToast('error', result.error || '刷新失败')
      }
    } catch (err: any) {
      showToast('error', err.message || '刷新失败')
    }
  }

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 过滤数据
  const filteredFeeds = feeds.filter(feed =>
    feed.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feed.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feed.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isPluginEnabled) {
    return (
      <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
        <Power className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          插件已禁用
        </h3>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          该插件当前处于禁用状态，无法管理数据。请先启用插件。
        </p>
        <button
          onClick={handleTogglePlugin}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium mx-auto"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
        >
          <Power className="w-4 h-4" />
          启用插件
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 插件状态栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border" style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
            <Rss className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{plugin.name}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>v{plugin.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-green-500/20 text-green-400">
            <Check className="w-3.5 h-3.5" />
            运行中
          </span>
          <button
            onClick={handleTogglePlugin}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/20 hover:text-red-400"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Power className="w-4 h-4" />
            禁用
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: 'var(--color-glass)' }}>
        {[
          { id: 'feeds', label: '订阅源管理', icon: Database },
          { id: 'articles', label: '文章列表', icon: Globe },
          { id: 'config', label: '插件配置', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'text-white'
                : 'hover:bg-white/5'
            )}
            style={{
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)'
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'feeds' ? '搜索订阅源...' : '搜索文章...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-glass-border)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
        {activeTab === 'feeds' && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus className="w-4 h-4" />
            添加订阅源
          </button>
        )}
      </div>

      {/* 订阅源列表 */}
      {activeTab === 'feeds' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
              加载中...
            </div>
          ) : filteredFeeds.length === 0 ? (
            <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <Database className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                {searchQuery ? '没有找到匹配的订阅源' : '暂无RSS订阅源'}
              </p>
            </div>
          ) : (
            filteredFeeds.map(feed => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border transition-all hover:border-[var(--color-primary)]/30"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {feed.title}
                      </h4>
                      {feed.isActive ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          启用
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">
                          <XCircle className="w-3 h-3" />
                          禁用
                        </span>
                      )}
                    </div>
                    <p className="text-sm truncate mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      {feed.url}
                    </p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {feed.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {feed.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        更新于 {formatDate(feed.lastFetchedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRefresh(feed)}
                      className="p-2 rounded-lg transition-colors hover:bg-white/5"
                      style={{ color: 'var(--color-text-muted)' }}
                      title="刷新"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(feed)}
                      className="p-2 rounded-lg transition-colors hover:bg-white/5"
                      style={{ color: 'var(--color-text-muted)' }}
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(feed)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-500/20 hover:text-red-400"
                      style={{ color: 'var(--color-text-muted)' }}
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* 文章列表 */}
      {activeTab === 'articles' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
              加载中...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                {searchQuery ? '没有找到匹配的文章' : '暂无RSS文章'}
              </p>
            </div>
          ) : (
            filteredArticles.map(article => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border transition-all hover:border-[var(--color-primary)]/30"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {article.title}
                    </h4>
                    <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      {article.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.pubDate)}
                      </span>
                      {article.isRead && (
                        <span className="flex items-center gap-1 text-green-400">
                          <Check className="w-3 h-3" />
                          已读
                        </span>
                      )}
                      {article.isStarred && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Tag className="w-3 h-3" />
                          收藏
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="打开链接"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* 配置页面 */}
      {activeTab === 'config' && (
        <div className="p-6 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            插件配置
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            RSS订阅插件的配置选项将在后续版本中添加。
          </p>
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 rounded-2xl border"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {editingFeed ? '编辑RSS订阅源' : '添加RSS订阅源'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    标题 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{
                      background: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-glass-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    placeholder="例如：技术博客"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    RSS地址 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{
                      background: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-glass-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    placeholder="https://example.com/feed.xml"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                    style={{
                      background: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-glass-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    placeholder="订阅源的描述信息"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    分类
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border outline-none focus:border-[var(--color-primary)] transition-colors"
                    style={{
                      background: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-glass-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    placeholder="例如：技术、新闻"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <label htmlFor="isActive" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    启用此订阅源
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border font-medium transition-colors hover:bg-white/5"
                    style={{ borderColor: 'var(--color-glass-border)', color: 'var(--color-text-muted)' }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {editingFeed ? '保存' : '添加'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
