/**
 * 名言路由 - V2版本
 * 提供名言警句管理
 */

import { Router, Request, Response } from 'express'
import { optionalAuthMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 获取随机名言
router.get('/random', (req: Request, res: Response) => {
  try {
    const quotes = [
      { text: '学而时习之，不亦说乎', author: '孔子' },
      { text: '知识就是力量', author: '培根' },
      { text: '千里之行，始于足下', author: '老子' },
    ]
    const random = quotes[Math.floor(Math.random() * quotes.length)]
    return successResponse(res, random)
  } catch (error) {
    console.error('获取名言失败:', error)
    return errorResponse(res, '获取名言失败')
  }
})

// 获取名言列表
router.get('/', optionalAuthMiddleware, (req: Request, res: Response) => {
  try {
    return successResponse(res, [])
  } catch (error) {
    console.error('获取名言列表失败:', error)
    return errorResponse(res, '获取名言列表失败')
  }
})

export default router
