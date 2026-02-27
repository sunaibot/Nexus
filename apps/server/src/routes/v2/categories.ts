/**
 * 分类路由 - V2版本
 * 提供分类的CRUD操作
 */

import { Router } from 'express'
import { generateId, logAudit } from '../../db/index.js'
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../../middleware/index.js'
import { queryAll, queryOne, run } from '../../utils/index.js'
import {
  validateBody,
  validateParams,
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../../schemas.js'
import { asyncHandler, successResponse, errorResponse, getClientInfo, normalizeId } from '../utils/index.js'

const router = Router()

// 获取所有分类（管理后台专用）
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
  return successResponse(res, categories)
}))

// 获取公共分类（无需登录）
router.get('/public', asyncHandler(async (req, res) => {
  const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
  return successResponse(res, categories)
}))

// 获取分类列表（支持公开访问和认证访问）
router.get('/', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const user = (req as any).user
  
  // 管理员返回所有分类
  if (user?.role === 'admin') {
    const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
    return successResponse(res, categories)
  }
  
  // 如果用户已登录，返回该用户的分类和公共分类（userId IS NULL）
  if (user) {
    const categories = queryAll('SELECT * FROM categories WHERE userId = ? OR userId IS NULL ORDER BY orderIndex ASC', [user.id])
    return successResponse(res, categories)
  }
  
  // 未登录用户返回所有分类
  const categories = queryAll('SELECT * FROM categories ORDER BY orderIndex ASC')
  return successResponse(res, categories)
}))

// 创建分类
router.post('/', authMiddleware, validateBody(createCategorySchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { name, description, icon, color, orderIndex, parentId } = req.body

  console.log('[Categories API] 创建分类请求体:', req.body)

  // 如果提供了 orderIndex，使用提供的值；否则自动计算
  let newOrderIndex = orderIndex
  if (typeof newOrderIndex !== 'number') {
    const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM categories WHERE userId = ? AND parentId IS ?', [user.id, parentId ?? null])
    newOrderIndex = (maxOrder?.max ?? -1) + 1
  }

  // 验证 parentId 是否存在
  if (parentId) {
    const parentCategory = queryOne('SELECT id FROM categories WHERE id = ?', [parentId])
    if (!parentCategory) {
      return errorResponse(res, '父级分类不存在', 400)
    }
  }

  const id = generateId()

  run(`
    INSERT INTO categories (id, name, description, icon, color, orderIndex, userId, parentId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, name, description ?? null, icon ?? null, color ?? null, newOrderIndex, user.id, parentId ?? null])

  const category = queryOne('SELECT * FROM categories WHERE id = ? AND userId = ?', [id, user.id])

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'CREATE_CATEGORY',
    resourceType: 'category',
    resourceId: id,
    details: { name, description, parentId },
    ip,
    userAgent
  })

  return successResponse(res, category, 201)
}))

// 重排序分类
router.patch('/reorder', authMiddleware, asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { items } = req.body

  if (!Array.isArray(items)) {
    return errorResponse(res, '无效的请求数据', 400)
  }

  for (const item of items) {
    if (item.id && typeof item.orderIndex === 'number') {
      run('UPDATE categories SET orderIndex = ? WHERE id = ? AND userId = ?', [item.orderIndex, item.id, user.id])
    }
  }

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'REORDER_CATEGORIES',
    resourceType: 'category',
    details: { count: items.length },
    ip,
    userAgent
  })

  return successResponse(res, { success: true })
}))

// 获取单个分类
router.get('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const resourceId = normalizeId(req.params.id)

  const category = queryOne('SELECT * FROM categories WHERE id = ? AND userId = ?', [resourceId, user.id])

  if (!category) {
    return errorResponse(res, '分类不存在', 404)
  }

  return successResponse(res, category)
}))

// 更新分类
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateCategorySchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)
  const { name, description, icon, color, orderIndex, parentId } = req.body

  const current = queryOne('SELECT * FROM categories WHERE id = ? AND userId = ?', [resourceId, user.id])
  if (!current) {
    return errorResponse(res, '分类不存在', 404)
  }

  // 验证 parentId 是否存在（如果提供了）
  if (parentId !== undefined && parentId !== null) {
    // 不能将自己设为父级
    if (parentId === resourceId) {
      return errorResponse(res, '不能将自己设为父级分类', 400)
    }
    const parentCategory = queryOne('SELECT id FROM categories WHERE id = ?', [parentId])
    if (!parentCategory) {
      return errorResponse(res, '父级分类不存在', 400)
    }
    // 检查是否会成为循环引用
    const checkCircular = (catId: string): boolean => {
      if (catId === resourceId) return true
      const cat = queryOne('SELECT parentId FROM categories WHERE id = ?', [catId])
      if (!cat?.parentId) return false
      return checkCircular(cat.parentId)
    }
    if (checkCircular(parentId)) {
      return errorResponse(res, '不能将子分类设为父级（会导致循环引用）', 400)
    }
  }

  const merged = {
    name: name ?? current.name,
    description: description !== undefined ? description : current.description,
    icon: icon ?? current.icon,
    color: color ?? current.color,
    orderIndex: orderIndex ?? current.orderIndex,
    parentId: parentId !== undefined ? parentId : current.parentId,
  }

  run(`
    UPDATE categories SET name = ?, description = ?, icon = ?, color = ?, orderIndex = ?, parentId = ?
    WHERE id = ? AND userId = ?
  `, [merged.name, merged.description, merged.icon, merged.color, merged.orderIndex, merged.parentId, resourceId, user.id])

  const category = queryOne('SELECT * FROM categories WHERE id = ? AND userId = ?', [resourceId, user.id])

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'UPDATE_CATEGORY',
    resourceType: 'category',
    resourceId: resourceId,
    details: { name: merged.name, description: merged.description, parentId: merged.parentId },
    ip,
    userAgent
  })

  return successResponse(res, category)
}))

// 删除分类
router.delete('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)

  const category = queryOne('SELECT * FROM categories WHERE id = ? AND userId = ?', [resourceId, user.id])

  if (!category) {
    return errorResponse(res, '分类不存在', 404)
  }

  // 将该分类下的书签设为未分类
  run('UPDATE bookmarks SET category = NULL WHERE category = ? AND userId = ?', [resourceId, user.id])

  // 删除分类
  run('DELETE FROM categories WHERE id = ? AND userId = ?', [resourceId, user.id])

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'DELETE_CATEGORY',
    resourceType: 'category',
    resourceId: resourceId,
    details: { name: category?.name },
    ip,
    userAgent
  })

  return successResponse(res, null, 204)
}))

export default router
