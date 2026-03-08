/**
 * 插件插槽 Hook
 * 管理插件的加载和渲染
 */

import { useState, useEffect, useCallback } from 'react'
import type { PluginDisplayConfig, SlotPosition } from '../types'
import { fetchPluginSlotConfigs } from '../api'
import { getPlugin, loadPluginComponent } from '../registry'

interface LoadedPlugin {
  config: PluginDisplayConfig
  component: any
  plugin: ReturnType<typeof getPlugin>
}

export function usePluginSlots(slot: SlotPosition) {
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlugins = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 从后端获取插件配置
      const configs = await fetchPluginSlotConfigs()
      // console.log(`[usePluginSlots ${slot}] Fetched configs:`, configs)
      
      // 过滤出当前插槽的插件
      const slotConfigs = configs
        .filter(c => c.slot === slot && c.isEnabled)
        .sort((a, b) => a.order - b.order)
      // console.log(`[usePluginSlots ${slot}] Filtered configs:`, slotConfigs)

      // 加载每个插件的组件
      const loadedPlugins: LoadedPlugin[] = []
      
      for (const config of slotConfigs) {
        // console.log(`[usePluginSlots ${slot}] Loading plugin:`, config.pluginId)
        const plugin = getPlugin(config.pluginId)
        if (!plugin) {
          // console.warn(`[usePluginSlots] Plugin "${config.pluginId}" not found`)
          continue
        }

        const component = await loadPluginComponent(config.pluginId)
        // console.log(`[usePluginSlots ${slot}] Component loaded:`, config.pluginId, component)
        if (component) {
          loadedPlugins.push({
            config,
            component,
            plugin
          })
        }
      }

      setPlugins(loadedPlugins)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载插件失败')
      console.error('[usePluginSlots] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [slot])

  useEffect(() => {
    loadPlugins()
  }, [loadPlugins])

  return {
    plugins,
    isLoading,
    error,
    refresh: loadPlugins
  }
}

export default usePluginSlots
