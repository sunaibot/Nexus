/**
 * 访问统计插件
 * 显示网站访问数据和热门书签
 */

import { useEffect, useState } from 'react'
import { BarChart3, Eye, TrendingUp, Clock, ExternalLink } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

interface VisitStats {
  totalVisits: number
  uniqueVisitors: number
  todayVisits: number
  avgDuration: number
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

export default function VisitsPlugin({ config }: PluginComponentProps) {
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [topBookmarks, setTopBookmarks] = useState<TopBookmark[]>([])
  const [trend, setTrend] = useState<VisitTrend[]>([])
  const [loading, setLoading] = useState(true)

  const showTrend = config?.showTrend !== false
  const showTopBookmarks = config?.showTopBookmarks !== false
  const trendDays = config?.trendDays || 7

  useEffect(() => {
    fetchStats()
    if (showTopBookmarks) fetchTopBookmarks()
    if (showTrend) fetchTrend()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v2/visits/stats', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('获取访问统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopBookmarks = async () => {
    try {
      const res = await fetch('/api/v2/visits/top?limit=5&period=7d', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setTopBookmarks(data.data || [])
      }
    } catch (error) {
      console.error('获取热门书签失败:', error)
    }
  }

  const fetchTrend = async () => {
    try {
      const res = await fetch(`/api/v2/visits/trend?days=${trendDays}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setTrend(data.data || [])
      }
    } catch (error) {
      console.error('获取访问趋势失败:', error)
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
    return `${Math.floor(seconds / 3600)}小时`
  }

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-white/5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-white/10" />
          <div className="w-24 h-4 rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  const maxTrendValue = Math.max(...trend.map(t => t.count), 1)

  return (
    <div className="rounded-lg bg-white/5 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-white">访问统计</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-white/50">总访问</span>
              </div>
              <span className="text-lg font-semibold text-white">
                {formatNumber(stats.totalVisits)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-white/50">今日</span>
              </div>
              <span className="text-lg font-semibold text-white">
                {formatNumber(stats.todayVisits)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-white/50">平均停留</span>
              </div>
              <span className="text-lg font-semibold text-white">
                {formatDuration(stats.avgDuration)}
              </span>
            </div>
          </div>
        )}

        {/* 趋势图 */}
        {showTrend && trend.length > 0 && (
          <div>
            <h4 className="text-xs text-white/50 mb-2">{trendDays}天访问趋势</h4>
            <div className="flex items-end gap-1 h-16">
              {trend.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-t"
                    style={{ height: `${(item.count / maxTrendValue) * 100}%` }}
                    title={`${item.date}: ${item.count}次访问`}
                  />
                  <span className="text-[10px] text-white/30">
                    {new Date(item.date).getDate()}日
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 热门书签 */}
        {showTopBookmarks && topBookmarks.length > 0 && (
          <div>
            <h4 className="text-xs text-white/50 mb-2">热门书签</h4>
            <div className="space-y-1.5">
              {topBookmarks.map((bookmark, index) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-colors group"
                >
                  <span className="text-xs text-white/30 w-4">
                    {index + 1}
                  </span>
                  {bookmark.favicon ? (
                    <img
                      src={bookmark.favicon}
                      alt=""
                      className="w-4 h-4 rounded"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-white/10" />
                  )}
                  <span className="flex-1 text-xs text-white/70 truncate group-hover:text-white">
                    {bookmark.title}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Eye className="w-3 h-3" />
                    {formatNumber(bookmark.visitCount)}
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
