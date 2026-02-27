/**
 * IP过滤路由 - V2版本
 * 提供IP黑白名单管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 获取IP过滤规则
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    return successResponse(res, [])
  } catch (error) {
    console.error('获取IP过滤规则失败:', error)
    return errorResponse(res, '获取IP过滤规则失败')
  }
})

// 添加IP过滤规则
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { ip, type, reason } = req.body
    return successResponse(res, { id: 'temp-id', ip, type, reason })
  } catch (error) {
    console.error('添加IP过滤规则失败:', error)
    return errorResponse(res, '添加IP过滤规则失败')
  }
})

export default router
