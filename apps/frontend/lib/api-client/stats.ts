/**
 * 统计 API 客户端
 * 提供数据统计分析功能
 */
import { request } from './client'

// 统计概览接口
export interface StatsOverview {
  pv: number
  uv: number
  today: number
  bookmarks: number
  categories: number
}

// 趋势数据接口
export interface TrendData {
  date: string
  pv: number
  uv: number
}

// 热门书签接口
export interface PopularBookmark {
  id: string
  title: string
  url: string
  category?: string
  visitCount: number
  uniqueVisitors: number
}

// 热力图小时数据接口
export interface HeatmapHourly {
  hour: string
  count: number
}

// 热力图星期数据接口
export interface HeatmapWeekday {
  weekday: string
  weekdayNum: string
  count: number
}

// 热力图分类数据接口
export interface HeatmapCategory {
  category: string
  count: number
}

// 热力图数据接口
export interface HeatmapData {
  hourly: HeatmapHourly[]
  weekday: HeatmapWeekday[]
  category: HeatmapCategory[]
}

// 分类统计接口
export interface CategoryStats {
  id: string
  name: string
  color?: string
  icon?: string
  bookmarkCount: number
  visitCount: number
  totalVisits: number
}

// 用户活跃度接口
export interface UserActivity {
  id: string
  username: string
  role: string
  visitCount: number
  bookmarkCount: number
  lastActive?: string
}

// 访问频率接口
export interface VisitFrequency {
  date: string
  visits: number
  uniqueVisitors: number
  avgVisitsPerUser: number
}

// 停留时长统计接口
export interface DurationStats {
  frequency: VisitFrequency[]
  note: string
}

/**
 * 获取统计概览
 */
export async function fetchStatsOverview(): Promise<StatsOverview> {
  const response = await request<{ success: boolean; data: StatsOverview }>('/v2/stats/overview', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取访问趋势
 */
export async function fetchStatsTrends(days?: number): Promise<TrendData[]> {
  const url = days ? `/v2/stats/trends?days=${days}` : '/v2/stats/trends'
  
  const response = await request<{ success: boolean; data: TrendData[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取热门书签排行
 */
export async function fetchPopularBookmarks(pageSize?: number): Promise<PopularBookmark[]> {
  const url = pageSize ? `/v2/stats/popular-bookmarks?pageSize=${pageSize}` : '/v2/stats/popular-bookmarks'
  
  const response = await request<{ success: boolean; data: PopularBookmark[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取书签点击热力图数据
 */
export async function fetchStatsHeatmap(days?: number): Promise<HeatmapData> {
  const url = days ? `/v2/stats/heatmap?days=${days}` : '/v2/stats/heatmap'
  
  const response = await request<{ success: boolean; data: HeatmapData }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取分类使用统计
 */
export async function fetchStatsCategories(): Promise<CategoryStats[]> {
  const response = await request<{ success: boolean; data: CategoryStats[] }>('/v2/stats/categories', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取用户活跃度统计（仅管理员）
 */
export async function fetchUserActivity(days?: number): Promise<UserActivity[]> {
  const url = days ? `/v2/stats/user-activity?days=${days}` : '/v2/stats/user-activity'
  
  const response = await request<{ success: boolean; data: UserActivity[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取停留时长统计
 */
export async function fetchStatsDuration(days?: number): Promise<DurationStats> {
  const url = days ? `/v2/stats/duration?days=${days}` : '/v2/stats/duration'
  
  const response = await request<{ success: boolean; data: DurationStats }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 统计 API 对象
 */
export const statsApi = {
  fetchOverview: fetchStatsOverview,
  fetchTrends: fetchStatsTrends,
  fetchPopularBookmarks,
  fetchHeatmap: fetchStatsHeatmap,
  fetchCategories: fetchStatsCategories,
  fetchUserActivity,
  fetchDuration: fetchStatsDuration,
}

export default statsApi
