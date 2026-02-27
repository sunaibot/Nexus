/**
 * 健康检查路由 - V2版本
 * 提供系统健康状态检查
 */

import { Router, Request, Response } from 'express'
import healthCheckRoutes from '../../features/health-check/routes.js'
import { successResponse } from '../utils/routeHelpers.js'

const router = Router()

// 根健康检查端点 - 用于前端健康检查
router.get('/', (req: Request, res: Response) => {
  return successResponse(res, {
    status: 'ok',
    version: 'v2',
    timestamp: new Date().toISOString()
  })
})

// 使用features中的健康检查路由
router.use('/', healthCheckRoutes)

export default router
