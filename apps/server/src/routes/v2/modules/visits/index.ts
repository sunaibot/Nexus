/**
 * 访问统计路由模块
 * 提供访问统计和数据分析
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import {
  recordVisit,
  getTopBookmarks,
  getVisitTrend,
  getRecentVisits,
  getBookmarkStats,
  getCategoryStats,
  getCategoryTrend,
  getVisitRecords,
  getPopularBookmarks,
  getVisitTimeline,
  getVisitStatsSummary,
  clearAllVisits
} from '../../../../db/index.js'

const router = Router()

// 记录书签访问（公开接口）
router.post('/track', (req: Request, res: Response) => {
  try {
    const { bookmarkId, userId, userAgent } = req.body
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'

    if (!bookmarkId) {
      return errorResponse(res, '书签ID不能为空', 400)
    }

    const id = recordVisit(
      bookmarkId,
      userId || null,
      String(ip),
      userAgent || null
    )

    if (!id) {
      return errorResponse(res, '记录访问失败', 500)
    }

    return successResponse(res, { recorded: true })
  } catch (error) {
    console.error('记录访问失败:', error)
    return errorResponse(res, '记录访问失败')
  }
})

// 获取热门书签排行
router.get('/top', authMiddleware, (req: Request, res: Response) => {
  try {
    const { limit = 10, period = 'all' } = req.query
    const limitNum = parseInt(limit as string) || 10

    const topBookmarks = getTopBookmarks(limitNum, period as string)
    return successResponse(res, topBookmarks)
  } catch (error) {
    console.error('获取热门书签失败:', error)
    return errorResponse(res, '获取热门书签失败')
  }
})

// 获取访问趋势
router.get('/trend', authMiddleware, (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query
    const dayCount = parseInt(days as string) || 7

    const trends = getVisitTrend(dayCount)
    return successResponse(res, trends)
  } catch (error) {
    console.error('获取访问趋势失败:', error)
    return errorResponse(res, '获取访问趋势失败')
  }
})

// 获取最近访问记录
router.get('/recent', authMiddleware, (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query
    const limitNum = parseInt(limit as string) || 20

    const recentVisits = getRecentVisits(limitNum)
    return successResponse(res, recentVisits)
  } catch (error) {
    console.error('获取最近访问记录失败:', error)
    return errorResponse(res, '获取最近访问记录失败')
  }
})

// 获取单个书签的统计
router.get('/stats/:bookmarkId', authMiddleware, (req: Request, res: Response) => {
  try {
    const bookmarkId = req.params.bookmarkId as string
    const stats = getBookmarkStats(bookmarkId)

    if (!stats) {
      return errorResponse(res, '获取书签统计失败', 500)
    }

    return successResponse(res, stats)
  } catch (error) {
    console.error('获取书签统计失败:', error)
    return errorResponse(res, '获取书签统计失败')
  }
})

// 获取分类使用统计
router.get('/category-stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const { period = 'all' } = req.query
    const stats = getCategoryStats(period as string)
    return successResponse(res, stats)
  } catch (error) {
    console.error('获取分类统计失败:', error)
    return errorResponse(res, '获取分类统计失败')
  }
})

// 获取分类趋势（按天统计）
router.get('/category-trend/:categoryId', authMiddleware, (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string
    const { days = 7 } = req.query
    const dayCount = parseInt(days as string) || 7

    const trends = getCategoryTrend(categoryId, dayCount)
    return successResponse(res, trends)
  } catch (error) {
    console.error('获取分类趋势失败:', error)
    return errorResponse(res, '获取分类趋势失败')
  }
})

// 获取访问记录列表（前端需要的端点）
router.get('/records', authMiddleware, (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query
    const limitNum = parseInt(limit as string) || 100

    const records = getVisitRecords(limitNum)
    return successResponse(res, records)
  } catch (error) {
    console.error('获取访问记录失败:', error)
    return errorResponse(res, '获取访问记录失败')
  }
})

// 获取热门书签排行（前端需要的端点）
router.get('/top-bookmarks', authMiddleware, (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query
    const limitNum = parseInt(limit as string) || 20

    const topBookmarks = getPopularBookmarks(limitNum)
    return successResponse(res, topBookmarks)
  } catch (error) {
    console.error('获取热门书签失败:', error)
    return errorResponse(res, '获取热门书签失败')
  }
})

// 获取访问时间线（前端需要的端点）
router.get('/timeline', authMiddleware, (req: Request, res: Response) => {
  try {
    const { range = 'week' } = req.query

    let days = 7
    if (range === 'today') days = 1
    else if (range === 'week') days = 7
    else if (range === 'month') days = 30
    else if (range === 'year') days = 365

    const timeline = getVisitTimeline(days)
    return successResponse(res, timeline)
  } catch (error) {
    console.error('获取访问时间线失败:', error)
    return errorResponse(res, '获取访问时间线失败')
  }
})

// 获取统计数据
router.get('/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const stats = getVisitStatsSummary()
    return successResponse(res, stats)
  } catch (error) {
    console.error('获取访问统计失败:', error)
    return errorResponse(res, '获取访问统计失败')
  }
})

// 清除所有访问记录（需要管理员权限）
router.delete('/clear', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { deletedCount } = clearAllVisits()

    return successResponse(res, {
      cleared: true,
      deletedCount,
      message: `已清除 ${deletedCount} 条访问记录`
    })
  } catch (error) {
    console.error('清除访问记录失败:', error)
    return errorResponse(res, '清除访问记录失败')
  }
})

export default router
