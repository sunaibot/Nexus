/**
 * 自定义插件前台 API 客户端
 */

import { request } from '../api'
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
 */
export async function getCustomPluginContent(id: string): Promise<CustomPluginContent> {
  return request<CustomPluginContent>(`/api/v2/custom-plugins/${id}/content`)
}

/**
 * 获取所有启用的自定义插件列表
 */
export async function getEnabledCustomPlugins(): Promise<CustomPluginContent[]> {
  return request<CustomPluginContent[]>('/api/v2/custom-plugins/public')
}
