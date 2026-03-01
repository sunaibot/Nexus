/**
 * 插件插槽配置路由 - V2版本
 * 管理插件在前台的显示位置
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 解析插槽配置
function parseSlotConfig(row: any) {
  return {
    id: row.id,
    pluginId: row.pluginId,
    slot: row.slot,
    order: row.orderIndex,
    isEnabled: Boolean(row.isEnabled),
    config: row.config ? JSON.parse(row.config) : {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 获取所有插槽配置 - 公开接口
router.get('/', (req: Request, res: Response) => {
  try {
    const { slot } = req.query
    
    let configs
    if (slot) {
      // 获取指定插槽的配置（同时检查插件和插槽配置都启用）
      configs = queryAll(
        `SELECT c.*, p.name as pluginName 
         FROM plugin_slot_configs c
         JOIN plugins p ON c.pluginId = p.id
         WHERE c.slot = ? AND c.isEnabled = 1 AND p.isEnabled = 1
         ORDER BY c.orderIndex ASC`,
        [slot]
      )
    } else {
      // 获取所有配置（同时检查插件和插槽配置都启用）
      configs = queryAll(
        `SELECT c.*, p.name as pluginName 
         FROM plugin_slot_configs c
         JOIN plugins p ON c.pluginId = p.id
         WHERE c.isEnabled = 1 AND p.isEnabled = 1
         ORDER BY c.slot ASC, c.orderIndex ASC`
      )
    }
    
    return successResponse(res, configs.map(parseSlotConfig))
  } catch (error) {
    console.error('获取插槽配置失败:', error)
    return errorResponse(res, '获取插槽配置失败')
  }
})

// 获取单个插件的插槽配置
router.get('/:pluginId', (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params
    
    const config = queryOne(
      `SELECT c.*, p.name as pluginName 
       FROM plugin_slot_configs c
       JOIN plugins p ON c.pluginId = p.id
       WHERE c.pluginId = ?`,
      [pluginId]
    )
    
    if (!config) {
      return errorResponse(res, '配置不存在', 404)
    }
    
    return successResponse(res, parseSlotConfig(config))
  } catch (error) {
    console.error('获取插槽配置失败:', error)
    return errorResponse(res, '获取插槽配置失败')
  }
})

// 更新插件插槽配置（管理员）
router.put('/:pluginId', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params
    const { slot, order, config } = req.body
    
    // 检查插件是否存在
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [pluginId])
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    // 检查是否已有配置
    const existing = queryOne('SELECT * FROM plugin_slot_configs WHERE pluginId = ?', [pluginId])
    
    const now = new Date().toISOString()
    
    if (existing) {
      // 更新配置
      run(
        `UPDATE plugin_slot_configs 
         SET slot = COALESCE(?, slot), 
             orderIndex = COALESCE(?, orderIndex),
             config = COALESCE(?, config),
             updatedAt = ?
         WHERE pluginId = ?`,
        [slot, order, config ? JSON.stringify(config) : null, now, pluginId]
      )
    } else {
      // 创建新配置
      const id = generateId()
      run(
        `INSERT INTO plugin_slot_configs (id, pluginId, slot, orderIndex, config, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, pluginId, slot || 'hero-after', order || 0, config ? JSON.stringify(config) : null, now, now]
      )
    }
    
    const updated = queryOne(
      `SELECT c.*, p.name as pluginName 
       FROM plugin_slot_configs c
       JOIN plugins p ON c.pluginId = p.id
       WHERE c.pluginId = ?`,
      [pluginId]
    )
    
    return successResponse(res, parseSlotConfig(updated))
  } catch (error) {
    console.error('更新插槽配置失败:', error)
    return errorResponse(res, '更新插槽配置失败')
  }
})

// 启用/禁用插件在插槽中的显示（管理员）
router.post('/:pluginId/toggle', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params
    const { enabled } = req.body
    
    // 检查是否已有配置
    const existing = queryOne('SELECT * FROM plugin_slot_configs WHERE pluginId = ?', [pluginId])
    
    const now = new Date().toISOString()
    
    if (existing) {
      // 更新状态
      run(
        'UPDATE plugin_slot_configs SET isEnabled = ?, updatedAt = ? WHERE pluginId = ?',
        [enabled ? 1 : 0, now, pluginId]
      )
    } else {
      // 创建默认配置
      const id = generateId()
      run(
        `INSERT INTO plugin_slot_configs (id, pluginId, slot, orderIndex, isEnabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, pluginId, 'hero-after', 0, enabled ? 1 : 0, now, now]
      )
    }
    
    return successResponse(res, { enabled })
  } catch (error) {
    console.error('切换插件状态失败:', error)
    return errorResponse(res, '切换插件状态失败')
  }
})

// 删除插槽配置（管理员）
router.delete('/:pluginId', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params
    
    run('DELETE FROM plugin_slot_configs WHERE pluginId = ?', [pluginId])
    
    return successResponse(res, { message: '配置已删除' })
  } catch (error) {
    console.error('删除插槽配置失败:', error)
    return errorResponse(res, '删除插槽配置失败')
  }
})

export default router
