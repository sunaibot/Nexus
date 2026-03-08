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
 * 上传文件 - 需要登录（安全考虑）
 * POST /api/file-transfers/upload
 */
router.post('/upload', authMiddleware, async (req, res) => {
  const user = (req as any).user
  
  // 安全检查：确保用户已登录
  if (!user || !user.id) {
    return res.status(401).json({
      success: false,
      error: '请先登录后再上传文件'
    })
  }
  
  const result = await fileTransferService.upload(
    req.body,
    user.id,
    user.role || UserRole.USER,
    req.ip || 'unknown'
  )

  if (result.success) {
    res.json({ success: true, data: result.data })
  } else {
    res.status(400).json({ success: false, error: result.error })
  }
})

/**
 * 验证提取码 - 公开接口
 * POST /api/file-transfers/extract
 * 验证提取码并返回文件信息（不增加下载次数）
 */
router.post('/extract', async (req, res) => {
  const { extractCode, password } = req.body

  if (!extractCode) {
    return res.status(400).json({ success: false, error: '请输入提取码' })
  }

  const result = await fileTransferService.verifyExtractCode(
    extractCode.toUpperCase(),
    password,
    req.ip || 'unknown'
  )

  if (!result.success || !result.file) {
    return res.status(404).json({ success: false, error: result.error || '文件不存在或已过期' })
  }

  // 只返回必要的文件信息，不包含敏感字段
  const file = result.file
  res.json({
    success: true,
    data: {
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      expiresAt: file.expiresAt,
      maxDownloads: file.maxDownloads,
      currentDownloads: file.currentDownloads,
      hasPassword: !!file.extractPassword,
      downloadToken: file.downloadToken,
    }
  })
})

/**
 * 下载文件 - 公开接口
 * GET /api/file-transfers/download/:downloadToken
 * 使用 downloadToken 而非 extractCode，增加安全性
 */
router.get('/download/:downloadToken', async (req, res) => {
  const { downloadToken } = req.params
  const result = await fileTransferService.downloadByToken(downloadToken, req.ip || 'unknown')

  if (!result.success || !result.file) {
    return res.status(404).json({ success: false, error: result.error })
  }

  const file = result.file

  // 读取文件并返回
  try {
    const fs = await import('fs')
    const pathModule = await import('path')
    const { getFileTransferSettings } = await import('../../db/index.js')

    // 获取设置中的存储路径
    const settings = await getFileTransferSettings()
    const storagePath = settings?.uploadPath || './uploads'
    const uploadsDir = storagePath.startsWith('/') 
      ? storagePath 
      : pathModule.join(process.cwd(), storagePath)
    
    // 安全检查：严格防止路径穿越攻击
    // 只允许文件名，不包含任何路径分隔符
    const safeFileName = pathModule.basename(file.filePath).replace(/[\/\\]/g, '')
    if (!safeFileName || safeFileName.startsWith('.') || safeFileName.trim() === '') {
      console.error('[Security] Invalid file name:', file.filePath)
      return res.status(403).json({ success: false, error: '非法文件路径' })
    }
    
    const filePath = pathModule.join(uploadsDir, safeFileName)
    
    // 安全检查：确保文件路径在允许目录内
    const resolvedUploadsDir = pathModule.resolve(uploadsDir)
    const resolvedFilePath = pathModule.resolve(filePath)
    
    if (!resolvedFilePath.startsWith(resolvedUploadsDir + pathModule.sep)) {
      console.error('[Security] Path traversal attempt:', file.filePath)
      return res.status(403).json({ success: false, error: '非法文件路径' })
    }

    if (!fs.existsSync(filePath)) {
      console.error('[Download Error] File not found:', filePath)
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
    const pathModule = await import('path')
    const uploadsDir = pathModule.join(process.cwd(), 'uploads')

    // 安全检查：规范化路径并防止路径穿越攻击
    const normalizedFilePath = pathModule.normalize(file.filePath).replace(/^(\.\.(\/|\\|$))+/, '')
    const filePath = pathModule.resolve(uploadsDir, normalizedFilePath)

    // 安全检查：确保文件路径在允许目录内（使用解析后的路径）
    const resolvedUploadsDir = pathModule.resolve(uploadsDir)
    const resolvedFilePath = pathModule.resolve(filePath)

    if (!resolvedFilePath.startsWith(resolvedUploadsDir + pathModule.sep) && resolvedFilePath !== resolvedUploadsDir) {
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

/**
 * 获取可用存储路径列表 - 需要管理员权限
 * GET /api/file-transfers/storage-paths
 * 返回推荐的存储路径列表，适配Docker环境
 */
router.get(
  '/storage-paths',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    const fs = await import('fs')
    const path = await import('path')

    // 获取当前工作目录
    const cwd = process.cwd()
    const isDocker = fs.existsSync('/.dockerenv') || fs.existsSync('/proc/self/cgroup')

    // 构建推荐路径列表
    const suggestedPaths = [
      {
        value: './uploads',
        label: '默认目录 (./uploads)',
        description: '应用目录下的uploads文件夹',
        recommended: !isDocker
      },
      {
        value: '/data/uploads',
        label: '数据卷 (/data/uploads)',
        description: 'Docker数据卷挂载点，推荐用于Docker部署',
        recommended: isDocker
      },
      {
        value: '/tmp/uploads',
        label: '临时目录 (/tmp/uploads)',
        description: '系统临时目录，重启后可能丢失',
        recommended: false
      }
    ]

    // 检查每个路径是否存在、可写
    const pathsWithStatus = await Promise.all(
      suggestedPaths.map(async (p) => {
        try {
          const fullPath = p.value.startsWith('/') ? p.value : path.join(cwd, p.value)
          const exists = fs.existsSync(fullPath)
          let writable = false

          if (exists) {
            // 检查是否可写
            try {
              fs.accessSync(fullPath, fs.constants.W_OK)
              writable = true
            } catch {
              writable = false
            }
          } else {
            // 尝试创建目录
            try {
              fs.mkdirSync(fullPath, { recursive: true })
              writable = true
            } catch {
              writable = false
            }
          }

          return {
            ...p,
            fullPath,
            exists,
            writable,
            usable: writable
          }
        } catch (error) {
          return {
            ...p,
            fullPath: p.value.startsWith('/') ? p.value : path.join(cwd, p.value),
            exists: false,
            writable: false,
            usable: false
          }
        }
      })
    )

    // 获取当前使用的路径
    const { fileTransferRepository } = await import('./repository.js')
    const settings = await fileTransferRepository.getSettings()
    const currentPath = settings?.uploadPath || './uploads'

    res.json({
      success: true,
      data: {
        isDocker,
        currentPath,
        paths: pathsWithStatus
      }
    })
  }
)

/**
 * 验证存储路径 - 需要管理员权限
 * POST /api/file-transfers/validate-path
 */
router.post(
  '/validate-path',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    const { path: customPath } = req.body
    const fs = await import('fs')
    const path = await import('path')

    if (!customPath) {
      return res.status(400).json({ success: false, error: '请提供路径' })
    }

    try {
      const fullPath = customPath.startsWith('/') ? customPath : path.join(process.cwd(), customPath)
      const exists = fs.existsSync(fullPath)
      let writable = false
      let created = false

      if (exists) {
        try {
          fs.accessSync(fullPath, fs.constants.W_OK)
          writable = true
        } catch {
          writable = false
        }
      } else {
        try {
          fs.mkdirSync(fullPath, { recursive: true })
          writable = true
          created = true
        } catch (error) {
          writable = false
        }
      }

      res.json({
        success: true,
        data: {
          path: customPath,
          fullPath,
          exists,
          writable,
          created,
          usable: writable
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '路径验证失败: ' + (error as Error).message
      })
    }
  }
)

export default router
