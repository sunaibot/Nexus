/**
 * Settings Tabs 配置 API 客户端
 * 用于获取设置页面标签配置
 */

import { request } from './client'

export interface SettingsTab {
  id: string
  name: string
  icon: string
  description?: string
  orderIndex: number
  isActive: boolean
  visibility: 'public' | 'user' | 'admin' | 'super_admin'
  component?: string
  metadata?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSettingsTabRequest {
  name: string
  icon: string
  description?: string
  orderIndex?: number
  isActive?: boolean
  visibility?: 'public' | 'user' | 'admin' | 'super_admin'
  component?: string
  metadata?: Record<string, any>
}

export interface UpdateSettingsTabRequest {
  name?: string
  icon?: string
  description?: string
  orderIndex?: number
  isActive?: boolean
  visibility?: 'public' | 'user' | 'admin' | 'super_admin'
  component?: string
  metadata?: Record<string, any>
}

/**
 * 获取当前用户的 Settings Tabs 配置
 */
export async function fetchSettingsTabs(): Promise<SettingsTab[]> {
  return request<SettingsTab[]>('/v2/settings-tabs', {
    requireAuth: false,
  })
}

/**
 * 获取所有 Settings Tabs（管理员）
 */
export async function fetchAllSettingsTabs(): Promise<SettingsTab[]> {
  return request<SettingsTab[]>('/v2/settings-tabs/all', {
    requireAuth: true,
  })
}

/**
 * 获取单个 Settings Tab
 */
export async function fetchSettingsTabById(id: string): Promise<SettingsTab> {
  return request<SettingsTab>(`/v2/settings-tabs/${id}`, {
    requireAuth: false,
  })
}

/**
 * 创建 Settings Tab（管理员）
 */
export async function createSettingsTab(
  data: CreateSettingsTabRequest
): Promise<SettingsTab> {
  return request<SettingsTab>('/v2/settings-tabs', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 更新 Settings Tab（管理员）
 */
export async function updateSettingsTab(
  id: string,
  data: UpdateSettingsTabRequest
): Promise<SettingsTab> {
  return request<SettingsTab>(`/v2/settings-tabs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除 Settings Tab（管理员）
 */
export async function deleteSettingsTab(id: string): Promise<void> {
  return request<void>(`/v2/settings-tabs/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 重新排序 Settings Tabs（管理员）
 */
export async function reorderSettingsTabs(ids: string[]): Promise<void> {
  return request<void>('/v2/settings-tabs/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids }),
    requireAuth: true,
  })
}

/**
 * Settings Tabs API 对象
 */
export const settingsTabsApi = {
  fetchAll: fetchSettingsTabs,
  fetchAllAdmin: fetchAllSettingsTabs,
  fetchById: fetchSettingsTabById,
  create: createSettingsTab,
  update: updateSettingsTab,
  delete: deleteSettingsTab,
  reorder: reorderSettingsTabs,
}

export default settingsTabsApi
