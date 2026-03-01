/**
 * 书签路由 - V2版本
 * 提供书签的CRUD操作和权限管理
 */

import { Router, Request, Response } from 'express'
import { generateId, logAudit } from '../../db/index.js'
import { queryAll, queryOne, run, booleanize } from '../../utils/index.js'
import { authMiddleware, adminMiddleware, optionalAuthMiddleware, apiCacheMiddleware, invalidateCache, cacheConfigs } from '../../middleware/index.js'
import {
  validateBody,
  validateParams,
  validateQuery,
  idParamSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
  reorderBookmarksSchema,
  paginationQuerySchema,
  PaginationQuery,
} from '../../schemas.js'
import { asyncHandler, successResponse, errorResponse, getClientInfo, normalizeId } from '../utils/index.js'

const router = Router()

type Visibility = 'public' | 'personal' | 'private'

/**
 * 构建书签查询条件
 * 管理员可以看到所有书签，普通用户只能看到自己的和公开的
 */
function buildBookmarkQuery(user: any, visibility?: string, includePublic?: boolean): { query: string; params: any[] } {
  let query: string
  let params: any[] = []

  // 管理员可以看到所有书签
  if (user?.role === 'admin') {
    if (visibility) {
      query = `SELECT * FROM bookmarks WHERE visibility = ?`
      params = [visibility]
    } else {
      query = `SELECT * FROM bookmarks ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
    }
  } else if (user) {
    // 普通用户
    if (visibility) {
      if (visibility === 'public') {
        query = `SELECT * FROM bookmarks WHERE visibility = 'public'`
      } else if (visibility === 'personal' || visibility === 'private') {
        query = `SELECT * FROM bookmarks WHERE visibility = ? AND userId = ?`
        params = [visibility, user.id]
      } else {
        query = `SELECT * FROM bookmarks WHERE userId = ?`
        params = [user.id]
      }
    } else {
      query = `
        SELECT * FROM bookmarks 
        WHERE visibility = 'public' 
        OR (visibility IN ('personal', 'private') AND userId = ?)
        OR userId IS NULL
        ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
      `
      params = [user.id]
    }
  } else {
    query = `SELECT * FROM bookmarks WHERE visibility = 'public'`
  }

  if (!query.includes('ORDER BY')) {
    query += ` ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
  }

  return { query, params }
}

// ========== 列表路由（无参数）==========

// 获取书签列表（支持三种权限模型）- 带缓存
router.get('/', optionalAuthMiddleware, apiCacheMiddleware(cacheConfigs.bookmarks), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { visibility, includePublic } = req.query

  const { query, params } = buildBookmarkQuery(user, visibility as string, includePublic === 'true')
  const bookmarks = queryAll(query, params)

  return successResponse(res, bookmarks.map(booleanize))
}))

// 获取公共书签（无需登录）- 带缓存（10分钟）
router.get('/public', apiCacheMiddleware(cacheConfigs.publicBookmarks), asyncHandler(async (req, res) => {
  const query = `SELECT * FROM bookmarks WHERE visibility = 'public' ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
  const bookmarks = queryAll(query)
  return successResponse(res, bookmarks.map(booleanize))
}))

// 获取所有书签（管理后台）
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const query = `SELECT * FROM bookmarks ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
  const bookmarks = queryAll(query)
  return successResponse(res, bookmarks.map(booleanize))
}))

// 分页获取书签
router.get('/paginated', authMiddleware, validateQuery(paginationQuerySchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const query = (req as any).validatedQuery as PaginationQuery
  const { page, pageSize, search, category, isPinned, isReadLater, sortBy, sortOrder } = query

  console.log('[Bookmarks Paginated] User:', user)
  console.log('[Bookmarks Paginated] Query params:', { page, pageSize, search, category, isPinned, isReadLater, sortBy, sortOrder })

  // 构建 WHERE 条件 - 管理员可以看到所有书签，普通用户只能看到自己的书签
  const conditions: string[] = user.role === 'admin' ? [] : ['userId = ?']
  const params: any[] = user.role === 'admin' ? [] : [user.id]

  if (search) {
    conditions.push('(title LIKE ? OR url LIKE ? OR description LIKE ?)')
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern, searchPattern)
  }

  if (category) {
    if (category === 'uncategorized') {
      conditions.push('(category IS NULL OR category = "")')
    } else {
      conditions.push('category = ?')
      params.push(category)
    }
  }

  if (typeof isPinned === 'boolean') {
    conditions.push('isPinned = ?')
    params.push(isPinned ? 1 : 0)
  }

  if (typeof isReadLater === 'boolean') {
    conditions.push('isReadLater = ?')
    params.push(isReadLater ? 1 : 0)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 获取总数
  const countResult = queryOne(`SELECT COUNT(*) as total FROM bookmarks ${whereClause}`, params)
  const total = countResult?.total || 0
  console.log('[Bookmarks Paginated] Count result:', countResult, 'Total:', total)

  // 计算分页
  const offset = (page - 1) * pageSize
  const totalPages = Math.ceil(total / pageSize)

  // 构建排序
  let orderClause = 'ORDER BY isPinned DESC'
  if (sortBy === 'orderIndex') {
    orderClause += `, orderIndex ${sortOrder.toUpperCase()}, createdAt DESC`
  } else {
    orderClause += `, ${sortBy} ${sortOrder.toUpperCase()}`
  }

  // 查询数据
  const bookmarks = queryAll(`
    SELECT * FROM bookmarks
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  console.log('[Bookmarks Paginated] Query results count:', bookmarks.length)

  return successResponse(res, {
    items: bookmarks.map(booleanize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    }
  })
}))

// 创建书签 - 清除相关缓存
router.post('/', authMiddleware, validateBody(createBookmarkSchema), invalidateCache(['bookmarks', 'public-bookmarks']), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const {
    url, internalUrl, title, description, favicon, ogImage, icon, iconUrl,
    category, tags, notes, isReadLater, visibility = 'personal'
  } = req.body

  const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM bookmarks WHERE userId = ?', [user.id])
  const newOrderIndex = (maxOrder?.max ?? -1) + 1

  const id = generateId()
  const now = new Date().toISOString()

  run(`
    INSERT INTO bookmarks (id, url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, notes, orderIndex, isReadLater, visibility, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, url, internalUrl || null, title, description || null, favicon || null,
    ogImage || null, icon || null, iconUrl || null, category || null,
    tags || null, notes || null, newOrderIndex, isReadLater ? 1 : 0,
    visibility, user.id, now, now
  ])

  const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ? AND userId = ?', [id, user.id])

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'CREATE_BOOKMARK',
    resourceType: 'bookmark',
    resourceId: id,
    details: { title, url, visibility },
    ip,
    userAgent
  })

  return successResponse(res, booleanize(bookmark), 201)
}))

// 重排序书签
router.patch('/reorder', authMiddleware, validateBody(reorderBookmarksSchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { items } = req.body

  for (const item of items) {
    run('UPDATE bookmarks SET orderIndex = ? WHERE id = ? AND userId = ?', [item.orderIndex, item.id, user.id])
  }

  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'REORDER_BOOKMARKS',
    resourceType: 'bookmark',
    details: { count: items.length },
    ip,
    userAgent
  })

  return successResponse(res, { success: true })
}))

// ========== 具体子路由（必须在 /:id 之前定义）==========

// 切换书签可见性状态
router.patch('/:id/visibility', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)
  const { visibility } = req.body as { visibility: Visibility }
  const now = new Date().toISOString()

  if (!['public', 'personal', 'private'].includes(visibility)) {
    return errorResponse(res, '无效的可见性类型', 400)
  }

  // 管理员可以修改所有书签，普通用户只能修改自己的书签
  let bookmark
  if (user.role === 'admin') {
    bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ?', [resourceId])
  } else {
    bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ? AND userId = ?', [resourceId, user.id])
  }

  if (!bookmark) {
    return errorResponse(res, '书签不存在', 404)
  }

  // 管理员可以更新所有书签，普通用户只能更新自己的书签
  if (user.role === 'admin') {
    run('UPDATE bookmarks SET visibility = ?, updatedAt = ? WHERE id = ?', [visibility, now, resourceId])
  } else {
    run('UPDATE bookmarks SET visibility = ?, updatedAt = ? WHERE id = ? AND userId = ?', [visibility, now, resourceId, user.id])
  }

  const updated = queryOne('SELECT * FROM bookmarks WHERE id = ?', [resourceId])

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'CHANGE_VISIBILITY',
    resourceType: 'bookmark',
    resourceId: resourceId,
    details: { title: updated?.title, visibility },
    ip,
    userAgent
  })

  return successResponse(res, booleanize(updated))
}))

// ========== 通用资源路由（必须在具体子路由之后）==========

// 获取单个书签
router.get('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const resourceId = normalizeId(req.params.id)

  const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ? AND userId = ?', [resourceId, user.id])

  if (!bookmark) {
    return errorResponse(res, '书签不存在', 404)
  }

  return successResponse(res, booleanize(bookmark))
}))

// 更新书签 - 清除相关缓存
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateBookmarkSchema), invalidateCache(['bookmarks', 'public-bookmarks']), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)
  const updates = req.body
  const now = new Date().toISOString()

  const current = queryOne('SELECT * FROM bookmarks WHERE id = ? AND userId = ?', [resourceId, user.id])

  if (!current) {
    return errorResponse(res, '书签不存在', 404)
  }

  const merged = { ...current, ...updates, updatedAt: now }

  run(`
    UPDATE bookmarks SET
      url = ?, internalUrl = ?, title = ?, description = ?, favicon = ?, ogImage = ?, icon = ?, iconUrl = ?,
      category = ?, tags = ?, notes = ?, orderIndex = ?, isPinned = ?,
      isReadLater = ?, isRead = ?, visibility = ?, updatedAt = ?
    WHERE id = ? AND userId = ?
  `, [
    merged.url, merged.internalUrl || null, merged.title, merged.description, merged.favicon, merged.ogImage, merged.icon, merged.iconUrl,
    merged.category, merged.tags, merged.notes || null, merged.orderIndex, merged.isPinned ? 1 : 0,
    merged.isReadLater ? 1 : 0, merged.isRead ? 1 : 0, merged.visibility || 'personal', now, resourceId, user.id
  ])

  const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ? AND userId = ?', [resourceId, user.id])

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'UPDATE_BOOKMARK',
    resourceType: 'bookmark',
    resourceId: resourceId,
    details: { title: merged.title, url: merged.url, visibility: merged.visibility },
    ip,
    userAgent
  })

  return successResponse(res, booleanize(bookmark))
}))

// 删除书签 - 清除相关缓存
router.delete('/:id', authMiddleware, validateParams(idParamSchema), invalidateCache(['bookmarks', 'public-bookmarks']), asyncHandler(async (req, res) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)

  const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ? AND userId = ?', [resourceId, user.id])

  if (!bookmark) {
    return errorResponse(res, '书签不存在', 404)
  }

  run('DELETE FROM bookmarks WHERE id = ? AND userId = ?', [resourceId, user.id])

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'DELETE_BOOKMARK',
    resourceType: 'bookmark',
    resourceId: resourceId,
    details: { title: bookmark?.title, url: bookmark?.url },
    ip,
    userAgent
  })

  return successResponse(res, null, 204)
}))

export default router
