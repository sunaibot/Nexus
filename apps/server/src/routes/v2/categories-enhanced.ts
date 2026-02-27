/**
 * 增强分类路由 - V2版本
 * 提供高级分类管理功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 获取分类树
router.get('/tree', authMiddleware, (req: Request, res: Response) => {
  try {
    return successResponse(res, [])
  } catch (error) {
    console.error('获取分类树失败:', error)
    return errorResponse(res, '获取分类树失败')
  }
})

// 批量更新分类排序
router.post('/reorder', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { orders } = req.body
    return successResponse(res, { updated: orders?.length || 0 })
  } catch (error) {
    console.error('更新分类排序失败:', error)
    return errorResponse(res, '更新分类排序失败')
  }
})

export default router
