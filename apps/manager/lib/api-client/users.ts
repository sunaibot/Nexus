import { request } from './client'
import type { ApiResponse } from '../../types'

export type UserRole = 'admin' | 'user' | 'guest'

export interface User {
  id: string
  username: string
  email?: string
  role: UserRole
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface CreateUserData {
  username: string
  password: string
  email?: string
  role?: UserRole
}

export interface UpdateUserData {
  username?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

export async function fetchUsers(): Promise<User[]> {
  const response = await request<ApiResponse<User[]>>('/v2/users', {
    requireAuth: true
  })
  return response.data || []
}

export async function createUser(data: CreateUserData): Promise<User> {
  const response = await request<ApiResponse<User>>('/v2/users', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true
  })
  return response.data!
}

export async function updateUser(userId: string, data: UpdateUserData): Promise<void> {
  await request<ApiResponse<void>>(`/v2/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true
  })
}

export async function deleteUser(userId: string): Promise<void> {
  await request<ApiResponse<void>>(`/v2/users/${userId}`, {
    method: 'DELETE',
    requireAuth: true
  })
}

export async function batchUpdateUsers(userIds: string[], data: UpdateUserData): Promise<void> {
  await request<ApiResponse<void>>('/v2/users/batch', {
    method: 'PUT',
    body: JSON.stringify({ userIds, data }),
    requireAuth: true
  })
}

export interface UserStats {
  bookmarkCount: number
  categoryCount: number
  tagCount: number
  totalVisits: number
  favoriteCategory?: string
}

export async function fetchUserStats(userId: string): Promise<UserStats> {
  const response = await request<ApiResponse<UserStats>>(`/v2/users/${userId}/stats`, {
    requireAuth: true
  })
  return response.data || {
    bookmarkCount: 0,
    categoryCount: 0,
    tagCount: 0,
    totalVisits: 0,
  }
}

// 批量删除用户
export async function batchDeleteUsers(userIds: string[]): Promise<void> {
  await request<ApiResponse<void>>('/v2/users/batch', {
    method: 'DELETE',
    body: JSON.stringify({ userIds }),
    requireAuth: true
  })
}

// API对象导出
export const usersApi = {
  fetchAll: fetchUsers,
  create: createUser,
  update: updateUser,
  delete: deleteUser,
  batchDelete: batchDeleteUsers,
  batchUpdate: batchUpdateUsers,
  getStats: fetchUserStats,
}
