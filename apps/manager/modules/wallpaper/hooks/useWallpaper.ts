'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchSettings, updateSettings, WallpaperSettings } from '../../../lib/api'
import type { PresetWallpaper } from '../types'

// 默认壁纸设置
const DEFAULT_SETTINGS: WallpaperSettings = {
  enabled: false,
  source: 'upload',
  imageData: '',
  imageUrl: '',
  blur: 0,
  overlay: 30,
}

export function useWallpaper() {
  const [settings, setSettings] = useState<WallpaperSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const siteSettings = await fetchSettings()
        setSettings(siteSettings.wallpaper || DEFAULT_SETTINGS)
      } catch (err) {
        setError('加载壁纸设置失败')
        console.error('加载壁纸设置失败:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // 更新设置
  const updateWallpaperSettings = useCallback(async (newSettings: Partial<WallpaperSettings>) => {
    try {
      setIsSaving(true)
      setError(null)
      const updated: WallpaperSettings = { ...settings, ...newSettings }
      
      console.log('[Wallpaper] Saving settings:', updated)
      
      // 调用真实 API 保存到后端
      const result = await updateSettings({ wallpaper: updated })
      console.log('[Wallpaper] Save result:', result)
      console.log('[Wallpaper] Returned wallpaper:', result.wallpaper)
      
      // 使用后端返回的壁纸设置更新状态
      if (result.wallpaper) {
        setSettings(result.wallpaper)
      } else {
        setSettings(updated)
      }
      return updated
    } catch (err) {
      setError('保存壁纸设置失败')
      console.error('保存壁纸设置失败:', err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  // 上传图片
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const imageData = e.target?.result as string
            await updateWallpaperSettings({
              source: 'upload',
              imageData: imageData,
              enabled: true
            })
            resolve(imageData)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    } catch (err) {
      setError('上传图片失败')
      throw err
    }
  }, [updateWallpaperSettings])

  // 设置图片URL
  const setImageUrl = useCallback(async (url: string) => {
    await updateWallpaperSettings({
      source: 'url',
      imageUrl: url,
      enabled: !!url
    })
  }, [updateWallpaperSettings])

  // 选择预设壁纸
  const selectPreset = useCallback(async (preset: PresetWallpaper) => {
    await updateWallpaperSettings({
      source: 'url',
      imageUrl: preset.url,
      enabled: true
    })
  }, [updateWallpaperSettings])

  // 清除壁纸
  const clearWallpaper = useCallback(async () => {
    await updateWallpaperSettings({
      enabled: false,
      imageData: '',
      imageUrl: '',
    })
  }, [updateWallpaperSettings])

  // 设置模糊度
  const setBlur = useCallback(async (blur: number) => {
    await updateWallpaperSettings({ blur })
  }, [updateWallpaperSettings])

  // 设置遮罩透明度
  const setOverlay = useCallback(async (overlay: number) => {
    await updateWallpaperSettings({ overlay })
  }, [updateWallpaperSettings])

  // 启用/禁用壁纸
  const setEnabled = useCallback(async (enabled: boolean) => {
    await updateWallpaperSettings({ enabled })
  }, [updateWallpaperSettings])

  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateSettings: updateWallpaperSettings,
    uploadImage,
    setImageUrl,
    selectPreset,
    clearWallpaper,
    setBlur,
    setOverlay,
    setEnabled
  }
}
