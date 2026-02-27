import { Plugin, PluginLoader as IPluginLoader } from './types'
import { pluginRegistry } from './PluginRegistry'

export class PluginLoader implements IPluginLoader {
  async load(pluginId: string): Promise<Plugin> {
    try {
      const module = await import(`../../modules/${pluginId}/index.js`)
      const plugin: Plugin = module.default || module.plugin
      
      if (!plugin.id) {
        plugin.id = pluginId
      }
      
      pluginRegistry.register(plugin)
      return plugin
    } catch (error) {
      throw new Error(`Failed to load plugin "${pluginId}": ${error}`)
    }
  }

  async unload(pluginId: string): Promise<void> {
    try {
      pluginRegistry.unregister(pluginId)
    } catch (error) {
      throw new Error(`Failed to unload plugin "${pluginId}": ${error}`)
    }
  }
}

export const pluginLoader = new PluginLoader()
