/**
 * 壁纸设置模块类型定义
 */

// 壁纸来源类型
export type WallpaperSource = 'upload' | 'url' | 'unsplash' | 'picsum' | 'pexels' | 'preset'

// 壁纸设置
export interface WallpaperSettings {
  enabled: boolean
  source: WallpaperSource
  imageData?: string | null
  imageUrl?: string | null
  blur: number
  overlay: number
  presetId?: string | null
}

// 预设壁纸
export interface PresetWallpaper {
  id: string
  name: string
  url: string
  thumbnail: string
  category: 'nature' | 'abstract' | 'city' | 'minimal' | 'dark'
}

// 上传结果
export interface UploadResult {
  url: string
  success: boolean
  message?: string
}

// 壁纸操作结果
export interface WallpaperOperationResult {
  success: boolean
  message?: string
  data?: WallpaperSettings
}
