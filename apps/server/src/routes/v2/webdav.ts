/**
 * WebDAV路由 - V2版本
 * 提供WebDAV协议支持
 */

import { Router } from 'express'
import webDAVRoutes from '../../features/webdav/routes.js'

const router = Router()

// 使用features中的WebDAV路由
router.use('/', webDAVRoutes)

export default router
