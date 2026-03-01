/**
 * 插件插槽系统 API
 * 从后端获取插件显示配置
 */

import { getApiBase } from '@/lib/env'
import type { PluginDisplayConfig, SlotPosition } from './types'

const API_BASE = getApiBase()

/**
 * 获取所有插件显示配置
 */
export async function fetchPluginSlotConfigs(): Promise<PluginDisplayConfig[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v2/plugin-slots`, {
      credentials: 'include'
    })
    
    if (!res.ok) {
      throw new Error('获取插件配置失败')
    }
    
    const data = await res.json()
    return data.data || []
  } catch (error) {
    console.error('[PluginAPI] Failed to fetch slot configs:', error)
    // 返回空数组，使用默认配置
    return []
  }
}

/**
 * 获取指定插槽的插件配置
 */
export async function fetchPluginsForSlot(slot: SlotPosition): Promise<PluginDisplayConfig[]> {
  try {
    const res = await fetch(`${API_BASE}/api/plugin-slots?slot=${slot}`, {
      credentials: 'include'
    })
    
    if (!res.ok) {
      throw new Error('获取插槽配置失败')
    }
    
    const data = await res.json()
    return data.data || []
  } catch (error) {
    console.error(`[PluginAPI] Failed to fetch plugins for slot ${slot}:`, error)
    return []
  }
}

/**
 * 更新插件插槽配置
 */
export async function updatePluginSlotConfig(
  pluginId: string, 
  slot: SlotPosition, 
  config?: Record<string, any>
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/plugin-slots/${pluginId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ slot, config })
  })
  
  if (!res.ok) {
    throw new Error('更新插件配置失败')
  }
}

/**
 * 启用/禁用插件在插槽中的显示
 */
export async function togglePluginInSlot(
  pluginId: string, 
  enabled: boolean
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/plugin-slots/${pluginId}/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ enabled })
  })
  
  if (!res.ok) {
    throw new Error('切换插件状态失败')
  }
}
