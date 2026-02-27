/**
 * 权限管理路由
 * 提供权限查询、角色管理、权限验证等功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import {
  Permission,
  PagePermission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  API_PERMISSIONS,
} from '../../middleware/permission.js'
import { queryAll, queryOne, run } from '../../utils/index.js'

const router = Router()

/**
 * 获取当前用户权限（需要认证）
 * GET /api/v2/permissions/me
 */
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const permissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.user

    return successResponse(res, {
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: permissions,
      pages: permissions.filter((p: string) => p.startsWith('page:')),
      apis: permissions.filter((p: string) => !p.startsWith('page:')),
    })
  } catch (error) {
    console.error('获取用户权限失败:', error)
    return errorResponse(res, '获取用户权限失败')
  }
})

/**
 * 获取所有权限定义（需要管理员权限）
 * GET /api/v2/permissions/definitions
 */
router.get('/definitions', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const permissionDefs = Object.values(Permission).map((p: string) => ({
      code: p,
      name: getPermissionName(p as Permission),
      category: getPermissionCategory(p),
    }))

    const pageDefs = Object.values(PagePermission).map((p: string) => ({
      code: p,
      name: getPageName(p as PagePermission),
      category: '页面权限',
    }))

    return successResponse(res, {
      permissions: permissionDefs,
      pages: pageDefs,
    })
  } catch (error) {
    console.error('获取权限定义失败:', error)
    return errorResponse(res, '获取权限定义失败')
  }
})

/**
 * 获取角色权限矩阵（需要管理员权限）
 * GET /api/v2/permissions/roles
 */
router.get('/roles', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const roles = Object.keys(ROLE_PERMISSIONS).map((role: string) => ({
      code: role,
      name: getRoleName(role),
      permissions: ROLE_PERMISSIONS[role] || [],
      permissionCount: (ROLE_PERMISSIONS[role] || []).length,
    }))

    return successResponse(res, roles)
  } catch (error) {
    console.error('获取角色权限失败:', error)
    return errorResponse(res, '获取角色权限失败')
  }
})

/**
 * 获取特定角色的权限（需要管理员权限）
 * GET /api/v2/permissions/roles/:role
 */
router.get('/roles/:role', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const role = Array.isArray(req.params.role) ? req.params.role[0] : req.params.role

    if (!ROLE_PERMISSIONS[role]) {
      return errorResponse(res, '角色不存在', 404)
    }

    const permissions = ROLE_PERMISSIONS[role]

    return successResponse(res, {
      code: role,
      name: getRoleName(role),
      permissions: permissions,
      pages: permissions.filter((p: string) => p.startsWith('page:')),
      apis: permissions.filter((p: string) => !p.startsWith('page:')),
    })
  } catch (error) {
    console.error('获取角色权限失败:', error)
    return errorResponse(res, '获取角色权限失败')
  }
})

/**
 * 检查权限（需要认证）
 * POST /api/v2/permissions/check
 */
router.post('/check', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { permissions, requireAll = false } = req.body

    if (!permissions || !Array.isArray(permissions)) {
      return errorResponse(res, '权限列表不能为空', 400)
    }

    let hasAccess: boolean
    if (requireAll) {
      hasAccess = hasAllPermissions(user.role, permissions)
    } else {
      hasAccess = hasAnyPermission(user.role, permissions)
    }

    // 获取用户拥有的权限
    const userPerms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.user
    const granted = permissions.filter((p: string) => userPerms.includes(p as any))
    const missing = permissions.filter((p: string) => !userPerms.includes(p as any))

    return successResponse(res, {
      hasAccess,
      requireAll,
      checked: permissions,
      granted,
      missing,
    })
  } catch (error) {
    console.error('检查权限失败:', error)
    return errorResponse(res, '检查权限失败')
  }
})

/**
 * 获取API权限映射（需要管理员权限）
 * GET /api/v2/permissions/api-map
 */
router.get('/api-map', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { groupBy = 'path' } = req.query

    let result: any

    if (groupBy === 'permission') {
      // 按权限分组
      const grouped: Record<string, Array<{ method: string; path: string; permissions: string[] }>> = {}
      for (const [key, perms] of Object.entries(API_PERMISSIONS)) {
        const [method, path] = key.split(' ')
        for (const perm of perms) {
          if (!grouped[perm]) {
            grouped[perm] = []
          }
          grouped[perm].push({ method, path, permissions: perms })
        }
      }
      result = grouped
    } else {
      // 按路径分组
      result = API_PERMISSIONS
    }

    return successResponse(res, {
      total: Object.keys(API_PERMISSIONS).length,
      apis: result,
    })
  } catch (error) {
    console.error('获取API权限映射失败:', error)
    return errorResponse(res, '获取API权限映射失败')
  }
})

/**
 * 验证用户是否有权访问特定API（需要认证）
 * POST /api/v2/permissions/verify-api
 */
router.post('/verify-api', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { path, method } = req.body

    if (!path || !method) {
      return errorResponse(res, '路径和方法不能为空', 400)
    }

    // 查找匹配的API配置
    const key = `${method.toUpperCase()} ${path}`
    const requiredPerms = API_PERMISSIONS[key] || []

    if (requiredPerms.length === 0) {
      return successResponse(res, {
        allowed: true,
        message: '未配置权限限制，默认允许',
        path,
        method,
      })
    }

    const hasAccess = hasAnyPermission(user.role, requiredPerms)

    return successResponse(res, {
      allowed: hasAccess,
      path,
      method,
      required: requiredPerms,
    })
  } catch (error) {
    console.error('验证API权限失败:', error)
    return errorResponse(res, '验证API权限失败')
  }
})

/**
 * 获取可访问的页面列表（需要认证）
 * GET /api/v2/permissions/pages
 */
router.get('/pages', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const userPerms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.user
    const pages = userPerms
      .filter((p: string) => p.startsWith('page:'))
      .map((p: string) => ({
        code: p,
        name: getPageName(p as PagePermission),
        path: getPagePath(p as PagePermission),
      }))

    return successResponse(res, pages)
  } catch (error) {
    console.error('获取页面列表失败:', error)
    return errorResponse(res, '获取页面列表失败')
  }
})

// 辅助函数：获取权限名称
function getPermissionName(permission: Permission): string {
  const names: Record<string, string> = {
    [Permission.BOOKMARK_VIEW]: '查看书签',
    [Permission.BOOKMARK_CREATE]: '创建书签',
    [Permission.BOOKMARK_UPDATE]: '更新书签',
    [Permission.BOOKMARK_DELETE]: '删除书签',
    [Permission.BOOKMARK_IMPORT]: '导入书签',
    [Permission.BOOKMARK_EXPORT]: '导出书签',
    [Permission.CATEGORY_VIEW]: '查看分类',
    [Permission.CATEGORY_CREATE]: '创建分类',
    [Permission.CATEGORY_UPDATE]: '更新分类',
    [Permission.CATEGORY_DELETE]: '删除分类',
    [Permission.USER_VIEW]: '查看用户',
    [Permission.USER_CREATE]: '创建用户',
    [Permission.USER_UPDATE]: '更新用户',
    [Permission.USER_DELETE]: '删除用户',
    [Permission.USER_MANAGE_ROLE]: '管理角色',
    [Permission.SYSTEM_VIEW]: '查看系统',
    [Permission.SYSTEM_SETTINGS]: '系统设置',
    [Permission.SYSTEM_MAINTENANCE]: '系统维护',
    [Permission.SYSTEM_LOGS]: '查看日志',
    [Permission.STATS_VIEW]: '查看统计',
    [Permission.STATS_EXPORT]: '导出统计',
    [Permission.ANNOUNCEMENT_VIEW]: '查看公告',
    [Permission.ANNOUNCEMENT_CREATE]: '创建公告',
    [Permission.ANNOUNCEMENT_UPDATE]: '更新公告',
    [Permission.ANNOUNCEMENT_DELETE]: '删除公告',
    [Permission.ANNOUNCEMENT_PUBLISH]: '发布公告',
    [Permission.THEME_VIEW]: '查看主题',
    [Permission.THEME_CREATE]: '创建主题',
    [Permission.THEME_UPDATE]: '更新主题',
    [Permission.THEME_DELETE]: '删除主题',
    [Permission.THEME_APPLY]: '应用主题',
    [Permission.PLUGIN_VIEW]: '查看插件',
    [Permission.PLUGIN_INSTALL]: '安装插件',
    [Permission.PLUGIN_UNINSTALL]: '卸载插件',
    [Permission.PLUGIN_CONFIG]: '配置插件',
    [Permission.BACKUP_CREATE]: '创建备份',
    [Permission.BACKUP_RESTORE]: '恢复备份',
    [Permission.SECURITY_VIEW]: '查看安全',
    [Permission.SECURITY_IP_FILTER]: 'IP过滤',
    [Permission.SECURITY_AUDIT]: '审计日志',
  }
  return names[permission] || permission
}

// 辅助函数：获取权限分类
function getPermissionCategory(permission: string): string {
  if (permission.startsWith('bookmark:')) return '书签管理'
  if (permission.startsWith('category:')) return '分类管理'
  if (permission.startsWith('user:')) return '用户管理'
  if (permission.startsWith('system:')) return '系统管理'
  if (permission.startsWith('stats:')) return '数据统计'
  if (permission.startsWith('announcement:')) return '公告管理'
  if (permission.startsWith('theme:')) return '主题管理'
  if (permission.startsWith('plugin:')) return '插件管理'
  if (permission.startsWith('backup:')) return '备份恢复'
  if (permission.startsWith('security:')) return '安全管理'
  return '其他'
}

// 辅助函数：获取页面名称
function getPageName(page: PagePermission): string {
  const names: Record<string, string> = {
    [PagePermission.PAGE_DASHBOARD]: '仪表盘',
    [PagePermission.PAGE_BOOKMARKS]: '书签管理',
    [PagePermission.PAGE_CATEGORIES]: '分类管理',
    [PagePermission.PAGE_USERS]: '用户管理',
    [PagePermission.PAGE_SETTINGS]: '系统设置',
    [PagePermission.PAGE_SYSTEM]: '系统监控',
    [PagePermission.PAGE_STATS]: '数据统计',
    [PagePermission.PAGE_ANNOUNCEMENTS]: '公告管理',
    [PagePermission.PAGE_THEMES]: '主题管理',
    [PagePermission.PAGE_PLUGINS]: '插件管理',
    [PagePermission.PAGE_SECURITY]: '安全管理',
    [PagePermission.PAGE_AUDIT]: '审计日志',
    [PagePermission.PAGE_I18N]: '国际化',
    [PagePermission.PAGE_API_DOCS]: 'API文档',
  }
  return names[page] || page
}

// 辅助函数：获取页面路径
function getPagePath(page: PagePermission): string {
  const paths: Record<string, string> = {
    [PagePermission.PAGE_DASHBOARD]: '/dashboard',
    [PagePermission.PAGE_BOOKMARKS]: '/bookmarks',
    [PagePermission.PAGE_CATEGORIES]: '/categories',
    [PagePermission.PAGE_USERS]: '/users',
    [PagePermission.PAGE_SETTINGS]: '/settings',
    [PagePermission.PAGE_SYSTEM]: '/system',
    [PagePermission.PAGE_STATS]: '/stats',
    [PagePermission.PAGE_ANNOUNCEMENTS]: '/announcements',
    [PagePermission.PAGE_THEMES]: '/themes',
    [PagePermission.PAGE_PLUGINS]: '/plugins',
    [PagePermission.PAGE_SECURITY]: '/security',
    [PagePermission.PAGE_AUDIT]: '/audit',
    [PagePermission.PAGE_I18N]: '/i18n',
    [PagePermission.PAGE_API_DOCS]: '/api-docs',
  }
  return paths[page] || '/'
}

// 辅助函数：获取角色名称
function getRoleName(role: string): string {
  const names: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    user: '普通用户',
    guest: '访客',
  }
  return names[role] || role
}

export default router
