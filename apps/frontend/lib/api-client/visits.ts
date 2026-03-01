/**
 * 访问记录 API 客户端
 * 提供访问统计和数据分析功能
 */
import { request } from './client'

// 访问记录接口
export interface Visit {
  id: string
  bookmarkId: string
  userId?: string
  visitedAt: string
  ip: string
  userAgent?: string
  bookmarkTitle?: string
  bookmarkUrl?: string
}

// 书签统计接口
export interface BookmarkStats {
  bookmarkId: string
  totalVisits: number
  uniqueVisitors: number
  todayVisits: number
  recentVisits: Visit[]
}

// 热门书签接口
export interface TopBookmark {
  id: string
  title: string
  url: string
  category?: string
  favicon?: string
  visitCount: number
  lastVisitedAt?: string
}

// 访问趋势接口
export interface VisitTrend {
  date: string
  count: number
}

// 分类统计接口
export interface CategoryStat {
  id: string
  name: string
  icon?: string
  color?: string
  visitCount: number
  bookmarkCount: number
  uniqueVisitors: number
  lastVisitedAt?: string
  percentage: number
}

// 分类趋势接口
export interface CategoryTrend {
  date: string
  count: number
  bookmarkCount: number
}

// 访问统计概览接口
export interface VisitStats {
  totalVisits: number
  todayVisits: number
  uniqueVisitors: number
  timestamp: string
}

// 记录访问请求
export interface TrackVisitRequest {
  bookmarkId: string
  userId?: string
  userAgent?: string
}

/**
 * 记录书签访问
 */
export async function trackVisit(data: TrackVisitRequest): Promise<{ recorded: boolean }> {
  const response = await request<{ success: boolean; data: { recorded: boolean } }>('/v2/visits/track', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: false, // 公开接口
  })
  return response.data
}

/**
 * 获取访问统计概览
 */
export async function fetchVisitStats(): Promise<VisitStats> {
  const response = await request<{ success: boolean; data: VisitStats }>('/v2/visits/stats', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取热门书签排行
 */
export async function fetchTopBookmarks(limit?: number, period?: 'all' | 'day' | 'week' | 'month'): Promise<TopBookmark[]> {
  const params = new URLSearchParams()
  if (limit) params.append('limit', String(limit))
  if (period) params.append('period', period)
  
  const query = params.toString()
  const url = `/v2/visits/top${query ? `?${query}` : ''}`
  
  const response = await request<{ success: boolean; data: TopBookmark[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取访问趋势
 */
export async function fetchVisitTrends(days?: number): Promise<VisitTrend[]> {
  const url = days ? `/v2/visits/trend?days=${days}` : '/v2/visits/trend'
  
  const response = await request<{ success: boolean; data: VisitTrend[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取最近访问记录
 */
export async function fetchRecentVisits(limit?: number): Promise<Visit[]> {
  const url = limit ? `/v2/visits/recent?limit=${limit}` : '/v2/visits/recent'
  
  const response = await request<{ success: boolean; data: Visit[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取单个书签的统计
 */
export async function fetchBookmarkStats(bookmarkId: string): Promise<BookmarkStats> {
  const response = await request<{ success: boolean; data: BookmarkStats }>(`/v2/visits/stats/${bookmarkId}`, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取分类使用统计
 */
export async function fetchCategoryStats(period?: 'all' | 'day' | 'week' | 'month'): Promise<{ totalVisits: number; categories: CategoryStat[]; period: string }> {
  const url = period ? `/v2/visits/category-stats?period=${period}` : '/v2/visits/category-stats'
  
  const response = await request<{ success: boolean; data: { totalVisits: number; categories: CategoryStat[]; period: string } }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取分类趋势
 */
export async function fetchCategoryTrend(categoryId: string, days?: number): Promise<CategoryTrend[]> {
  const url = days ? `/v2/visits/category-trend/${categoryId}?days=${days}` : `/v2/visits/category-trend/${categoryId}`
  
  const response = await request<{ success: boolean; data: CategoryTrend[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 使用 sendBeacon 记录访问（用于页面跳转前）
 * @param bookmarkId 书签ID
 * @returns 是否成功发送
 */
export function trackVisitBeacon(bookmarkId: string): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    return false
  }

  const data = JSON.stringify({ bookmarkId })
  const url = '/api/v2/visits/track'

  try {
    return navigator.sendBeacon(url, data)
  } catch {
    return false
  }
}

/**
 * 访问记录 API 对象
 */
export const visitsApi = {
  track: trackVisit,
  trackBeacon: trackVisitBeacon,
  fetchStats: fetchVisitStats,
  fetchTopBookmarks,
  fetchTrends: fetchVisitTrends,
  fetchRecent: fetchRecentVisits,
  fetchBookmarkStats,
  fetchCategoryStats,
  fetchCategoryTrend,
}

export default visitsApi
