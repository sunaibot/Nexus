/**
 * 访问统计路由 - V2版本
 * 提供访问统计和数据分析
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 记录书签访问（公开接口）
router.post('/track', (req: Request, res: Response) => {
  try {
    const { bookmarkId, userId, userAgent } = req.body
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    
    if (!bookmarkId) {
      return errorResponse(res, '书签ID不能为空', 400)
    }

    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      'INSERT INTO visits (id, bookmarkId, userId, visitedAt, ip, userAgent) VALUES (?, ?, ?, ?, ?, ?)',
      [id, bookmarkId, userId || null, now, ip, userAgent || null]
    )
    
    // 更新书签访问计数
    run(
      'UPDATE bookmarks SET visitCount = COALESCE(visitCount, 0) + 1, lastVisitedAt = ? WHERE id = ?',
      [now, bookmarkId]
    )
    
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
    
    let dateFilter = ''
    const params: any[] = []
    
    if (period === 'day') {
      dateFilter = "WHERE v.visitedAt >= date('now', '-1 day')"
    } else if (period === 'week') {
      dateFilter = "WHERE v.visitedAt >= date('now', '-7 days')"
    } else if (period === 'month') {
      dateFilter = "WHERE v.visitedAt >= date('now', '-30 days')"
    }
    
    const topBookmarks = queryAll(
      `SELECT 
        b.id, b.title, b.url, b.category, b.favicon,
        COUNT(v.id) as visitCount,
        MAX(v.visitedAt) as lastVisitedAt
      FROM bookmarks b
      LEFT JOIN visits v ON b.id = v.bookmarkId ${dateFilter}
      GROUP BY b.id
      ORDER BY visitCount DESC
      LIMIT ?`,
      [...params, limitNum]
    )
    
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
    
    const trends = queryAll(
      `SELECT 
        date(visitedAt) as date,
        COUNT(*) as count
      FROM visits
      WHERE visitedAt >= date('now', '-' || ? || ' days')
      GROUP BY date(visitedAt)
      ORDER BY date ASC`,
      [dayCount]
    )
    
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
    
    const recentVisits = queryAll(
      `SELECT 
        v.*,
        b.title as bookmarkTitle,
        b.url as bookmarkUrl
      FROM visits v
      LEFT JOIN bookmarks b ON v.bookmarkId = b.id
      ORDER BY v.visitedAt DESC
      LIMIT ?`,
      [parseInt(limit as string) || 20]
    )
    
    return successResponse(res, recentVisits)
  } catch (error) {
    console.error('获取最近访问记录失败:', error)
    return errorResponse(res, '获取最近访问记录失败')
  }
})

// 获取单个书签的统计
router.get('/stats/:bookmarkId', authMiddleware, (req: Request, res: Response) => {
  try {
    const bookmarkId = Array.isArray(req.params.bookmarkId) ? req.params.bookmarkId[0] : req.params.bookmarkId
    
    // 总访问次数
    const totalVisits = queryOne(
      'SELECT COUNT(*) as count FROM visits WHERE bookmarkId = ?',
      [bookmarkId]
    ) as { count: number }
    
    // 独立访客数
    const uniqueVisitors = queryOne(
      'SELECT COUNT(DISTINCT COALESCE(userId, ip)) as count FROM visits WHERE bookmarkId = ?',
      [bookmarkId]
    ) as { count: number }
    
    // 今日访问次数
    const today = new Date().toISOString().split('T')[0]
    const todayVisits = queryOne(
      'SELECT COUNT(*) as count FROM visits WHERE bookmarkId = ? AND date(visitedAt) = date(?)',
      [bookmarkId, today]
    ) as { count: number }
    
    // 最近访问记录
    const recentVisits = queryAll(
      `SELECT * FROM visits 
       WHERE bookmarkId = ? 
       ORDER BY visitedAt DESC 
       LIMIT 10`,
      [bookmarkId]
    )
    
    return successResponse(res, {
      bookmarkId,
      totalVisits: totalVisits?.count || 0,
      uniqueVisitors: uniqueVisitors?.count || 0,
      todayVisits: todayVisits?.count || 0,
      recentVisits
    })
  } catch (error) {
    console.error('获取书签统计失败:', error)
    return errorResponse(res, '获取书签统计失败')
  }
})

// 获取分类使用统计
router.get('/category-stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const { period = 'all' } = req.query
    
    let dateFilter = ''
    const params: any[] = []
    
    if (period === 'day') {
      dateFilter = "WHERE v.visitedAt >= date('now', '-1 day')"
    } else if (period === 'week') {
      dateFilter = "WHERE v.visitedAt >= date('now', '-7 days')"
    } else if (period === 'month') {
      dateFilter = "WHERE v.visitedAt >= date('now', '-30 days')"
    }
    
    // 分类访问统计
    const categoryStats = queryAll(
      `SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        COUNT(v.id) as visitCount,
        COUNT(DISTINCT b.id) as bookmarkCount,
        COUNT(DISTINCT COALESCE(v.userId, v.ip)) as uniqueVisitors,
        MAX(v.visitedAt) as lastVisitedAt
      FROM categories c
      LEFT JOIN bookmarks b ON c.id = b.category
      LEFT JOIN visits v ON b.id = v.bookmarkId ${dateFilter}
      GROUP BY c.id
      ORDER BY visitCount DESC`
    )
    
    // 计算总访问量
    const totalVisits = categoryStats.reduce((sum, cat) => sum + (cat.visitCount || 0), 0)
    
    // 添加百分比
    const statsWithPercent = categoryStats.map(cat => ({
      ...cat,
      percentage: totalVisits > 0 ? Math.round((cat.visitCount / totalVisits) * 100) : 0
    }))
    
    return successResponse(res, {
      totalVisits,
      categories: statsWithPercent,
      period
    })
  } catch (error) {
    console.error('获取分类统计失败:', error)
    return errorResponse(res, '获取分类统计失败')
  }
})

// 获取分类趋势（按天统计）
router.get('/category-trend/:categoryId', authMiddleware, (req: Request, res: Response) => {
  try {
    const categoryId = Array.isArray(req.params.categoryId) ? req.params.categoryId[0] : req.params.categoryId
    const { days = 7 } = req.query
    const dayCount = parseInt(days as string) || 7
    
    const trends = queryAll(
      `SELECT 
        date(v.visitedAt) as date,
        COUNT(*) as count,
        COUNT(DISTINCT b.id) as bookmarkCount
      FROM visits v
      JOIN bookmarks b ON v.bookmarkId = b.id
      WHERE b.category = ?
        AND v.visitedAt >= date('now', '-' || ? || ' days')
      GROUP BY date(v.visitedAt)
      ORDER BY date ASC`,
      [categoryId, dayCount]
    )
    
    return successResponse(res, trends)
  } catch (error) {
    console.error('获取分类趋势失败:', error)
    return errorResponse(res, '获取分类趋势失败')
  }
})

// 清除所有访问记录（需要管理员权限）
// 获取访问记录列表（前端需要的端点）
router.get('/records', authMiddleware, (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query
    const limitNum = parseInt(limit as string) || 100
    
    const records = queryAll(
      `SELECT 
        v.id,
        v.bookmarkId,
        b.title as bookmarkTitle,
        v.ip,
        v.userAgent,
        v.visitedAt
      FROM visits v
      LEFT JOIN bookmarks b ON v.bookmarkId = b.id
      ORDER BY v.visitedAt DESC
      LIMIT ?`,
      [limitNum]
    )
    
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
    
    const topBookmarks = queryAll(
      `SELECT 
        b.id,
        b.title,
        b.url,
        COALESCE(b.visitCount, 0) as visitCount,
        b.lastVisitedAt
      FROM bookmarks b
      WHERE b.visitCount > 0
      ORDER BY b.visitCount DESC
      LIMIT ?`,
      [limitNum]
    )
    
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
    
    const timeline = queryAll(
      `SELECT 
        date(visitedAt) as date,
        COUNT(*) as count
      FROM visits
      WHERE visitedAt >= date('now', '-' || ? || ' days')
      GROUP BY date(visitedAt)
      ORDER BY date ASC`,
      [days]
    )
    
    return successResponse(res, timeline)
  } catch (error) {
    console.error('获取访问时间线失败:', error)
    return errorResponse(res, '获取访问时间线失败')
  }
})

// 更新统计数据（添加更多统计字段）
router.get('/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    // 总访问量
    const totalVisits = queryOne('SELECT COUNT(*) as count FROM visits') as { count: number }
    
    // 独立访客数
    const uniqueVisitors = queryOne(
      'SELECT COUNT(DISTINCT COALESCE(userId, ip)) as count FROM visits'
    ) as { count: number }
    
    // 今日访问量
    const today = new Date().toISOString().split('T')[0]
    const todayVisits = queryOne(
      'SELECT COUNT(*) as count FROM visits WHERE date(visitedAt) = date(?)',
      [today]
    ) as { count: number }
    
    // 本周访问量
    const weekVisits = queryOne(
      "SELECT COUNT(*) as count FROM visits WHERE visitedAt >= date('now', '-7 days')"
    ) as { count: number }
    
    // 本月访问量
    const monthVisits = queryOne(
      "SELECT COUNT(*) as count FROM visits WHERE visitedAt >= date('now', '-30 days')"
    ) as { count: number }
    
    // 平均停留时间（ visits 表没有 duration 字段，返回 0）
    const avgDuration = 0
    
    // 跳出率（简化计算：单页访问占总访问的比例）
    const singleVisits = queryOne(
      `SELECT COUNT(*) as count FROM (
        SELECT ip, COUNT(*) as visitCount 
        FROM visits 
        GROUP BY ip 
        HAVING visitCount = 1
      )`
    ) as { count: number }
    
    const bounceRate = totalVisits?.count > 0 
      ? Math.round((singleVisits?.count || 0) / totalVisits.count * 100)
      : 0
    
    return successResponse(res, {
      totalVisits: totalVisits?.count || 0,
      uniqueVisitors: uniqueVisitors?.count || 0,
      todayVisits: todayVisits?.count || 0,
      weekVisits: weekVisits?.count || 0,
      monthVisits: monthVisits?.count || 0,
      avgDuration,
      bounceRate
    })
  } catch (error) {
    console.error('获取访问统计失败:', error)
    return errorResponse(res, '获取访问统计失败')
  }
})

router.delete('/clear', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    // 获取清除前的记录数
    const countResult = queryOne('SELECT COUNT(*) as count FROM visits') as { count: number }
    const deletedCount = countResult?.count || 0
    
    // 清空访问记录表
    run('DELETE FROM visits')
    
    // 重置所有书签的访问计数
    run('UPDATE bookmarks SET visitCount = 0, lastVisitedAt = NULL')
    
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
