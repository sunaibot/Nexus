import React from 'react'

export interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  enabled: boolean
  dependencies?: string[]
  components?: Record<string, React.ComponentType<any>>
  hooks?: Record<string, (...args: any[]) => any>
  register?: (registry: any) => void
  unregister?: (registry: any) => void
  onLoad?: () => void
  onUnload?: () => void
}

export interface PluginRegistry {
  register(plugin: Plugin): void
  unregister(pluginId: string): void
  getPlugin(pluginId: string): Plugin | undefined
  getAllPlugins(): Plugin[]
  enablePlugin(pluginId: string): void
  disablePlugin(pluginId: string): void
}

export interface PluginLoader {
  load(pluginId: string): Promise<Plugin>
  unload(pluginId: string): Promise<void>
}
