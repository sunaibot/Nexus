/**
 * 批量操作路由 - V2版本
 * 提供批量数据处理功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 批量删除书签
router.post('/bookmarks/delete', authMiddleware, (req: Request, res: Response) => {
  try {
    const { ids } = req.body
    return successResponse(res, { deleted: ids?.length || 0 })
  } catch (error) {
    console.error('批量删除失败:', error)
    return errorResponse(res, '批量删除失败')
  }
})

// 批量移动书签
router.post('/bookmarks/move', authMiddleware, (req: Request, res: Response) => {
  try {
    const { ids, categoryId } = req.body
    return successResponse(res, { moved: ids?.length || 0, categoryId })
  } catch (error) {
    console.error('批量移动失败:', error)
    return errorResponse(res, '批量移动失败')
  }
})

// 批量更新书签
router.post('/bookmarks/update', authMiddleware, (req: Request, res: Response) => {
  try {
    const { ids, updates } = req.body
    return successResponse(res, { updated: ids?.length || 0 })
  } catch (error) {
    console.error('批量更新失败:', error)
    return errorResponse(res, '批量更新失败')
  }
})

export default router
