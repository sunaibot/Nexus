import { Plugin, PluginRegistry as IPluginRegistry } from './types'

export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, Plugin> = new Map()

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id "${plugin.id}" already registered`)
    }
    this.plugins.set(plugin.id, plugin)
    if (plugin.onLoad && plugin.enabled) {
      plugin.onLoad()
    }
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin with id "${pluginId}" not found`)
    }
    if (plugin.onUnload) {
      plugin.onUnload()
    }
    this.plugins.delete(pluginId)
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  enablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin with id "${pluginId}" not found`)
    }
    if (!plugin.enabled) {
      plugin.enabled = true
      if (plugin.onLoad) {
        plugin.onLoad()
      }
    }
  }

  disablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin with id "${pluginId}" not found`)
    }
    if (plugin.enabled) {
      plugin.enabled = false
      if (plugin.onUnload) {
        plugin.onUnload()
      }
    }
  }
}

export const pluginRegistry = new PluginRegistry()
