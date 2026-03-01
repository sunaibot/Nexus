/**
 * API 类型定义
 * 集中管理所有 API 相关的类型
 */

import type { Bookmark, Category } from '../types/bookmark'
import type {
  SiteSettings,
  WidgetVisibility,
  MenuVisibility,
  WallpaperSettings,
  ThemeColors,
} from '../types/system'

// 重新导出系统类型
export type {
  SiteSettings,
  WidgetVisibility,
  MenuVisibility,
  WallpaperSettings,
  ThemeColors,
}

// ========== 基础类型 ==========

export interface ReorderItem {
  id: string
  orderIndex: number
}

export interface SuccessResponse {
  success: boolean
  message?: string
}

// ========== 书签 API 类型 ==========

export interface CreateBookmarkParams {
  url: string
  internalUrl?: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string[]
  isReadLater?: boolean
}

export interface UpdateBookmarkParams {
  url?: string
  internalUrl?: string
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string[]
  isPinned?: boolean
  isReadLater?: boolean
  isRead?: boolean
  orderIndex?: number
}

export interface MetadataResponse {
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  error?: string
}

// ========== 分类 API 类型 ==========

export interface CreateCategoryParams {
  name: string
  icon?: string
  color: string
}

export interface UpdateCategoryParams {
  name?: string
  icon?: string
  color?: string
  orderIndex?: number
}

// ========== 认证 API 类型 ==========

export interface LoginResponse {
  success: boolean
  token: string
  user: { id: string; username: string }
  requirePasswordChange?: boolean
}

export interface VerifyResponse {
  valid: boolean
  user: { id: string; username: string }
}

export interface AuthStatus {
  isValid: boolean
  username: string | null
  requirePasswordChange?: boolean
}

// ========== 分页类型 ==========

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  isPinned?: boolean
  isReadLater?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'orderIndex'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// ========== 站点设置类型 ==========
// 注意：SiteSettings, NetworkEnvConfig 等类型已从 types/system 导入

// ========== 访问统计类型 ==========

export interface VisitStats {
  totalVisits: number
  todayVisits: number
  weekVisits?: number
  monthVisits?: number
  totalBookmarks?: number
  visitedBookmarks?: number
  uniqueVisitors?: number
  timestamp?: string
}

export interface TopBookmark {
  id: string
  url: string
  internalUrl?: string
  title: string
  description?: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  visitCount: number
}

export interface VisitTrend {
  date: string
  count: number
}

export interface RecentVisit {
  id: string
  visitedAt: string
  ip?: string
  userAgent?: string
  bookmarkUrl?: string
  bookmark?: {
    id: string
    url: string
    internalUrl?: string
    title: string
    favicon?: string
    icon?: string
    iconUrl?: string
  }
}

export interface BookmarkVisitStats {
  bookmarkId: string
  visitCount: number
  lastVisited: string | null
  trend: number[]
}

// ========== 健康检查类型 ==========

export type HealthStatus = 'ok' | 'error' | 'timeout' | 'redirect'

export interface HealthCheckResult {
  bookmarkId: string
  url: string
  title: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  status: HealthStatus
  statusCode?: number
  responseTime: number
  error?: string
  redirectUrl?: string
}

export interface HealthCheckSummary {
  total: number
  ok: number
  error: number
  timeout: number
  redirect: number
  averageResponseTime: number
}

export interface HealthCheckResponse {
  results: HealthCheckResult[]
  summary: HealthCheckSummary
}

// ========== 数据管理类型 ==========

export interface ExportData {
  version: string
  exportedAt: string
  data: {
    bookmarks: Bookmark[]
    categories: Category[]
    settings: SiteSettings
  }
}

export interface ImportResponse {
  success: boolean
  message?: string
  imported?: {
    bookmarks: number
    categories: number
  }
}

export interface FactoryResetResponse {
  success: boolean
  message: string
}

// ========== 名言类型 ==========

export interface QuotesData {
  quotes: string[]
  useDefaultQuotes: boolean
}

export interface QuotesUpdateResponse {
  success: boolean
  count: number
}

// 重新导出基础类型
export type { Bookmark, Category }
