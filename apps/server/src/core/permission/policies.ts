/**
 * 权限策略定义
 * 基于RBAC模型，复用现有role字段
 */

import { UserRole, PermissionAction, ResourceType, PermissionPolicy } from './types.js'

/**
 * 系统默认权限策略
 * 定义各角色对资源的操作权限
 */
export const DEFAULT_POLICIES: PermissionPolicy[] = [
  // ==================== 超级管理员权限 ====================
  {
    role: UserRole.SUPER_ADMIN,
    resource: ResourceType.SYSTEM,
    actions: [PermissionAction.MANAGE],
  },
  {
    role: UserRole.SUPER_ADMIN,
    resource: ResourceType.USER,
    actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE, PermissionAction.MANAGE],
  },
  {
    role: UserRole.SUPER_ADMIN,
    resource: ResourceType.SETTING,
    actions: [PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.MANAGE],
  },
  {
    role: UserRole.SUPER_ADMIN,
    resource: ResourceType.AUDIT,
    actions: [PermissionAction.READ, PermissionAction.MANAGE],
  },

  // ==================== 管理员权限 ====================
  {
    role: UserRole.ADMIN,
    resource: ResourceType.USER,
    actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE],
    condition: (ctx) => ctx.role !== UserRole.SUPER_ADMIN, // 不能管理超级管理员
  },
  {
    role: UserRole.ADMIN,
    resource: ResourceType.BOOKMARK,
    actions: [PermissionAction.READ, PermissionAction.MANAGE], // 可管理所有书签
  },
  {
    role: UserRole.ADMIN,
    resource: ResourceType.CATEGORY,
    actions: [PermissionAction.READ, PermissionAction.MANAGE], // 可管理所有分类
  },
  {
    role: UserRole.ADMIN,
    resource: ResourceType.AUDIT,
    actions: [PermissionAction.READ],
  },

  // ==================== 普通用户权限 ====================
  {
    role: UserRole.USER,
    resource: ResourceType.BOOKMARK,
    actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE],
    condition: (ctx) => ctx.isOwner !== false, // 只能操作自己的书签
  },
  {
    role: UserRole.USER,
    resource: ResourceType.CATEGORY,
    actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE],
    condition: (ctx) => ctx.isOwner !== false, // 只能操作自己的分类
  },
  {
    role: UserRole.USER,
    resource: ResourceType.FILE_TRANSFER,
    actions: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.DELETE],
    condition: (ctx) => ctx.isOwner !== false, // 只能操作自己的快传
  },

  // ==================== 访客权限 ====================
  {
    role: UserRole.GUEST,
    resource: ResourceType.BOOKMARK,
    actions: [PermissionAction.READ],
    condition: (ctx) => ctx.isOwner !== false, // 只能查看公开书签
  },
  {
    role: UserRole.GUEST,
    resource: ResourceType.CATEGORY,
    actions: [PermissionAction.READ],
    condition: (ctx) => ctx.isOwner !== false, // 只能查看公开分类
  },
]

/**
 * 角色默认配额配置
 */
export const DEFAULT_QUOTAS: Record<UserRole, { dailyFileTransferSize: number; maxFileTransferExpiry: number }> = {
  [UserRole.SUPER_ADMIN]: {
    dailyFileTransferSize: Infinity,
    maxFileTransferExpiry: 720, // 30天
  },
  [UserRole.ADMIN]: {
    dailyFileTransferSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxFileTransferExpiry: 168, // 7天
  },
  [UserRole.USER]: {
    dailyFileTransferSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFileTransferExpiry: 72, // 3天
  },
  [UserRole.GUEST]: {
    dailyFileTransferSize: 500 * 1024 * 1024, // 500MB
    maxFileTransferExpiry: 24, // 1天
  },
}

/**
 * 获取角色权限策略
 * @param role 用户角色
 * @returns 该角色的所有权限策略
 */
export function getRolePolicies(role: UserRole): PermissionPolicy[] {
  return DEFAULT_POLICIES.filter(policy => policy.role === role)
}

/**
 * 检查角色是否有权限
 * @param role 用户角色
 * @param resource 资源类型
 * @param action 操作类型
 * @returns 是否有权限
 */
export function hasRolePermission(role: UserRole, resource: ResourceType, action: PermissionAction): boolean {
  const policies = getRolePolicies(role)
  return policies.some(policy => 
    policy.resource === resource && policy.actions.includes(action)
  )
}
