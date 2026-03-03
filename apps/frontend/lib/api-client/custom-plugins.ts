/**
 * 自定义插件前台 API 客户端
 * 使用统一插件API（已合并到 /v2/plugins）
 */

import { request } from './client'
import type { BuildingPlugin } from '../../plugins/types/builder'

export interface CustomPluginContent {
  id: string
  name: string
  description: string
  icon: string
  builderData: BuildingPlugin
}

/**
 * 获取自定义插件内容（公开接口）
 * 使用统一插件API: /v2/plugins/:id/content
 */
export async function getCustomPluginContent(id: string): Promise<CustomPluginContent> {
  const response = await request<{ success: boolean; data: CustomPluginContent }>(`/v2/plugins/${id}/content`, { requireAuth: false })
  return response.data
}

/**
 * 获取所有启用的自定义插件列表
 * 使用统一插件API: /v2/plugins/public/list
 */
export async function getEnabledCustomPlugins(): Promise<CustomPluginContent[]> {
  const response = await request<{ success: boolean; data: CustomPluginContent[] }>('/v2/plugins/public/list', { requireAuth: false })
  return response.data || []
}

/**
 * 获取所有公开插件（包括内置和自定义）
 * 使用统一插件API: /v2/plugins/public
 */
export async function getPublicPlugins(): Promise<CustomPluginContent[]> {
  const response = await request<{ success: boolean; data: CustomPluginContent[] }>('/v2/plugins/public', { requireAuth: false })
  return response.data || []
}
