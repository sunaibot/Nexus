/**
 * 自定义指标路由模块
 * 提供自定义监控指标管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import {
  createCustomMetric,
  getCustomMetricsByUser,
  getCustomMetric,
  updateCustomMetric,
  deleteCustomMetric,
  addCustomMetricHistory,
  getCustomMetricHistory,
  type CustomMetric
} from '../../../../db/index.js'

const router = Router()

// 获取自定义指标列表
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { activeOnly } = req.query
    const metrics = getCustomMetricsByUser(user.id, activeOnly === 'true')
    return successResponse(res, metrics)
  } catch (error) {
    console.error('获取自定义指标失败:', error)
    return errorResponse(res, '获取自定义指标失败')
  }
})

// 创建自定义指标
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, type, script, unit } = req.body

    if (!name || !type || !script) {
      return errorResponse(res, '缺少必要字段: name, type, script', 400)
    }

    const id = createCustomMetric(user.id, name, type, script, unit)
    if (!id) {
      return errorResponse(res, '创建自定义指标失败', 500)
    }

    const metric = getCustomMetric(id)
    return successResponse(res, metric)
  } catch (error) {
    console.error('添加自定义指标失败:', error)
    return errorResponse(res, '添加自定义指标失败')
  }
})

// 获取单个自定义指标
router.get('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const metric = getCustomMetric(id)

    if (!metric) {
      return errorResponse(res, '自定义指标不存在', 404)
    }

    return successResponse(res, metric)
  } catch (error) {
    console.error('获取自定义指标失败:', error)
    return errorResponse(res, '获取自定义指标失败')
  }
})

// 更新自定义指标
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, type, script, unit, active } = req.body

    const existing = getCustomMetric(id)
    if (!existing) {
      return errorResponse(res, '自定义指标不存在', 404)
    }

    const updates: Partial<CustomMetric> = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) updates.type = type
    if (script !== undefined) updates.script = script
    if (unit !== undefined) updates.unit = unit
    if (active !== undefined) updates.active = active

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }

    const success = updateCustomMetric(id, updates)
    if (!success) {
      return errorResponse(res, '更新自定义指标失败', 500)
    }

    const metric = getCustomMetric(id)
    return successResponse(res, metric)
  } catch (error) {
    console.error('更新自定义指标失败:', error)
    return errorResponse(res, '更新自定义指标失败')
  }
})

// 删除自定义指标
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const existing = getCustomMetric(id)
    if (!existing) {
      return errorResponse(res, '自定义指标不存在', 404)
    }

    const success = deleteCustomMetric(id)
    if (!success) {
      return errorResponse(res, '删除自定义指标失败', 500)
    }

    return successResponse(res, { id })
  } catch (error) {
    console.error('删除自定义指标失败:', error)
    return errorResponse(res, '删除自定义指标失败')
  }
})

// 获取指标历史数据
router.get('/:id/history', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const limit = parseInt(req.query.limit as string) || 100

    const existing = getCustomMetric(id)
    if (!existing) {
      return errorResponse(res, '自定义指标不存在', 404)
    }

    const history = getCustomMetricHistory(id, limit)
    return successResponse(res, history)
  } catch (error) {
    console.error('获取指标历史失败:', error)
    return errorResponse(res, '获取指标历史失败')
  }
})

// 添加指标历史记录
router.post('/:id/history', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { value } = req.body

    if (value === undefined) {
      return errorResponse(res, '缺少 value 字段', 400)
    }

    const existing = getCustomMetric(id)
    if (!existing) {
      return errorResponse(res, '自定义指标不存在', 404)
    }

    const historyId = addCustomMetricHistory(id, value)
    if (!historyId) {
      return errorResponse(res, '添加历史记录失败', 500)
    }

    return successResponse(res, { id: historyId, metricId: id, value })
  } catch (error) {
    console.error('添加指标历史失败:', error)
    return errorResponse(res, '添加指标历史失败')
  }
})

export default router
