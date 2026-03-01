/**
 * 类型定义统一导出
 */

// 书签相关类型
export type {
  Bookmark,
  Category,
  CustomIcon,
  CategoryStats,
  CategoryFilter,
  BookmarkStore,
  Visibility,
  CreateBookmarkParams,
  UpdateBookmarkParams,
  MetadataResponse,
} from './bookmark'

// 系统相关类型
export type {
  SystemStats,
  WidgetVisibility,
  MenuVisibility,
  WallpaperSettings,
  ThemeColors,
  SiteSettings,
  ServiceMonitor,
  Notepad,
  Note,
  Tag,
  RssFeed,
  AuditLog,
  Notification,
  HealthStatus,
} from './system'

// API 相关类型
export type {
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  SuccessResponse,
  ReorderItem,
} from './api'

// 用户相关类型
export type {
  User,
  LoginResponse,
  VerifyResponse,
  AuthStatus,
  RegisterParams,
} from './user'
