/**
 * RSS路由模块
 * 提供RSS订阅源管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import {
  createRssFeed,
  getRssFeeds,
  getRssFeed,
  updateRssFeed,
  deleteRssFeed,
  getRssArticles,
  getUnreadCount,
  markArticleRead,
  markAllRead,
  starArticle,
  type RssFeed
} from '../../../../db/index.js'

const router = Router()

router.use(authMiddleware)

// 获取订阅源列表
router.get('/feeds', (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { activeOnly } = req.query
    const feeds = getRssFeeds(activeOnly === 'true', user.id)
    return successResponse(res, feeds)
  } catch (error) {
    console.error('Get feeds error:', error)
    return errorResponse(res, '获取订阅源失败')
  }
})

// 获取单个订阅源
router.get('/feeds/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const feed = getRssFeed(id)
    if (!feed) {
      return errorResponse(res, '订阅源不存在', 404)
    }
    return successResponse(res, feed)
  } catch (error) {
    console.error('Get feed error:', error)
    return errorResponse(res, '获取订阅源失败')
  }
})

// 创建订阅源
router.post('/feeds', (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { url, title, description } = req.body

    if (!url) {
      return errorResponse(res, 'URL 不能为空', 400)
    }

    const id = createRssFeed(user.id, title || '', url, description)
    if (!id) {
      return errorResponse(res, '创建订阅源失败', 500)
    }

    return successResponse(res, { id })
  } catch (error) {
    console.error('Create feed error:', error)
    return errorResponse(res, '创建订阅源失败')
  }
})

// 更新订阅源
router.patch('/feeds/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const updates: Partial<RssFeed> = req.body

    const existing = getRssFeed(id)
    if (!existing) {
      return errorResponse(res, '订阅源不存在', 404)
    }

    updateRssFeed(id, updates)
    return successResponse(res, { id })
  } catch (error) {
    console.error('Update feed error:', error)
    return errorResponse(res, '更新订阅源失败')
  }
})

// 删除订阅源
router.delete('/feeds/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const existing = getRssFeed(id)
    if (!existing) {
      return errorResponse(res, '订阅源不存在', 404)
    }

    deleteRssFeed(id)
    return successResponse(res, { id })
  } catch (error) {
    console.error('Delete feed error:', error)
    return errorResponse(res, '删除订阅源失败')
  }
})

// 刷新订阅源
router.post('/feeds/:id/refresh', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const feed = getRssFeed(id)

    if (!feed) {
      return errorResponse(res, '订阅源不存在', 404)
    }

    // 更新最后获取时间
    updateRssFeed(id, { lastFetchAt: new Date().toISOString() })

    // 这里可以添加实际的 RSS 抓取逻辑
    // 目前仅更新时间戳作为示例

    return successResponse(res, { refreshed: true })
  } catch (error) {
    console.error('Refresh feed error:', error)
    return errorResponse(res, '刷新订阅源失败')
  }
})

// 获取文章列表
router.get('/articles', (req: Request, res: Response) => {
  try {
    const { feedId, unreadOnly } = req.query
    const articles = getRssArticles(
      feedId as string | undefined,
      unreadOnly === 'true'
    )
    return successResponse(res, articles || [])
  } catch (error: any) {
    console.error('Get articles error:', error)
    return errorResponse(res, '获取文章失败: ' + (error?.message || '未知错误'), 500)
  }
})

// 获取未读数
router.get('/unread-count', (req: Request, res: Response) => {
  try {
    const { feedId } = req.query
    const count = getUnreadCount(feedId as string | undefined)
    return successResponse(res, { count })
  } catch (error) {
    console.error('Get unread count error:', error)
    return errorResponse(res, '获取未读数失败')
  }
})

// 标记文章已读
router.patch('/articles/:id/read', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    markArticleRead(id)
    return successResponse(res, { id })
  } catch (error) {
    console.error('Mark article read error:', error)
    return errorResponse(res, '标记已读失败')
  }
})

// 标记全部已读
router.post('/mark-all-read', (req: Request, res: Response) => {
  try {
    const { feedId } = req.body
    markAllRead(feedId)
    return successResponse(res, { feedId })
  } catch (error) {
    console.error('Mark all read error:', error)
    return errorResponse(res, '标记全部已读失败')
  }
})

// 收藏/取消收藏文章
router.patch('/articles/:id/star', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { isStarred } = req.body
    starArticle(id, isStarred !== false)
    return successResponse(res, { id, isStarred: isStarred !== false })
  } catch (error) {
    console.error('Star article error:', error)
    return errorResponse(res, '标记收藏失败')
  }
})

export default router
