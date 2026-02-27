/**
 * 文件快传路由模块
 * 复用现有路由逻辑，增加权限检查和新功能
 */

import { Router } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.js'
import { fileTransferService } from './service.js'
import { UserRole } from '../../core/permission/types.js'
import { requirePermission, requireRole } from '../../core/permission/checker.js'
import { ResourceType, PermissionAction } from '../../core/permission/types.js'

const router = Router()

/**
 * 上传文件 - 支持匿名和登录用户
 * POST /api/file-transfers/upload
 */
router.post('/upload', optionalAuthMiddleware, async (req, res) => {
  const user = (req as any).user
  const result = await fileTransferService.upload(
    req.body,
    user?.id,
    user?.role || UserRole.GUEST,
    req.ip || 'unknown'
  )

  if (result.success) {
    res.json({ success: true, data: result.data })
  } else {
    res.status(400).json({ success: false, error: result.error })
  }
})

/**
 * 下载文件 - 公开接口
 * GET /api/file-transfers/download/:extractCode
 */
router.get('/download/:extractCode', async (req, res) => {
  const { extractCode } = req.params
  const result = await fileTransferService.download(extractCode, req.ip || 'unknown')

  if (!result.success || !result.file) {
    return res.status(404).json({ success: false, error: result.error })
  }

  const file = result.file

  // 读取文件并返回
  try {
    const fs = await import('fs')
    const path = await import('path')
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const filePath = path.resolve(uploadsDir, file.filePath)
    
    // 安全检查：确保文件路径在允许目录内
    if (!filePath.startsWith(uploadsDir)) {
      console.error('[Security] Path traversal attempt:', file.filePath)
      return res.status(403).json({ success: false, error: '非法文件路径' })
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' })
    }

    // 设置下载头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`)
    res.setHeader('Content-Type', file.fileType)
    res.setHeader('Content-Length', file.fileSize)

    // 流式传输
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (error) {
    console.error('文件下载错误:', error)
    res.status(500).json({ success: false, error: '文件下载失败' })
  }
})

/**
 * 删除文件 - 需要登录
 * DELETE /api/file-transfers/:deleteCode
 */
router.delete('/:deleteCode', optionalAuthMiddleware, async (req, res) => {
  const user = (req as any).user
  const deleteCode = Array.isArray(req.params.deleteCode) ? req.params.deleteCode[0] : req.params.deleteCode
  const result = await fileTransferService.delete(
    deleteCode,
    user?.id ?? null,
    req.ip || 'unknown'
  )

  if (result.success) {
    res.json({ success: true })
  } else {
    res.status(403).json({ success: false, error: result.error })
  }
})

/**
 * 获取文件预览 - 公开接口
 * GET /api/file-transfers/:extractCode/preview
 */
router.get('/:extractCode/preview', async (req, res) => {
  const { extractCode } = req.params
  const result = await fileTransferService.download(extractCode, req.ip || 'unknown')

  if (!result.success || !result.file) {
    return res.status(404).json({ success: false, error: result.error })
  }

  const file = result.file
  const previewInfo = fileTransferService.getPreviewInfo(file)

  if (!previewInfo.canPreview) {
    return res.status(400).json({ success: false, error: '该文件类型不支持预览' })
  }

  try {
    const fs = await import('fs')
    const path = await import('path')
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const filePath = path.resolve(uploadsDir, file.filePath)
    
    // 安全检查：确保文件路径在允许目录内
    if (!filePath.startsWith(uploadsDir)) {
      console.error('[Security] Path traversal attempt:', file.filePath)
      return res.status(403).json({ success: false, error: '非法文件路径' })
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' })
    }

    // 根据预览类型设置响应头
    switch (previewInfo.previewType) {
      case 'image':
        res.setHeader('Content-Type', file.fileType)
        break
      case 'video':
        res.setHeader('Content-Type', file.fileType)
        break
      case 'audio':
        res.setHeader('Content-Type', file.fileType)
        break
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf')
        break
      case 'text':
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        break
    }

    // 流式传输
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (error) {
    console.error('文件预览错误:', error)
    res.status(500).json({ success: false, error: '文件预览失败' })
  }
})

/**
 * 获取当前用户的文件列表 - 需要登录
 * GET /api/file-transfers/my
 */
router.get('/my', authMiddleware, async (req, res) => {
  const user = (req as any).user
  const { fileTransferRepository } = await import('./repository.js')
  const files = await fileTransferRepository.findByUser(user.id)

  // 添加预览信息
  const filesWithPreview = files.map(file => ({
    ...file,
    preview: fileTransferService.getPreviewInfo(file),
  }))

  res.json({ success: true, data: filesWithPreview })
})

/**
 * 获取所有文件 - 需要管理员权限
 * GET /api/file-transfers/all
 */
router.get(
  '/all',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    const { fileTransferRepository } = await import('./repository.js')
    const files = await fileTransferRepository.findAll()

    res.json({ success: true, data: files })
  }
)

/**
 * 获取系统设置 - 需要登录
 * GET /api/file-transfers/settings
 */
router.get('/settings', authMiddleware, async (req, res) => {
  const { fileTransferRepository } = await import('./repository.js')
  const settings = await fileTransferRepository.getSettings()

  // 不返回管理密码
  if (settings) {
    const { adminPassword, ...safeSettings } = settings as any
    res.json({ success: true, data: safeSettings })
  } else {
    res.status(500).json({ success: false, error: '获取设置失败' })
  }
})

/**
 * 更新系统设置 - 需要管理员权限
 * PUT /api/file-transfers/settings
 */
router.put(
  '/settings',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    const { fileTransferRepository } = await import('./repository.js')
    const success = await fileTransferRepository.updateSettings(req.body)

    if (success) {
      res.json({ success: true })
    } else {
      res.status(500).json({ success: false, error: '更新设置失败' })
    }
  }
)

/**
 * 获取统计信息 - 需要管理员权限
 * GET /api/file-transfers/stats
 */
router.get(
  '/stats',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    const { fileTransferRepository } = await import('./repository.js')
    const stats = await fileTransferRepository.getStats()

    res.json({ success: true, data: stats })
  }
)

export default router
