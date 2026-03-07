/**
 * 壁纸源管理 API
 */

import { request } from '../../../lib/api'
import type { WallpaperProvider, BuiltinProviderPreset, ProviderWallpaper } from '../types'

/**
 * 获取所有内置壁纸源预设
 */
export async function fetchProviderPresets(): Promise<BuiltinProviderPreset[]> {
  return request<BuiltinProviderPreset[]>('/api/v2/wallpaper-providers/presets')
}

/**
 * 获取所有壁纸源配置
 */
export async function fetchProviders(): Promise<WallpaperProvider[]> {
  return request<WallpaperProvider[]>('/api/v2/wallpaper-providers')
}

/**
 * 获取启用的壁纸源（公开接口）
 */
export async function fetchEnabledProviders(): Promise<WallpaperProvider[]> {
  return request<WallpaperProvider[]>('/api/v2/wallpaper-providers/enabled')
}

/**
 * 获取单个壁纸源配置
 */
export async function fetchProvider(id: string): Promise<WallpaperProvider> {
  return request<WallpaperProvider>(`/api/v2/wallpaper-providers/${id}`)
}

/**
 * 创建壁纸源配置
 */
export async function createProvider(data: Omit<WallpaperProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<WallpaperProvider> {
  return request<WallpaperProvider>('/api/v2/wallpaper-providers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新壁纸源配置
 */
export async function updateProvider(id: string, data: Partial<WallpaperProvider>): Promise<WallpaperProvider> {
  return request<WallpaperProvider>(`/api/v2/wallpaper-providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * 删除壁纸源配置
 */
export async function deleteProvider(id: string): Promise<void> {
  return request<void>(`/api/v2/wallpaper-providers/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 从内置预设创建壁纸源
 */
export async function createProviderFromPreset(
  presetId: string,
  data: { apiKey?: string; customParams?: Record<string, string> }
): Promise<WallpaperProvider> {
  return request<WallpaperProvider>(`/api/v2/wallpaper-providers/from-preset/${presetId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 获取壁纸源的壁纸列表
 */
export async function fetchProviderWallpapers(
  providerId: string,
  options?: { refresh?: boolean }
): Promise<ProviderWallpaper[]> {
  const query = options?.refresh ? '?refresh=true' : ''
  return request<ProviderWallpaper[]>(`/api/v2/wallpaper-providers/${providerId}/wallpapers${query}`)
}
