/**
 * 文件传输路由 - V2版本
 * 提供文件上传、下载和传输管理
 */

import { Router } from 'express'
import { fileTransferRoutes } from '../../features/file-transfer/index.js'

const router = Router()

// 使用features中的文件传输路由
router.use('/', fileTransferRoutes)

export default router
