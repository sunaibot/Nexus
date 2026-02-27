/**
 * Frontend导航配置API路由
 * 提供前端导航项配置的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 解析Frontend NavItem数据
function parseFrontendNavItem(row: any) {
  return {
    id: row.id,
    navId: row.navId,
    name: row.name,
    labelKey: row.labelKey,
    icon: row.icon,
    iconType: row.iconType,
    href: row.href,
    orderIndex: row.orderIndex,
    isEnabled: row.isEnabled,
    isVisible: row.isVisible,
    visibility: row.visibility,
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : [],
    requireAuth: row.requireAuth,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * 获取Frontend NavItems列表
 * GET /api/v2/frontend-nav
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { visibility, requireAuth } = req.query
    const currentUser = (req as any).user

    let sql = 'SELECT * FROM frontend_nav_items WHERE isEnabled = 1'
    const params: any[] = []

    // 根据用户认证状态过滤
    if (!currentUser) {
      // 未登录用户只能看到public且不需要认证的
      sql += ' AND visibility = ? AND requireAuth = 0'
      params.push('public')
    } else {
      // 已登录用户根据角色过滤
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        // 管理员可以看到所有
        if (visibility) {
          sql += ' AND visibility = ?'
          params.push(visibility)
        }
      } else {
        // 普通用户
        sql += ' AND visibility IN (?, ?)'
        params.push('public', 'user')
      }
    }

    if (requireAuth !== undefined) {
      sql += ' AND requireAuth = ?'
      params.push(requireAuth === 'true' || requireAuth === '1' ? 1 : 0)
    }

    sql += ' ORDER BY orderIndex ASC, createdAt ASC'

    const items = queryAll(sql, params)
    const parsedItems = items.map(parseFrontendNavItem)

    return successResponse(res, parsedItems)
  } catch (error) {
    console.error('获取Frontend NavItems列表失败:', error)
    return errorResponse(res, '获取Frontend NavItems列表失败')
  }
})

/**
 * 获取所有Frontend NavItems（管理员）
 * GET /api/v2/frontend-nav/all
 */
router.get('/all', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const items = queryAll('SELECT * FROM frontend_nav_items ORDER BY orderIndex ASC, createdAt ASC')
    const parsedItems = items.map(parseFrontendNavItem)

    return successResponse(res, parsedItems)
  } catch (error) {
    console.error('获取所有Frontend NavItems失败:', error)
    return errorResponse(res, '获取所有Frontend NavItems失败')
  }
})

/**
 * 获取单个Frontend NavItem
 * GET /api/v2/frontend-nav/:id
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const currentUser = (req as any).user

    const row = queryOne('SELECT * FROM frontend_nav_items WHERE id = ?', [id])

    if (!row) {
      return errorResponse(res, 'Frontend NavItem不存在', 404)
    }

    // 权限检查
    if (row.requireAuth && !currentUser) {
      return errorResponse(res, '需要登录才能访问', 401)
    }

    if (row.visibility === 'admin' && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return errorResponse(res, '无权访问此导航项', 403)
    }

    return successResponse(res, parseFrontendNavItem(row))
  } catch (error) {
    console.error('获取Frontend NavItem失败:', error)
    return errorResponse(res, '获取Frontend NavItem失败')
  }
})

/**
 * 通过navId获取Frontend NavItem
 * GET /api/v2/frontend-nav/by-navId/:navId
 */
router.get('/by-navId/:navId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { navId } = req.params
    const currentUser = (req as any).user

    const row = queryOne('SELECT * FROM frontend_nav_items WHERE navId = ?', [navId])

    if (!row) {
      return errorResponse(res, 'Frontend NavItem不存在', 404)
    }

    // 权限检查
    if (row.requireAuth && !currentUser) {
      return errorResponse(res, '需要登录才能访问', 401)
    }

    if (row.visibility === 'admin' && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return errorResponse(res, '无权访问此导航项', 403)
    }

    return successResponse(res, parseFrontendNavItem(row))
  } catch (error) {
    console.error('获取Frontend NavItem失败:', error)
    return errorResponse(res, '获取Frontend NavItem失败')
  }
})

/**
 * 创建Frontend NavItem
 * POST /api/v2/frontend-nav
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { navId, name, labelKey, icon, iconType, href, orderIndex, isEnabled, isVisible, visibility, allowedRoles, requireAuth } = req.body

    if (!navId || !name) {
      return errorResponse(res, 'navId和name不能为空', 400)
    }

    // 检查navId是否已存在
    const existing = queryOne('SELECT 1 FROM frontend_nav_items WHERE navId = ?', [navId])
    if (existing) {
      return errorResponse(res, 'navId已存在', 409)
    }

    const id = generateId()
    const now = new Date().toISOString()

    run(
      `INSERT INTO frontend_nav_items (id, navId, name, labelKey, icon, iconType, href, orderIndex, isEnabled, isVisible, visibility, allowedRoles, requireAuth, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, navId, name, labelKey || '', icon || '', iconType || 'lucide', href || '', orderIndex || 0, isEnabled !== false ? 1 : 0, isVisible !== false ? 1 : 0, visibility || 'public', allowedRoles ? JSON.stringify(allowedRoles) : null, requireAuth ? 1 : 0, now, now]
    )

    const newItem = queryOne('SELECT * FROM frontend_nav_items WHERE id = ?', [id])
    return successResponse(res, parseFrontendNavItem(newItem), 201)
  } catch (error) {
    console.error('创建Frontend NavItem失败:', error)
    return errorResponse(res, '创建Frontend NavItem失败')
  }
})

/**
 * 更新Frontend NavItem
 * PATCH /api/v2/frontend-nav/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const item = queryOne('SELECT * FROM frontend_nav_items WHERE id = ?', [id])

    if (!item) {
      return errorResponse(res, 'Frontend NavItem不存在', 404)
    }

    const { navId, name, labelKey, icon, iconType, href, orderIndex, isEnabled, isVisible, visibility, allowedRoles, requireAuth } = req.body

    // 如果修改了navId，检查是否与其他冲突
    if (navId && navId !== item.navId) {
      const existing = queryOne('SELECT 1 FROM frontend_nav_items WHERE navId = ? AND id != ?', [navId, id])
      if (existing) {
        return errorResponse(res, 'navId已存在', 409)
      }
    }

    const now = new Date().toISOString()

    const updates: string[] = []
    const params: any[] = []

    if (navId !== undefined) {
      updates.push('navId = ?')
      params.push(navId)
    }
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (labelKey !== undefined) {
      updates.push('labelKey = ?')
      params.push(labelKey)
    }
    if (icon !== undefined) {
      updates.push('icon = ?')
      params.push(icon)
    }
    if (iconType !== undefined) {
      updates.push('iconType = ?')
      params.push(iconType)
    }
    if (href !== undefined) {
      updates.push('href = ?')
      params.push(href)
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
    if (requireAuth !== undefined) {
      updates.push('requireAuth = ?')
      params.push(requireAuth ? 1 : 0)
    }

    updates.push('updatedAt = ?')
    params.push(now)
    params.push(id)

    run(`UPDATE frontend_nav_items SET ${updates.join(', ')} WHERE id = ?`, params)

    const updatedItem = queryOne('SELECT * FROM frontend_nav_items WHERE id = ?', [id])
    return successResponse(res, parseFrontendNavItem(updatedItem))
  } catch (error) {
    console.error('更新Frontend NavItem失败:', error)
    return errorResponse(res, '更新Frontend NavItem失败')
  }
})

/**
 * 删除Frontend NavItem
 * DELETE /api/v2/frontend-nav/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const item = queryOne('SELECT * FROM frontend_nav_items WHERE id = ?', [id])

    if (!item) {
      return errorResponse(res, 'Frontend NavItem不存在', 404)
    }

    run('DELETE FROM frontend_nav_items WHERE id = ?', [id])
    return successResponse(res, { message: 'Frontend NavItem已删除' })
  } catch (error) {
    console.error('删除Frontend NavItem失败:', error)
    return errorResponse(res, '删除Frontend NavItem失败')
  }
})

/**
 * 批量更新Frontend NavItems排序
 * PATCH /api/v2/frontend-nav/reorder
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
      run('UPDATE frontend_nav_items SET orderIndex = ?, updatedAt = ? WHERE id = ?', [item.orderIndex, now, item.id])
    }

    return successResponse(res, { message: '排序已更新', updatedCount: items.length })
  } catch (error) {
    console.error('批量更新Frontend NavItems排序失败:', error)
    return errorResponse(res, '批量更新Frontend NavItems排序失败')
  }
})

/**
 * 获取Frontend NavItems统计
 * GET /api/v2/frontend-nav/stats/overview
 */
router.get('/stats/overview', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const total = queryOne('SELECT COUNT(*) as count FROM frontend_nav_items')
    const enabledCount = queryOne('SELECT COUNT(*) as count FROM frontend_nav_items WHERE isEnabled = 1')
    const visibleCount = queryOne('SELECT COUNT(*) as count FROM frontend_nav_items WHERE isVisible = 1')
    const requireAuthCount = queryOne('SELECT COUNT(*) as count FROM frontend_nav_items WHERE requireAuth = 1')

    const visibilityStats = queryAll(`
      SELECT visibility, COUNT(*) as count 
      FROM frontend_nav_items 
      GROUP BY visibility
    `)

    return successResponse(res, {
      total: total?.count || 0,
      enabled: enabledCount?.count || 0,
      visible: visibleCount?.count || 0,
      requireAuth: requireAuthCount?.count || 0,
      byVisibility: visibilityStats
    })
  } catch (error) {
    console.error('获取Frontend NavItems统计失败:', error)
    return errorResponse(res, '获取Frontend NavItems统计失败')
  }
})

export default router
