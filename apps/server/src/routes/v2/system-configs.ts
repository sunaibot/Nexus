/**
 * 系统配置管理 API
 * 支持动态配置系统参数，替代硬编码配置
 */

import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js'
import {
  configManager,
  getSecurityConfig,
  getFileTransferConfig,
  getUploadConfig,
  getNotificationConfig,
  getHealthCheckConfig,
  getRateLimitConfig,
  updateSecurityConfig,
  updateFileTransferConfig,
  updateUploadConfig,
  updateNotificationConfig,
  updateHealthCheckConfig,
  updateRateLimitConfig,
  DEFAULT_SYSTEM_CONFIG,
  type SystemConfig
} from '../../core/config/index.js'
import { asyncHandler, successResponse, errorResponse } from '../utils/index.js'
import { logAudit } from '../../db/index.js'

const router = Router()

/**
 * 获取所有系统配置
 * GET /api/v2/system-configs
 * 需要管理员权限
 */
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const configs = configManager.getAll()
    return successResponse(res, configs)
  })
)

/**
 * 获取安全配置
 * GET /api/v2/system-configs/security
 * 需要管理员权限
 */
router.get(
  '/security',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const config = getSecurityConfig()
    return successResponse(res, config)
  })
)

/**
 * 更新安全配置
 * PUT /api/v2/system-configs/security
 * 需要管理员权限
 */
router.put(
  '/security',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const updates = req.body

    // 验证输入
    if (updates.maxLoginAttempts !== undefined && (updates.maxLoginAttempts < 1 || updates.maxLoginAttempts > 10)) {
      return errorResponse(res, '最大登录尝试次数必须在 1-10 之间', 400)
    }
    if (updates.lockDurationMinutes !== undefined && (updates.lockDurationMinutes < 1 || updates.lockDurationMinutes > 60)) {
      return errorResponse(res, '锁定时间必须在 1-60 分钟之间', 400)
    }
    if (updates.sessionTimeoutHours !== undefined && (updates.sessionTimeoutHours < 1 || updates.sessionTimeoutHours > 168)) {
      return errorResponse(res, '会话超时时间必须在 1-168 小时之间', 400)
    }
    if (updates.minPasswordLength !== undefined && (updates.minPasswordLength < 4 || updates.minPasswordLength > 32)) {
      return errorResponse(res, '密码最小长度必须在 4-32 之间', 400)
    }

    const success = updateSecurityConfig(updates)
    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_SECURITY_CONFIG',
        resourceType: 'system_config',
        details: updates,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, getSecurityConfig())
    }
    return errorResponse(res, '更新安全配置失败', 500)
  })
)

/**
 * 获取文件传输配置
 * GET /api/v2/system-configs/file-transfer
 * 需要管理员权限
 */
router.get(
  '/file-transfer',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const config = getFileTransferConfig()
    return successResponse(res, config)
  })
)

/**
 * 更新文件传输配置
 * PUT /api/v2/system-configs/file-transfer
 * 需要管理员权限
 */
router.put(
  '/file-transfer',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const updates = req.body

    // 验证输入
    if (updates.maxFileSizeMB !== undefined && (updates.maxFileSizeMB < 1 || updates.maxFileSizeMB > 10240)) {
      return errorResponse(res, '最大文件大小必须在 1-10240 MB 之间', 400)
    }
    if (updates.maxExpiryHours !== undefined && (updates.maxExpiryHours < 1 || updates.maxExpiryHours > 720)) {
      return errorResponse(res, '最大过期时间必须在 1-720 小时之间', 400)
    }
    if (updates.maxDownloads !== undefined && (updates.maxDownloads < 1 || updates.maxDownloads > 1000)) {
      return errorResponse(res, '最大下载次数必须在 1-1000 之间', 400)
    }

    const success = updateFileTransferConfig(updates)
    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_FILE_TRANSFER_CONFIG',
        resourceType: 'system_config',
        details: updates,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, getFileTransferConfig())
    }
    return errorResponse(res, '更新文件传输配置失败', 500)
  })
)

/**
 * 获取上传配置
 * GET /api/v2/system-configs/upload
 * 需要管理员权限
 */
router.get(
  '/upload',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const config = getUploadConfig()
    return successResponse(res, config)
  })
)

/**
 * 更新上传配置
 * PUT /api/v2/system-configs/upload
 * 需要管理员权限
 */
router.put(
  '/upload',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const updates = req.body

    // 验证输入
    if (updates.chunkSizeMB !== undefined && (updates.chunkSizeMB < 1 || updates.chunkSizeMB > 100)) {
      return errorResponse(res, '分片大小必须在 1-100 MB 之间', 400)
    }
    if (updates.maxConcurrent !== undefined && (updates.maxConcurrent < 1 || updates.maxConcurrent > 10)) {
      return errorResponse(res, '最大并发数必须在 1-10 之间', 400)
    }
    if (updates.maxFileSizeMB !== undefined && (updates.maxFileSizeMB < 1 || updates.maxFileSizeMB > 10240)) {
      return errorResponse(res, '最大文件大小必须在 1-10240 MB 之间', 400)
    }

    const success = updateUploadConfig(updates)
    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_UPLOAD_CONFIG',
        resourceType: 'system_config',
        details: updates,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, getUploadConfig())
    }
    return errorResponse(res, '更新上传配置失败', 500)
  })
)

/**
 * 获取通知配置
 * GET /api/v2/system-configs/notification
 * 需要管理员权限
 */
router.get(
  '/notification',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const config = getNotificationConfig()
    return successResponse(res, config)
  })
)

/**
 * 更新通知配置
 * PUT /api/v2/system-configs/notification
 * 需要管理员权限
 */
router.put(
  '/notification',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const updates = req.body

    const success = updateNotificationConfig(updates)
    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_NOTIFICATION_CONFIG',
        resourceType: 'system_config',
        details: updates,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, getNotificationConfig())
    }
    return errorResponse(res, '更新通知配置失败', 500)
  })
)

/**
 * 获取健康检查配置
 * GET /api/v2/system-configs/health-check
 * 需要管理员权限
 */
router.get(
  '/health-check',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const config = getHealthCheckConfig()
    return successResponse(res, config)
  })
)

/**
 * 更新健康检查配置
 * PUT /api/v2/system-configs/health-check
 * 需要管理员权限
 */
router.put(
  '/health-check',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const updates = req.body

    const success = updateHealthCheckConfig(updates)
    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_HEALTH_CHECK_CONFIG',
        resourceType: 'system_config',
        details: updates,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, getHealthCheckConfig())
    }
    return errorResponse(res, '更新健康检查配置失败', 500)
  })
)

/**
 * 获取速率限制配置
 * GET /api/v2/system-configs/rate-limit
 * 需要管理员权限
 */
router.get(
  '/rate-limit',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const config = getRateLimitConfig()
    return successResponse(res, config)
  })
)

/**
 * 更新速率限制配置
 * PUT /api/v2/system-configs/rate-limit
 * 需要管理员权限
 */
router.put(
  '/rate-limit',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const updates = req.body

    // 验证输入
    if (updates.windowMinutes !== undefined && (updates.windowMinutes < 1 || updates.windowMinutes > 60)) {
      return errorResponse(res, '时间窗口必须在 1-60 分钟之间', 400)
    }
    if (updates.maxRequests !== undefined && (updates.maxRequests < 10 || updates.maxRequests > 10000)) {
      return errorResponse(res, '最大请求数必须在 10-10000 之间', 400)
    }

    const success = updateRateLimitConfig(updates)
    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_RATE_LIMIT_CONFIG',
        resourceType: 'system_config',
        details: updates,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, getRateLimitConfig())
    }
    return errorResponse(res, '更新速率限制配置失败', 500)
  })
)

/**
 * 批量更新配置
 * PUT /api/v2/system-configs/batch
 * 需要管理员权限
 */
router.put(
  '/batch',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const configs = req.body

    if (!configs || typeof configs !== 'object') {
      return errorResponse(res, '无效的配置数据', 400)
    }

    const success = configManager.setBatch(configs)
    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'UPDATE_SYSTEM_CONFIGS_BATCH',
        resourceType: 'system_config',
        details: Object.keys(configs),
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, configManager.getAll())
    }
    return errorResponse(res, '批量更新配置失败', 500)
  })
)

/**
 * 重置为默认配置
 * POST /api/v2/system-configs/reset
 * 需要管理员权限
 */
router.post(
  '/reset',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    const { type } = req.body

    let success = false
    if (type === 'security') {
      success = updateSecurityConfig(DEFAULT_SYSTEM_CONFIG.security)
    } else if (type === 'fileTransfer') {
      success = updateFileTransferConfig(DEFAULT_SYSTEM_CONFIG.fileTransfer)
    } else if (type === 'upload') {
      success = updateUploadConfig(DEFAULT_SYSTEM_CONFIG.upload)
    } else if (type === 'notification') {
      success = updateNotificationConfig(DEFAULT_SYSTEM_CONFIG.notification)
    } else if (type === 'healthCheck') {
      success = updateHealthCheckConfig(DEFAULT_SYSTEM_CONFIG.healthCheck)
    } else if (type === 'rateLimit') {
      success = updateRateLimitConfig(DEFAULT_SYSTEM_CONFIG.rateLimit)
    } else if (type === 'all' || !type) {
      success = configManager.resetToDefaults()
    }

    if (success) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'RESET_SYSTEM_CONFIGS',
        resourceType: 'system_config',
        details: { type },
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      })
      return successResponse(res, configManager.getAll())
    }
    return errorResponse(res, '重置配置失败', 500)
  })
)

/**
 * 获取默认配置（用于参考）
 * GET /api/v2/system-configs/defaults
 * 需要管理员权限
 */
router.get(
  '/defaults',
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    return successResponse(res, DEFAULT_SYSTEM_CONFIG)
  })
)

export default router
