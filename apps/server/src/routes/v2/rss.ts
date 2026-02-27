/**
 * RSS路由 - V2版本
 * 提供RSS订阅源管理
 */

import { Router } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
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
} from '../../db/index.js'

const router = Router()

router.use(authMiddleware)

router.get('/feeds', (req, res) => {
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

router.get('/feeds/:id', (req, res) => {
  try {
    const { id } = req.params
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

router.post('/feeds', (req, res) => {
  try {
    const user = (req as any).user
    const { url, title, description } = req.body
    if (!url) {
      return res.status(400).json({ error: 'URL 不能为空' })
    }
    const id = createRssFeed(user.id, title || '', url, description)
    res.json({ success: true, id })
  } catch (error) {
    console.error('Create feed error:', error)
    res.status(500).json({ error: '创建订阅源失败' })
  }
})

router.patch('/feeds/:id', (req, res) => {
  try {
    const { id } = req.params
    updateRssFeed(id, req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Update feed error:', error)
    res.status(500).json({ error: '更新订阅源失败' })
  }
})

router.delete('/feeds/:id', (req, res) => {
  try {
    const { id } = req.params
    deleteRssFeed(id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete feed error:', error)
    res.status(500).json({ error: '删除订阅源失败' })
  }
})

router.get('/articles', (req, res) => {
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

router.get('/unread-count', (req, res) => {
  try {
    const { feedId } = req.query
    const count = getUnreadCount(feedId as string | undefined)
    return successResponse(res, { count })
  } catch (error) {
    console.error('Get unread count error:', error)
    return errorResponse(res, '获取未读数失败')
  }
})

router.patch('/articles/:id/read', (req, res) => {
  try {
    const { id } = req.params
    markArticleRead(id)
    res.json({ success: true })
  } catch (error) {
    console.error('Mark article read error:', error)
    res.status(500).json({ error: '标记已读失败' })
  }
})

router.post('/mark-all-read', (req, res) => {
  try {
    const { feedId } = req.body
    markAllRead(feedId)
    res.json({ success: true })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ error: '标记全部已读失败' })
  }
})

router.patch('/articles/:id/star', (req, res) => {
  try {
    const { id } = req.params
    const { isStarred } = req.body
    starArticle(id, isStarred !== false)
    res.json({ success: true })
  } catch (error) {
    console.error('Star article error:', error)
    res.status(500).json({ error: '标记收藏失败' })
  }
})

export default router
