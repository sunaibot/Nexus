/**
 * Settings Tabs配置API路由
 * 提供设置页面标签配置的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 解析Settings Tab数据
function parseSettingsTab(row: any) {
  return {
    id: row.id,
    tabId: row.tabId,
    name: row.name,
    labelKey: row.labelKey,
    descriptionKey: row.descriptionKey,
    icon: row.icon,
    iconType: row.iconType,
    gradient: row.gradient,
    orderIndex: row.orderIndex,
    isEnabled: row.isEnabled,
    isVisible: row.isVisible,
    visibility: row.visibility,
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : [],
    component: row.component,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * 获取Settings Tabs列表
 * GET /api/v2/settings-tabs
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { visibility } = req.query
    const currentUser = (req as any).user

    let sql = 'SELECT * FROM settings_tabs WHERE isEnabled = 1'
    const params: any[] = []

    // 根据用户角色过滤可见性
    if (currentUser?.role !== 'super_admin') {
      if (currentUser?.role === 'admin') {
        sql += ' AND visibility IN (?, ?, ?)'
        params.push('public', 'role', 'admin')
      } else {
        sql += ' AND visibility = ?'
        params.push('public')
      }
    }

    if (visibility && (currentUser?.role === 'admin' || currentUser?.role === 'super_admin')) {
      sql += ' AND visibility = ?'
      params.push(visibility)
    }

    sql += ' ORDER BY orderIndex ASC, createdAt ASC'

    const tabs = queryAll(sql, params)
    const parsedTabs = tabs.map(parseSettingsTab)

    return successResponse(res, parsedTabs)
  } catch (error) {
    console.error('获取Settings Tabs列表失败:', error)
    return errorResponse(res, '获取Settings Tabs列表失败')
  }
})

/**
 * 获取所有Settings Tabs（管理员）
 * GET /api/v2/settings-tabs/all
 */
router.get('/all', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const tabs = queryAll('SELECT * FROM settings_tabs ORDER BY orderIndex ASC, createdAt ASC')
    const parsedTabs = tabs.map(parseSettingsTab)

    return successResponse(res, parsedTabs)
  } catch (error) {
    console.error('获取所有Settings Tabs失败:', error)
    return errorResponse(res, '获取所有Settings Tabs失败')
  }
})

/**
 * 获取单个Settings Tab
 * GET /api/v2/settings-tabs/:id
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const currentUser = (req as any).user

    const row = queryOne('SELECT * FROM settings_tabs WHERE id = ?', [id])

    if (!row) {
      return errorResponse(res, 'Settings Tab不存在', 404)
    }

    // 权限检查
    if (row.visibility === 'super_admin' && currentUser?.role !== 'super_admin') {
      return errorResponse(res, '无权访问此Tab', 403)
    }

    if (row.visibility === 'admin' && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return errorResponse(res, '无权访问此Tab', 403)
    }

    return successResponse(res, parseSettingsTab(row))
  } catch (error) {
    console.error('获取Settings Tab失败:', error)
    return errorResponse(res, '获取Settings Tab失败')
  }
})

/**
 * 通过tabId获取Settings Tab
 * GET /api/v2/settings-tabs/by-tabId/:tabId
 */
router.get('/by-tabId/:tabId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { tabId } = req.params
    const currentUser = (req as any).user

    const row = queryOne('SELECT * FROM settings_tabs WHERE tabId = ?', [tabId])

    if (!row) {
      return errorResponse(res, 'Settings Tab不存在', 404)
    }

    // 权限检查
    if (row.visibility === 'super_admin' && currentUser?.role !== 'super_admin') {
      return errorResponse(res, '无权访问此Tab', 403)
    }

    if (row.visibility === 'admin' && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return errorResponse(res, '无权访问此Tab', 403)
    }

    return successResponse(res, parseSettingsTab(row))
  } catch (error) {
    console.error('获取Settings Tab失败:', error)
    return errorResponse(res, '获取Settings Tab失败')
  }
})

/**
 * 创建Settings Tab
 * POST /api/v2/settings-tabs
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { tabId, name, labelKey, descriptionKey, icon, iconType, gradient, orderIndex, isEnabled, isVisible, visibility, allowedRoles, component } = req.body

    if (!tabId || !name || !labelKey) {
      return errorResponse(res, 'tabId、name和labelKey不能为空', 400)
    }

    // 检查tabId是否已存在
    const existing = queryOne('SELECT 1 FROM settings_tabs WHERE tabId = ?', [tabId])
    if (existing) {
      return errorResponse(res, 'tabId已存在', 409)
    }

    const id = generateId()
    const now = new Date().toISOString()

    run(
      `INSERT INTO settings_tabs (id, tabId, name, labelKey, descriptionKey, icon, iconType, gradient, orderIndex, isEnabled, isVisible, visibility, allowedRoles, component, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tabId, name, labelKey, descriptionKey || '', icon || '', iconType || 'lucide', gradient || '', orderIndex || 0, isEnabled !== false ? 1 : 0, isVisible !== false ? 1 : 0, visibility || 'admin', allowedRoles ? JSON.stringify(allowedRoles) : null, component || '', now, now]
    )

    const newTab = queryOne('SELECT * FROM settings_tabs WHERE id = ?', [id])
    return successResponse(res, parseSettingsTab(newTab), 201)
  } catch (error) {
    console.error('创建Settings Tab失败:', error)
    return errorResponse(res, '创建Settings Tab失败')
  }
})

/**
 * 更新Settings Tab
 * PATCH /api/v2/settings-tabs/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tab = queryOne('SELECT * FROM settings_tabs WHERE id = ?', [id])

    if (!tab) {
      return errorResponse(res, 'Settings Tab不存在', 404)
    }

    const { tabId, name, labelKey, descriptionKey, icon, iconType, gradient, orderIndex, isEnabled, isVisible, visibility, allowedRoles, component } = req.body

    // 如果修改了tabId，检查是否与其他冲突
    if (tabId && tabId !== tab.tabId) {
      const existing = queryOne('SELECT 1 FROM settings_tabs WHERE tabId = ? AND id != ?', [tabId, id])
      if (existing) {
        return errorResponse(res, 'tabId已存在', 409)
      }
    }

    const now = new Date().toISOString()

    const updates: string[] = []
    const params: any[] = []

    if (tabId !== undefined) {
      updates.push('tabId = ?')
      params.push(tabId)
    }
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (labelKey !== undefined) {
      updates.push('labelKey = ?')
      params.push(labelKey)
    }
    if (descriptionKey !== undefined) {
      updates.push('descriptionKey = ?')
      params.push(descriptionKey)
    }
    if (icon !== undefined) {
      updates.push('icon = ?')
      params.push(icon)
    }
    if (iconType !== undefined) {
      updates.push('iconType = ?')
      params.push(iconType)
    }
    if (gradient !== undefined) {
      updates.push('gradient = ?')
      params.push(gradient)
    }
    if (orderIndex !== undefined) {
      updates.push('orderIndex = ?')
      params.push(orderIndex)
    }
    if (isEnabled !== undefined) {
      updates.push('isEnabled = ?')
      params.push(isEnabled ? 1 : 0)
    }
    if (isVisible !== undefined) {
      updates.push('isVisible = ?')
      params.push(isVisible ? 1 : 0)
    }
    if (visibility !== undefined) {
      updates.push('visibility = ?')
      params.push(visibility)
    }
    if (allowedRoles !== undefined) {
      updates.push('allowedRoles = ?')
      params.push(JSON.stringify(allowedRoles))
    }
    if (component !== undefined) {
      updates.push('component = ?')
      params.push(component)
    }

    updates.push('updatedAt = ?')
    params.push(now)
    params.push(id)

    run(`UPDATE settings_tabs SET ${updates.join(', ')} WHERE id = ?`, params)

    const updatedTab = queryOne('SELECT * FROM settings_tabs WHERE id = ?', [id])
    return successResponse(res, parseSettingsTab(updatedTab))
  } catch (error) {
    console.error('更新Settings Tab失败:', error)
    return errorResponse(res, '更新Settings Tab失败')
  }
})

/**
 * 删除Settings Tab
 * DELETE /api/v2/settings-tabs/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tab = queryOne('SELECT * FROM settings_tabs WHERE id = ?', [id])

    if (!tab) {
      return errorResponse(res, 'Settings Tab不存在', 404)
    }

    run('DELETE FROM settings_tabs WHERE id = ?', [id])
    return successResponse(res, { message: 'Settings Tab已删除' })
  } catch (error) {
    console.error('删除Settings Tab失败:', error)
    return errorResponse(res, '删除Settings Tab失败')
  }
})

/**
 * 批量更新Settings Tabs排序
 * PATCH /api/v2/settings-tabs/reorder
 */
router.patch('/reorder', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return errorResponse(res, 'items必须是数组', 400)
    }

    // 验证每个item
    for (const item of items) {
      if (!item.id || typeof item.orderIndex !== 'number') {
        return errorResponse(res, '每个item必须包含id和orderIndex', 400)
      }
    }

    const now = new Date().toISOString()

    // 批量更新
    for (const item of items) {
      run('UPDATE settings_tabs SET orderIndex = ?, updatedAt = ? WHERE id = ?', [item.orderIndex, now, item.id])
    }

    return successResponse(res, { message: '排序已更新', updatedCount: items.length })
  } catch (error) {
    console.error('批量更新Settings Tabs排序失败:', error)
    return errorResponse(res, '批量更新Settings Tabs排序失败')
  }
})

/**
 * 获取Settings Tabs统计
 * GET /api/v2/settings-tabs/stats/overview
 */
router.get('/stats/overview', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const total = queryOne('SELECT COUNT(*) as count FROM settings_tabs')
    const enabledCount = queryOne('SELECT COUNT(*) as count FROM settings_tabs WHERE isEnabled = 1')
    const visibleCount = queryOne('SELECT COUNT(*) as count FROM settings_tabs WHERE isVisible = 1')

    const visibilityStats = queryAll(`
      SELECT visibility, COUNT(*) as count 
      FROM settings_tabs 
      GROUP BY visibility
    `)

    return successResponse(res, {
      total: total?.count || 0,
      enabled: enabledCount?.count || 0,
      visible: visibleCount?.count || 0,
      byVisibility: visibilityStats
    })
  } catch (error) {
    console.error('获取Settings Tabs统计失败:', error)
    return errorResponse(res, '获取Settings Tabs统计失败')
  }
})

export default router
