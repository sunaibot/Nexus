/**
 * 系统设置模块 API 封装
 * 低耦合：所有设置相关 API 集中管理，便于维护和替换
 */

import { 
  SiteSettings, 
  WidgetVisibility, 
  ThemeSettings, 
  WallpaperSettings,
  SecuritySettings,
  DataManagementSettings,
  SettingsOperationResult 
} from './types'

// 导入基础 API 工具
import { request } from '../../lib/api-client/client'

const API_BASE = '/api/v2'

/**
 * 站点设置 API
 */
export const siteSettingsApi = {
  // 获取站点设置
  async get(): Promise<SiteSettings> {
    return request<SiteSettings>(`${API_BASE}/settings/site`, {
      requireAuth: true,
    })
  },

  // 更新站点设置
  async update(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    return request<SiteSettings>(`${API_BASE}/settings/site`, {
      method: 'PUT',
      body: JSON.stringify(settings),
      requireAuth: true,
    })
  },

  // 上传站点图标
  async uploadFavicon(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    
    return request<{ url: string }>(`${API_BASE}/settings/site/favicon`, {
      method: 'POST',
      body: formData,
      requireAuth: true,
    })
  },
}

/**
 * 主题设置 API
 */
export const themeSettingsApi = {
  // 获取当前主题设置
  async get(): Promise<ThemeSettings> {
    return request<ThemeSettings>(`${API_BASE}/theme`, {
      requireAuth: true,
    })
  },

  // 更新主题设置
  async update(settings: Partial<ThemeSettings>): Promise<ThemeSettings> {
    return request<ThemeSettings>(`${API_BASE}/theme`, {
      method: 'PUT',
      body: JSON.stringify(settings),
      requireAuth: true,
    })
  },

  // 获取所有可用主题
  async list(): Promise<ThemeSettings[]> {
    return request<ThemeSettings[]>(`${API_BASE}/themes`, {
      requireAuth: true,
    })
  },
}

/**
 * 壁纸设置 API
 */
export const wallpaperSettingsApi = {
  // 获取壁纸设置（通过站点设置接口）
  async get(): Promise<WallpaperSettings> {
    const response = await request<{ success: boolean; data: { wallpaper: WallpaperSettings } }>(`${API_BASE}/settings/site`, {
      requireAuth: false,
    })
    return response.data.wallpaper
  },

  // 更新壁纸设置（通过站点设置接口）
  async update(settings: Partial<WallpaperSettings>): Promise<WallpaperSettings> {
    const response = await request<{ success: boolean; data: { wallpaper?: WallpaperSettings } & WallpaperSettings }>(`${API_BASE}/settings/site`, {
      method: 'PUT',
      body: JSON.stringify({ wallpaper: settings }),
      requireAuth: true,
    })
    // 后端返回的是整个设置对象，需要提取 wallpaper 字段
    return response.data.wallpaper || response.data
  },

  // 上传壁纸图片（前端直接转 base64，不经过后端上传接口）
  async upload(file: File): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          resolve({ url: result })
        } else {
          reject(new Error('读取文件失败'))
        }
      }
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsDataURL(file)
    })
  },
}

/**
 * 仪表显示设置 API
 */
export const widgetSettingsApi = {
  // 获取仪表显示设置
  async get(): Promise<WidgetVisibility> {
    return request<WidgetVisibility>(`${API_BASE}/settings/widgets`, {
      requireAuth: true,
    })
  },

  // 更新仪表显示设置
  async update(settings: Partial<WidgetVisibility>): Promise<WidgetVisibility> {
    return request<WidgetVisibility>(`${API_BASE}/settings/widgets`, {
      method: 'PUT',
      body: JSON.stringify(settings),
      requireAuth: true,
    })
  },
}

/**
 * 安全设置 API
 */
export const securitySettingsApi = {
  // 获取安全设置
  async get(): Promise<SecuritySettings> {
    return request<SecuritySettings>(`${API_BASE}/settings/security`, {
      requireAuth: true,
    })
  },

  // 更新安全设置
  async update(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    return request<SecuritySettings>(`${API_BASE}/settings/security`, {
      method: 'PUT',
      body: JSON.stringify(settings),
      requireAuth: true,
    })
  },

  // 修改密码
  async changePassword(currentPassword: string, newPassword: string): Promise<SettingsOperationResult> {
    return request<SettingsOperationResult>(`${API_BASE}/admin/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
      requireAuth: true,
    })
  },
}

/**
 * 数据管理 API
 */
export const dataManagementApi = {
  // 导出数据
  async export(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/data/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('导出数据失败')
    }
    
    return response.blob()
  },

  // 导入数据
  async import(data: FormData, mode: 'merge' | 'overwrite' | 'skip' = 'merge'): Promise<SettingsOperationResult> {
    return request<SettingsOperationResult>(`${API_BASE}/data/import?mode=${mode}`, {
      method: 'POST',
      body: data,
      requireAuth: true,
    })
  },

  // 恢复出厂设置
  async factoryReset(): Promise<SettingsOperationResult> {
    return request<SettingsOperationResult>(`${API_BASE}/data/factory-reset`, {
      method: 'POST',
      requireAuth: true,
    })
  },
}

// 统一导出设置 API
export const settingsApi = {
  site: siteSettingsApi,
  theme: themeSettingsApi,
  wallpaper: wallpaperSettingsApi,
  widget: widgetSettingsApi,
  security: securitySettingsApi,
  data: dataManagementApi,
}
