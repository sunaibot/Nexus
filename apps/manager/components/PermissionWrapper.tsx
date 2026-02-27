/**
 * 权限包装组件
 * 用于页面级权限控制和按钮级权限控制
 */

import React from 'react'
import { usePermission, Permission, PagePermission } from '../hooks/usePermission'
import { Shield, Lock } from 'lucide-react'

// 无权限提示组件
interface NoPermissionProps {
  title?: string
  description?: string
  showIcon?: boolean
}

export function NoPermission({
  title = '无权访问',
  description = '您没有权限访问此页面或执行此操作',
  showIcon = true,
}: NoPermissionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {showIcon && (
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-gray-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        {description}
      </p>
    </div>
  )
}

// 页面权限包装器Props
interface PagePermissionWrapperProps {
  children: React.ReactNode
  page: PagePermission
  loadingComponent?: React.ReactNode
}

// 页面权限包装器
export function PagePermissionWrapper({
  children,
  page,
  loadingComponent = <PageLoading />,
}: PagePermissionWrapperProps) {
  const { hasPageAccess, isLoading } = usePermission()
  
  if (isLoading) {
    return <>{loadingComponent}</>
  }
  
  if (!hasPageAccess(page)) {
    return (
      <NoPermission
        title="无权访问此页面"
        description="请联系管理员获取相应权限"
      />
    )
  }
  
  return <>{children}</>
}

// 按钮权限包装器Props
interface ButtonPermissionWrapperProps {
  children: React.ReactNode
  permission: Permission
  hideWhenNoPermission?: boolean
  disabledWhenNoPermission?: boolean
}

// 按钮权限包装器
export function ButtonPermissionWrapper({
  children,
  permission,
  hideWhenNoPermission = true,
  disabledWhenNoPermission = false,
}: ButtonPermissionWrapperProps) {
  const { hasPermission, isLoading } = usePermission()
  
  if (isLoading) {
    return null
  }
  
  const hasAccess = hasPermission(permission)
  
  if (!hasAccess && hideWhenNoPermission) {
    return null
  }
  
  if (!hasAccess && disabledWhenNoPermission) {
    return (
      <div className="relative inline-block">
        <div className="opacity-50 cursor-not-allowed">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// 页面加载中组件
function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">加载权限信息...</p>
      </div>
    </div>
  )
}

// 权限标签组件
interface PermissionBadgeProps {
  permission: Permission | PagePermission
  showName?: boolean
}

export function PermissionBadge({ permission, showName = true }: PermissionBadgeProps) {
  const permissionNames: Record<string, string> = {
    // 书签
    'bookmark:view': '查看书签',
    'bookmark:create': '创建书签',
    'bookmark:update': '更新书签',
    'bookmark:delete': '删除书签',
    // 分类
    'category:view': '查看分类',
    'category:create': '创建分类',
    'category:update': '更新分类',
    'category:delete': '删除分类',
    // 用户
    'user:view': '查看用户',
    'user:create': '创建用户',
    'user:update': '更新用户',
    'user:delete': '删除用户',
    // 系统
    'system:view': '查看系统',
    'system:settings': '系统设置',
    // 统计
    'stats:view': '查看统计',
    // 页面
    'page:dashboard': '仪表盘',
    'page:bookmarks': '书签管理',
    'page:categories': '分类管理',
    'page:users': '用户管理',
    'page:settings': '系统设置',
    'page:stats': '数据统计',
    'page:announcements': '公告管理',
    'page:themes': '主题管理',
    'page:plugins': '插件管理',
    'page:security': '安全管理',
    'page:audit': '审计日志',
    'page:i18n': '国际化',
    'page:api_docs': 'API文档',
  }
  
  const name = permissionNames[permission] || permission
  const isPage = permission.startsWith('page:')
  
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isPage
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      }`}
    >
      {showName ? name : permission}
    </span>
  )
}

// 权限列表组件
interface PermissionListProps {
  permissions: (Permission | PagePermission)[]
  maxShow?: number
}

export function PermissionList({ permissions, maxShow = 5 }: PermissionListProps) {
  const displayPerms = permissions.slice(0, maxShow)
  const remaining = permissions.length - maxShow
  
  return (
    <div className="flex flex-wrap gap-1">
      {displayPerms.map(perm => (
        <PermissionBadge key={perm} permission={perm} />
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          +{remaining}
        </span>
      )}
    </div>
  )
}

export default {
  NoPermission,
  PagePermissionWrapper,
  ButtonPermissionWrapper,
  PermissionBadge,
  PermissionList,
}
