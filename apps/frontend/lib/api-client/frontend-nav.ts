/**
 * 前端导航配置 API 客户端
 * 用于获取前端导航项配置
 */

import { request } from './client'

export interface FrontendNavItem {
  id: string
  name: string
  icon: string
  url?: string
  action?: string
  orderIndex: number
  isActive: boolean
  scope: 'global' | 'user' | 'role'
  roleId?: string
  userId?: string
  parentId?: string
  metadata?: string
  children?: FrontendNavItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateFrontendNavItemRequest {
  name: string
  icon: string
  url?: string
  action?: string
  orderIndex?: number
  isActive?: boolean
  scope?: 'global' | 'user' | 'role'
  roleId?: string
  userId?: string
  parentId?: string
  metadata?: Record<string, any>
}

export interface UpdateFrontendNavItemRequest {
  name?: string
  icon?: string
  url?: string
  action?: string
  orderIndex?: number
  isActive?: boolean
  scope?: 'global' | 'user' | 'role'
  roleId?: string
  userId?: string
  parentId?: string
  metadata?: Record<string, any>
}

/**
 * 获取当前用户的导航配置（树形结构）
 */
export async function fetchFrontendNavItems(): Promise<FrontendNavItem[]> {
  return request<FrontendNavItem[]>('/v2/frontend-nav', {
    requireAuth: false,
  })
}

/**
 * 获取扁平化的导航列表（管理员）
 */
export async function fetchFrontendNavItemsFlat(): Promise<FrontendNavItem[]> {
  return request<FrontendNavItem[]>('/v2/frontend-nav/flat', {
    requireAuth: true,
  })
}

/**
 * 获取单个导航项
 */
export async function fetchFrontendNavItemById(id: string): Promise<FrontendNavItem> {
  return request<FrontendNavItem>(`/v2/frontend-nav/${id}`, {
    requireAuth: false,
  })
}

/**
 * 创建导航项（管理员）
 */
export async function createFrontendNavItem(
  data: CreateFrontendNavItemRequest
): Promise<FrontendNavItem> {
  return request<FrontendNavItem>('/v2/frontend-nav', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 更新导航项（管理员）
 */
export async function updateFrontendNavItem(
  id: string,
  data: UpdateFrontendNavItemRequest
): Promise<FrontendNavItem> {
  return request<FrontendNavItem>(`/v2/frontend-nav/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除导航项（管理员）
 */
export async function deleteFrontendNavItem(id: string): Promise<void> {
  return request<void>(`/v2/frontend-nav/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 重新排序导航项（管理员）
 */
export async function reorderFrontendNavItems(
  parentId: string | null,
  ids: string[]
): Promise<void> {
  return request<void>('/v2/frontend-nav/reorder', {
    method: 'POST',
    body: JSON.stringify({ parentId, ids }),
    requireAuth: true,
  })
}

/**
 * 前端导航 API 对象
 */
export const frontendNavApi = {
  fetchAll: fetchFrontendNavItems,
  fetchFlat: fetchFrontendNavItemsFlat,
  fetchById: fetchFrontendNavItemById,
  create: createFrontendNavItem,
  update: updateFrontendNavItem,
  delete: deleteFrontendNavItem,
  reorder: reorderFrontendNavItems,
}

export default frontendNavApi
