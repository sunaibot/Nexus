/**
 * 私密模式路由 - V2版本
 * 提供私密书签访问验证
 */

import { Router, Request, Response } from 'express'
import { privateBookmarkRoutes } from '../../features/private-bookmark/index.js'

const router = Router()

// 使用features中的私密书签路由
router.use('/', privateBookmarkRoutes)

export default router
