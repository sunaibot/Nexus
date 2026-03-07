/**
 * 主题颜色提供者
 * 从站点设置中加载自定义主题颜色并应用到页面
 */

import { useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { siteSettings, isLoaded } = useSettingsStore()

  // 应用自定义主题颜色
  useEffect(() => {
    if (!isLoaded) return

    const themeColors = siteSettings.themeColors
    if (!themeColors) return

    const root = document.documentElement

    // 应用文字颜色
    if (themeColors.textPrimary) {
      root.style.setProperty('--color-text-primary', themeColors.textPrimary)
    }
    if (themeColors.textSecondary) {
      root.style.setProperty('--color-text-secondary', themeColors.textSecondary)
    }
    if (themeColors.textMuted) {
      root.style.setProperty('--color-text-muted', themeColors.textMuted)
    }

    // 应用图标颜色
    if (themeColors.iconPrimary) {
      root.style.setProperty('--color-icon-primary', themeColors.iconPrimary)
    }
    if (themeColors.iconSecondary) {
      root.style.setProperty('--color-icon-secondary', themeColors.iconSecondary)
    }
    if (themeColors.iconMuted) {
      root.style.setProperty('--color-icon-muted', themeColors.iconMuted)
    }

    // 应用按钮颜色
    if (themeColors.buttonPrimaryBg) {
      root.style.setProperty('--color-button-primary-bg', themeColors.buttonPrimaryBg)
    }
    if (themeColors.buttonPrimaryText) {
      root.style.setProperty('--color-button-primary-text', themeColors.buttonPrimaryText)
    }
    if (themeColors.buttonSecondaryBg) {
      root.style.setProperty('--color-button-secondary-bg', themeColors.buttonSecondaryBg)
    }
    if (themeColors.buttonSecondaryText) {
      root.style.setProperty('--color-button-secondary-text', themeColors.buttonSecondaryText)
    }
  }, [siteSettings.themeColors, isLoaded])

  return <>{children}</>
}
