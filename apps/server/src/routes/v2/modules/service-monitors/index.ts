/**
 * 服务监控路由模块
 * 提供外部服务状态监控
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import {
  createServiceMonitor,
  getServiceMonitorsByUser,
  getServiceMonitorById,
  updateServiceMonitor,
  deleteServiceMonitor,
  type ServiceMonitor
} from '../../../../db/index.js'

const router = Router()

// 获取监控服务列表
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const monitors = getServiceMonitorsByUser(user.id)
    return successResponse(res, monitors)
  } catch (error) {
    console.error('获取监控服务列表失败:', error)
    return errorResponse(res, '获取监控服务列表失败')
  }
})

// 添加监控服务
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, url, method, expectedStatus, checkInterval, timeout } = req.body

    const id = createServiceMonitor(
      user.id,
      name,
      url,
      method,
      expectedStatus,
      checkInterval,
      timeout
    )

    if (!id) {
      return errorResponse(res, '创建监控服务失败', 500)
    }

    const monitor = getServiceMonitorById(id)
    return successResponse(res, monitor)
  } catch (error) {
    console.error('添加监控服务失败:', error)
    return errorResponse(res, '添加监控服务失败')
  }
})

// 获取单个监控服务
router.get('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const monitor = getServiceMonitorById(id)

    if (!monitor) {
      return errorResponse(res, '监控服务不存在', 404)
    }

    return successResponse(res, monitor)
  } catch (error) {
    console.error('获取监控服务失败:', error)
    return errorResponse(res, '获取监控服务失败')
  }
})

// 更新监控服务
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, url, type, active } = req.body

    const existing = getServiceMonitorById(id)
    if (!existing) {
      return errorResponse(res, '监控服务不存在', 404)
    }

    const updates: Partial<ServiceMonitor> = {}
    if (name !== undefined) updates.name = name
    if (url !== undefined) updates.url = url
    if (type !== undefined) updates.type = type
    if (active !== undefined) updates.active = active

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }

    const success = updateServiceMonitor(id, updates)
    if (!success) {
      return errorResponse(res, '更新监控服务失败', 500)
    }

    const monitor = getServiceMonitorById(id)
    return successResponse(res, monitor)
  } catch (error) {
    console.error('更新监控服务失败:', error)
    return errorResponse(res, '更新监控服务失败')
  }
})

// 删除监控服务
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const existing = getServiceMonitorById(id)
    if (!existing) {
      return errorResponse(res, '监控服务不存在', 404)
    }

    const success = deleteServiceMonitor(id)
    if (!success) {
      return errorResponse(res, '删除监控服务失败', 500)
    }

    return successResponse(res, { id })
  } catch (error) {
    console.error('删除监控服务失败:', error)
    return errorResponse(res, '删除监控服务失败')
  }
})

// 检查服务状态
router.get('/:id/check', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const monitor = getServiceMonitorById(id)
    if (!monitor) {
      return errorResponse(res, '监控服务不存在', 404)
    }

    // 简单的健康检查
    const startTime = Date.now()
    try {
      const response = await fetch(monitor.url, {
        method: monitor.method || 'GET',
        signal: AbortSignal.timeout((monitor.timeout || 30) * 1000)
      })
      const responseTime = Date.now() - startTime
      const status = response.ok ? 'up' : 'down'

      return successResponse(res, {
        id,
        status,
        responseTime,
        statusCode: response.status,
        checkedAt: new Date().toISOString()
      })
    } catch (error) {
      return successResponse(res, {
        id,
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误',
        checkedAt: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('检查服务状态失败:', error)
    return errorResponse(res, '检查服务状态失败')
  }
})

export default router
