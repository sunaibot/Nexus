/**
 * Dock 配置 API 客户端
 * 用于获取 Dock 导航项配置
 */

import { request } from './client'

export interface DockConfig {
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
  metadata?: string
  createdAt: string
  updatedAt: string
}

export interface CreateDockConfigRequest {
  name: string
  icon: string
  url?: string
  action?: string
  orderIndex?: number
  isActive?: boolean
  scope?: 'global' | 'user' | 'role'
  roleId?: string
  userId?: string
  metadata?: Record<string, any>
}

export interface UpdateDockConfigRequest {
  name?: string
  icon?: string
  url?: string
  action?: string
  orderIndex?: number
  isActive?: boolean
  scope?: 'global' | 'user' | 'role'
  roleId?: string
  userId?: string
  metadata?: Record<string, any>
}

/**
 * 获取当前用户的 Dock 配置
 */
export async function fetchDockConfigs(): Promise<DockConfig[]> {
  return request<DockConfig[]>('/v2/dock-configs', {
    requireAuth: false,
  })
}

/**
 * 获取单个 Dock 配置
 */
export async function fetchDockConfigById(id: string): Promise<DockConfig> {
  return request<DockConfig>(`/v2/dock-configs/${id}`, {
    requireAuth: false,
  })
}

/**
 * 创建 Dock 配置（管理员）
 */
export async function createDockConfig(
  data: CreateDockConfigRequest
): Promise<DockConfig> {
  return request<DockConfig>('/v2/dock-configs', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 更新 Dock 配置（管理员）
 */
export async function updateDockConfig(
  id: string,
  data: UpdateDockConfigRequest
): Promise<DockConfig> {
  return request<DockConfig>(`/api/v2/dock-configs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除 Dock 配置（管理员）
 */
export async function deleteDockConfig(id: string): Promise<void> {
  return request<void>(`/api/v2/dock-configs/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 重新排序 Dock 配置（管理员）
 */
export async function reorderDockConfigs(ids: string[]): Promise<void> {
  return request<void>('/v2/dock-configs/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids }),
    requireAuth: true,
  })
}

/**
 * Dock 配置 API 对象
 */
export const dockConfigsApi = {
  fetchAll: fetchDockConfigs,
  fetchById: fetchDockConfigById,
  create: createDockConfig,
  update: updateDockConfig,
  delete: deleteDockConfig,
  reorder: reorderDockConfigs,
}

export default dockConfigsApi
