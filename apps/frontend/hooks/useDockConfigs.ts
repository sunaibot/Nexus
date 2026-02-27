import { useState, useEffect, useCallback } from 'react'
import { fetchDockConfigs, type DockConfig } from '../lib/api-client/dock-configs'
import { useToast } from '../components/admin/Toast'

export function useDockConfigs() {
  const [dockConfigs, setDockConfigs] = useState<DockConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const loadDockConfigs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const configs = await fetchDockConfigs()
      // 按orderIndex排序
      const sortedConfigs = configs
        .filter(config => config.isActive)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      setDockConfigs(sortedConfigs)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取Dock配置失败'
      setError(errorMessage)
      showToast('error', errorMessage)
      console.error('Failed to fetch dock configs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadDockConfigs()
  }, [loadDockConfigs])

  return {
    dockConfigs,
    isLoading,
    error,
    refresh: loadDockConfigs,
  }
}
