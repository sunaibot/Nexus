/**
 * 站点设置 Hook
 * 高内聚：封装站点设置的所有业务逻辑
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SiteSettings, SettingsOperationResult } from '../types'
import { siteSettingsApi } from '../api'

interface UseSiteSettingsReturn {
  // 状态
  settings: SiteSettings
  isLoading: boolean
  isSaving: boolean
  error: string | null
  success: boolean
  
  // 操作
  updateSettings: (settings: Partial<SiteSettings>) => void
  saveSettings: () => Promise<SettingsOperationResult>
  uploadFavicon: (file: File) => Promise<string>
  resetError: () => void
  refresh: () => Promise<void>
}

const defaultSettings: SiteSettings = {
  siteTitle: 'NOWEN',
  siteFavicon: '',
  siteDescription: '',
  enableBeamAnimation: true,
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
}

export function useSiteSettings(): UseSiteSettingsReturn {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 加载设置
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await siteSettingsApi.get()
      setSettings({ ...defaultSettings, ...data })
    } catch (err: any) {
      setError(err.message || t('settings.site.loadError'))
      console.error('加载站点设置失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  // 初始加载
  useEffect(() => {
    refresh()
  }, [refresh])

  // 更新设置（本地状态）
  const updateSettings = useCallback((newSettings: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    setSuccess(false)
    setError(null)
  }, [])

  // 保存设置到服务器
  const saveSettings = useCallback(async (): Promise<SettingsOperationResult> => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      await siteSettingsApi.update(settings)
      setSuccess(true)
      
      // 更新页面标题
      if (settings.siteTitle) {
        document.title = settings.siteTitle
      }
      
      // 3秒后清除成功状态
      setTimeout(() => setSuccess(false), 3000)
      
      return { success: true, message: t('settings.site.saveSuccess') }
    } catch (err: any) {
      const errorMsg = err.message || t('settings.site.saveError')
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsSaving(false)
    }
  }, [settings, t])

  // 上传图标
  const uploadFavicon = useCallback(async (file: File): Promise<string> => {
    try {
      const result = await siteSettingsApi.uploadFavicon(file)
      updateSettings({ siteFavicon: result.url })
      return result.url
    } catch (err: any) {
      setError(err.message || t('settings.site.uploadError'))
      throw err
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
    error,
    success,
    updateSettings,
    saveSettings,
    uploadFavicon,
    resetError,
    refresh,
  }
}
