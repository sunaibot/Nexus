import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  Globe,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Power,
  Check,
  BarChart,
  Activity,
  Hash
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'
import { getCurrentUserRole } from '../../../../lib/api-client/client'

// 访问统计数据类型
interface VisitStats {
  totalVisits: number
  uniqueVisitors: number
  todayVisits: number
  weekVisits: number
  monthVisits: number
  avgDuration: number
  bounceRate: number
}

// 访问记录数据类型
interface VisitRecord {
  id: string
  bookmarkId?: string
  bookmarkTitle?: string
  ip: string
  userAgent: string
  visitedAt: string
}

// 热门书签数据类型
interface TopBookmark {
  id: string
  title: string
  url: string
  visitCount: number
  lastVisitedAt: string
}

// 时间线数据类型
interface TimelineData {
  date: string
  count: number
}

interface VisitsManagerProps {
  plugin: UnifiedPlugin
  onPluginUpdate?: (plugin: UnifiedPlugin) => void
}

export default function VisitsManager({ plugin, onPluginUpdate }: VisitsManagerProps) {
  const { showToast } = useToast()

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'bookmarks' | 'timeline'>('overview')

  // 插件状态
  const [isPluginEnabled, setIsPluginEnabled] = useState<boolean>(!!plugin.isEnabled || false)

  // 数据状态
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [records, setRecords] = useState<VisitRecord[]>([])
  const [topBookmarks, setTopBookmarks] = useState<TopBookmark[]>([])
  const [timeline, setTimeline] = useState<TimelineData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week')

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/v2/visits/stats', {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err: any) {
      console.error('加载统计数据失败:', err)
    }
  }, [])

  // 加载访问记录
  const loadRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v2/visits/records?limit=100', {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setRecords(result.data)
      } else {
        setRecords([])
      }
    } catch (err: any) {
      showToast('error', err.message || '加载访问记录失败')
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // 加载热门书签
  const loadTopBookmarks = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v2/visits/top-bookmarks?limit=20', {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setTopBookmarks(result.data)
      } else {
        setTopBookmarks([])
      }
    } catch (err: any) {
      showToast('error', err.message || '加载热门书签失败')
      setTopBookmarks([])
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // 加载时间线数据
  const loadTimeline = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v2/visits/timeline?range=${dateRange}`, {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setTimeline(result.data)
      } else {
        setTimeline([])
      }
    } catch (err: any) {
      showToast('error', err.message || '加载时间线失败')
      setTimeline([])
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, showToast])

  useEffect(() => {
    if (isPluginEnabled) {
      loadStats()
      if (activeTab === 'records') loadRecords()
      if (activeTab === 'bookmarks') loadTopBookmarks()
      if (activeTab === 'timeline') loadTimeline()
    }
  }, [isPluginEnabled, activeTab, loadStats, loadRecords, loadTopBookmarks, loadTimeline])

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

  // 刷新数据
  const handleRefresh = () => {
    loadStats()
    if (activeTab === 'records') loadRecords()
    if (activeTab === 'bookmarks') loadTopBookmarks()
    if (activeTab === 'timeline') loadTimeline()
    showToast('success', '数据已刷新')
  }

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化持续时间
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
  }

  if (!isPluginEnabled) {
    return (
      <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
        <Power className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          插件已禁用
        </h3>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          该插件当前处于禁用状态，无法查看访问统计。请先启用插件。
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
            <BarChart3 className="w-5 h-5 text-white" />
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
            onClick={handleRefresh}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-muted)' }}
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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
          { id: 'overview', label: '数据概览', icon: BarChart },
          { id: 'records', label: '访问记录', icon: Eye },
          { id: 'bookmarks', label: '热门书签', icon: Activity },
          { id: 'timeline', label: '访问趋势', icon: TrendingUp }
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

      {/* 概览页面 */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatNumber(stats.totalVisits)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>总访问量</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl border"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatNumber(stats.uniqueVisitors)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>独立访客</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl border"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatDuration(stats.avgDuration)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>平均停留</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl border"
              style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {stats.bounceRate}%
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>跳出率</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 今日/本周/本月统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>今日访问</span>
                <Calendar className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {formatNumber(stats.todayVisits)}
              </p>
            </div>

            <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>本周访问</span>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {formatNumber(stats.weekVisits)}
              </p>
            </div>

            <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>本月访问</span>
                <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {formatNumber(stats.monthVisits)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 访问记录页面 */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
              加载中...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>暂无访问记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>书签</th>
                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>IP地址</th>
                    <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>访问时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-white/5" style={{ borderColor: 'var(--color-glass-border)' }}>
                      <td className="py-3 px-4" style={{ color: 'var(--color-text-primary)' }}>
                        {record.bookmarkTitle || '直接访问'}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {record.ip}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDate(record.visitedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 热门书签页面 */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
              加载中...
            </div>
          ) : topBookmarks.length === 0 ? (
            <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>暂无热门书签数据</p>
            </div>
          ) : (
            topBookmarks.map((bookmark, index) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm"
                  style={{
                    background: index < 3 ? 'var(--color-primary)' : 'var(--color-glass)',
                    color: index < 3 ? 'white' : 'var(--color-text-muted)'
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {bookmark.title}
                  </h4>
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {bookmark.url}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <Eye className="w-4 h-4" />
                  {formatNumber(bookmark.visitCount)}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* 时间线页面 */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {/* 时间范围选择 */}
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  dateRange === range
                    ? 'text-white'
                    : 'hover:bg-white/5'
                )}
                style={{
                  background: dateRange === range ? 'var(--color-primary)' : 'var(--color-glass)',
                  color: dateRange === range ? 'white' : 'var(--color-text-muted)'
                }}
              >
                {range === 'today' && '今日'}
                {range === 'week' && '本周'}
                {range === 'month' && '本月'}
                {range === 'year' && '全年'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
              加载中...
            </div>
          ) : timeline.length === 0 ? (
            <div className="p-8 text-center rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>暂无趋势数据</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-glass-border)' }}>
              {/* 简单的条形图 */}
              <div className="space-y-2">
                {timeline.map((item, index) => {
                  const maxCount = Math.max(...timeline.map(t => t.count))
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-20 text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {item.date}
                      </div>
                      <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full rounded-full"
                          style={{ background: 'var(--color-primary)' }}
                        />
                      </div>
                      <div className="w-12 text-sm text-right" style={{ color: 'var(--color-text-primary)' }}>
                        {item.count}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
