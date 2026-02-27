/**
 * 权限管理 Hook
 * 提供页面级权限、API级权限检查
 */

import React, { useState, useEffect, useCallback } from 'react'
import { request } from '../lib/api-client'

// 权限类型（与后端保持一致）
export enum Permission {
  // 书签管理
  BOOKMARK_VIEW = 'bookmark:view',
  BOOKMARK_CREATE = 'bookmark:create',
  BOOKMARK_UPDATE = 'bookmark:update',
  BOOKMARK_DELETE = 'bookmark:delete',
  BOOKMARK_IMPORT = 'bookmark:import',
  BOOKMARK_EXPORT = 'bookmark:export',
  
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

// 用户权限信息
interface UserPermissions {
  userId: string
  username: string
  role: string
  permissions: string[]
  pages: string[]
  apis: string[]
}

// 权限Hook返回类型
interface UsePermissionReturn {
  // 权限数据
  permissions: UserPermissions | null
  isLoading: boolean
  error: string | null
  
  // 权限检查函数
  hasPermission: (permission: Permission | PagePermission) => boolean
  hasAnyPermission: (permissions: (Permission | PagePermission)[]) => boolean
  hasAllPermissions: (permissions: (Permission | PagePermission)[]) => boolean
  hasPageAccess: (page: PagePermission) => boolean
  
  // 刷新权限
  refreshPermissions: () => Promise<void>
  
  // 页面映射
  getAccessiblePages: () => { code: string; name: string; path: string }[]
}

export function usePermission(): UsePermissionReturn {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取用户权限
  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await request<{ success: boolean; data: UserPermissions; error?: string }>('/permissions/me')
      
      if (response.success) {
        setPermissions(response.data)
      } else {
        setError(response.error || '获取权限失败')
      }
    } catch (err) {
      setError('获取权限失败')
      console.error('获取权限失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // 检查单个权限
  const hasPermission = useCallback((permission: Permission | PagePermission): boolean => {
    if (!permissions) return false
    // 超级管理员拥有所有权限
    if (permissions.role === 'super_admin') return true
    return permissions.permissions.includes(permission)
  }, [permissions])

  // 检查是否有任意一个权限
  const hasAnyPermission = useCallback((perms: (Permission | PagePermission)[]): boolean => {
    if (!permissions) return false
    if (permissions.role === 'super_admin') return true
    return perms.some(p => permissions.permissions.includes(p))
  }, [permissions])

  // 检查是否拥有所有权限
  const hasAllPermissions = useCallback((perms: (Permission | PagePermission)[]): boolean => {
    if (!permissions) return false
    if (permissions.role === 'super_admin') return true
    return perms.every(p => permissions.permissions.includes(p))
  }, [permissions])

  // 检查页面访问权限
  const hasPageAccess = useCallback((page: PagePermission): boolean => {
    return hasPermission(page)
  }, [hasPermission])

  // 获取可访问的页面列表
  const getAccessiblePages = useCallback(() => {
    if (!permissions) return []
    
    const pageMap: Record<string, { name: string; path: string }> = {
      [PagePermission.PAGE_DASHBOARD]: { name: '仪表盘', path: '/admin/dashboard' },
      [PagePermission.PAGE_BOOKMARKS]: { name: '书签管理', path: '/admin/bookmarks' },
      [PagePermission.PAGE_CATEGORIES]: { name: '分类管理', path: '/admin/categories' },
      [PagePermission.PAGE_USERS]: { name: '用户管理', path: '/admin/users' },
      [PagePermission.PAGE_SETTINGS]: { name: '系统设置', path: '/admin/settings' },
      [PagePermission.PAGE_SYSTEM]: { name: '系统监控', path: '/admin/system' },
      [PagePermission.PAGE_STATS]: { name: '数据统计', path: '/admin/stats' },
      [PagePermission.PAGE_ANNOUNCEMENTS]: { name: '公告管理', path: '/admin/announcements' },
      [PagePermission.PAGE_THEMES]: { name: '主题管理', path: '/admin/themes' },
      [PagePermission.PAGE_PLUGINS]: { name: '插件管理', path: '/admin/plugins' },
      [PagePermission.PAGE_SECURITY]: { name: '安全管理', path: '/admin/security' },
      [PagePermission.PAGE_AUDIT]: { name: '审计日志', path: '/admin/audit' },
      [PagePermission.PAGE_I18N]: { name: '国际化', path: '/admin/i18n' },
      [PagePermission.PAGE_API_DOCS]: { name: 'API文档', path: '/admin/api-docs' },
    }
    
    return permissions.pages
      .filter(page => pageMap[page])
      .map(page => ({
        code: page,
        name: pageMap[page].name,
        path: pageMap[page].path,
      }))
  }, [permissions])

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasPageAccess,
    refreshPermissions: fetchPermissions,
    getAccessiblePages,
  }
}

// 检查API权限
export async function checkApiPermission(
  path: string, 
  method: string
): Promise<{ allowed: boolean; required?: string[]; description?: string }> {
  try {
    const response = await request<{ 
      success: boolean; 
      data: { allowed: boolean; required?: string[]; description?: string } 
    }>('/permissions/verify-api', {
      method: 'POST',
      body: JSON.stringify({ path, method }),
    })
    
    if (response.success) {
      return {
        allowed: response.data.allowed,
        required: response.data.required,
        description: response.data.description,
      }
    }
    
    return { allowed: false }
  } catch (err) {
    console.error('检查API权限失败:', err)
    return { allowed: false }
  }
}

// 权限守卫组件Props
interface PermissionGuardProps {
  children: React.ReactNode
  permission?: Permission | PagePermission
  permissions?: (Permission | PagePermission)[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

// 权限守卫组件
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps): React.ReactElement | null {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission()
  
  if (isLoading) {
    return React.createElement('div', null, '加载中...')
  }
  
  let hasAccess = false
  
  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    hasAccess = true
  }
  
  return hasAccess ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback)
}

// 页面权限守卫Props
interface PageGuardProps {
  children: React.ReactNode
  page: PagePermission
  fallback?: React.ReactNode
}

// 页面权限守卫组件
export function PageGuard({
  children,
  page,
  fallback,
}: PageGuardProps): React.ReactElement {
  const defaultFallback = React.createElement('div', { 
    className: 'p-8 text-center text-gray-500' 
  }, '无权访问此页面')
  
  return React.createElement(PermissionGuard, {
    permission: page,
    fallback: fallback || defaultFallback,
    children: children
  })
}

export default usePermission
