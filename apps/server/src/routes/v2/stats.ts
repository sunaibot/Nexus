/**
 * 数据统计分析 API
 * 提供访问统计、书签点击热力图、分类使用统计等功能
 */

import { Router } from 'express'
import { authMiddleware, adminMiddleware, requirePermission, Permission } from '../../middleware/index.js'
import { queryAll, queryOne } from '../../utils/index.js'
import { asyncHandler, successResponse, errorResponse, getPaginationParams } from '../utils/index.js'
import { ErrorCode, AppError } from '../../types/error-codes.js'

const router = Router()

// ========== 访问统计 ==========

/**
 * 获取访问统计概览
 * GET /api/v2/stats/overview
 */
router.get('/overview',
  authMiddleware,
  requirePermission(Permission.STATS_VIEW),
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'

    // 总访问量 (PV)
    const pvResult = queryOne(`
      SELECT COUNT(*) as total FROM visits
      ${isAdmin ? '' : 'WHERE userId = ?'}
    `, isAdmin ? [] : [user.id])

    // 独立访客 (UV) - 按 IP 去重
    const uvResult = queryOne(`
      SELECT COUNT(DISTINCT ip) as total FROM visits
      ${isAdmin ? '' : 'WHERE userId = ?'}
    `, isAdmin ? [] : [user.id])

    // 今日访问
    const today = new Date().toISOString().split('T')[0]
    const todayResult = queryOne(`
      SELECT COUNT(*) as total FROM visits
      WHERE visitedAt >= ?
      ${isAdmin ? '' : 'AND userId = ?'}
    `, isAdmin ? [`${today}T00:00:00.000Z`] : [`${today}T00:00:00.000Z`, user.id])

    // 书签总数
    const bookmarkCount = queryOne(`
      SELECT COUNT(*) as total FROM bookmarks
      ${isAdmin ? '' : 'WHERE userId = ?'}
    `, isAdmin ? [] : [user.id])

    // 分类总数
    const categoryCount = queryOne(`
      SELECT COUNT(*) as total FROM categories
      ${isAdmin ? '' : 'WHERE userId = ?'}
    `, isAdmin ? [] : [user.id])

    return successResponse(res, {
      pv: pvResult?.total || 0,
      uv: uvResult?.total || 0,
      today: todayResult?.total || 0,
      bookmarks: bookmarkCount?.total || 0,
      categories: categoryCount?.total || 0,
    })
  })
)

/**
 * 获取访问趋势（按日期）
 * GET /api/v2/stats/trends
 */
router.get('/trends',
  authMiddleware,
  requirePermission(Permission.STATS_VIEW),
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'
    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30))

    const trends = queryAll(`
      SELECT 
        date(visitedAt) as date,
        COUNT(*) as pv,
        COUNT(DISTINCT ip) as uv
      FROM visits
      WHERE visitedAt >= date('now', '-${days} days')
      ${isAdmin ? '' : 'AND userId = ?'}
      GROUP BY date(visitedAt)
      ORDER BY date ASC
    `, isAdmin ? [] : [user.id])

    return successResponse(res, trends)
  })
)

/**
 * 获取热门书签排行
 * GET /api/v2/stats/popular-bookmarks
 */
router.get('/popular-bookmarks',
  authMiddleware,
  requirePermission(Permission.STATS_VIEW),
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'
    const { pageSize } = getPaginationParams(req)
    const limit = Math.min(50, pageSize)

    const bookmarks = queryAll(`
      SELECT 
        b.id,
        b.title,
        b.url,
        b.category,
        COUNT(v.id) as visitCount,
        COUNT(DISTINCT v.ip) as uniqueVisitors
      FROM bookmarks b
      LEFT JOIN visits v ON b.id = v.bookmarkId
      ${isAdmin ? '' : 'WHERE b.userId = ?'}
      GROUP BY b.id
      ORDER BY visitCount DESC
      LIMIT ?
    `, isAdmin ? [limit] : [user.id, limit])

    return successResponse(res, bookmarks)
  })
)

// ========== 书签点击热力图 ==========

/**
 * 获取书签点击热力图数据
 * GET /api/v2/stats/heatmap
 */
router.get('/heatmap',
  authMiddleware,
  requirePermission(Permission.STATS_VIEW),
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'
    const days = Math.min(365, Math.max(7, parseInt(req.query.days as string) || 30))

    // 按小时统计点击分布
    const hourlyData = queryAll(`
      SELECT 
        strftime('%H', visitedAt) as hour,
        COUNT(*) as count
      FROM visits
      WHERE visitedAt >= date('now', '-${days} days')
      ${isAdmin ? '' : 'AND userId = ?'}
      GROUP BY strftime('%H', visitedAt)
      ORDER BY hour ASC
    `, isAdmin ? [] : [user.id])

    // 按星期统计点击分布
    const weekdayData = queryAll(`
      SELECT 
        CASE strftime('%w', visitedAt)
          WHEN '0' THEN '周日'
          WHEN '1' THEN '周一'
          WHEN '2' THEN '周二'
          WHEN '3' THEN '周三'
          WHEN '4' THEN '周四'
          WHEN '5' THEN '周五'
          WHEN '6' THEN '周六'
        END as weekday,
        strftime('%w', visitedAt) as weekdayNum,
        COUNT(*) as count
      FROM visits
      WHERE visitedAt >= date('now', '-${days} days')
      ${isAdmin ? '' : 'AND userId = ?'}
      GROUP BY strftime('%w', visitedAt)
      ORDER BY weekdayNum ASC
    `, isAdmin ? [] : [user.id])

    // 按分类统计点击分布
    const categoryData = queryAll(`
      SELECT 
        COALESCE(c.name, '未分类') as category,
        COUNT(v.id) as count
      FROM visits v
      LEFT JOIN bookmarks b ON v.bookmarkId = b.id
      LEFT JOIN categories c ON b.category = c.id
      WHERE v.visitedAt >= date('now', '-${days} days')
      ${isAdmin ? '' : 'AND v.userId = ?'}
      GROUP BY b.category
      ORDER BY count DESC
    `, isAdmin ? [] : [user.id])

    return successResponse(res, {
      hourly: hourlyData,
      weekday: weekdayData,
      category: categoryData,
    })
  })
)

// ========== 分类使用统计 ==========

/**
 * 获取分类使用统计
 * GET /api/v2/stats/categories
 */
router.get('/categories',
  authMiddleware,
  requirePermission(Permission.STATS_VIEW),
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'

    const stats = queryAll(`
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        COUNT(DISTINCT b.id) as bookmarkCount,
        COUNT(v.id) as visitCount,
        COALESCE(SUM(b.visitCount), 0) as totalVisits
      FROM categories c
      LEFT JOIN bookmarks b ON c.id = b.category
      LEFT JOIN visits v ON b.id = v.bookmarkId
      ${isAdmin ? '' : 'WHERE c.userId = ?'}
      GROUP BY c.id
      ORDER BY bookmarkCount DESC, visitCount DESC
    `, isAdmin ? [] : [user.id])

    return successResponse(res, stats)
  })
)

// ========== 用户活跃度统计（仅管理员） ==========

/**
 * 获取用户活跃度统计
 * GET /api/v2/stats/user-activity
 */
router.get('/user-activity',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30))

    const activeUsers = queryAll(`
      SELECT 
        u.id,
        u.username,
        u.role,
        COUNT(DISTINCT v.id) as visitCount,
        COUNT(DISTINCT b.id) as bookmarkCount,
        MAX(v.visitedAt) as lastActive
      FROM users u
      LEFT JOIN visits v ON u.id = v.userId AND v.visitedAt >= date('now', '-${days} days')
      LEFT JOIN bookmarks b ON u.id = b.userId
      GROUP BY u.id
      ORDER BY visitCount DESC
    `)

    return successResponse(res, activeUsers)
  })
)

// ========== 停留时长统计 ==========

/**
 * 获取停留时长统计
 * GET /api/v2/stats/duration
 */
router.get('/duration',
  authMiddleware,
  requirePermission(Permission.STATS_VIEW),
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'
    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30))

    // 由于 SQLite 无法直接计算停留时长，这里返回访问频率统计
    const frequency = queryAll(`
      SELECT 
        date(visitedAt) as date,
        COUNT(*) as visits,
        COUNT(DISTINCT ip) as uniqueVisitors,
        ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT ip), 2) as avgVisitsPerUser
      FROM visits
      WHERE visitedAt >= date('now', '-${days} days')
      ${isAdmin ? '' : 'AND userId = ?'}
      GROUP BY date(visitedAt)
      ORDER BY date ASC
    `, isAdmin ? [] : [user.id])

    return successResponse(res, {
      frequency,
      note: '停留时长需要前端配合上报数据',
    })
  })
)

// ========== 导出统计报告 ==========

/**
 * 导出统计报告
 * POST /api/v2/stats/export
 */
router.post('/export',
  authMiddleware,
  requirePermission(Permission.STATS_EXPORT),
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'
    const { format = 'json', startDate, endDate } = req.body

    // 构建时间范围条件
    let dateCondition = ''
    const params: any[] = []

    if (startDate) {
      dateCondition += ' AND visitedAt >= ?'
      params.push(startDate)
    }
    if (endDate) {
      dateCondition += ' AND visitedAt <= ?'
      params.push(endDate)
    }

    if (!isAdmin) {
      dateCondition += ' AND userId = ?'
      params.push(user.id)
    }

    // 获取详细访问记录
    const visits = queryAll(`
      SELECT 
        v.id,
        v.visitedAt,
        v.ip,
        v.userAgent,
        b.title as bookmarkTitle,
        b.url as bookmarkUrl,
        c.name as categoryName
      FROM visits v
      LEFT JOIN bookmarks b ON v.bookmarkId = b.id
      LEFT JOIN categories c ON b.category = c.id
      WHERE 1=1 ${dateCondition}
      ORDER BY v.visitedAt DESC
    `, params)

    if (format === 'csv') {
      // 生成 CSV 格式
      const headers = ['ID', '访问时间', 'IP', 'UserAgent', '书签标题', '书签URL', '分类']
      const rows = visits.map((v: any) => [
        v.id,
        v.visitedAt,
        v.ip,
        v.userAgent,
        v.bookmarkTitle,
        v.bookmarkUrl,
        v.categoryName,
      ])

      const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="stats-export-${Date.now()}.csv"`)
      return res.send(csv)
    }

    // 默认 JSON 格式
    return successResponse(res, {
      exportTime: new Date().toISOString(),
      totalRecords: visits.length,
      data: visits,
    })
  })
)

export default router
