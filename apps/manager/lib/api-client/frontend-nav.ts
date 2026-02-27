/**
 * Frontend NavItems API 客户端
 * 提供与后端API的交互功能
 */

import { request } from './client'

export interface NavItem {
  id: string
  name: string
  path: string
  icon: string
  iconType: 'lucide' | 'custom' | 'url'
  description?: string
  orderIndex: number
  isEnabled: number
  isVisible: number
  visibility: 'public' | 'user' | 'admin' | 'super_admin'
  allowedRoles: string[]
  parentId?: string
  children?: NavItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateNavItemRequest {
  name: string
  path: string
  icon?: string
  iconType?: 'lucide' | 'custom' | 'url'
  description?: string
  orderIndex?: number
  isEnabled?: boolean
  isVisible?: boolean
  visibility?: 'public' | 'user' | 'admin' | 'super_admin'
  allowedRoles?: string[]
  parentId?: string
}

export interface UpdateNavItemRequest {
  name?: string
  path?: string
  icon?: string
  iconType?: 'lucide' | 'custom' | 'url'
  description?: string
  orderIndex?: number
  isEnabled?: boolean
  isVisible?: boolean
  visibility?: 'public' | 'user' | 'admin' | 'super_admin'
  allowedRoles?: string[]
  parentId?: string
}

export interface ReorderItem {
  id: string
  orderIndex: number
  parentId?: string
}

class FrontendNavApiClient {
  private baseUrl = '/v2/frontend-nav'

  /**
   * 获取导航项列表（树形结构）
   */
  async getNavItems(): Promise<NavItem[]> {
    const result = await request<{ data: NavItem[] }>(this.baseUrl, {
      requireAuth: true,
    })
    return result.data || []
  }

  /**
   * 获取所有导航项（管理员，扁平结构）
   */
  async getAllNavItems(): Promise<NavItem[]> {
    const result = await request<{ data: NavItem[] }>(`${this.baseUrl}/all`, {
      requireAuth: true,
    })
    return result.data || []
  }

  /**
   * 获取单个导航项
   */
  async getNavItem(id: string): Promise<NavItem> {
    const result = await request<{ data: NavItem }>(`${this.baseUrl}/${id}`, {
      requireAuth: true,
    })
    return result.data
  }

  /**
   * 创建导航项
   */
  async createNavItem(data: CreateNavItemRequest): Promise<NavItem> {
    const result = await request<{ data: NavItem }>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    })
    return result.data
  }

  /**
   * 更新导航项
   */
  async updateNavItem(id: string, data: UpdateNavItemRequest): Promise<NavItem> {
    const result = await request<{ data: NavItem }>(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      requireAuth: true,
    })
    return result.data
  }

  /**
   * 删除导航项
   */
  async deleteNavItem(id: string): Promise<void> {
    await request<void>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    })
  }

  /**
   * 批量更新导航项排序
   */
  async reorderNavItems(items: ReorderItem[]): Promise<void> {
    await request<void>(`${this.baseUrl}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
      requireAuth: true,
    })
  }

  /**
   * 获取导航项统计
   */
  async getNavItemsStats(): Promise<{
    total: number
    enabled: number
    visible: number
    topLevel: number
    byVisibility: { visibility: string; count: number }[]
  }> {
    const result = await request<{
      data: {
        total: number
        enabled: number
        visible: number
        topLevel: number
        byVisibility: { visibility: string; count: number }[]
      }
    }>(`${this.baseUrl}/stats/overview`, {
      requireAuth: true,
    })
    return result.data
  }
}

export const frontendNavApi = new FrontendNavApiClient()
