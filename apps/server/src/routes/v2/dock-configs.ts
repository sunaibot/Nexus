/**
 * Dock配置API路由
 * 提供Dock导航配置的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// Dock配置项接口
interface DockItem {
  id: string
  title: string
  icon: string
  iconType: 'lucide' | 'custom' | 'url'
  href?: string
  action?: string
  orderIndex: number
  isEnabled: number
  isVisible: number
}

// 解析Dock配置数据
function parseDockConfig(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    items: JSON.parse(row.items || '[]'),
    scope: row.scope,
    userId: row.userId,
    role: row.role,
    isDefault: row.isDefault,
    isEnabled: row.isEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * 获取Dock配置列表
 * GET /api/v2/dock-configs
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { scope, userId, role } = req.query
    const currentUser = (req as any).user

    let sql = 'SELECT * FROM dock_configs WHERE 1=1'
    const params: any[] = []

    // 非管理员只能看到全局配置和自己的配置
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      sql += ' AND (scope = ? OR (scope = ? AND userId = ?))'
      params.push('global', 'user', currentUser?.userId)
    } else if (scope) {
      sql += ' AND scope = ?'
      params.push(scope)
    }

    if (userId && (currentUser?.role === 'admin' || currentUser?.role === 'super_admin')) {
      sql += ' AND userId = ?'
      params.push(userId)
    }

    if (role && (currentUser?.role === 'admin' || currentUser?.role === 'super_admin')) {
      sql += ' AND role = ?'
      params.push(role)
    }

    sql += ' ORDER BY isDefault DESC, createdAt ASC'

    const configs = queryAll(sql, params)
    const parsedConfigs = configs.map(parseDockConfig)

    return successResponse(res, parsedConfigs)
  } catch (error) {
    console.error('获取Dock配置列表失败:', error)
    return errorResponse(res, '获取Dock配置列表失败')
  }
})

/**
 * 获取当前用户的有效Dock配置
 * GET /api/v2/dock-configs/current
 */
router.get('/current', authMiddleware, (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user

    // 优先查找用户专属配置
    let row = queryOne(
      'SELECT * FROM dock_configs WHERE scope = ? AND userId = ? AND isEnabled = 1 ORDER BY updatedAt DESC LIMIT 1',
      ['user', currentUser?.userId]
    )

    // 如果没有用户配置，查找角色配置
    if (!row && currentUser?.role) {
      row = queryOne(
        'SELECT * FROM dock_configs WHERE scope = ? AND role = ? AND isEnabled = 1 ORDER BY isDefault DESC, updatedAt DESC LIMIT 1',
        ['role', currentUser.role]
      )
    }

    // 如果没有角色配置，使用全局默认配置
    if (!row) {
      row = queryOne(
        'SELECT * FROM dock_configs WHERE scope = ? AND isDefault = 1 AND isEnabled = 1 LIMIT 1',
        ['global']
      )
    }

    // 如果还没有，使用第一个全局配置
    if (!row) {
      row = queryOne(
        'SELECT * FROM dock_configs WHERE scope = ? AND isEnabled = 1 ORDER BY createdAt ASC LIMIT 1',
        ['global']
      )
    }

    if (!row) {
      return errorResponse(res, '未找到有效的Dock配置', 404)
    }

    return successResponse(res, parseDockConfig(row))
  } catch (error) {
    console.error('获取当前Dock配置失败:', error)
    return errorResponse(res, '获取当前Dock配置失败')
  }
})

/**
 * 获取单个Dock配置
 * GET /api/v2/dock-configs/:id
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const currentUser = (req as any).user

    const row = queryOne('SELECT * FROM dock_configs WHERE id = ?', [id])

    if (!row) {
      return errorResponse(res, 'Dock配置不存在', 404)
    }

    // 权限检查
    if (row.scope === 'user' && row.userId !== currentUser?.userId && 
        currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return errorResponse(res, '无权访问此配置', 403)
    }

    return successResponse(res, parseDockConfig(row))
  } catch (error) {
    console.error('获取Dock配置失败:', error)
    return errorResponse(res, '获取Dock配置失败')
  }
})

/**
 * 创建Dock配置
 * POST /api/v2/dock-configs
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { name, description, items, scope, userId, role, isDefault, isEnabled } = req.body

    if (!name || !items || !Array.isArray(items)) {
      return errorResponse(res, '名称和items不能为空', 400)
    }

    const id = generateId()
    const now = new Date().toISOString()

    // 如果设置为默认，取消其他默认配置
    if (isDefault && scope === 'global') {
      run('UPDATE dock_configs SET isDefault = 0 WHERE scope = ?', ['global'])
    }

    run(
      `INSERT INTO dock_configs (id, name, description, items, scope, userId, role, isDefault, isEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description || '', JSON.stringify(items), scope || 'global', userId || null, role || null, isDefault ? 1 : 0, isEnabled !== false ? 1 : 0, now, now]
    )

    const newConfig = queryOne('SELECT * FROM dock_configs WHERE id = ?', [id])
    return successResponse(res, parseDockConfig(newConfig), 201)
  } catch (error) {
    console.error('创建Dock配置失败:', error)
    return errorResponse(res, '创建Dock配置失败')
  }
})

/**
 * 更新Dock配置
 * PATCH /api/v2/dock-configs/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const config = queryOne('SELECT * FROM dock_configs WHERE id = ?', [id])

    if (!config) {
      return errorResponse(res, 'Dock配置不存在', 404)
    }

    const { name, description, items, scope, userId, role, isDefault, isEnabled } = req.body
    const now = new Date().toISOString()

    // 如果设置为默认，取消其他默认配置
    if (isDefault && (scope || config.scope) === 'global') {
      run('UPDATE dock_configs SET isDefault = 0 WHERE scope = ? AND id != ?', ['global', id])
    }

    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (items !== undefined) {
      updates.push('items = ?')
      params.push(JSON.stringify(items))
    }
    if (scope !== undefined) {
      updates.push('scope = ?')
      params.push(scope)
    }
    if (userId !== undefined) {
      updates.push('userId = ?')
      params.push(userId)
    }
    if (role !== undefined) {
      updates.push('role = ?')
      params.push(role)
    }
    if (isDefault !== undefined) {
      updates.push('isDefault = ?')
      params.push(isDefault ? 1 : 0)
    }
    if (isEnabled !== undefined) {
      updates.push('isEnabled = ?')
      params.push(isEnabled ? 1 : 0)
    }

    updates.push('updatedAt = ?')
    params.push(now)
    params.push(id)

    run(`UPDATE dock_configs SET ${updates.join(', ')} WHERE id = ?`, params)

    const updatedConfig = queryOne('SELECT * FROM dock_configs WHERE id = ?', [id])
    return successResponse(res, parseDockConfig(updatedConfig))
  } catch (error) {
    console.error('更新Dock配置失败:', error)
    return errorResponse(res, '更新Dock配置失败')
  }
})

/**
 * 删除Dock配置
 * DELETE /api/v2/dock-configs/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const config = queryOne('SELECT * FROM dock_configs WHERE id = ?', [id])

    if (!config) {
      return errorResponse(res, 'Dock配置不存在', 404)
    }

    // 不能删除默认配置
    if (config.isDefault) {
      return errorResponse(res, '不能删除默认配置，请先设置其他配置为默认', 400)
    }

    run('DELETE FROM dock_configs WHERE id = ?', [id])
    return successResponse(res, { message: 'Dock配置已删除' })
  } catch (error) {
    console.error('删除Dock配置失败:', error)
    return errorResponse(res, '删除Dock配置失败')
  }
})

/**
 * 批量更新Dock项排序
 * PATCH /api/v2/dock-configs/:id/reorder
 */
router.patch('/:id/reorder', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { items } = req.body

    if (!Array.isArray(items)) {
      return errorResponse(res, 'items必须是数组', 400)
    }

    const config = queryOne('SELECT * FROM dock_configs WHERE id = ?', [id])
    if (!config) {
      return errorResponse(res, 'Dock配置不存在', 404)
    }

    // 验证每个item
    for (const item of items) {
      if (!item.id || typeof item.orderIndex !== 'number') {
        return errorResponse(res, '每个item必须包含id和orderIndex', 400)
      }
    }

    // 更新items的排序
    const currentItems: DockItem[] = JSON.parse(config.items || '[]')
    const updatedItems = currentItems.map((item: DockItem) => {
      const newOrder = items.find((i: any) => i.id === item.id)
      if (newOrder) {
        return { ...item, orderIndex: newOrder.orderIndex }
      }
      return item
    }).sort((a: DockItem, b: DockItem) => a.orderIndex - b.orderIndex)

    const now = new Date().toISOString()
    run('UPDATE dock_configs SET items = ?, updatedAt = ? WHERE id = ?', [JSON.stringify(updatedItems), now, id])

    return successResponse(res, {
      message: '排序已更新',
      items: updatedItems
    })
  } catch (error) {
    console.error('更新Dock项排序失败:', error)
    return errorResponse(res, '更新Dock项排序失败')
  }
})

/**
 * 获取Dock配置统计
 * GET /api/v2/dock-configs/stats/overview
 */
router.get('/stats/overview', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const total = queryOne('SELECT COUNT(*) as count FROM dock_configs')
    const globalCount = queryOne('SELECT COUNT(*) as count FROM dock_configs WHERE scope = ?', ['global'])
    const userCount = queryOne('SELECT COUNT(*) as count FROM dock_configs WHERE scope = ?', ['user'])
    const roleCount = queryOne('SELECT COUNT(*) as count FROM dock_configs WHERE scope = ?', ['role'])
    const enabledCount = queryOne('SELECT COUNT(*) as count FROM dock_configs WHERE isEnabled = 1')

    return successResponse(res, {
      total: total?.count || 0,
      global: globalCount?.count || 0,
      user: userCount?.count || 0,
      role: roleCount?.count || 0,
      enabled: enabledCount?.count || 0
    })
  } catch (error) {
    console.error('获取Dock配置统计失败:', error)
    return errorResponse(res, '获取Dock配置统计失败')
  }
})

export default router
