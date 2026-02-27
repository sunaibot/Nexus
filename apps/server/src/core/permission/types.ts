/**
 * 权限系统类型定义
 * 基于现有用户表role字段扩展
 */

/** 用户角色枚举 - 复用数据库现有role字段 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',  // 超级管理员
  ADMIN = 'admin',              // 管理员
  USER = 'user',                // 普通用户
  GUEST = 'guest',              // 访客
}

/** 权限操作类型 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

/** 资源类型 */
export enum ResourceType {
  BOOKMARK = 'bookmark',
  CATEGORY = 'category',
  FILE_TRANSFER = 'file_transfer',
  USER = 'user',
  SETTING = 'setting',
  AUDIT = 'audit',
  SYSTEM = 'system',
}

/** 权限检查上下文 */
export interface PermissionContext {
  userId: string
  role: UserRole
  isOwner?: boolean
  resourceType: ResourceType
  action: PermissionAction
}

/** 权限策略 */
export interface PermissionPolicy {
  role: UserRole
  resource: ResourceType
  actions: PermissionAction[]
  condition?: (ctx: PermissionContext) => boolean
}

/** 用户权限配置 */
export interface UserPermissionConfig {
  role: UserRole
  permissions: string[]
  quotas?: UserQuotas
}

/** 用户配额限制 */
export interface UserQuotas {
  maxBookmarks?: number        // 最大书签数
  maxCategories?: number       // 最大分类数
  dailyFileTransferSize?: number  // 每日快传额度(字节)
  maxFileTransferExpiry?: number  // 最大快传有效期(小时)
}

/** 角色层级关系 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.USER]: 50,
  [UserRole.GUEST]: 10,
}
