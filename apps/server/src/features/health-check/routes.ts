/**
 * 链接检测路由模块
 * 复用现有 health-check 路由，增加智能检测和故障自愈
 */

import { Router } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { healthCheckService } from './service.js'
import { CheckStrategy } from './types.js'
import { queryAll } from '../../utils/index.js'

const router = Router()

/**
 * 批量检测书签链接
 * POST /api/v2/health-check/batch
 */
router.post('/health-check/batch', authMiddleware, async (req, res) => {
  try {
    const { bookmarkIds, strategy = CheckStrategy.HEAD, timeout = 10000 } = req.body

    // 获取书签信息
    let query = 'SELECT id, url, title, favicon, icon, iconUrl, category FROM bookmarks WHERE 1=1'
    const params: any[] = []

    if (bookmarkIds && bookmarkIds.length > 0) {
      query += ` AND id IN (${bookmarkIds.map(() => '?').join(',')})`
      params.push(...bookmarkIds)
    }

    const bookmarks = queryAll(query, params)

    if (!bookmarks || bookmarks.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          success: 0,
          failed: 0,
          timeout: 0,
          redirect: 0,
          results: []
        }
      })
    }

    // 批量检测
    const results = await healthCheckService.batchCheck(
      bookmarks.map((b: any) => ({
        id: b.id,
        url: b.url,
        title: b.title,
        favicon: b.favicon,
        icon: b.icon,
        iconUrl: b.iconUrl,
        category: b.category,
      })),
      { strategy, timeout }
    )

    // 统计
    const stats = healthCheckService.getStats(results)

    res.json({
      success: true,
      data: {
        total: stats.total,
        success: stats.healthy,
        failed: results.filter(r => r.status === 'error').length,
        timeout: results.filter(r => r.status === 'timeout').length,
        redirect: results.filter(r => r.status === 'redirect').length,
        averageResponseTime: stats.averageResponseTime,
        results
      }
    })
  } catch (error) {
    console.error('批量检测失败:', error)
    res.status(500).json({
      success: false,
      error: '批量检测失败'
    })
  }
})

/**
 * 智能检测单个链接
 * POST /api/v2/health-check/smart
 */
router.post('/health-check/smart', authMiddleware, async (req, res) => {
  try {
    const { url, history } = req.body

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL不能为空'
      })
    }

    const result = await healthCheckService.smartCheck(url, history)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('智能检测失败:', error)
    res.status(500).json({
      success: false,
      error: '智能检测失败'
    })
  }
})

/**
 * 故障自愈检测
 * POST /api/v2/health-check/heal
 */
router.post('/health-check/heal', authMiddleware, async (req, res) => {
  try {
    const { bookmarkId, healUrl } = req.body

    // 获取书签信息
    const bookmark = queryAll(
      'SELECT id, url, title FROM bookmarks WHERE id = ?',
      [bookmarkId]
    )[0]

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: '书签不存在'
      })
    }

    const result = await healthCheckService.checkWithHeal(
      {
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
      },
      {
        enabled: !!healUrl,
        healUrl,
        notifyOnHeal: true,
      }
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('故障自愈检测失败:', error)
    res.status(500).json({
      success: false,
      error: '故障自愈检测失败'
    })
  }
})

/**
 * 获取检测统计
 * GET /api/v2/health-check/stats
 */
router.get('/health-check/stats', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query

    let query = 'SELECT id, url, title, favicon, icon, iconUrl, category FROM bookmarks WHERE 1=1'
    const params: any[] = []

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    const bookmarks = queryAll(query, params)

    if (!bookmarks || bookmarks.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          unknown: 0,
          averageResponseTime: 0,
        }
      })
    }

    // 批量检测
    const results = await healthCheckService.batchCheck(
      bookmarks.map((b: any) => ({
        id: b.id,
        url: b.url,
        title: b.title,
        favicon: b.favicon,
        icon: b.icon,
        iconUrl: b.iconUrl,
        category: b.category,
      })),
      { strategy: CheckStrategy.HEAD, timeout: 5000 }
    )

    const stats = healthCheckService.getStats(results)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({
      success: false,
      error: '获取统计失败'
    })
  }
})

/**
 * 清除检测缓存
 * POST /api/v2/health-check/clear-cache
 */
router.post('/health-check/clear-cache', authMiddleware, async (req, res) => {
  try {
    healthCheckService.clearCache()
    res.json({ success: true })
  } catch (error) {
    console.error('清除缓存失败:', error)
    res.status(500).json({
      success: false,
      error: '清除缓存失败'
    })
  }
})

export default router
