/**
 * 壁纸设置 Hook
 * 封装壁纸设置的所有业务逻辑
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WallpaperSettings, SettingsOperationResult } from '../types'
import { wallpaperSettingsApi } from '../api'

interface UseWallpaperSettingsReturn {
  // 状态
  settings: WallpaperSettings
  isLoading: boolean
  isSaving: boolean
  isUploading: boolean
  error: string | null
  success: boolean
  
  // 操作
  updateSettings: (settings: Partial<WallpaperSettings>) => void
  saveSettings: () => Promise<SettingsOperationResult>
  uploadWallpaper: (file: File) => Promise<string>
  toggleEnabled: () => void
  resetError: () => void
  refresh: () => Promise<void>
}

const defaultSettings: WallpaperSettings = {
  enabled: false,
  url: '',
  blur: 0,
  opacity: 100,
  maskOpacity: 30,
  maskColor: '#000000',
}

export function useWallpaperSettings(): UseWallpaperSettingsReturn {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<WallpaperSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 加载设置
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await wallpaperSettingsApi.get()
      setSettings({ ...defaultSettings, ...data })
    } catch (err: any) {
      setError(err.message || t('settings.wallpaper.loadError'))
      console.error('加载壁纸设置失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  // 初始加载
  useEffect(() => {
    refresh()
  }, [refresh])

  // 更新设置（本地状态）
  const updateSettings = useCallback((newSettings: Partial<WallpaperSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    setSuccess(false)
    setError(null)
  }, [])

  // 切换启用状态
  const toggleEnabled = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }))
  }, [])

  // 保存设置到服务器
  const saveSettings = useCallback(async (): Promise<SettingsOperationResult> => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      await wallpaperSettingsApi.update(settings)
      setSuccess(true)
      
      // 3秒后清除成功状态
      setTimeout(() => setSuccess(false), 3000)
      
      return { success: true, message: t('settings.wallpaper.saveSuccess') }
    } catch (err: any) {
      const errorMsg = err.message || t('settings.wallpaper.saveError')
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsSaving(false)
    }
  }, [settings, t])

  // 上传壁纸
  const uploadWallpaper = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true)
    setError(null)
    
    try {
      const result = await wallpaperSettingsApi.upload(file)
      updateSettings({ url: result.url })
      return result.url
    } catch (err: any) {
      const errorMsg = err.message || t('settings.wallpaper.uploadError')
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }, [updateSettings, t])

  // 重置错误
  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    settings,
    isLoading,
    isSaving,
    isUploading,
    error,
    success,
    updateSettings,
    saveSettings,
    uploadWallpaper,
    toggleEnabled,
    resetError,
    refresh,
  }
}
