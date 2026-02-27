/**
 * 分享路由 - V2版本
 * 提供内容分享功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 创建分享
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { type, resourceId, expiresIn } = req.body
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    return successResponse(res, { 
      id: 'temp-id', 
      shareCode, 
      type, 
      resourceId,
      expiresAt: Date.now() + (expiresIn || 86400) * 1000 
    })
  } catch (error) {
    console.error('创建分享失败:', error)
    return errorResponse(res, '创建分享失败')
  }
})

// 获取分享内容
router.get('/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params
    return successResponse(res, { code, content: null })
  } catch (error) {
    console.error('获取分享失败:', error)
    return errorResponse(res, '获取分享失败')
  }
})

export default router
