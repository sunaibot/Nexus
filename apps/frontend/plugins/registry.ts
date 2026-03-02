/**
 * 插件注册表
 * 管理所有内置插件的注册和获取
 */

import type { Plugin, SlotPosition } from './types'

// 内置插件注册表
const builtinPlugins: Map<string, Plugin> = new Map()

// 插件组件懒加载映射
const pluginComponentMap: Record<string, () => Promise<any>> = {
  // 展示型插件
  'weather': () => import('./builtin/weather/index.tsx'),
  'clock': () => import('./builtin/clock/index.tsx'),
  'quote': () => import('./builtin/quote/index.tsx'),
  
  // 工具型插件
  'file-transfer': () => import('./builtin/file-transfer/index.tsx'),
  
  // 内容型插件
  'rss': () => import('./builtin/rss/index.tsx'),
  'notes': () => import('./builtin/notes/index.tsx'),
  'visits': () => import('./builtin/visits/index.tsx'),
  
  // 可以在这里添加更多插件
}

/**
 * 注册插件
 */
export function registerPlugin(plugin: Plugin): void {
  builtinPlugins.set(plugin.id, plugin)
  console.log(`[PluginRegistry] Plugin "${plugin.name}" registered`)
}

/**
 * 获取插件
 */
export function getPlugin(id: string): Plugin | undefined {
  return builtinPlugins.get(id)
}

/**
 * 获取所有插件
 */
export function getAllPlugins(): Plugin[] {
  return Array.from(builtinPlugins.values())
}

/**
 * 获取指定类型的插件
 */
export function getPluginsByType(type: Plugin['type']): Plugin[] {
  return getAllPlugins().filter(p => p.type === type)
}

/**
 * 获取指定插槽的默认插件
 */
export function getPluginsForSlot(slot: SlotPosition): Plugin[] {
  return getAllPlugins().filter(p => p.defaultSlot === slot)
}

/**
 * 懒加载插件组件
 */
export async function loadPluginComponent(pluginId: string): Promise<any | null> {
  const loader = pluginComponentMap[pluginId]
  if (!loader) {
    console.warn(`[PluginRegistry] No component found for plugin "${pluginId}"`)
    return null
  }
  
  try {
    const module = await loader()
    return module.default || module
  } catch (error) {
    console.error(`[PluginRegistry] Failed to load component for plugin "${pluginId}":`, error)
    return null
  }
}

/**
 * 检查插件是否存在
 */
export function hasPlugin(id: string): boolean {
  return builtinPlugins.has(id)
}

/**
 * 初始化所有内置插件
 */
export function initBuiltinPlugins(): void {
  // 天气插件
  registerPlugin({
    id: 'weather',
    name: '天气',
    description: '显示当前天气信息',
    version: '1.0.0',
    author: 'Nexus Team',
    type: 'widget',
    component: 'WeatherWidget',
    defaultSlot: 'hero-before',
    defaultConfig: {
      city: 'auto',
      unit: 'celsius',
      showForecast: true
    }
  })

  // 时钟插件
  registerPlugin({
    id: 'clock',
    name: '时钟',
    description: '显示当前时间',
    version: '1.0.0',
    author: 'Nexus Team',
    type: 'widget',
    component: 'ClockWidget',
    defaultSlot: 'header-center',
    defaultConfig: {
      format: '24h',
      showSeconds: false
    }
  })

  // 名言插件
  registerPlugin({
    id: 'quote',
    name: '每日名言',
    description: '显示每日名言警句',
    version: '1.0.0',
    author: 'Nexus Team',
    type: 'widget',
    component: 'QuoteWidget',
    defaultSlot: 'hero-after',
    defaultConfig: {
      category: 'inspiration',
      refreshInterval: 3600000 // 1小时
    }
  })

  // 文件快传插件
  registerPlugin({
    id: 'file-transfer',
    name: '文件快传',
    description: '快速上传和分享文件',
    version: '1.0.0',
    author: 'Nexus Team',
    type: 'tool',
    component: 'FileTransferWidget',
    defaultSlot: 'header-right',
    defaultConfig: {
      maxFileSize: 104857600, // 100MB
      buttonStyle: 'icon'
    }
  })

  // RSS订阅插件
  registerPlugin({
    id: 'rss',
    name: 'RSS订阅',
    description: '显示RSS订阅文章',
    version: '1.0.0',
    author: 'Nexus Team',
    type: 'content',
    component: 'RssWidget',
    defaultSlot: 'sidebar-right',
    defaultConfig: {
      maxItems: 5,
      showUnreadOnly: true
    }
  })

  // 笔记便签插件
  registerPlugin({
    id: 'notes',
    name: '便签',
    description: '快速记录和管理笔记',
    version: '1.0.0',
    author: 'Nexus Team',
    type: 'tool',
    component: 'NotesWidget',
    defaultSlot: 'sidebar-right',
    defaultConfig: {
      maxNotes: 5,
      showPinnedOnly: false
    }
  })

  // 访问统计插件
  registerPlugin({
    id: 'visits',
    name: '访问统计',
    description: '显示网站访问数据和热门书签',
    version: '1.0.0',
    author: 'Nexus Team',
    type: 'widget',
    component: 'VisitsWidget',
    defaultSlot: 'footer-left',
    defaultConfig: {
      showTrend: true,
      showTopBookmarks: true,
      trendDays: 7
    }
  })

  console.log(`[PluginRegistry] ${builtinPlugins.size} builtin plugins initialized`)
}

// 自动初始化
initBuiltinPlugins()
