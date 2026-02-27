/**
 * Settings Tabs API 客户端
 * 提供与后端API的交互功能
 */

import { request } from './client'

export interface SettingsTab {
  id: string
  tabId: string
  name: string
  labelKey: string
  descriptionKey: string
  icon: string
  iconType: 'lucide' | 'custom' | 'url'
  gradient: string
  orderIndex: number
  isEnabled: number
  isVisible: number
  visibility: 'public' | 'user' | 'admin' | 'super_admin'
  allowedRoles: string[]
  component: string
  createdAt: string
  updatedAt: string
}

export interface CreateSettingsTabRequest {
  tabId: string
  name: string
  labelKey: string
  descriptionKey?: string
  icon?: string
  iconType?: 'lucide' | 'custom' | 'url'
  gradient?: string
  orderIndex?: number
  isEnabled?: boolean
  isVisible?: boolean
  visibility?: 'public' | 'user' | 'admin' | 'super_admin'
  allowedRoles?: string[]
  component?: string
}

export interface UpdateSettingsTabRequest {
  tabId?: string
  name?: string
  labelKey?: string
  descriptionKey?: string
  icon?: string
  iconType?: 'lucide' | 'custom' | 'url'
  gradient?: string
  orderIndex?: number
  isEnabled?: boolean
  isVisible?: boolean
  visibility?: 'public' | 'user' | 'admin' | 'super_admin'
  allowedRoles?: string[]
  component?: string
}

export interface ReorderItem {
  id: string
  orderIndex: number
}

class SettingsTabsApiClient {
  private baseUrl = '/v2/settings-tabs'

  /**
   * 获取Settings Tabs列表
   */
  async getSettingsTabs(): Promise<SettingsTab[]> {
    const result = await request<{ data: SettingsTab[] }>(this.baseUrl, {
      requireAuth: true,
    })
    return result.data || []
  }

  /**
   * 获取所有Settings Tabs（管理员）
   */
  async getAllSettingsTabs(): Promise<SettingsTab[]> {
    const result = await request<{ data: SettingsTab[] }>(`${this.baseUrl}/all`, {
      requireAuth: true,
    })
    return result.data || []
  }

  /**
   * 获取单个Settings Tab
   */
  async getSettingsTab(id: string): Promise<SettingsTab> {
    const result = await request<{ data: SettingsTab }>(`${this.baseUrl}/${id}`, {
      requireAuth: true,
    })
    return result.data
  }

  /**
   * 通过tabId获取Settings Tab
   */
  async getSettingsTabByTabId(tabId: string): Promise<SettingsTab> {
    const result = await request<{ data: SettingsTab }>(`${this.baseUrl}/by-tabId/${tabId}`, {
      requireAuth: true,
    })
    return result.data
  }

  /**
   * 创建Settings Tab
   */
  async createSettingsTab(data: CreateSettingsTabRequest): Promise<SettingsTab> {
    const result = await request<{ data: SettingsTab }>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    })
    return result.data
  }

  /**
   * 更新Settings Tab
   */
  async updateSettingsTab(id: string, data: UpdateSettingsTabRequest): Promise<SettingsTab> {
    const result = await request<{ data: SettingsTab }>(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    })
    return result.data
  }

  /**
   * 删除Settings Tab
   */
  async deleteSettingsTab(id: string): Promise<void> {
    await request<void>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    })
  }

  /**
   * 批量更新Settings Tabs排序
   */
  async reorderSettingsTabs(items: ReorderItem[]): Promise<void> {
    await request<void>(`${this.baseUrl}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
      requireAuth: true,
    })
  }

  /**
   * 获取Settings Tabs统计
   */
  async getSettingsTabsStats(): Promise<{
    total: number
    enabled: number
    visible: number
    byVisibility: { visibility: string; count: number }[]
  }> {
    const result = await request<{
      data: {
        total: number
        enabled: number
        visible: number
        byVisibility: { visibility: string; count: number }[]
      }
    }>(`${this.baseUrl}/stats/overview`, {
      requireAuth: true,
    })
    return result.data
  }
}

export const settingsTabsApi = new SettingsTabsApiClient()
