/**
 * RSS订阅插件
 * 显示RSS文章列表
 */

import { useEffect, useState } from 'react'
import { Rss, ExternalLink, Star, Circle, CheckCircle2, RefreshCw } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

interface RssArticle {
  id: string
  title: string
  link: string
  description?: string
  pubDate: string
  isRead: boolean
  isStarred: boolean
  feedName: string
  feedIcon?: string
}

interface RssFeed {
  id: string
  title: string
  url: string
  description?: string
  isActive: boolean
}

export default function RssPlugin({ config }: PluginComponentProps) {
  const [articles, setArticles] = useState<RssArticle[]>([])
  const [feeds, setFeeds] = useState<RssFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAll, setShowAll] = useState(false)

  const maxItems = config?.maxItems || 5
  const showUnreadOnly = config?.showUnreadOnly !== false

  useEffect(() => {
    fetchFeeds()
    fetchArticles()
    fetchUnreadCount()
  }, [])

  const fetchFeeds = async () => {
    try {
      const res = await fetch('/api/v2/rss/feeds?activeOnly=true', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setFeeds(data.data || [])
      }
    } catch (error) {
      console.error('获取RSS源失败:', error)
    }
  }

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/v2/rss/articles?unreadOnly=${showUnreadOnly}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setArticles(data.data || [])
      }
    } catch (error) {
      console.error('获取RSS文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/v2/rss/unread-count', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.data?.count || 0)
      }
    } catch (error) {
      console.error('获取未读数失败:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/v2/rss/articles/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      })
      setArticles(prev => prev.map(a => 
        a.id === id ? { ...a, isRead: true } : a
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const toggleStar = async (id: string, isStarred: boolean) => {
    try {
      await fetch(`/api/v2/rss/articles/${id}/star`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred }),
        credentials: 'include'
      })
      setArticles(prev => prev.map(a => 
        a.id === id ? { ...a, isStarred } : a
      ))
    } catch (error) {
      console.error('标记收藏失败:', error)
    }
  }

  const displayedArticles = showAll ? articles : articles.slice(0, maxItems)

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-white/5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-white/10" />
          <div className="w-24 h-4 rounded bg-white/10" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 rounded bg-white/5 mb-2" />
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Rss className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-medium text-white">RSS订阅</span>
        </div>
        <p className="text-xs text-white/50">暂无文章</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white/5 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Rss className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-medium text-white">RSS订阅</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-400">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchArticles}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="divide-y divide-white/5">
        {displayedArticles.map(article => (
          <div
            key={article.id}
            className={`px-4 py-3 hover:bg-white/5 transition-colors ${
              article.isRead ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* 已读/未读标记 */}
              <button
                onClick={() => markAsRead(article.id)}
                className="mt-0.5 flex-shrink-0"
              >
                {article.isRead ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Circle className="w-4 h-4 text-orange-400" />
                )}
              </button>

              {/* 文章内容 */}
              <div className="flex-1 min-w-0">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-white hover:text-orange-400 transition-colors truncate"
                  onClick={() => !article.isRead && markAsRead(article.id)}
                >
                  {article.title}
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/40">{article.feedName}</span>
                  <span className="text-xs text-white/30">
                    {new Date(article.pubDate).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>

              {/* 收藏按钮 */}
              <button
                onClick={() => toggleStar(article.id, !article.isStarred)}
                className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
              >
                <Star
                  className={`w-4 h-4 ${
                    article.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 展开/收起按钮 */}
      {articles.length > maxItems && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-4 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          {showAll ? '收起' : `查看全部 ${articles.length} 篇文章`}
        </button>
      )}
    </div>
  )
}
