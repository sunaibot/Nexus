import { useEffect, useRef, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

interface UseSettingsSyncOptions {
  /** 轮询间隔（毫秒），默认 60000 */
  pollInterval?: number
  /** 缓存有效期（毫秒），默认 300000 */
  cacheDuration?: number
  /** 是否在页面可见性变化时同步 */
  syncOnVisibility?: boolean
  /** 是否监听 storage 变化（多标签页同步） */
  syncAcrossTabs?: boolean
}

export function useSettingsSync(options: UseSettingsSyncOptions = {}) {
  const {
    pollInterval = 60000,
    cacheDuration = 300000,
    syncOnVisibility = true,
    syncAcrossTabs = true,
  } = options

  const { fetchSettings, lastSyncTime, isLoaded } = useSettingsStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 检查是否需要同步
  const shouldSync = useCallback(() => {
    if (!isLoaded) return true
    if (!lastSyncTime) return true
    return Date.now() - lastSyncTime > cacheDuration
  }, [isLoaded, lastSyncTime, cacheDuration])

  // 执行同步
  const sync = useCallback(async () => {
    if (shouldSync()) {
      await fetchSettings()
    }
  }, [fetchSettings, shouldSync])

  useEffect(() => {
    // 初始同步
    sync()

    // 定时轮询
    intervalRef.current = setInterval(() => {
      sync()
    }, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sync, pollInterval])

  // 页面可见性变化时同步
  useEffect(() => {
    if (!syncOnVisibility) return

    let timeoutId: NodeJS.Timeout | null = null

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 延迟执行，避免页面切换时的请求冲突
        timeoutId = setTimeout(() => {
          sync()
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [sync, syncOnVisibility])

  // 多标签页同步
  useEffect(() => {
    if (!syncAcrossTabs) return

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'settings-storage') {
        // 其他标签页更新了设置，重新获取
        fetchSettings()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [fetchSettings, syncAcrossTabs])

  // 监听自定义事件（Manager 更新后触发）
  useEffect(() => {
    const handleSettingsUpdated = () => {
      fetchSettings()
    }

    window.addEventListener('settings:updated', handleSettingsUpdated)
    return () => {
      window.removeEventListener('settings:updated', handleSettingsUpdated)
    }
  }, [fetchSettings])

  return { sync }
}

// 强制刷新设置的 hook
export function useRefreshSettings() {
  const { fetchSettings } = useSettingsStore()

  return useCallback(async () => {
    await fetchSettings()
  }, [fetchSettings])
}
