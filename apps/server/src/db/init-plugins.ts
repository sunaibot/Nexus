/**
 * 插件数据库初始化
 * 集中管理所有内置插件的初始化
 */

import type { Database as SqlJsDatabase } from 'sql.js'
import { randomUUID } from 'crypto'

/**
 * 插件配置接口
 */
export interface PluginDefinition {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  isEnabled: number
  isInstalled: number
  visibility: 'public' | 'admin' | 'private'
  orderIndex: number
  hasBackend: boolean
  hasFrontend: boolean
  defaultSlot?: string
  config: Record<string, any>
  // 后台菜单配置
  menuConfig?: {
    label: string
    path: string
    order: number
  }
}

/**
 * 内置插件定义
 * 添加新插件时，只需在这里注册
 */
export const BUILTIN_PLUGINS: PluginDefinition[] = [
  {
    id: 'quotes',
    name: '名言管理',
    description: '名言管理插件，提供名言的增删改查功能',
    version: '1.0.0',
    author: 'Nexus Team',
    icon: 'Quote',
    isEnabled: 1,
    isInstalled: 1,
    visibility: 'public',
    orderIndex: 1,
    hasBackend: true,
    hasFrontend: true,
    defaultSlot: 'hero-after',
    config: {
      refreshInterval: 3600000,
      showSource: true
    },
    menuConfig: {
      label: '名言管理',
      path: '/quotes',
      order: 70
    }
  },
  {
    id: 'file-transfer',
    name: '文件快传',
    description: '文件快传插件，提供临时文件上传和分享功能',
    version: '1.0.0',
    author: 'Nexus Team',
    icon: 'Upload',
    isEnabled: 1,
    isInstalled: 1,
    visibility: 'public',
    orderIndex: 2,
    hasBackend: true,
    hasFrontend: true,
    defaultSlot: 'header-right',
    config: {
      maxFileSize: 104857600,
      maxDownloads: 10,
      expiresInHours: 24
    },
    menuConfig: {
      label: '文件快传',
      path: '/file-transfer',
      order: 72
    }
  },
  {
    id: 'rss',
    name: 'RSS订阅',
    description: 'RSS订阅插件，聚合和展示RSS文章',
    version: '1.0.0',
    author: 'Nexus Team',
    icon: 'Rss',
    isEnabled: 1,
    isInstalled: 1,
    visibility: 'public',
    orderIndex: 3,
    hasBackend: true,
    hasFrontend: true,
    defaultSlot: 'content-sidebar',
    config: {
      maxItems: 5,
      refreshInterval: 3600000
    },
    menuConfig: {
      label: 'RSS订阅',
      path: '/rss',
      order: 80
    }
  },
  {
    id: 'notes',
    name: '便签笔记',
    description: '便签笔记插件，快速记录和管理笔记',
    version: '1.0.0',
    author: 'Nexus Team',
    icon: 'StickyNote',
    isEnabled: 1,
    isInstalled: 1,
    visibility: 'public',
    orderIndex: 4,
    hasBackend: true,
    hasFrontend: true,
    defaultSlot: 'content-sidebar',
    config: {
      maxNotes: 5
    },
    menuConfig: {
      label: '笔记管理',
      path: '/notes',
      order: 85
    }
  },
  {
    id: 'visits',
    name: '访问统计',
    description: '访问统计插件，展示网站访问数据',
    version: '1.0.0',
    author: 'Nexus Team',
    icon: 'BarChart',
    isEnabled: 1,
    isInstalled: 1,
    visibility: 'admin',
    orderIndex: 5,
    hasBackend: true,
    hasFrontend: true,
    defaultSlot: 'footer-left',
    config: {
      showTrend: true,
      trendDays: 7
    },
    menuConfig: {
      label: '访问统计',
      path: '/analytics',
      order: 75
    }
  }
]

/**
 * 清理插件自动创建的菜单项
 * 插件管理统一在插件中心，不再在顶级菜单显示
 */
function cleanupPluginMenus(db: SqlJsDatabase): void {
  const pluginIds = BUILTIN_PLUGINS.map(p => p.id)
  if (pluginIds.length === 0) return
  
  // 删除内置插件创建的菜单项
  const placeholders = pluginIds.map(() => '?').join(',')
  db.run(`DELETE FROM admin_menus WHERE id IN (${placeholders})`, pluginIds)
  console.log(`🧹 Cleaned up ${pluginIds.length} plugin menus from top navigation`)
}

/**
 * 初始化所有内置插件到数据库
 */
export function initBuiltinPlugins(db: SqlJsDatabase): void {
  const now = new Date().toISOString()
  
  // 清理插件菜单（插件管理统一在插件中心）
  cleanupPluginMenus(db)
  
  for (const plugin of BUILTIN_PLUGINS) {
    const existing = db.exec('SELECT 1 FROM plugins WHERE id = ?', [plugin.id])
    
    if (existing.length === 0) {
      // 插入新插件
      db.run(
        `INSERT INTO plugins (
          id, name, description, version, author, icon, 
          isEnabled, isInstalled, visibility, orderIndex, 
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plugin.id, 
          plugin.name, 
          plugin.description, 
          plugin.version, 
          plugin.author, 
          plugin.icon,
          plugin.isEnabled, 
          plugin.isInstalled, 
          plugin.visibility, 
          plugin.orderIndex,
          now, 
          now
        ]
      )
      console.log(`✅ Plugin "${plugin.name}" initialized`)
      
      // 初始化插件插槽配置（如果有前台组件）
      if (plugin.hasFrontend && plugin.defaultSlot) {
        initPluginSlotConfig(db, plugin.id, plugin.defaultSlot, plugin.config)
      }
    } else {
      // 更新现有插件（保留用户配置，只更新元数据）
      db.run(
        `UPDATE plugins SET 
          name = ?, 
          description = ?, 
          version = ?, 
          author = ?, 
          icon = ?,
          updatedAt = ?
         WHERE id = ?`,
        [plugin.name, plugin.description, plugin.version, plugin.author, plugin.icon, now, plugin.id]
      )
      console.log(`🔄 Plugin "${plugin.name}" updated (icon: ${plugin.icon})`)
      
      // 确保插槽配置存在（对于已有插件）
      if (plugin.hasFrontend && plugin.defaultSlot) {
        initPluginSlotConfig(db, plugin.id, plugin.defaultSlot, plugin.config)
      }
    }
  }
  
  console.log(`✅ All ${BUILTIN_PLUGINS.length} builtin plugins checked`)
}

/**
 * 初始化插件插槽配置
 */
function initPluginSlotConfig(
  db: SqlJsDatabase, 
  pluginId: string, 
  slot: string, 
  config: Record<string, any>
): void {
  const now = new Date().toISOString()
  
  // 检查是否已有插槽配置
  const existing = db.exec(
    'SELECT 1 FROM plugin_slot_configs WHERE pluginId = ?',
    [pluginId]
  )
  
  if (existing.length === 0) {
    db.run(
      `INSERT INTO plugin_slot_configs (
        id, pluginId, slot, orderIndex, isEnabled, config, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        pluginId,
        slot,
        0,
        1,
        JSON.stringify(config),
        now,
        now
      ]
    )
    console.log(`  📍 Slot config created: ${pluginId} -> ${slot}`)
  }
}

/**
 * 初始化插件后台菜单
 */
function initPluginMenu(
  db: SqlJsDatabase,
  pluginId: string,
  menuConfig: { label: string; path: string; order: number },
  now: string
): void {
  // 检查菜单是否已存在
  const existing = db.exec('SELECT 1 FROM admin_menus WHERE id = ?', [pluginId])
  
  if (existing.length === 0) {
    db.run(
      `INSERT INTO admin_menus (
        id, name, icon, path, isVisible, isEnabled, orderIndex, visibility, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pluginId,
        menuConfig.label,
        pluginId, // 使用插件ID作为图标标识
        menuConfig.path,
        1,
        1,
        menuConfig.order,
        'admin',
        now,
        now
      ]
    )
    console.log(`  📋 Menu created: ${menuConfig.label}`)
  }
}

/**
 * 获取所有内置插件ID列表
 */
export function getBuiltinPluginIds(): string[] {
  return BUILTIN_PLUGINS.map(p => p.id)
}

/**
 * 检查是否为内置插件
 */
export function isBuiltinPlugin(pluginId: string): boolean {
  return BUILTIN_PLUGINS.some(p => p.id === pluginId)
}

/**
 * 获取插件配置
 */
export function getPluginConfig(pluginId: string): Record<string, any> {
  const plugin = BUILTIN_PLUGINS.find(p => p.id === pluginId)
  return plugin?.config || {}
}

/**
 * 获取插件定义
 */
export function getPluginDefinition(pluginId: string): PluginDefinition | undefined {
  return BUILTIN_PLUGINS.find(p => p.id === pluginId)
}

/**
 * 注册新插件（用于动态添加插件）
 * 返回插件定义，方便后续使用
 */
export function registerPlugin(definition: Omit<PluginDefinition, 'isEnabled' | 'isInstalled'>): PluginDefinition {
  const plugin: PluginDefinition = {
    ...definition,
    isEnabled: 1,
    isInstalled: 1
  }
  
  // 检查是否已存在
  const existingIndex = BUILTIN_PLUGINS.findIndex(p => p.id === plugin.id)
  if (existingIndex >= 0) {
    BUILTIN_PLUGINS[existingIndex] = plugin
  } else {
    BUILTIN_PLUGINS.push(plugin)
  }
  
  return plugin
}
