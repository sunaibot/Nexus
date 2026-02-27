/**
 * 自定义指标路由 - V2版本
 * 提供自定义监控指标
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 获取自定义指标
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    return successResponse(res, [])
  } catch (error) {
    console.error('获取自定义指标失败:', error)
    return errorResponse(res, '获取自定义指标失败')
  }
})

// 添加自定义指标
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { name, query, type } = req.body
    return successResponse(res, { id: 'temp-id', name, query, type })
  } catch (error) {
    console.error('添加自定义指标失败:', error)
    return errorResponse(res, '添加自定义指标失败')
  }
})

export default router
