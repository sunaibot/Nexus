/**
 * 分类路由模块
 * 提供分类的CRUD操作
 */

import { Router, Request, Response } from 'express'
import { logAudit } from '../../../../db/index.js'
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../../../../middleware/index.js'
import {
  validateBody,
  validateParams,
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../../../../schemas.js'
import { asyncHandler, successResponse, errorResponse, getClientInfo, normalizeId } from '../../../utils/index.js'
import {
  getAllCategories,
  getAllCategoriesWithTabs,
  getPublicCategories,
  getCategories,
  getCategoryById,
  getCategoryByIdOnly,
  checkParentExists,
  checkCircularReference,
  createCategory,
  reorderCategories,
  updateCategory,
  deleteCategory,
  ReorderItem
} from '../../../../db/modules/categories/index.js'

const router = Router()

// 获取所有分类（管理后台专用）
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const categories = getAllCategories()
  return successResponse(res, categories)
}))

// 获取所有分类及其 Tab 信息（管理后台专用）
router.get('/admin/all-with-tabs', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const categories = getAllCategoriesWithTabs()
  return successResponse(res, categories)
}))

// 获取公共分类（无需登录）
router.get('/public', asyncHandler(async (req: Request, res: Response) => {
  const categories = getPublicCategories()
  return successResponse(res, categories)
}))

// 获取分类列表（支持公开访问和认证访问）
router.get('/', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const categories = getCategories(user)
  return successResponse(res, categories)
}))

// 创建分类
router.post('/', authMiddleware, validateBody(createCategorySchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { name, description, icon, color, orderIndex, parentId } = req.body

  console.log('[Categories API] 创建分类请求体:', req.body)

  // 验证 parentId 是否存在
  if (parentId) {
    if (!checkParentExists(parentId)) {
      return errorResponse(res, '父级分类不存在', 400)
    }
  }

  const category = createCategory(user.id, {
    name,
    description,
    icon,
    color,
    orderIndex,
    parentId
  })

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'CREATE_CATEGORY',
    resourceType: 'category',
    resourceId: category.id,
    details: { name, description, parentId },
    ip,
    userAgent
  })

  return successResponse(res, category, 201)
}))

// 重排序分类
router.patch('/reorder', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { items } = req.body

  if (!Array.isArray(items)) {
    return errorResponse(res, '无效的请求数据', 400)
  }

  reorderCategories(items as ReorderItem[], user.id)

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
router.get('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const resourceId = normalizeId(req.params.id)

  const category = getCategoryById(resourceId, user.id)

  if (!category) {
    return errorResponse(res, '分类不存在', 404)
  }

  return successResponse(res, category)
}))

// 更新分类
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateCategorySchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)
  const { name, description, icon, color, orderIndex, parentId } = req.body

  const current = getCategoryById(resourceId, user.id)
  if (!current) {
    return errorResponse(res, '分类不存在', 404)
  }

  // 验证 parentId 是否存在（如果提供了）
  if (parentId !== undefined && parentId !== null) {
    // 不能将自己设为父级
    if (parentId === resourceId) {
      return errorResponse(res, '不能将自己设为父级分类', 400)
    }
    if (!checkParentExists(parentId)) {
      return errorResponse(res, '父级分类不存在', 400)
    }
    // 检查是否会成为循环引用
    if (checkCircularReference(resourceId, parentId)) {
      return errorResponse(res, '不能将子分类设为父级（会导致循环引用）', 400)
    }
  }

  const category = updateCategory(resourceId, user.id, {
    name,
    description,
    icon,
    color,
    orderIndex,
    parentId
  }, current)

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'UPDATE_CATEGORY',
    resourceType: 'category',
    resourceId: resourceId,
    details: { name, description, parentId },
    ip,
    userAgent
  })

  return successResponse(res, category)
}))

// 删除分类
router.delete('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)

  const result = deleteCategory(resourceId, user.id)

  if (!result.success) {
    return errorResponse(res, '分类不存在', 404)
  }

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'DELETE_CATEGORY',
    resourceType: 'category',
    resourceId: resourceId,
    details: { name: result.category?.name },
    ip,
    userAgent
  })

  return successResponse(res, null, 204)
}))

export default router
