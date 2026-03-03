/**
 * Dock配置API客户端
 */

import { request } from './client'

export interface DockItem {
  id: string
  title: string
  icon: string
  iconType: 'lucide' | 'custom' | 'url'
  href?: string
  action?: string
  orderIndex: number
  isEnabled: number
  isVisible: number
}

export interface DockConfig {
  id: string
  name: string
  description: string
  items: DockItem[]
  scope: 'global' | 'user' | 'role'
  userId?: string
  role?: string
  isDefault: number
  isEnabled: number
  createdAt: string
  updatedAt: string
}

export interface CreateDockConfigData {
  name: string
  description?: string
  items: DockItem[]
  scope?: 'global' | 'user' | 'role'
  userId?: string
  role?: string
  isDefault?: number
  isEnabled?: number
}

export interface UpdateDockConfigData {
  name?: string
  description?: string
  items?: DockItem[]
  scope?: 'global' | 'user' | 'role'
  userId?: string
  role?: string
  isDefault?: number
  isEnabled?: number
}

export interface ReorderDockItem {
  id: string
  orderIndex: number
}

export interface DockConfigStats {
  total: number
  global: number
  user: number
  role: number
  enabled: number
}

const baseUrl = '/v2/dock-configs'

/**
 * 获取Dock配置列表
 */
export async function fetchDockConfigs(params?: { scope?: string; userId?: string; role?: string }): Promise<DockConfig[]> {
  const searchParams = new URLSearchParams()
  if (params?.scope) searchParams.append('scope', params.scope)
  if (params?.userId) searchParams.append('userId', params.userId)
  if (params?.role) searchParams.append('role', params.role)
  
  const result = await request<{ data: DockConfig[] }>(`${baseUrl}?${searchParams.toString()}`, {
    requireAuth: true,
  })
  return result.data || []
}

/**
 * 获取当前用户的有效Dock配置
 */
export async function fetchCurrentDockConfig(): Promise<DockConfig> {
  const result = await request<{ data: DockConfig }>(`${baseUrl}/current`, {
    requireAuth: true,
  })
  return result.data
}

/**
 * 获取单个Dock配置
 */
export async function fetchDockConfigById(id: string): Promise<DockConfig> {
  const result = await request<{ data: DockConfig }>(`${baseUrl}/${id}`, {
    requireAuth: true,
  })
  return result.data
}

/**
 * 创建Dock配置
 */
export async function createDockConfig(data: CreateDockConfigData): Promise<DockConfig> {
  const result = await request<{ data: DockConfig }>(baseUrl, {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return result.data
}

/**
 * 更新Dock配置
 */
export async function updateDockConfig(id: string, data: UpdateDockConfigData): Promise<DockConfig> {
  const result = await request<{ data: DockConfig }>(`${baseUrl}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return result.data
}

/**
 * 删除Dock配置
 */
export async function deleteDockConfig(id: string): Promise<void> {
  await request<void>(`${baseUrl}/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 批量更新Dock项排序
 */
export async function reorderDockItems(id: string, items: ReorderDockItem[]): Promise<{ items: DockItem[] }> {
  const result = await request<{ data: { items: DockItem[] } }>(`${baseUrl}/${id}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    requireAuth: true,
  })
  return result.data
}

/**
 * 获取Dock配置统计
 */
export async function fetchDockConfigStats(): Promise<DockConfigStats> {
  const result = await request<{ data: DockConfigStats }>(`${baseUrl}/stats/overview`, {
    requireAuth: true,
  })
  return result.data
}

// API对象导出
export const dockConfigsApi = {
  fetchAll: fetchDockConfigs,
  fetchCurrent: fetchCurrentDockConfig,
  fetchById: fetchDockConfigById,
  create: createDockConfig,
  update: updateDockConfig,
  delete: deleteDockConfig,
  reorderItems: reorderDockItems,
  getStats: fetchDockConfigStats,
}
