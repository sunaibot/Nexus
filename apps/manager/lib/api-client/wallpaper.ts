/**
 * 壁纸管理 API 客户端
 * 提供壁纸库管理和壁纸设置功能
 */

import { request } from './client'
import type { WallpaperLibraryItem, WallpaperSettings, WallpaperPreset } from '@/modules/wallpaper/types'

// 壁纸库 API
export const wallpaperLibraryApi = {
  // 获取壁纸库列表
  getAll: async (): Promise<WallpaperLibraryItem[]> => {
    const response = await request<{ success: boolean; data: WallpaperLibraryItem[] }>('/api/v2/wallpaper/library')
    return response.data || []
  },

  // 添加壁纸到库
  add: async (wallpaper: Omit<WallpaperLibraryItem, 'id' | 'createdAt' | 'useCount'>): Promise<WallpaperLibraryItem> => {
    const response = await request<{ success: boolean; data: WallpaperLibraryItem }>('/api/v2/wallpaper/library', {
      method: 'POST',
      body: JSON.stringify(wallpaper),
    })
    return response.data
  },

  // 更新壁纸
  update: async (id: string, updates: Partial<WallpaperLibraryItem>): Promise<void> => {
    await request(`/api/v2/wallpaper/library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // 删除壁纸
  delete: async (id: string): Promise<void> => {
    await request(`/api/v2/wallpaper/library/${id}`, {
      method: 'DELETE',
    })
  },

  // 记录壁纸使用
  use: async (id: string): Promise<void> => {
    await request(`/api/v2/wallpaper/library/${id}/use`, {
      method: 'POST',
    })
  },

  // 切换收藏状态
  toggleFavorite: async (id: string, isFavorite: boolean): Promise<void> => {
    await request(`/api/v2/wallpaper/library/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ isFavorite }),
    })
  },
}

// 预设壁纸 API
export const wallpaperPresetsApi = {
  // 获取预设壁纸列表
  getAll: async (): Promise<WallpaperPreset[]> => {
    const response = await request<{ success: boolean; data: WallpaperPreset[] }>('/api/v2/wallpaper/presets')
    return response.data || []
  },
}

// 每日壁纸 API
export const wallpaperDailyApi = {
  // 获取每日壁纸
  get: async (options?: { source?: string; category?: string; keywords?: string }): Promise<string> => {
    const params = new URLSearchParams()
    if (options?.source) params.append('source', options.source)
    if (options?.category) params.append('category', options.category)
    if (options?.keywords) params.append('keywords', options.keywords)

    const response = await request<{ success: boolean; data: { url: string; source: string } }>(
      `/api/v2/wallpaper/daily?${params.toString()}`
    )
    return response.data?.url || ''
  },
}

// 壁纸设置 API（复用 settings API）
export const wallpaperSettingsApi = {
  // 获取壁纸设置
  get: async (): Promise<WallpaperSettings | null> => {
    try {
      const response = await request<{ success: boolean; data: { wallpaper?: WallpaperSettings } }>('/api/v2/settings/site')
      return response.data?.wallpaper || null
    } catch {
      return null
    }
  },

  // 更新壁纸设置
  update: async (settings: Partial<WallpaperSettings>): Promise<void> => {
    await request('/api/v2/settings/site', {
      method: 'PUT',
      body: JSON.stringify({ wallpaper: settings }),
    })
  },
}

// 导出所有 API
export const wallpaperApi = {
  library: wallpaperLibraryApi,
  presets: wallpaperPresetsApi,
  daily: wallpaperDailyApi,
  settings: wallpaperSettingsApi,
}

// 导出默认 API 对象
export default wallpaperApi
