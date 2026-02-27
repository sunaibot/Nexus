/**
 * 用户模块类型定义
 * 高内聚：所有用户相关类型集中管理
 */

// 用户角色
import type { UserRole } from '../../../lib/api-client/users'
export type { UserRole }

// 用户状态
export interface UserStatus {
  isActive: boolean
  lastLoginAt?: number
  loginCount: number
  createdAt: number
  updatedAt: number
}

// 基础用户信息
export interface UserBase {
  id: string
  username: string
  email?: string
  role: UserRole
  avatar?: string
}

// 完整用户类型
export interface User extends UserBase, UserStatus {}

// 用户统计信息（与书签系统关联）
export interface UserStats {
  bookmarkCount: number
  categoryCount: number
  tagCount: number
  totalVisits: number
  favoriteCategory?: string
}

// 用户详情（包含统计）
export interface UserDetail extends User {
  stats: UserStats
}

// 创建用户请求
export interface CreateUserData {
  username: string
  password: string
  email?: string
  role?: UserRole
}

// 更新用户请求
export interface UpdateUserData {
  username?: string
  email?: string
  role?: UserRole
  isActive?: boolean
  password?: string
}

// 用户筛选条件
export interface UserFilters {
  searchQuery?: string
  role?: UserRole | 'all'
  status?: 'active' | 'inactive' | 'all'
  sortBy?: 'username' | 'createdAt' | 'lastLogin' | 'bookmarkCount'
  sortOrder?: 'asc' | 'desc'
}

// 用户列表响应
export interface UserListResponse {
  users: UserDetail[]
  total: number
  page: number
  pageSize: number
}

// 批量操作类型
export type BatchAction = 'activate' | 'deactivate' | 'delete'

// 用户活动日志
export interface UserActivity {
  id: string
  userId: string
  action: string
  details?: Record<string, any>
  createdAt: number
}
