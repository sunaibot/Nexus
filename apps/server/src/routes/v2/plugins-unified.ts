/**
 * 统一插件管理 API
 * 提供插件的完整生命周期管理
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js'
import { getDatabase } from '../../db/core.js'
import { queryAll, queryOne, run } from '../../utils/database.js'
import { randomUUID } from 'crypto'
import { BUILTIN_PLUGINS, isBuiltinPlugin } from '../../db/init-plugins.js'

const router = Router()

/**
 * 统一响应格式
 */
function successResponse(res: Response, data: any, message?: string) {
  return res.json({
    success: true,
    data,
    message
  })
}

function errorResponse(res: Response, message: string, status = 400) {
  return res.status(status).json({
    success: false,
    error: message
  })
}

/**
 * 获取所有插件（合并数据库和内置插件）
 * GET /api/v2/plugins
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    // 从数据库获取插件
    const pluginIds = BUILTIN_PLUGINS.map(p => p.id)
    const dbPlugins = queryAll(`
      SELECT 
        p.*,
        CASE WHEN p.id IN (${pluginIds.map(() => '?').join(',')}) THEN 1 ELSE 0 END as isBuiltin
      FROM plugins p
      ORDER BY p.orderIndex ASC, p.createdAt DESC
    `, pluginIds)

    // 合并内置插件的额外信息
    const plugins = dbPlugins.map((dbPlugin: any) => {
      const builtin = BUILTIN_PLUGINS.find(p => p.id === dbPlugin.id)
      return {
        ...dbPlugin,
        hasBackend: builtin?.hasBackend || false,
        hasFrontend: builtin?.hasFrontend || false,
        defaultSlot: builtin?.defaultSlot || null,
        config: builtin?.config || {}
      }
    })

    return successResponse(res, plugins)
  } catch (error) {
    console.error('获取插件列表失败:', error)
    return errorResponse(res, '获取插件列表失败')
  }
})

/**
 * 获取单个插件详情
 * GET /api/v2/plugins/:id
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const plugin = queryOne(`
      SELECT p.*,
        (SELECT config FROM plugin_slot_configs WHERE pluginId = p.id) as slotConfig
      FROM plugins p
      WHERE p.id = ?
    `, [id])

    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }

    // 合并内置插件信息
    const builtin = BUILTIN_PLUGINS.find(p => p.id === id)
    const result = {
      ...plugin,
      isBuiltin: !!builtin,
      hasBackend: builtin?.hasBackend || false,
      hasFrontend: builtin?.hasFrontend || false,
      defaultSlot: builtin?.defaultSlot || null,
      config: builtin?.config || {},
      slotConfig: plugin.slotConfig ? JSON.parse(plugin.slotConfig) : null
    }

    return successResponse(res, result)
  } catch (error) {
    console.error('获取插件详情失败:', error)
    return errorResponse(res, '获取插件详情失败')
  }
})

/**
 * 创建新插件
 * POST /api/v2/plugins
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id, name, description, version, author, icon, config } = req.body

    if (!id || !name) {
      return errorResponse(res, '插件ID和名称为必填项')
    }

    // 检查ID是否已存在
    const existing = queryOne('SELECT 1 FROM plugins WHERE id = ?', [id])
    if (existing) {
      return errorResponse(res, '插件ID已存在')
    }

    const now = new Date().toISOString()
    
    run(`
      INSERT INTO plugins (
        id, name, description, version, author, icon,
        isEnabled, isInstalled, visibility, orderIndex,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, name, description || '', version || '1.0.0', author || '', icon || '',
      1, 1, 'public', 999,
      now, now
    ])

    // 如果有插槽配置
    if (config?.slot) {
      run(`
        INSERT INTO plugin_slot_configs (id, pluginId, slot, orderIndex, isEnabled, config, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        randomUUID(), id, config.slot, config.order || 0, 1, 
        JSON.stringify(config.pluginConfig || {}),
        now, now
      ])
    }

    console.log(`✅ Plugin created: ${name} (${id})`)
    return successResponse(res, { id }, '插件创建成功')
  } catch (error) {
    console.error('创建插件失败:', error)
    return errorResponse(res, '创建插件失败')
  }
})

/**
 * 更新插件
 * PATCH /api/v2/plugins/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, description, version, isEnabled, visibility, orderIndex } = req.body

    const plugin = queryOne('SELECT 1 FROM plugins WHERE id = ?', [id])
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }

    // 内置插件不允许修改某些字段
    const isBuiltin = isBuiltinPlugin(id)
    
    const updates: string[] = []
    const values: any[] = []

    if (name && !isBuiltin) {
      updates.push('name = ?')
      values.push(name)
    }
    if (description !== undefined && !isBuiltin) {
      updates.push('description = ?')
      values.push(description)
    }
    if (version && !isBuiltin) {
      updates.push('version = ?')
      values.push(version)
    }
    if (isEnabled !== undefined) {
      updates.push('isEnabled = ?')
      values.push(isEnabled ? 1 : 0)
    }
    if (visibility && !isBuiltin) {
      updates.push('visibility = ?')
      values.push(visibility)
    }
    if (orderIndex !== undefined) {
      updates.push('orderIndex = ?')
      values.push(orderIndex)
    }

    if (updates.length === 0) {
      return errorResponse(res, '没有要更新的字段')
    }

    updates.push('updatedAt = ?')
    values.push(new Date().toISOString())
    values.push(id)

    run(`UPDATE plugins SET ${updates.join(', ')} WHERE id = ?`, values)

    return successResponse(res, null, '插件更新成功')
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

    // 内置插件不允许删除
    if (isBuiltinPlugin(id)) {
      return errorResponse(res, '内置插件不能删除')
    }

    const plugin = queryOne('SELECT 1 FROM plugins WHERE id = ?', [id])
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }

    // 删除关联数据
    run('DELETE FROM plugin_slot_configs WHERE pluginId = ?', [id])
    run('DELETE FROM user_plugins WHERE pluginId = ?', [id])
    run('DELETE FROM role_plugins WHERE pluginId = ?', [id])
    run('DELETE FROM plugins WHERE id = ?', [id])

    console.log(`🗑️ Plugin deleted: ${id}`)
    return successResponse(res, null, '插件删除成功')
  } catch (error) {
    console.error('删除插件失败:', error)
    return errorResponse(res, '删除插件失败')
  }
})

/**
 * 获取插件插槽配置
 * GET /api/v2/plugins/:id/slot-config
 */
router.get('/:id/slot-config', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const config = queryOne(`
      SELECT * FROM plugin_slot_configs WHERE pluginId = ?
    `, [id])

    if (!config) {
      return successResponse(res, null)
    }

    return successResponse(res, {
      ...config,
      config: config.config ? JSON.parse(config.config) : {}
    })
  } catch (error) {
    console.error('获取插槽配置失败:', error)
    return errorResponse(res, '获取插槽配置失败')
  }
})

/**
 * 更新插件插槽配置
 * PATCH /api/v2/plugins/:id/slot-config
 */
router.patch('/:id/slot-config', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { slot, orderIndex, isEnabled, config } = req.body

    const existing = queryOne('SELECT 1 FROM plugin_slot_configs WHERE pluginId = ?', [id])
    const now = new Date().toISOString()

    if (existing) {
      const updates: string[] = []
      const values: any[] = []

      if (slot) {
        updates.push('slot = ?')
        values.push(slot)
      }
      if (orderIndex !== undefined) {
        updates.push('orderIndex = ?')
        values.push(orderIndex)
      }
      if (isEnabled !== undefined) {
        updates.push('isEnabled = ?')
        values.push(isEnabled ? 1 : 0)
      }
      if (config) {
        updates.push('config = ?')
        values.push(JSON.stringify(config))
      }

      if (updates.length > 0) {
        updates.push('updatedAt = ?')
        values.push(now)
        values.push(id)

        run(`UPDATE plugin_slot_configs SET ${updates.join(', ')} WHERE pluginId = ?`, values)
      }
    } else {
      run(`
        INSERT INTO plugin_slot_configs (id, pluginId, slot, orderIndex, isEnabled, config, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        randomUUID(), id, slot || 'hero-after', orderIndex || 0, 
        isEnabled !== undefined ? (isEnabled ? 1 : 0) : 1,
        config ? JSON.stringify(config) : '{}',
        now, now
      ])
    }

    return successResponse(res, null, '插槽配置更新成功')
  } catch (error) {
    console.error('更新插槽配置失败:', error)
    return errorResponse(res, '更新插槽配置失败')
  }
})

/**
 * 获取前台插件列表（公开接口）
 * GET /api/v2/plugins/public
 */
router.get('/public/list', (req: Request, res: Response) => {
  try {
    const plugins = queryAll(`
      SELECT 
        p.id, p.name, p.description, p.icon, p.isEnabled,
        c.slot, c.orderIndex, c.config as pluginConfig
      FROM plugins p
      LEFT JOIN plugin_slot_configs c ON p.id = c.pluginId
      WHERE p.isEnabled = 1 AND p.visibility = 'public'
        AND (c.isEnabled = 1 OR c.isEnabled IS NULL)
      ORDER BY c.slot ASC, c.orderIndex ASC
    `)

    const result = plugins.map((p: any) => ({
      ...p,
      pluginConfig: p.pluginConfig ? JSON.parse(p.pluginConfig) : {}
    }))

    return successResponse(res, result)
  } catch (error) {
    console.error('获取公开插件失败:', error)
    return errorResponse(res, '获取插件列表失败')
  }
})

export default router
