/**
 * 自定义插件 API 客户端
 * 处理通过可视化构建器创建的插件
 */

import { request } from '../api'
import type { BuildingPlugin, CanvasComponent } from '@/modules/plugins/types/builder'

export interface CustomPlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  isEnabled: boolean
  isInstalled: boolean
  isCustom: boolean
  builderData: BuildingPlugin
  visibility: 'public' | 'private' | 'role'
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface CustomPluginContent {
  id: string
  name: string
  description: string
  icon: string
  builderData: BuildingPlugin
}

/**
 * 获取所有自定义插件
 * 使用统一插件API，过滤自定义插件
 */
export async function getCustomPlugins(): Promise<CustomPlugin[]> {
  const plugins = await request<{ success: boolean; data: any[] }>('/api/v2/plugins?includeUninstalled=true', { requireAuth: true })
  return (plugins.data || [])
    .filter(p => p.isCustom === true || p.builderData)
    .map(p => ({ ...p, isCustom: true }))
}

/**
 * 获取单个自定义插件
 */
export async function getCustomPlugin(id: string): Promise<CustomPlugin> {
  const response = await request<{ success: boolean; data: any }>(`/api/v2/plugins/${id}`, { requireAuth: true })
  return { ...response.data, isCustom: true }
}

/**
 * 创建自定义插件
 */
export async function createCustomPlugin(data: {
  name: string
  description?: string
  icon?: string
  builderData: BuildingPlugin
  visibility?: 'public' | 'private' | 'role'
}): Promise<CustomPlugin> {
  const response = await request<{ success: boolean; data: any }>('/api/v2/plugins', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({
      ...data,
      version: '1.0.0',
      author: 'custom',
      isCustom: true,
      config: { builderData: data.builderData }
    }),
  })
  return { ...response.data, isCustom: true }
}

/**
 * 更新自定义插件
 */
export async function updateCustomPlugin(
  id: string,
  data: {
    name?: string
    description?: string
    icon?: string
    builderData?: BuildingPlugin
    isEnabled?: boolean
  }
): Promise<CustomPlugin> {
  const response = await request<{ success: boolean; data: any }>(`/api/v2/plugins/${id}`, {
    method: 'PATCH',
    requireAuth: true,
    body: JSON.stringify({
      ...data,
      config: data.builderData ? { builderData: data.builderData } : undefined
    }),
  })
  return { ...response.data, isCustom: true }
}

/**
 * 删除自定义插件
 */
export async function deleteCustomPlugin(id: string): Promise<void> {
  await request(`/api/v2/plugins/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 获取插件内容（前台使用，公开接口）
 */
export async function getCustomPluginContent(id: string): Promise<CustomPluginContent> {
  const response = await request<{ success: boolean; data: any }>(`/api/v2/plugins/${id}`, { requireAuth: false })
  const plugin = response.data
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    icon: plugin.icon,
    builderData: plugin.config?.builderData || plugin.builderData
  }
}

/**
 * 保存构建器插件到服务器
 */
export async function saveBuildingPlugin(plugin: BuildingPlugin): Promise<CustomPlugin> {
  if (plugin.id) {
    // 更新现有插件
    return updateCustomPlugin(plugin.id, {
      name: plugin.name,
      description: plugin.description,
      icon: plugin.icon,
      builderData: plugin,
    })
  } else {
    // 创建新插件
    return createCustomPlugin({
      name: plugin.name,
      description: plugin.description,
      icon: plugin.icon,
      builderData: plugin,
      visibility: 'public',
    })
  }
}

/**
 * 从服务器加载构建器插件
 */
export async function loadBuildingPlugin(id: string): Promise<BuildingPlugin> {
  const plugin = await getCustomPlugin(id)
  return {
    ...plugin.builderData,
    id: plugin.id,
  }
}
