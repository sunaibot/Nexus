/**
 * Tab 路由 - V2版本
 * 提供快速导航标签的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { generateId, logAudit } from '../../db/index.js'
import { queryAll, queryOne, run, booleanize } from '../../utils/index.js'
import { authMiddleware, optionalAuthMiddleware, apiCacheMiddleware, invalidateCache } from '../../middleware/index.js'
import {
  validateBody,
  validateParams,
  createTabSchema,
  updateTabSchema,
  reorderTabsSchema,
  idParamSchema,
} from '../../schemas.js'
import { asyncHandler, successResponse, errorResponse, getClientInfo } from '../utils/routeHelpers.js'

// Tab 缓存配置
const tabCacheConfig = {
  ttl: 300000, // 5分钟
  tags: ['tabs']
}

const router = Router()

// ========== 列表路由 ==========

// 获取所有 Tab（带缓存）
router.get('/', optionalAuthMiddleware, apiCacheMiddleware(tabCacheConfig), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user

  let tabs: any[]
  if (user?.role === 'admin') {
    // 管理员可以看到所有 Tab
    tabs = queryAll('SELECT * FROM tabs ORDER BY orderIndex ASC, createdAt ASC')
  } else if (user) {
    // 普通用户可以看到自己的 Tab 和公共 Tab
    tabs = queryAll(`
      SELECT * FROM tabs 
      WHERE userId = ? OR userId = 'admin'
      ORDER BY orderIndex ASC, createdAt ASC
    `, [user.id])
  } else {
    // 未登录用户只能看到公共 Tab
    tabs = queryAll(`
      SELECT * FROM tabs 
      WHERE userId = 'admin'
      ORDER BY orderIndex ASC, createdAt ASC
    `)
  }

  // 获取每个 Tab 关联的分类
  const tabsWithCategories = tabs.map(tab => {
    const categories = queryAll(`
      SELECT c.* FROM categories c
      INNER JOIN tab_categories tc ON c.id = tc.categoryId
      WHERE tc.tabId = ?
      ORDER BY tc.orderIndex ASC
    `, [tab.id])

    return {
      ...booleanize(tab),
      categories: categories.map(booleanize)
    }
  })

  return successResponse(res, tabsWithCategories)
}))

// 获取当前 Tab（默认 Tab 或第一个 Tab）
router.get('/current', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user

  let tab: any
  if (user?.role === 'admin') {
    tab = queryOne('SELECT * FROM tabs WHERE isDefault = 1 ORDER BY orderIndex ASC LIMIT 1')
  } else if (user) {
    tab = queryOne(`
      SELECT * FROM tabs 
      WHERE (userId = ? OR userId = 'admin') AND isDefault = 1
      ORDER BY orderIndex ASC LIMIT 1
    `, [user.id])
  } else {
    tab = queryOne(`
      SELECT * FROM tabs 
      WHERE userId = 'admin' AND isDefault = 1
      ORDER BY orderIndex ASC LIMIT 1
    `)
  }

  if (!tab) {
    // 如果没有默认 Tab，返回第一个 Tab
    if (user?.role === 'admin') {
      tab = queryOne('SELECT * FROM tabs ORDER BY orderIndex ASC LIMIT 1')
    } else if (user) {
      tab = queryOne(`
        SELECT * FROM tabs 
        WHERE userId = ? OR userId = 'admin'
        ORDER BY orderIndex ASC LIMIT 1
      `, [user.id])
    } else {
      tab = queryOne(`
        SELECT * FROM tabs 
        WHERE userId = 'admin'
        ORDER BY orderIndex ASC LIMIT 1
      `)
    }
  }

  if (!tab) {
    return errorResponse(res, '没有可用的 Tab', 404)
  }

  // 获取关联的分类
  const categories = queryAll(`
    SELECT c.* FROM categories c
    INNER JOIN tab_categories tc ON c.id = tc.categoryId
    WHERE tc.tabId = ?
    ORDER BY tc.orderIndex ASC
  `, [tab.id])

  return successResponse(res, {
    ...booleanize(tab),
    categories: categories.map(booleanize)
  })
}))

// ========== 具体子路由 ==========

// 获取单个 Tab
router.get('/:id', optionalAuthMiddleware, validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { id } = req.params

  let tab: any
  if (user?.role === 'admin') {
    tab = queryOne('SELECT * FROM tabs WHERE id = ?', [id])
  } else if (user) {
    tab = queryOne('SELECT * FROM tabs WHERE id = ? AND (userId = ? OR userId = ?)', [id, user.id, 'admin'])
  } else {
    tab = queryOne('SELECT * FROM tabs WHERE id = ? AND userId = ?', [id, 'admin'])
  }

  if (!tab) {
    return errorResponse(res, 'Tab 不存在', 404)
  }

  // 获取关联的分类
  const categories = queryAll(`
    SELECT c.* FROM categories c
    INNER JOIN tab_categories tc ON c.id = tc.categoryId
    WHERE tc.tabId = ?
    ORDER BY tc.orderIndex ASC
  `, [tab.id])

  return successResponse(res, {
    ...booleanize(tab),
    categories: categories.map(booleanize)
  })
}))

// 创建 Tab
router.post('/', authMiddleware, validateBody(createTabSchema), invalidateCache(['tabs']), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { name, icon, color, categoryIds } = req.body

  const id = generateId()
  const now = new Date().toISOString()

  // 获取当前最大 orderIndex
  const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM tabs WHERE userId = ?', [user.id])
  const orderIndex = (maxOrder?.max || 0) + 1

  run(`
    INSERT INTO tabs (id, name, icon, color, orderIndex, isDefault, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, name, icon || null, color || null, orderIndex, 0, user.id, now, now])

  // 关联分类
  if (categoryIds && categoryIds.length > 0) {
    for (let i = 0; i < categoryIds.length; i++) {
      run(`
        INSERT INTO tab_categories (tabId, categoryId, orderIndex, createdAt)
        VALUES (?, ?, ?, ?)
      `, [id, categoryIds[i], i, now])
    }
  }

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'CREATE_TAB',
    resourceType: 'tab',
    resourceId: id,
    details: { name, icon, color, categoryIds },
    ip,
    userAgent
  })

  const tab = queryOne('SELECT * FROM tabs WHERE id = ?', [id])
  return successResponse(res, booleanize(tab), 201)
}))

// 更新 Tab
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateTabSchema), invalidateCache(['tabs']), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const id = req.params.id as string
  const { name, icon, color, categoryIds, isDefault } = req.body
  const now = new Date().toISOString()

  // 检查权限
  const existing = queryOne('SELECT * FROM tabs WHERE id = ?', [id])
  if (!existing) {
    return errorResponse(res, 'Tab 不存在', 404)
  }

  if (user.role !== 'admin' && existing.userId !== user.id) {
    return errorResponse(res, '无权修改此 Tab', 403)
  }

  // 如果设置为默认，先取消其他默认 Tab
  if (isDefault) {
    run('UPDATE tabs SET isDefault = 0 WHERE userId = ?', [existing.userId])
  }

  // 更新 Tab
  run(`
    UPDATE tabs SET
      name = COALESCE(?, name),
      icon = COALESCE(?, icon),
      color = COALESCE(?, color),
      isDefault = COALESCE(?, isDefault),
      updatedAt = ?
    WHERE id = ?
  `, [name, icon, color, isDefault, now, id])

  // 更新分类关联
  if (categoryIds !== undefined) {
    // 删除旧关联
    run('DELETE FROM tab_categories WHERE tabId = ?', [id])

    // 添加新关联
    for (let i = 0; i < categoryIds.length; i++) {
      run(`
        INSERT INTO tab_categories (tabId, categoryId, orderIndex, createdAt)
        VALUES (?, ?, ?, ?)
      `, [id, categoryIds[i], i, now])
    }
  }

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'UPDATE_TAB',
    resourceType: 'tab',
    resourceId: id,
    details: { name, icon, color, categoryIds, isDefault },
    ip: ip as string,
    userAgent: userAgent as string
  })

  const tab = queryOne('SELECT * FROM tabs WHERE id = ?', [id])
  return successResponse(res, booleanize(tab))
}))

// 删除 Tab
router.delete('/:id', authMiddleware, validateParams(idParamSchema), invalidateCache(['tabs']), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const id = req.params.id as string

  const existing = queryOne('SELECT * FROM tabs WHERE id = ?', [id])
  if (!existing) {
    return errorResponse(res, 'Tab 不存在', 404)
  }

  if (user.role !== 'admin' && existing.userId !== user.id) {
    return errorResponse(res, '无权删除此 Tab', 403)
  }

  // 删除关联的分类关系
  run('DELETE FROM tab_categories WHERE tabId = ?', [id])

  // 删除 Tab
  run('DELETE FROM tabs WHERE id = ?', [id])

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'DELETE_TAB',
    resourceType: 'tab',
    resourceId: id,
    details: { name: existing.name },
    ip: ip as string,
    userAgent: userAgent as string
  })

  return successResponse(res, { success: true })
}))

// 重排序 Tab
router.patch('/reorder', authMiddleware, validateBody(reorderTabsSchema), invalidateCache(['tabs']), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { items } = req.body
  const now = new Date().toISOString()

  for (const item of items) {
    const tab = queryOne('SELECT * FROM tabs WHERE id = ?', [item.id])
    if (tab && (user.role === 'admin' || tab.userId === user.id)) {
      run('UPDATE tabs SET orderIndex = ?, updatedAt = ? WHERE id = ?', [item.orderIndex, now, item.id])
    }
  }

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'REORDER_TABS',
    resourceType: 'tab',
    resourceId: 'multiple',
    details: { count: items.length },
    ip,
    userAgent
  })

  return successResponse(res, { success: true })
}))

export default router
