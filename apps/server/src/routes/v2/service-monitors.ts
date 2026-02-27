/**
 * 服务监控路由 - V2版本
 * 提供外部服务状态监控
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 获取监控服务列表
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    return successResponse(res, [])
  } catch (error) {
    console.error('获取监控服务列表失败:', error)
    return errorResponse(res, '获取监控服务列表失败')
  }
})

// 添加监控服务
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { name, url, interval } = req.body
    return successResponse(res, { id: 'temp-id', name, url, interval })
  } catch (error) {
    console.error('添加监控服务失败:', error)
    return errorResponse(res, '添加监控服务失败')
  }
})

// 检查服务状态
router.get('/:id/check', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    return successResponse(res, { id, status: 'unknown', responseTime: 0 })
  } catch (error) {
    console.error('检查服务状态失败:', error)
    return errorResponse(res, '检查服务状态失败')
  }
})

export default router
