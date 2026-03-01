/**
 * 访问统计管理模块
 */

import { BarChart3, Eye, Users, Clock, TrendingUp, Calendar } from 'lucide-react'
import type { Module } from '@/core/module-system'

const API_BASE = 'http://localhost:8787'

interface VisitStats {
  totalVisits: number
  uniqueVisitors: number
  todayVisits: number
  weekVisits: number
  monthVisits: number
  avgDuration: number
  bounceRate: number
}

interface TopBookmark {
  id: string
  title: string
  url: string
  visitCount: number
  favicon?: string
}

interface VisitTrend {
  date: string
  count: number
}

function AnalyticsManager() {
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [topBookmarks, setTopBookmarks] = useState<TopBookmark[]>([])
  const [trend, setTrend] = useState<VisitTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchStats(),
        fetchTopBookmarks(),
        fetchTrend()
      ])
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    const res = await fetch(`${API_BASE}/api/v2/visits/stats`, {
      credentials: 'include'
    })
    if (res.ok) {
      const data = await res.json()
      setStats(data.data)
    }
  }

  const fetchTopBookmarks = async () => {
    const res = await fetch(`${API_BASE}/api/v2/visits/top?limit=10&period=${period}`, {
      credentials: 'include'
    })
    if (res.ok) {
      const data = await res.json()
      setTopBookmarks(data.data || [])
    }
  }

  const fetchTrend = async () => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const res = await fetch(`${API_BASE}/api/v2/visits/trend?days=${days}`, {
      credentials: 'include'
    })
    if (res.ok) {
      const data = await res.json()
      setTrend(data.data || [])
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
  }

  const maxTrendValue = Math.max(...trend.map(t => t.count), 1)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          访问统计
        </h1>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                period === p
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {p === '7d' ? '7天' : p === '30d' ? '30天' : '90天'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/50">加载中...</div>
      ) : (
        <div className="space-y-6">
          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/50">总访问量</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.totalVisits)}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/50">独立访客</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.uniqueVisitors)}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white/50">平均停留</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatDuration(stats.avgDuration)}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white/50">今日访问</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.todayVisits)}</p>
              </div>
            </div>
          )}

          {/* 趋势图 */}
          {trend.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white mb-4">访问趋势</h3>
              <div className="flex items-end gap-1 h-40">
                {trend.map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-t relative group"
                      style={{ height: `${(item.count / maxTrendValue) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black/80 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.count}次
                      </div>
                    </div>
                    <span className="text-[10px] text-white/30">
                      {new Date(item.date).getMonth() + 1}/{new Date(item.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 热门书签 */}
          {topBookmarks.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white mb-4">热门书签</h3>
              <div className="space-y-2">
                {topBookmarks.map((bookmark, index) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-3 p-3 rounded hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-white/30 w-6">{index + 1}</span>
                    {bookmark.favicon ? (
                      <img
                        src={bookmark.favicon}
                        alt=""
                        className="w-5 h-5 rounded"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded bg-white/10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{bookmark.title}</p>
                      <p className="text-xs text-white/40 truncate">{bookmark.url}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-white/50">
                      <Eye className="w-4 h-4" />
                      {formatNumber(bookmark.visitCount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'

const AnalyticsModule: Module = {
  id: 'analytics',
  name: '访问统计',
  description: '查看网站访问数据分析',
  version: '1.0.0',
  icon: BarChart3,
  enabled: true,
  routes: [
    {
      path: '/analytics',
      component: AnalyticsManager,
      exact: true
    }
  ],
  sidebarItem: {
    id: 'analytics',
    label: '访问统计',
    icon: BarChart3,
    order: 75
  }
}

export default AnalyticsModule
