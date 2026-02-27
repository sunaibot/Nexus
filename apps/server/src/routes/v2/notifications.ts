/**
 * 通知路由 - V2版本
 * 提供通知管理和推送功能
 */

import { Router } from 'express'
import notificationRoutes from '../../features/notification/routes.js'

const router = Router()

// 使用features中的通知路由
router.use('/', notificationRoutes)

export default router
