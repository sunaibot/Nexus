/**
 * 小部件 API 客户端
 * 提供用户小部件管理功能
 */
import { request } from './client'

// 小部件配置
export interface WidgetConfig {
  [key: string]: unknown
}

// 小部件接口
export interface Widget {
  id: string
  userId: string
  name: string
  type: string
  config: WidgetConfig
  orderIndex: number
  createdAt: string
  updatedAt: string
}

// 创建小部件请求
export interface CreateWidgetRequest {
  name: string
  type: string
  config?: WidgetConfig
  orderIndex?: number
}

// 更新小部件请求
export interface UpdateWidgetRequest {
  name?: string
  type?: string
  config?: WidgetConfig
  orderIndex?: number
}

/**
 * 获取当前用户的所有小部件
 */
export async function fetchWidgets(): Promise<Widget[]> {
  const response = await request<{ success: boolean; data: Widget[] }>('/v2/widgets', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 创建小部件
 */
export async function createWidget(data: CreateWidgetRequest): Promise<Widget> {
  const response = await request<{ success: boolean; data: Widget }>('/v2/widgets', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新小部件
 */
export async function updateWidget(id: string, data: UpdateWidgetRequest): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/widgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除小部件
 */
export async function deleteWidget(id: string): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/widgets/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 小部件 API 对象
 */
export const widgetsApi = {
  fetchAll: fetchWidgets,
  create: createWidget,
  update: updateWidget,
  delete: deleteWidget,
}

export default widgetsApi
