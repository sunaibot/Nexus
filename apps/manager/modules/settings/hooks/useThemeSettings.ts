/**
 * 主题设置 Hook
 * 封装主题设置的所有业务逻辑
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeSettings, ThemeId, SettingsOperationResult } from '../types'
import { themeSettingsApi } from '../api'

interface UseThemeSettingsReturn {
  // 状态
  settings: ThemeSettings
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // 操作
  setTheme: (themeId: ThemeId) => void
  setDarkMode: (isDark: boolean) => void
  setAutoMode: (auto: boolean) => void
  saveSettings: () => Promise<SettingsOperationResult>
  toggleDarkMode: () => void
  refresh: () => Promise<void>
}

const defaultSettings: ThemeSettings = {
  themeId: 'default',
  isDark: false,
  autoMode: false,
}

export function useThemeSettings(): UseThemeSettingsReturn {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载设置
  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await themeSettingsApi.get()
      setSettings({ ...defaultSettings, ...data })
    } catch (err: any) {
      setError(err.message || t('settings.theme.loadError'))
      console.error('加载主题设置失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  // 初始加载
  useEffect(() => {
    refresh()
  }, [refresh])

  // 设置主题
  const setTheme = useCallback((themeId: ThemeId) => {
    setSettings(prev => ({ ...prev, themeId }))
  }, [])

  // 设置暗黑模式
  const setDarkMode = useCallback((isDark: boolean) => {
    setSettings(prev => ({ ...prev, isDark }))
  }, [])

  // 设置自动模式
  const setAutoMode = useCallback((auto: boolean) => {
    setSettings(prev => ({ ...prev, autoMode: auto }))
  }, [])

  // 切换暗黑模式
  const toggleDarkMode = useCallback(() => {
    setSettings(prev => ({ ...prev, isDark: !prev.isDark }))
  }, [])

  // 保存设置
  const saveSettings = useCallback(async (): Promise<SettingsOperationResult> => {
    setIsSaving(true)
    setError(null)
    
    try {
      await themeSettingsApi.update(settings)
      return { success: true, message: t('settings.theme.saveSuccess') }
    } catch (err: any) {
      const errorMsg = err.message || t('settings.theme.saveError')
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsSaving(false)
    }
  }, [settings, t])

  return {
    settings,
    isLoading,
    isSaving,
    error,
    setTheme,
    setDarkMode,
    setAutoMode,
    saveSettings,
    toggleDarkMode,
    refresh,
  }
}
