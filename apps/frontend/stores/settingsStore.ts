import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { fetchSettings as fetchSettingsFromApi, updateSettings, fetchQuotesSettings, SiteSettings } from '../lib/api'
import { setActiveQuotes } from '../data/quotes'

// 默认站点设置
export const defaultSiteSettings: SiteSettings = {
  siteTitle: 'Nexus',
  siteFavicon: '',
  enableBeamAnimation: true,
  enableLiteMode: false,
  enableWeather: true,
  enableLunar: true,
  widgetVisibility: {
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  },
  menuVisibility: {
    languageToggle: true,
    themeToggle: true,
  },
  wallpaper: {
    enabled: false,
    source: 'upload',
    imageData: '',
    imageUrl: '',
    blur: 0,
    overlay: 30,
  },
}

interface SettingsState {
  // 状态
  siteSettings: SiteSettings
  isLoading: boolean
  error: string | null
  lastSyncTime: number
  isLoaded: boolean

  // Actions
  fetchSettings: (force?: boolean) => Promise<void>
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>
  updateSetting: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => Promise<void>
  resetSettings: () => void
  clearError: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      siteSettings: defaultSiteSettings,
      isLoading: false,
      error: null,
      lastSyncTime: 0,
      isLoaded: false,

      fetchSettings: async (force = false) => {
        console.log('[SettingsStore] fetchSettings called, force:', force, 'isLoaded:', get().isLoaded, 'lastSyncTime:', get().lastSyncTime)
        
        // 如果不是强制刷新，且已经加载过，则跳过
        if (!force && get().isLoaded && get().lastSyncTime > 0) {
          console.log('[SettingsStore] Skipping fetch, using cached data')
          return
        }
        
        set({ isLoading: true, error: null })
        try {
          console.log('[SettingsStore] Fetching settings from API...')
 // 加载设置和语录
        const [settings, quotes] = await Promise.all([
          fetchSettingsFromApi(),
          fetchQuotesSettings().catch(() => null),
        ])
          console.log('[SettingsStore] Settings fetched:', settings)

          // 应用站点设置
          if (settings.siteTitle) {
            document.title = settings.siteTitle
          }
          if (settings.siteFavicon) {
            const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
            if (link) {
              link.href = settings.siteFavicon
            } else {
              const newLink = document.createElement('link')
              newLink.rel = 'icon'
              newLink.href = settings.siteFavicon
              document.head.appendChild(newLink)
            }
          }

          // 应用语录
          if (quotes) {
            setActiveQuotes(quotes.quotes, quotes.useDefaultQuotes)
          }

          set({
            siteSettings: settings,
            isLoading: false,
            lastSyncTime: Date.now(),
            isLoaded: true,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : '加载设置失败'
          set({ error: message, isLoading: false })
          console.error('加载设置失败:', error)
        }
      },

      updateSettings: async (settings) => {
        const prevSettings = get().siteSettings
        // 乐观更新
        set({
          siteSettings: { ...prevSettings, ...settings },
          error: null,
        })

        try {
          await updateSettings(settings)
          set({ lastSyncTime: Date.now() })

          // 应用更新到页面
          if (settings.siteTitle) {
            document.title = settings.siteTitle
          }
          if (settings.siteFavicon) {
            const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
            if (link) {
              link.href = settings.siteFavicon
            }
          }
        } catch (error) {
          // 回滚
          set({
            siteSettings: prevSettings,
            error: error instanceof Error ? error.message : '更新设置失败',
          })
          throw error
        }
      },

      updateSetting: async (key, value) => {
        await get().updateSettings({ [key]: value })
      },

      resetSettings: () => {
        set({
          siteSettings: defaultSiteSettings,
          error: null,
          lastSyncTime: 0,
        })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        siteSettings: state.siteSettings,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
)

// 快捷访问 hook
export function useSiteSettings() {
  const store = useSettingsStore()

  return {
    siteSettings: store.siteSettings,
    isLoading: store.isLoading,
    error: store.error,
    isLoaded: store.isLoaded,
    isLiteMode: store.siteSettings.enableLiteMode ?? false,
    showWeather: store.siteSettings.enableWeather ?? true,
    showLunar: store.siteSettings.enableLunar ?? true,
    widgetVisibility: store.siteSettings.widgetVisibility || defaultSiteSettings.widgetVisibility,
    menuVisibility: store.siteSettings.menuVisibility || { languageToggle: true, themeToggle: true },
    wallpaper: store.siteSettings.wallpaper,
    fetchSettings: store.fetchSettings,
    updateSettings: store.updateSettings,
    updateSetting: store.updateSetting,
    clearError: store.clearError,
  }
}
