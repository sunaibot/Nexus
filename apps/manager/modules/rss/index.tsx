/**
 * RSS订阅管理模块
 */

import { Rss, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import type { Module } from '@/core/module-system'

export interface RssFeed {
  id: string
  title: string
  url: string
  description?: string
  isActive: boolean
  lastFetched?: string
  articleCount: number
  unreadCount: number
}

const API_BASE = 'http://localhost:8787'

async function fetchFeeds(): Promise<RssFeed[]> {
  const res = await fetch(`${API_BASE}/api/v2/rss/feeds`, {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('获取RSS源失败')
  const data = await res.json()
  return data.data || []
}

async function createFeed(url: string, title?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/rss/feeds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title }),
    credentials: 'include'
  })
  if (!res.ok) throw new Error('创建RSS源失败')
}

async function deleteFeed(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/rss/feeds/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  if (!res.ok) throw new Error('删除RSS源失败')
}

function RssManager() {
  const [feeds, setFeeds] = useState<RssFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    loadFeeds()
  }, [])

  const loadFeeds = async () => {
    try {
      setLoading(true)
      const data = await fetchFeeds()
      setFeeds(data)
    } catch (error) {
      console.error('加载RSS源失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newUrl.trim()) return
    try {
      await createFeed(newUrl, newTitle)
      setNewUrl('')
      setNewTitle('')
      setIsAdding(false)
      loadFeeds()
    } catch (error) {
      alert('添加RSS源失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个RSS源吗？')) return
    try {
      await deleteFeed(id)
      loadFeeds()
    } catch (error) {
      alert('删除失败')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Rss className="w-6 h-6 text-orange-400" />
          RSS订阅管理
        </h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加订阅
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">添加RSS源</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="RSS URL"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-white/30"
            />
            <input
              type="text"
              placeholder="标题（可选）"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white placeholder-white/30"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-white/70 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-sm text-white"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-white/50">加载中...</div>
      ) : feeds.length === 0 ? (
        <div className="text-center py-12">
          <Rss className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">暂无RSS订阅</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 text-orange-400 hover:text-orange-300"
          >
            添加第一个订阅
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {feeds.map(feed => (
            <div
              key={feed.id}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{feed.title}</h3>
                <p className="text-sm text-white/50 truncate">{feed.url}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span>文章: {feed.articleCount}</span>
                  <span>未读: {feed.unreadCount}</span>
                  {feed.lastFetched && (
                    <span>更新: {new Date(feed.lastFetched).toLocaleString('zh-CN')}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(feed.id)}
                  className="p-2 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'

const RssModule: Module = {
  id: 'rss',
  name: 'RSS订阅',
  description: '管理RSS订阅源',
  version: '1.0.0',
  icon: Rss,
  enabled: true,
  routes: [
    {
      path: '/rss',
      component: RssManager,
      exact: true
    }
  ],
  sidebarItem: {
    id: 'rss',
    label: 'RSS订阅',
    icon: Rss,
    order: 80
  }
}

export default RssModule
