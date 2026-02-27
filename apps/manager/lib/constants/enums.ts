/**
 * 全局枚举定义
 * 解决魔法字符串问题：统一使用枚举替代硬编码字符串
 * 
 * 改进点：
 * 1. 所有字符串常量集中管理
 * 2. 类型安全
 * 3. 易于维护和重构
 * 4. 支持国际化
 */

// ==================== 用户角色枚举 ====================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// 用户角色显示名称
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.USER]: '普通用户',
  [UserRole.GUEST]: '访客',
}

// ==================== 书签可见性枚举 ====================

export enum BookmarkVisibility {
  PUBLIC = 'public',
  PERSONAL = 'personal',
  PRIVATE = 'private',
}

export const BookmarkVisibilityLabels: Record<BookmarkVisibility, string> = {
  [BookmarkVisibility.PUBLIC]: '公开',
  [BookmarkVisibility.PERSONAL]: '个人',
  [BookmarkVisibility.PRIVATE]: '私密',
}

// ==================== API 权限枚举 ====================

export enum Permission {
  // 书签权限
  BOOKMARK_VIEW = 'bookmark:view',
  BOOKMARK_CREATE = 'bookmark:create',
  BOOKMARK_UPDATE = 'bookmark:update',
  BOOKMARK_DELETE = 'bookmark:delete',
  BOOKMARK_ADMIN = 'bookmark:admin',
  
  // 分类权限
  CATEGORY_VIEW = 'category:view',
  CATEGORY_CREATE = 'category:create',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',
  CATEGORY_ADMIN = 'category:admin',
  
  // 用户权限
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ADMIN = 'user:admin',
  
  // 系统权限
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update',
  SYSTEM_MONITOR = 'system:monitor',
  STATS_VIEW = 'stats:view',
  
  // 超级管理员
  SUPER_ADMIN = 'super:admin',
}

// 权限分组
export const PermissionGroups = {
  Bookmark: [
    Permission.BOOKMARK_VIEW,
    Permission.BOOKMARK_CREATE,
    Permission.BOOKMARK_UPDATE,
    Permission.BOOKMARK_DELETE,
    Permission.BOOKMARK_ADMIN,
  ],
  Category: [
    Permission.CATEGORY_VIEW,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.CATEGORY_ADMIN,
  ],
  User: [
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_ADMIN,
  ],
  System: [
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.SYSTEM_MONITOR,
    Permission.STATS_VIEW,
  ],
} as const

// 角色权限映射
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.BOOKMARK_VIEW,
    Permission.BOOKMARK_CREATE,
    Permission.BOOKMARK_UPDATE,
    Permission.BOOKMARK_DELETE,
    Permission.CATEGORY_VIEW,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.USER_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE,
    Permission.STATS_VIEW,
  ],
  [UserRole.USER]: [
    Permission.BOOKMARK_VIEW,
    Permission.BOOKMARK_CREATE,
    Permission.BOOKMARK_UPDATE,
    Permission.BOOKMARK_DELETE,
    Permission.CATEGORY_VIEW,
  ],
  [UserRole.GUEST]: [
    Permission.BOOKMARK_VIEW,
    Permission.CATEGORY_VIEW,
  ],
}

// ==================== HTTP 方法枚举 ====================

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

// ==================== HTTP 状态码枚举 ====================

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// ==================== 主题枚举 ====================

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export const ThemeLabels: Record<Theme, string> = {
  [Theme.LIGHT]: '浅色',
  [Theme.DARK]: '深色',
  [Theme.AUTO]: '跟随系统',
}

// ==================== 语言枚举 ====================

export enum Language {
  ZH = 'zh',
  EN = 'en',
}

export const LanguageLabels: Record<Language, string> = {
  [Language.ZH]: '中文',
  [Language.EN]: 'English',
}

// ==================== 排序字段枚举 ====================

export enum BookmarkSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  ORDER_INDEX = 'orderIndex',
  VISIT_COUNT = 'visitCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ==================== 链接健康状态枚举 ====================

export enum LinkHealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  UNCHECKED = 'unchecked',
}

export const LinkHealthStatusLabels: Record<LinkHealthStatus, string> = {
  [LinkHealthStatus.HEALTHY]: '正常',
  [LinkHealthStatus.WARNING]: '警告',
  [LinkHealthStatus.ERROR]: '错误',
  [LinkHealthStatus.UNCHECKED]: '未检查',
}

// ==================== 存储键枚举 ====================

export enum StorageKey {
  TOKEN = 'token',
  USERNAME = 'admin_username',
  ROLE = 'admin_role',
  THEME = 'theme',
  LANGUAGE = 'language',
  CUSTOM_ICONS = 'zen-garden-custom-icons',
  SETTINGS = 'site_settings',
}

// ==================== 路由名称枚举 ====================

export enum RouteName {
  HOME = 'home',
  ADMIN = 'admin',
  ADMIN_LOGIN = 'admin-login',
  FORCE_PASSWORD_CHANGE = 'force-password-change',
}

// ==================== 模块 ID 枚举 ====================

export enum ModuleId {
  BOOKMARKS = 'bookmarks',
  CATEGORIES = 'categories',
  USERS = 'users',
  SETTINGS = 'settings',
  THEME = 'theme',
  WALLPAPER = 'wallpaper',
  DOCK = 'dock',
  MENUS = 'menus',
  NAVIGATION = 'navigation',
  ICONS = 'icons',
  QUOTES = 'quotes',
  PLUGINS = 'plugins',
  SECURITY = 'security',
  SYSTEM_MONITOR = 'system-monitor',
  HEALTH_CHECK = 'health-check',
  ANALYTICS = 'analytics',
}

// ==================== 事件名称枚举 ====================

export enum EventName {
  // 用户事件
  USER_LOGIN = 'user:login',
  USER_LOGOUT = 'user:logout',
  USER_CREATED = 'user:created',
  USER_UPDATED = 'user:updated',
  USER_DELETED = 'user:deleted',
  
  // 书签事件
  BOOKMARK_CREATED = 'bookmark:created',
  BOOKMARK_UPDATED = 'bookmark:updated',
  BOOKMARK_DELETED = 'bookmark:deleted',
  BOOKMARK_IMPORTED = 'bookmark:imported',
  
  // 分类事件
  CATEGORY_CREATED = 'category:created',
  CATEGORY_UPDATED = 'category:updated',
  CATEGORY_DELETED = 'category:deleted',
  
  // 系统事件
  SETTINGS_UPDATED = 'settings:updated',
  THEME_CHANGED = 'theme:changed',
  LANGUAGE_CHANGED = 'language:changed',
  ERROR_OCCURRED = 'error:occurred',
}

// ==================== 错误代码枚举 ====================

export enum ErrorCode {
  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 认证授权错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  FORBIDDEN = 'FORBIDDEN',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // 请求错误
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // 业务错误
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  BOOKMARK_NOT_FOUND = 'BOOKMARK_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
}

// ==================== 辅助函数 ====================

/**
 * 检查值是否为有效的枚举值
 */
export function isValidEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T])
}

/**
 * 获取枚举的所有值
 */
export function getEnumValues<T extends Record<string, string | number>>(enumObj: T): (string | number)[] {
  return Object.values(enumObj)
}

/**
 * 获取枚举的所有键
 */
export function getEnumKeys<T extends Record<string, string | number>>(enumObj: T): (keyof T)[] {
  return Object.keys(enumObj) as (keyof T)[]
}

export default {
  UserRole,
  UserRoleLabels,
  BookmarkVisibility,
  BookmarkVisibilityLabels,
  Permission,
  PermissionGroups,
  RolePermissions,
  HttpMethod,
  HttpStatus,
  Theme,
  ThemeLabels,
  Language,
  LanguageLabels,
  BookmarkSortField,
  SortOrder,
  LinkHealthStatus,
  LinkHealthStatusLabels,
  StorageKey,
  RouteName,
  ModuleId,
  EventName,
  ErrorCode,
  isValidEnumValue,
  getEnumValues,
  getEnumKeys,
}
