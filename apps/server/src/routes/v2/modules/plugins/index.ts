/**
 * 统一插件路由模块
 * 合并 plugins.ts, plugins-unified.ts, custom-plugins.ts 的功能
 * 提供完整的插件生命周期管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../../routes/utils/routeHelpers.js'
import {
  createPlugin,
  createCustomPlugin,
  updateCustomPlugin,
  getPlugins,
  getPluginById,
  updatePlugin,
  deletePlugin,
  enablePlugin,
  disablePlugin
} from '../../../../db/index.js'
import { queryAll, queryOne, run, generateId } from '../../../../utils/index.js'
import { BUILTIN_PLUGINS, isBuiltinPlugin } from '../../../../db/init-plugins.js'
import { randomUUID } from 'crypto'

const router = Router()

// ========== 类型定义 ==========
interface PluginQuery {
  includeUninstalled?: string
  all?: string
  isCustom?: string
}

// ========== 工具函数 ==========

/**
 * 解析插件数据
 */
function parsePlugin(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    author: row.author,
    icon: row.icon,
    isEnabled: Boolean(row.isEnabled),
    isInstalled: Boolean(row.isInstalled),
    isCustom: Boolean(row.isCustom),
    isSystem: Boolean(row.isSystem),
    builderData: row.builderData ? JSON.parse(row.builderData) : undefined,
    visibility: row.visibility || 'public',
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    orderIndex: row.orderIndex || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * 检查用户是否有权限访问插件
 */
function canAccessPlugin(plugin: any, user: any): boolean {
  if (plugin.isSystem) return true
  if (plugin.visibility === 'public') return true
  if (plugin.visibility === 'private') {
    return plugin.createdBy === user.id
  }
  if (plugin.visibility === 'role' && plugin.allowedRoles) {
    return plugin.allowedRoles.includes(user.role)
  }
  return false
}

/**
 * 合并内置插件信息
 */
function mergeBuiltinInfo(plugin: any) {
  const builtin = BUILTIN_PLUGINS.find(p => p.id === plugin.id)
  if (!builtin) return plugin

  return {
    ...plugin,
    isBuiltin: true,
    hasBackend: builtin.hasBackend || false,
    hasFrontend: builtin.hasFrontend || false,
    defaultSlot: builtin.defaultSlot || null,
    config: builtin.config || {}
  }
}

// ========== 路由定义 ==========

/**
 * 获取插件列表（管理员权限）
 * GET /api/v2/plugins
 * 支持参数: includeUninstalled, all, isCustom
 */
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { includeUninstalled, all, isCustom } = req.query as PluginQuery

    // 获取所有插件（包括自定义插件）
    const plugins = getPlugins(false, true)

    // 根据参数过滤
    let filteredPlugins = plugins

    // 如果只请求自定义插件
    if (isCustom === 'true') {
      filteredPlugins = plugins.filter((p: any) => p.isCustom)
    }
    // 如果只请求非自定义插件
    else if (isCustom === 'false') {
      filteredPlugins = plugins.filter((p: any) => !p.isCustom)
    }
    // 默认只返回已启用的插件
    else if (all !== 'true' && includeUninstalled !== 'true') {
      filteredPlugins = plugins.filter((p: any) => p.isEnabled)
    }

    // 合并内置插件信息
    const result = filteredPlugins.map((plugin: any) => mergeBuiltinInfo(plugin))

    return successResponse(res, result)
  } catch (error) {
    console.error('获取插件列表失败:', error)
    return errorResponse(res, '获取插件列表失败')
  }
})

/**
 * 获取公开的自定义插件列表（无需认证）
 * GET /api/v2/plugins/public/list
 * 只返回 isCustom = 1 的自定义插件
 */
router.get('/public/list', (req: Request, res: Response) => {
  try {
    // 只返回已启用的公开自定义插件（isCustom = 1）
    const plugins = queryAll(
      `SELECT id, name, description, icon, builderData
       FROM plugins
       WHERE isEnabled = 1 AND isCustom = 1 AND visibility = 'public'
       ORDER BY orderIndex ASC, createdAt DESC`
    )

    return successResponse(res, plugins.map((plugin: any) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      icon: plugin.icon,
      builderData: plugin.builderData ? JSON.parse(plugin.builderData) : undefined
    })))
  } catch (error) {
    console.error('获取公开插件列表失败:', error)
    return errorResponse(res, '获取公开插件列表失败')
  }
})

/**
 * 获取单个插件详情
 * GET /api/v2/plugins/:id
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = req.params.id as string

    const plugin = getPluginById(id)

    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }

    // 检查权限
    if (!canAccessPlugin(plugin, user)) {
      return errorResponse(res, '无权访问此插件', 403)
    }

    // 获取插槽配置
    const slotConfig = queryOne(
      'SELECT config FROM plugin_slot_configs WHERE pluginId = ?',
      [id]
    )

    const result = {
      ...mergeBuiltinInfo(plugin),
      slotConfig: slotConfig ? JSON.parse(slotConfig.config) : null
    }

    return successResponse(res, result)
  } catch (error) {
    console.error('获取插件详情失败:', error)
    return errorResponse(res, '获取插件详情失败')
  }
})

/**
 * 创建插件（管理员）
 * POST /api/v2/plugins
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const {
      id,
      name,
      description,
      version,
      author,
      icon,
      visibility,
      allowedRoles,
      config,
      builderData
    } = req.body

    if (!name) {
      return errorResponse(res, '插件名称不能为空', 400)
    }

    // 如果有 builderData，创建自定义插件
    if (builderData) {
      const pluginId = createCustomPlugin(
        name,
        description || '',
        user.username || user.id,
        icon || '📦',
        builderData,
        visibility || 'public'
      )

      if (!pluginId) {
        return errorResponse(res, '创建自定义插件失败', 500)
      }

      const plugin = getPluginById(pluginId)
      return successResponse(res, { plugin, message: '自定义插件创建成功' })
    }

    // 创建普通插件
    const pluginId = id || generateId()

    // 检查ID是否已存在
    const existing = queryOne('SELECT 1 FROM plugins WHERE id = ?', [pluginId])
    if (existing) {
      return errorResponse(res, '插件ID已存在', 400)
    }

    const newPlugin = createPlugin(
      name,
      description,
      version || '1.0.0',
      author || user.username || user.id,
      icon,
      config,
      visibility || 'public',
      allowedRoles
    )

    if (!newPlugin) {
      return errorResponse(res, '创建插件失败', 500)
    }

    // 如果有插槽配置
    if (config?.slot) {
      const now = new Date().toISOString()
      run(`
        INSERT INTO plugin_slot_configs (id, pluginId, slot, orderIndex, isEnabled, config, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        randomUUID(),
        pluginId,
        config.slot,
        config.order || 0,
        1,
        JSON.stringify(config.pluginConfig || {}),
        now,
        now
      ])
    }

    const plugin = getPluginById(pluginId)
    console.log(`✅ Plugin created: ${name} (${pluginId})`)
    return successResponse(res, { plugin, message: '插件创建成功' })
  } catch (error) {
    console.error('创建插件失败:', error)
    return errorResponse(res, '创建插件失败')
  }
})

/**
 * 更新插件
 * PUT /api/v2/plugins/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const {
      name,
      description,
      version,
      author,
      icon,
      isEnabled,
      visibility,
      allowedRoles,
      orderIndex,
      builderData
    } = req.body

    const existing = getPluginById(id)
    if (!existing) {
      return errorResponse(res, '插件不存在', 404)
    }

    // 内置插件不允许修改某些字段
    const isBuiltin = isBuiltinPlugin(id)

    // 如果是自定义插件，使用专门的更新函数
    if (existing.isCustom) {
      const success = updateCustomPlugin(id, {
        name,
        description,
        icon,
        builderData,
        isEnabled
      })

      if (!success) {
        return errorResponse(res, '更新自定义插件失败', 500)
      }
    } else {
      // 普通插件更新
      const updates: any = {}

      if (name && !isBuiltin) updates.name = name
      if (description !== undefined && !isBuiltin) updates.description = description
      if (version && !isBuiltin) updates.version = version
      if (author && !isBuiltin) updates.author = author
      if (icon !== undefined) updates.icon = icon
      if (isEnabled !== undefined) updates.isEnabled = isEnabled
      if (visibility && !isBuiltin) updates.visibility = visibility
      if (allowedRoles !== undefined && !isBuiltin) updates.allowedRoles = allowedRoles
      if (orderIndex !== undefined) updates.orderIndex = orderIndex

      const success = updatePlugin(id, updates)
      if (!success) {
        return errorResponse(res, '更新插件失败', 500)
      }
    }

    const updated = getPluginById(id)
    return successResponse(res, { plugin: mergeBuiltinInfo(updated), message: '插件更新成功' })
  } catch (error) {
    console.error('更新插件失败:', error)
    return errorResponse(res, '更新插件失败')
  }
})

/**
 * 部分更新插件
 * PATCH /api/v2/plugins/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { isEnabled, visibility, orderIndex } = req.body

    const existing = getPluginById(id)
    if (!existing) {
      return errorResponse(res, '插件不存在', 404)
    }

    const isBuiltin = isBuiltinPlugin(id)
    const updates: any = {}

    if (isEnabled !== undefined) updates.isEnabled = isEnabled
    if (visibility !== undefined && !isBuiltin) updates.visibility = visibility
    if (orderIndex !== undefined) updates.orderIndex = orderIndex

    const success = updatePlugin(id, updates)
    if (!success) {
      return errorResponse(res, '更新插件失败', 500)
    }

    const updated = getPluginById(id)
    return successResponse(res, { plugin: mergeBuiltinInfo(updated), message: '插件更新成功' })
  } catch (error) {
    console.error('更新插件失败:', error)
    return errorResponse(res, '更新插件失败')
  }
})

/**
 * 删除插件
 * DELETE /api/v2/plugins/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const existing = getPluginById(id)
    if (!existing) {
      return errorResponse(res, '插件不存在', 404)
    }

    // 内置插件不允许删除，只能禁用
    if (isBuiltinPlugin(id)) {
      return errorResponse(res, '内置插件不能删除，只能禁用', 400)
    }

    const success = deletePlugin(id)
    if (!success) {
      return errorResponse(res, '删除插件失败', 500)
    }

    return successResponse(res, { message: '插件删除成功' })
  } catch (error) {
    console.error('删除插件失败:', error)
    return errorResponse(res, '删除插件失败')
  }
})

/**
 * 启用插件
 * POST /api/v2/plugins/:id/enable
 */
router.post('/:id/enable', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const success = enablePlugin(id)
    if (!success) {
      return errorResponse(res, '启用插件失败', 500)
    }

    return successResponse(res, { message: '插件已启用' })
  } catch (error) {
    console.error('启用插件失败:', error)
    return errorResponse(res, '启用插件失败')
  }
})

/**
 * 禁用插件
 * POST /api/v2/plugins/:id/disable
 */
router.post('/:id/disable', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const success = disablePlugin(id)
    if (!success) {
      return errorResponse(res, '禁用插件失败', 500)
    }

    return successResponse(res, { message: '插件已禁用' })
  } catch (error) {
    console.error('禁用插件失败:', error)
    return errorResponse(res, '禁用插件失败')
  }
})

// ========== 自定义插件专用路由 ==========

/**
 * 获取所有自定义插件
 * GET /api/v2/plugins/custom/list
 */
router.get('/custom/list', authMiddleware, (req: Request, res: Response) => {
  try {
    const plugins = getPlugins(false, true)
    const customPlugins = plugins.filter((p: any) => p.isCustom)

    return successResponse(res, customPlugins)
  } catch (error) {
    console.error('获取自定义插件列表失败:', error)
    return errorResponse(res, '获取自定义插件列表失败')
  }
})

/**
 * 前台获取插件内容（公开接口）
 * GET /api/v2/plugins/:id/content
 * 支持自定义插件和内置插件
 */
router.get('/:id/content', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    // 首先尝试获取自定义插件
    let plugin = queryOne(
      `SELECT id, name, description, icon, builderData, visibility, isCustom
       FROM plugins
       WHERE id = ? AND isEnabled = 1 AND isCustom = 1`,
      [id]
    )

    // 如果不是自定义插件，尝试获取内置插件
    if (!plugin) {
      plugin = queryOne(
        `SELECT id, name, description, icon, builderData, visibility, isCustom
         FROM plugins
         WHERE id = ? AND isEnabled = 1 AND isCustom = 0`,
        [id]
      )
    }

    if (!plugin) {
      return errorResponse(res, '插件不存在或未启用', 404)
    }

    // 检查可见性
    if (plugin.visibility === 'private') {
      return errorResponse(res, '无权访问此插件', 403)
    }

    return successResponse(res, {
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      icon: plugin.icon,
      isCustom: Boolean(plugin.isCustom),
      builderData: plugin.builderData ? JSON.parse(plugin.builderData) : undefined
    })
  } catch (error) {
    console.error('获取插件内容失败:', error)
    return errorResponse(res, '获取插件内容失败')
  }
})

export default router
