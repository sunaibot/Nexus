import { Tab, CreateTabParams, UpdateTabParams, ReorderTabItem } from '../../types'
import { ApiResponse } from '../../types/api'
import { request } from './client'

/**
 * 获取所有 Tabs
 */
export async function fetchTabs(): Promise<Tab[]> {
  const response = await request<ApiResponse<Tab[]>>('/v2/tabs', {
    requireAuth: true,
  })
  return response.data || []
}

/**
 * 获取单个 Tab
 */
export async function fetchTabById(id: string): Promise<Tab | null> {
  const response = await request<ApiResponse<Tab>>(`/v2/tabs/${id}`, {
    requireAuth: true,
  })
  return response.data || null
}

/**
 * 创建 Tab
 */
export async function createTab(params: CreateTabParams): Promise<Tab> {
  const response = await request<ApiResponse<Tab>>('/v2/tabs', {
    method: 'POST',
    body: JSON.stringify(params),
    requireAuth: true,
  })
  if (!response.data) {
    throw new Error('创建 Tab 失败')
  }
  return response.data
}

/**
 * 更新 Tab
 */
export async function updateTab(id: string, params: UpdateTabParams): Promise<Tab> {
  const response = await request<ApiResponse<Tab>>(`/v2/tabs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
    requireAuth: true,
  })
  if (!response.data) {
    throw new Error('更新 Tab 失败')
  }
  return response.data
}

/**
 * 删除 Tab
 */
export async function deleteTab(id: string): Promise<void> {
  await request<ApiResponse<void>>(`/v2/tabs/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 重排序 Tab
 */
export async function reorderTabs(items: ReorderTabItem[]): Promise<void> {
  await request<ApiResponse<void>>('/v2/tabs/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    requireAuth: true,
  })
}
