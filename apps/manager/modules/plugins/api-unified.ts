/**
 * 统一插件管理 API
 */

import { request } from '@/lib/api-client/client'

export interface UnifiedPlugin {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  icon?: string
  isEnabled: number
  isInstalled: number
  visibility: string
  orderIndex: number
  isBuiltin: boolean
  hasBackend: boolean
  hasFrontend: boolean
  defaultSlot?: string
  config?: Record<string, any>
  slotConfig?: {
    slot: string
    orderIndex: number
    isEnabled: number
    config: Record<string, any>
  }
  createdAt: string
  updatedAt: string
}

export interface CreatePluginRequest {
  id: string
  name: string
  description?: string
  version?: string
  author?: string
  icon?: string
  config?: {
    slot?: string
    order?: number
    pluginConfig?: Record<string, any>
  }
}

export interface UpdatePluginRequest {
  name?: string
  description?: string
  version?: string
  isEnabled?: boolean
  visibility?: string
  orderIndex?: number
}

export interface SlotConfigRequest {
  slot?: string
  orderIndex?: number
  isEnabled?: boolean
  config?: Record<string, any>
}

const API_BASE = '/v2/plugins'

/**
 * 获取所有插件
 */
export async function fetchAllPlugins(): Promise<UnifiedPlugin[]> {
  const response = await request<{ success: boolean; data: UnifiedPlugin[] }>(API_BASE, {
    requireAuth: true,
  })
  return response.data || []
}

/**
 * 获取单个插件详情
 */
export async function fetchPluginById(id: string): Promise<UnifiedPlugin | null> {
  const response = await request<{ success: boolean; data: UnifiedPlugin }>(`${API_BASE}/${id}`, {
    requireAuth: true,
  })
  return response.data || null
}

/**
 * 创建新插件
 */
export async function createPlugin(data: CreatePluginRequest): Promise<void> {
  await request<{ success: boolean }>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 更新插件
 */
export async function updatePlugin(id: string, data: UpdatePluginRequest): Promise<void> {
  await request<{ success: boolean }>(`${API_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除插件
 */
export async function deletePlugin(id: string): Promise<void> {
  await request<{ success: boolean }>(`${API_BASE}/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 获取插件插槽配置
 */
export async function fetchPluginSlotConfig(id: string): Promise<UnifiedPlugin['slotConfig'] | null> {
  const response = await request<{ success: boolean; data: UnifiedPlugin['slotConfig'] }>(
    `${API_BASE}/${id}/slot-config`,
    { requireAuth: true }
  )
  return response.data || null
}

/**
 * 更新插件插槽配置
 */
export async function updatePluginSlotConfig(id: string, data: SlotConfigRequest): Promise<void> {
  await request<{ success: boolean }>(`${API_BASE}/${id}/slot-config`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 启用/禁用插件
 */
export async function togglePlugin(id: string, enabled: boolean): Promise<void> {
  await updatePlugin(id, { isEnabled: enabled })
}

/**
 * 生成插件代码
 * 将可视化构建数据转换为真实可用的代码
 */
export async function generatePluginCode(id: string): Promise<{
  message: string
  pluginId: string
  hasBackend: boolean
  files: {
    frontend: string[]
    backend: string[]
  }
}> {
  const response = await request<{
    success: boolean
    data: {
      message: string
      pluginId: string
      hasBackend: boolean
      files: {
        frontend: string[]
        backend: string[]
      }
    }
  }>(`${API_BASE}/${id}/generate`, {
    method: 'POST',
    requireAuth: true,
  })
  return response.data!
}

/**
 * 部署插件
 * 将生成的代码部署到系统中
 */
export async function deployPlugin(
  id: string,
  slot: string = 'content-sidebar'
): Promise<{
  message: string
  pluginId: string
  slot: string
  isEnabled: boolean
}> {
  const response = await request<{
    success: boolean
    data: {
      message: string
      pluginId: string
      slot: string
      isEnabled: boolean
    }
  }>(`${API_BASE}/${id}/deploy`, {
    method: 'POST',
    body: JSON.stringify({ slot }),
    requireAuth: true,
  })
  return response.data!
}

/**
 * 预览插件代码
 * 临时生成代码用于预览（不保存）
 */
export async function previewPlugin(builderData: any): Promise<{
  code: string
  styles: string
  hasBackend: boolean
}> {
  const response = await request<{
    success: boolean
    data: {
      code: string
      styles: string
      hasBackend: boolean
    }
  }>(`${API_BASE}/preview`, {
    method: 'POST',
    body: JSON.stringify({ builderData }),
    requireAuth: true,
  })
  return response.data!
}
