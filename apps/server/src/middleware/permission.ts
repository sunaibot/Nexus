/**
 * 权限控制中间件
 * 提供角色权限矩阵、API级权限、页面级权限控制
 */

import { Request, Response, NextFunction } from 'express'
import { queryOne, queryAll } from '../utils/index.js'
import { ErrorCode, AppError } from '../types/error-codes.js'

// 权限类型
export enum Permission {
  // 书签管理
  BOOKMARK_VIEW = 'bookmark:view',
  BOOKMARK_CREATE = 'bookmark:create',
  BOOKMARK_UPDATE = 'bookmark:update',
  BOOKMARK_DELETE = 'bookmark:delete',
  BOOKMARK_IMPORT = 'bookmark:import',
  BOOKMARK_EXPORT = 'bookmark:export',
  BOOKMARK_CREATE_PUBLIC = 'bookmark:create_public',

  // 分类管理
  CATEGORY_VIEW = 'category:view',
  CATEGORY_CREATE = 'category:create',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',

  // 用户管理
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLE = 'user:manage_role',

  // 系统管理
  SYSTEM_VIEW = 'system:view',
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  SYSTEM_LOGS = 'system:logs',

  // 数据统计
  STATS_VIEW = 'stats:view',
  STATS_EXPORT = 'stats:export',

  // 公告管理
  ANNOUNCEMENT_VIEW = 'announcement:view',
  ANNOUNCEMENT_CREATE = 'announcement:create',
  ANNOUNCEMENT_UPDATE = 'announcement:update',
  ANNOUNCEMENT_DELETE = 'announcement:delete',
  ANNOUNCEMENT_PUBLISH = 'announcement:publish',

  // 主题管理
  THEME_VIEW = 'theme:view',
  THEME_CREATE = 'theme:create',
  THEME_UPDATE = 'theme:update',
  THEME_DELETE = 'theme:delete',
  THEME_APPLY = 'theme:apply',

  // 插件管理
  PLUGIN_VIEW = 'plugin:view',
  PLUGIN_INSTALL = 'plugin:install',
  PLUGIN_UNINSTALL = 'plugin:uninstall',
  PLUGIN_CONFIG = 'plugin:config',

  // 备份恢复
  BACKUP_CREATE = 'backup:create',
  BACKUP_RESTORE = 'backup:restore',

  // 安全管理
  SECURITY_VIEW = 'security:view',
  SECURITY_IP_FILTER = 'security:ip_filter',
  SECURITY_AUDIT = 'security:audit',
}

// 页面权限
export enum PagePermission {
  PAGE_DASHBOARD = 'page:dashboard',
  PAGE_BOOKMARKS = 'page:bookmarks',
  PAGE_CATEGORIES = 'page:categories',
  PAGE_USERS = 'page:users',
  PAGE_SETTINGS = 'page:settings',
  PAGE_SYSTEM = 'page:system',
  PAGE_STATS = 'page:stats',
  PAGE_ANNOUNCEMENTS = 'page:announcements',
  PAGE_THEMES = 'page:themes',
  PAGE_PLUGINS = 'page:plugins',
  PAGE_SECURITY = 'page:security',
  PAGE_AUDIT = 'page:audit',
  PAGE_I18N = 'page:i18n',
  PAGE_API_DOCS = 'page:api_docs',
}

// 角色权限矩阵
export const ROLE_PERMISSIONS: Record<string, (Permission | PagePermission)[]> = {
  // 超级管理员 - 拥有所有权限
  super_admin: Object.values({ ...Permission, ...PagePermission }),

  // 管理员
  admin: [
    // 书签管理
    Permission.BOOKMARK_VIEW,
    Permission.BOOKMARK_CREATE,
    Permission.BOOKMARK_UPDATE,
    Permission.BOOKMARK_DELETE,
    Permission.BOOKMARK_IMPORT,
    Permission.BOOKMARK_EXPORT,
    Permission.BOOKMARK_CREATE_PUBLIC,

    // 分类管理
    Permission.CATEGORY_VIEW,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,

    // 用户管理（不能管理角色）
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,

    // 系统管理
    Permission.SYSTEM_VIEW,
    Permission.SYSTEM_SETTINGS,

    // 数据统计
    Permission.STATS_VIEW,
    Permission.STATS_EXPORT,

    // 公告管理
    Permission.ANNOUNCEMENT_VIEW,
    Permission.ANNOUNCEMENT_CREATE,
    Permission.ANNOUNCEMENT_UPDATE,
    Permission.ANNOUNCEMENT_DELETE,
    Permission.ANNOUNCEMENT_PUBLISH,

    // 主题管理
    Permission.THEME_VIEW,
    Permission.THEME_CREATE,
    Permission.THEME_UPDATE,
    Permission.THEME_DELETE,
    Permission.THEME_APPLY,

    // 插件管理
    Permission.PLUGIN_VIEW,
    Permission.PLUGIN_CONFIG,

    // 页面权限
    PagePermission.PAGE_DASHBOARD,
    PagePermission.PAGE_BOOKMARKS,
    PagePermission.PAGE_CATEGORIES,
    PagePermission.PAGE_USERS,
    PagePermission.PAGE_SETTINGS,
    PagePermission.PAGE_STATS,
    PagePermission.PAGE_ANNOUNCEMENTS,
    PagePermission.PAGE_THEMES,
    PagePermission.PAGE_PLUGINS,
    PagePermission.PAGE_API_DOCS,
  ],

  // 普通用户
  user: [
    // 书签管理（自己的）
    Permission.BOOKMARK_VIEW,
    Permission.BOOKMARK_CREATE,
    Permission.BOOKMARK_UPDATE,
    Permission.BOOKMARK_DELETE,
    Permission.BOOKMARK_IMPORT,
    Permission.BOOKMARK_EXPORT,

    // 分类管理（查看）
    Permission.CATEGORY_VIEW,

    // 主题管理（查看和应用）
    Permission.THEME_VIEW,
    Permission.THEME_APPLY,

    // 页面权限
    PagePermission.PAGE_DASHBOARD,
    PagePermission.PAGE_BOOKMARKS,
    PagePermission.PAGE_CATEGORIES,
    PagePermission.PAGE_THEMES,
  ],

  // 访客（只读）
  guest: [
    Permission.BOOKMARK_VIEW,
    Permission.CATEGORY_VIEW,
    Permission.THEME_VIEW,
    PagePermission.PAGE_DASHBOARD,
    PagePermission.PAGE_BOOKMARKS,
    PagePermission.PAGE_CATEGORIES,
  ],
}

// 检查用户是否有指定权限
export function hasPermission(userRole: string, permission: Permission | PagePermission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.user
  return permissions.includes(permission)
}

// 检查用户是否有任意一个权限
export function hasAnyPermission(userRole: string, permissions: (Permission | PagePermission)[]): boolean {
  return permissions.some(p => hasPermission(userRole, p))
}

// 检查用户是否有所有权限
export function hasAllPermissions(userRole: string, permissions: (Permission | PagePermission)[]): boolean {
  return permissions.every(p => hasPermission(userRole, p))
}

// 权限检查中间件工厂
export function requirePermission(...permissions: (Permission | PagePermission)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user

    if (!user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED))
    }

    // 超级管理员直接通过
    if (user.role === 'super_admin') {
      return next()
    }

    // 检查是否有任意一个权限
    if (hasAnyPermission(user.role, permissions)) {
      return next()
    }

    return next(new AppError(ErrorCode.PERMISSION_DENIED, '权限不足', {
      required: permissions,
    }))
  }
}

// 需要所有权限的中间件
export function requireAllPermissions(...permissions: (Permission | PagePermission)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user

    if (!user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED))
    }

    // 超级管理员直接通过
    if (user.role === 'super_admin') {
      return next()
    }

    // 检查是否拥有所有权限
    const missing = permissions.filter(p => !hasPermission(user.role, p))
    if (missing.length === 0) {
      return next()
    }

    return next(new AppError(ErrorCode.PERMISSION_DENIED, '权限不足', {
      missing,
      required: permissions,
    }))
  }
}

// 页面权限检查中间件
export function requirePagePermission(page: PagePermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user

    if (!user) {
      return next(new AppError(ErrorCode.UNAUTHORIZED))
    }

    // 超级管理员直接通过
    if (user.role === 'super_admin') {
      return next()
    }

    if (hasPermission(user.role, page)) {
      return next()
    }

    return next(new AppError(ErrorCode.PERMISSION_DENIED, '无权访问该页面'))
  }
}

// API 权限映射（用于文档生成）
export const API_PERMISSIONS: Record<string, (Permission | PagePermission)[]> = {
  // 书签 API
  'GET /api/v2/bookmarks': [Permission.BOOKMARK_VIEW],
  'POST /api/v2/bookmarks': [Permission.BOOKMARK_CREATE],
  'PATCH /api/v2/bookmarks/:id': [Permission.BOOKMARK_UPDATE],
  'DELETE /api/v2/bookmarks/:id': [Permission.BOOKMARK_DELETE],
  'POST /api/v2/bookmarks/import': [Permission.BOOKMARK_IMPORT],
  'POST /api/v2/bookmarks/export': [Permission.BOOKMARK_EXPORT],

  // 分类 API
  'GET /api/v2/categories': [Permission.CATEGORY_VIEW],
  'POST /api/v2/categories': [Permission.CATEGORY_CREATE],
  'PATCH /api/v2/categories/:id': [Permission.CATEGORY_UPDATE],
  'DELETE /api/v2/categories/:id': [Permission.CATEGORY_DELETE],

  // 用户 API
  'GET /api/v2/users': [Permission.USER_VIEW],
  'POST /api/v2/users': [Permission.USER_CREATE],
  'PATCH /api/v2/users/:id': [Permission.USER_UPDATE],
  'DELETE /api/v2/users/:id': [Permission.USER_DELETE],

  // 系统 API
  'GET /api/v2/system': [Permission.SYSTEM_VIEW],
  'POST /api/v2/system/settings': [Permission.SYSTEM_SETTINGS],

  // 统计 API
  'GET /api/v2/stats': [Permission.STATS_VIEW],

  // 主题 API
  'GET /api/v2/theme': [Permission.THEME_VIEW],
  'POST /api/v2/theme': [Permission.THEME_CREATE],
  'PATCH /api/v2/theme/:id': [Permission.THEME_UPDATE],
  'DELETE /api/v2/theme/:id': [Permission.THEME_DELETE],
}

// 获取 API 所需权限
export function getApiPermissions(method: string, path: string): (Permission | PagePermission)[] {
  const key = `${method} ${path}`
  return API_PERMISSIONS[key] || []
}
