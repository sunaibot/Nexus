/**
 * 书签路由模块
 * 提供书签的CRUD操作和权限管理
 */

import { Router, Request, Response } from 'express'
import { logAudit } from '../../../../db/index.js'
import {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
  apiCacheMiddleware,
  invalidateCache,
  cacheConfigs
} from '../../../../middleware/index.js'
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
} from '../../../../schemas.js'
import { asyncHandler, successResponse, errorResponse, getClientInfo, normalizeId } from '../../../utils/index.js'
import {
  getBookmarks,
  getPublicBookmarks,
  getAllBookmarks,
  getPaginatedBookmarks,
  getBookmarkById,
  getBookmarkByIdAndVisibility,
  createBookmark,
  updateBookmark,
  updateBookmarkVisibility,
  deleteBookmark,
  reorderBookmarks,
  Visibility
} from '../../../../db/modules/bookmarks/index.js'

const router = Router()

// ========== 列表路由（无参数）==========

// 获取书签列表（支持三种权限模型）- 带缓存
router.get('/', optionalAuthMiddleware, apiCacheMiddleware(cacheConfigs.bookmarks), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { visibility, includePublic } = req.query

  const bookmarks = getBookmarks(user, visibility as string, includePublic === 'true')
  return successResponse(res, bookmarks)
}))

// 获取公共书签（无需登录）- 带缓存（10分钟）
router.get('/public', apiCacheMiddleware(cacheConfigs.publicBookmarks), asyncHandler(async (req: Request, res: Response) => {
  const bookmarks = getPublicBookmarks()
  return successResponse(res, bookmarks)
}))

// 获取合并后的书签列表（按URL去重，显示收藏人数）
router.get('/merged', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { visibility } = req.query

  // 获取所有可见的书签
  const bookmarks = getBookmarks(user, visibility as string, true)
  
  // 按URL合并书签
  const urlMap = new Map<string, any>()
  
  bookmarks.forEach((bookmark: any) => {
    const url = bookmark.url
    if (urlMap.has(url)) {
      // 已存在相同URL的书签，增加收藏人数
      const existing = urlMap.get(url)
      existing.collectCount = (existing.collectCount || 1) + 1
      existing.collectors = existing.collectors || []
      existing.collectors.push({
        userId: bookmark.userId,
        userName: bookmark.userName,
        isPinned: bookmark.isPinned,
      })
      // 如果是当前用户的，标记为已收藏
      if (user && bookmark.userId === user.id) {
        existing.isCollectedByMe = true
        existing.myBookmarkId = bookmark.id
      }
    } else {
      // 新的URL
      urlMap.set(url, {
        ...bookmark,
        collectCount: 1,
        isCollectedByMe: user && bookmark.userId === user.id,
        myBookmarkId: user && bookmark.userId === user.id ? bookmark.id : null,
        collectors: [{
          userId: bookmark.userId,
          userName: bookmark.userName,
          isPinned: bookmark.isPinned,
        }],
      })
    }
  })
  
  // 转换为数组并按收藏人数排序
  const mergedBookmarks = Array.from(urlMap.values()).sort((a: any, b: any) => {
    // 优先显示自己的书签
    if (a.isCollectedByMe && !b.isCollectedByMe) return -1
    if (!a.isCollectedByMe && b.isCollectedByMe) return 1
    // 然后按收藏人数排序
    return (b.collectCount || 1) - (a.collectCount || 1)
  })
  
  return successResponse(res, mergedBookmarks)
}))

// 获取所有书签（管理后台）
router.get('/admin/all', authMiddleware, adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const bookmarks = getAllBookmarks()
  return successResponse(res, bookmarks)
}))

// 分页获取书签
router.get('/paginated', authMiddleware, validateQuery(paginationQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const query = (req as any).validatedQuery as PaginationQuery

  const result = getPaginatedBookmarks(user, query)
  return successResponse(res, result)
}))

// 创建书签 - 清除相关缓存
router.post('/', authMiddleware, validateBody(createBookmarkSchema), invalidateCache(['bookmarks', 'public-bookmarks']), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const input = req.body

  const bookmark = createBookmark(user.id, input)

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'CREATE_BOOKMARK',
    resourceType: 'bookmark',
    resourceId: bookmark.id,
    details: { title: input.title, url: input.url, visibility: input.visibility },
    ip,
    userAgent
  })

  return successResponse(res, bookmark, 201)
}))

// 重排序书签
router.patch('/reorder', authMiddleware, validateBody(reorderBookmarksSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const { items } = req.body

  reorderBookmarks(items, user.id)

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
router.patch('/:id/visibility', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)
  const { visibility } = req.body as { visibility: Visibility }

  if (!['public', 'personal', 'private'].includes(visibility)) {
    return errorResponse(res, '无效的可见性类型', 400)
  }

  // 检查书签是否存在
  let bookmark
  if (user.role === 'admin') {
    bookmark = getBookmarkById(resourceId)
  } else {
    bookmark = getBookmarkById(resourceId, user.id)
  }

  if (!bookmark) {
    return errorResponse(res, '书签不存在', 404)
  }

  const updated = updateBookmarkVisibility(resourceId, visibility, user.role === 'admin', user.id)

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

  return successResponse(res, updated)
}))

// ========== 通用资源路由（必须在具体子路由之后）==========

// 获取单个书签
router.get('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const resourceId = normalizeId(req.params.id)

  const bookmark = getBookmarkById(resourceId, user.id)

  if (!bookmark) {
    return errorResponse(res, '书签不存在', 404)
  }

  return successResponse(res, bookmark)
}))

// 更新书签 - 清除相关缓存
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateBookmarkSchema), invalidateCache(['bookmarks', 'public-bookmarks']), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)
  const updates = req.body

  // 首先尝试查找用户自己的书签
  let current = getBookmarkById(resourceId, user.id)
  let isOwnBookmark = true

  // 如果不是用户自己的书签，尝试查找公共书签（允许修改分类和排序）
  if (!current) {
    current = getBookmarkByIdAndVisibility(resourceId, 'public')
    isOwnBookmark = false
  }

  if (!current) {
    return errorResponse(res, '书签不存在', 404)
  }

  const bookmark = updateBookmark(resourceId, user.id, user.role === 'admin', updates, isOwnBookmark)

  logAudit({
    userId: user.id,
    username: user.username,
    action: 'UPDATE_BOOKMARK',
    resourceType: 'bookmark',
    resourceId: resourceId,
    details: { title: updates.title, url: updates.url, visibility: updates.visibility, isOwnBookmark },
    ip,
    userAgent
  })

  return successResponse(res, bookmark)
}))

// 删除书签 - 清除相关缓存
router.delete('/:id', authMiddleware, validateParams(idParamSchema), invalidateCache(['bookmarks', 'public-bookmarks']), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { ip, userAgent } = getClientInfo(req)
  const resourceId = normalizeId(req.params.id)

  const bookmark = getBookmarkById(resourceId, user.id)

  if (!bookmark) {
    return errorResponse(res, '书签不存在', 404)
  }

  deleteBookmark(resourceId, user.id)

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
