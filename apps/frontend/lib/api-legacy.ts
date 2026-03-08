/**
 * API 兼容层
 * 
 * 此文件提供对旧版 lib/api.ts 的兼容导出
 * 新项目代码应直接使用 lib/api-client
 * 
 * @deprecated 请使用 lib/api-client 替代
 */

// 从新的 api-client 重新导出所有内容
export {
  // 基础
  request,
  ApiError,
} from './api-client/client'

export type { RequestOptions } from './api-client/client'

// 认证
export {
  adminLogin,
  adminVerify,
  adminLogout,
  checkAuthStatus,
  clearAuthStatus,
  changePassword,
} from './api-client/auth'

// 兼容旧名称
export { changePassword as adminChangePassword } from './api-client/auth'

// 演示模式判断
export function isDemoMode(): boolean {
  return window.location.hostname === '118.145.185.221'
}

// 清除密码修改标记
export function clearPasswordChangeFlag(): void {
  localStorage.removeItem('requirePasswordChange')
}

// 书签
export {
  fetchBookmarks,  // 公开接口，不需要认证
  fetchAllBookmarks,  // 管理员接口，需要认证
  fetchBookmarksPaginated,
  fetchBookmarkById,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
  fetchMetadata,
} from './api-client/bookmarks'

// 分类
export {
  fetchCategories,  // 公开接口，不需要认证
  fetchAllCategories,  // 管理员接口，需要认证
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from './api-client/categories'

// 系统设置
export {
  getSiteSettings as fetchSettings,
  updateSiteSettings as updateSettings,
} from './api-client/system'

// 访问记录
export {
  fetchVisitStats,
  fetchTopBookmarks,
  fetchVisitTrends as fetchVisitTrend,
  fetchRecentVisits,
  fetchBookmarkStats,
  trackVisit,
} from './api-client/visits'

// 名言
export {
  fetchQuotes,
  fetchQuotesSettings,
  updateQuotes,
} from './api-client/quotes'

// 数据管理
export {
  exportAllData as exportData,
  importAllData as importData,
  factoryReset,
} from './api-client/data-management'

// 健康检查
export {
  checkBookmarksHealth,
} from './api-client/health-check'

// API 对象（兼容旧代码）
export {
  bookmarksApi as bookmarkApi,
  metadataApi,
  categoriesApi as categoryApi,
  systemApi as settingsApi,
  visitsApi,
  quotesApi,
  dataManagementApi as dataApi,
  healthCheckApi,
} from './api-client'

// 书签卡片样式 API
export {
  fetchCurrentBookmarkCardStyle,
  fetchGlobalBookmarkCardStyle,
  styleToCSS,
  getHoverStyle,
  getTitleStyle,
  getDescriptionStyle,
  getIconStyle,
  type BookmarkCardStyle,
} from './api/bookmark-card-styles'

// 类型导出
export type {
  // 书签相关
  CreateBookmarkParams,
  UpdateBookmarkParams,
  // 分类相关
  CreateCategoryParams,
  UpdateCategoryParams,
  // 其他
  ReorderItem,
  MetadataResponse,
  LoginResponse,
  SuccessResponse,
  VerifyResponse,
  PaginatedResponse,
  PaginationParams,
} from '../lib/api-types'

// 站点设置类型
export type {
  SiteSettings,
  WidgetVisibility,
  MenuVisibility,
  WallpaperSettings,
  ThemeColors,
  NetworkEnvConfig,
} from '../types/system'

// 访问统计类型
export type {
  VisitStats,
  TopBookmark,
  VisitTrend,
  RecentVisit,
  BookmarkVisitStats,
} from '../lib/api-types'

// 健康检查类型
export type {
  HealthCheckResult,
  HealthCheckSummary,
  HealthCheckResponse,
} from '../lib/api-types'

// 数据管理类型
export type {
  ExportData,
  QuotesData,
  QuotesUpdateResponse,
} from '../lib/api-types'
