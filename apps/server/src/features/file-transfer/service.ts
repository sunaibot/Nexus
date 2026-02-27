/**
 * 文件快传服务层
 * 业务逻辑封装，支持配额检查、预览、分享等功能
 */

import { FileTransferRepository, fileTransferRepository } from './repository.js'
import {
  FileTransfer,
  CreateFileTransferRequest,
  CreateFileTransferResponse,
  FileTransferQuota,
  FilePreviewInfo,
  ShareLinkConfig,
} from './types.js'
import { UserRole } from '../../core/permission/types.js'
import { permissionChecker } from '../../core/permission/checker.js'
import { logAudit } from '../../db/index.js'
import { FILE_TRANSFER_ACTIONS } from '../../db/audit-enhanced.js'

/**
 * 文件快传服务类
 * 处理所有业务逻辑
 */
export class FileTransferService {
  private repository: FileTransferRepository

  constructor(repository: FileTransferRepository = fileTransferRepository) {
    this.repository = repository
  }

  /**
   * 上传文件
   * @param request 上传请求
   * @param userId 用户ID
   * @param userRole 用户角色
   * @param ip 用户IP
   * @returns 上传结果
   */
  async upload(
    request: CreateFileTransferRequest,
    userId: string | undefined,
    userRole: UserRole,
    ip: string
  ): Promise<{ success: boolean; data?: CreateFileTransferResponse; error?: string }> {
    try {
      // 获取系统设置
      const settings = await this.repository.getSettings()
      if (!settings) {
        return { success: false, error: '系统配置错误' }
      }

      // 检查文件大小
      if (request.fileSize > settings.maxFileSize) {
        return {
          success: false,
          error: `文件大小超过限制，最大支持 ${(settings.maxFileSize / 1024 / 1024).toFixed(0)}MB`,
        }
      }

      // 检查文件类型
      const fileExt = request.fileName.split('.').pop()?.toLowerCase() || ''
      if (!settings.allowedFileTypes.includes(fileExt) && !settings.allowedFileTypes.includes('*')) {
        return { success: false, error: '不支持的文件类型' }
      }

      // 检查用户配额
      if (userId) {
        const quotaCheck = await this.checkQuota(userId, userRole, request.fileSize)
        if (!quotaCheck.allowed) {
          return { success: false, error: quotaCheck.reason }
        }
      }

      // 计算实际参数
      const quotas = permissionChecker.getUserQuotas(userRole)
      const actualMaxDownloads = Math.min(
        request.maxDownloads || settings.maxDownloads,
        settings.maxDownloads
      )
      const actualExpiryHours = Math.min(
        request.expiryHours || settings.maxExpiryHours,
        settings.maxExpiryHours,
        quotas.maxFileTransferExpiry
      )

      // 生成提取码和删除码
      const extractCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const deleteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // 创建文件记录
      // 生成提取密码和删除密码
      const extractPassword = Math.random().toString(36).substring(2, 10)
      const deletePassword = Math.random().toString(36).substring(2, 10)
      
      const result = await this.repository.create(
        userId,
        request.fileName,
        request.fileSize,
        request.fileType,
        request.fileData,
        extractCode,
        extractPassword,
        deleteCode,
        deletePassword,
        actualMaxDownloads,
        actualExpiryHours
      )

      if (!result) {
        return { success: false, error: '上传失败' }
      }

      // 记录审计日志
      logAudit({
        userId: userId || null,
        username: userId || 'anonymous',
        action: FILE_TRANSFER_ACTIONS.UPLOAD,
        resourceType: 'fileTransfer',
        resourceId: result.extractCode,
        details: {
          fileName: request.fileName,
          fileSize: request.fileSize,
          maxDownloads: actualMaxDownloads,
          expiryHours: actualExpiryHours,
        },
        ip,
        userAgent: '',
      })

      return {
        success: true,
        data: {
          extractCode: result.extractCode,
          deleteCode: result.deleteCode,
          expiresAt: result.expiresAt,
          maxDownloads: actualMaxDownloads,
        },
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      return { success: false, error: '上传失败，请稍后重试' }
    }
  }

  /**
   * 下载文件
   * @param extractCode 提取码
   * @param ip 下载者IP
   * @returns 文件信息
   */
  async download(extractCode: string, ip: string): Promise<{
    success: boolean
    file?: FileTransfer
    error?: string
  }> {
    try {
      const file = await this.repository.findByExtractCode(extractCode)

      if (!file) {
        return { success: false, error: '文件不存在或已过期' }
      }

      // 检查是否过期
      if (Date.now() > file.expiresAt) {
        return { success: false, error: '文件已过期' }
      }

      // 检查下载次数
      if (file.currentDownloads >= file.maxDownloads) {
        return { success: false, error: '下载次数已达上限' }
      }

      // 增加下载次数
      await this.repository.incrementDownload(extractCode)

      // 记录审计日志
      logAudit({
        userId: null,
        username: null,
        action: 'FILE_DOWNLOAD',
        resourceType: 'fileTransfer',
        resourceId: extractCode,
        details: {
          fileName: file.fileName,
          fileSize: file.fileSize,
        },
        ip,
        userAgent: '',
      })

      return { success: true, file }
    } catch (error) {
      console.error('文件下载失败:', error)
      return { success: false, error: '下载失败' }
    }
  }

  /**
   * 删除文件
   * @param deleteCode 删除码
   * @param userId 用户ID
   * @param ip 操作者IP
   * @returns 是否成功
   */
  async delete(deleteCode: string, userId: string | undefined, ip: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const file = await this.repository.findByDeleteCode(deleteCode)

      if (!file) {
        return { success: false, error: '文件不存在' }
      }

      // 检查权限：只有上传者或管理员可以删除
      if (file.userId && file.userId !== userId) {
        return { success: false, error: '无权删除此文件' }
      }

      const deleteResult = await this.repository.delete(file.id)

      if (deleteResult.success) {
        // 记录审计日志
        logAudit({
          userId: userId ?? null,
          username: userId ?? 'anonymous',
          action: 'FILE_DELETE',
          resourceType: 'fileTransfer',
          resourceId: deleteCode,
          details: { fileName: file.fileName },
          ip,
          userAgent: '',
        })
      }

      return { success: deleteResult.success }
    } catch (error) {
      console.error('文件删除失败:', error)
      return { success: false, error: '删除失败' }
    }
  }

  /**
   * 检查用户配额
   * @param userId 用户ID
   * @param role 用户角色
   * @param fileSize 文件大小
   * @returns 检查结果
   */
  private async checkQuota(
    userId: string,
    role: UserRole,
    fileSize: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const quotas = permissionChecker.getUserQuotas(role)

    // 检查文件大小是否超过单次限制
    if (fileSize > quotas.dailyFileTransferSize) {
      return {
        allowed: false,
        reason: `文件大小超过单次上传限制(${this.formatBytes(quotas.dailyFileTransferSize)})`,
      }
    }

    // 检查每日配额
    const dailyUsage = await this.getDailyUsage(userId)
    const dailyLimit = quotas.dailyFileTransferSize
    
    if (dailyUsage + fileSize > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - dailyUsage)
      return {
        allowed: false,
        reason: `今日上传配额不足，剩余 ${this.formatBytes(remaining)}`,
      }
    }

    // 记录本次上传到每日使用量
    await this.recordDailyUsage(userId, fileSize)

    return { allowed: true }
  }

  /**
   * 获取用户今日使用量
   */
  private async getDailyUsage(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const key = `file_transfer_quota:${userId}:${today}`
    
    try {
      // 尝试从数据库获取
      const { getDatabase } = await import('../../db/core.js')
      const db = getDatabase()
      if (!db) return 0
      
      const result = db.exec(
        'SELECT total_size FROM file_transfer_daily_quota WHERE user_id = ? AND date = ?',
        [userId, today]
      )
      
      if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0] as number
      }
    } catch (error) {
      console.error('获取每日使用量失败:', error)
    }
    
    return 0
  }

  /**
   * 记录用户每日使用量
   */
  private async recordDailyUsage(userId: string, fileSize: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { getDatabase } = await import('../../db/core.js')
      const db = getDatabase()
      if (!db) return
      
      // 检查是否已有记录
      const result = db.exec(
        'SELECT total_size FROM file_transfer_daily_quota WHERE user_id = ? AND date = ?',
        [userId, today]
      )
      
      if (result.length > 0 && result[0].values.length > 0) {
        // 更新记录
        db.exec(
          'UPDATE file_transfer_daily_quota SET total_size = total_size + ?, updated_at = ? WHERE user_id = ? AND date = ?',
          [fileSize, new Date().toISOString(), userId, today]
        )
      } else {
        // 插入新记录
        db.exec(
          'INSERT INTO file_transfer_daily_quota (user_id, date, total_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [userId, today, fileSize, new Date().toISOString(), new Date().toISOString()]
        )
      }
    } catch (error) {
      console.error('记录每日使用量失败:', error)
    }
  }

  /**
   * 获取文件预览信息
   * @param file 文件记录
   * @returns 预览信息
   */
  getPreviewInfo(file: FileTransfer): FilePreviewInfo {
    const ext = file.fileName.split('.').pop()?.toLowerCase() || ''

    // 图片类型
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return {
        canPreview: true,
        previewType: 'image',
        previewUrl: `/api/file-transfers/${file.extractCode}/preview`,
      }
    }

    // 视频类型
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return {
        canPreview: true,
        previewType: 'video',
        previewUrl: `/api/file-transfers/${file.extractCode}/preview`,
      }
    }

    // 音频类型
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return {
        canPreview: true,
        previewType: 'audio',
        previewUrl: `/api/file-transfers/${file.extractCode}/preview`,
      }
    }

    // PDF类型
    if (ext === 'pdf') {
      return {
        canPreview: true,
        previewType: 'pdf',
        previewUrl: `/api/file-transfers/${file.extractCode}/preview`,
      }
    }

    // 文本类型
    if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'xml', 'yaml', 'yml'].includes(ext)) {
      return {
        canPreview: true,
        previewType: 'text',
        previewUrl: `/api/file-transfers/${file.extractCode}/preview`,
      }
    }

    return {
      canPreview: false,
      previewType: 'none',
    }
  }

  /**
   * 格式化字节大小
   * @param bytes 字节数
   * @returns 格式化字符串
   */
  private formatBytes(bytes: number): string {
    if (bytes === Infinity) return '无限制'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

/**
 * 服务实例导出
 */
export const fileTransferService = new FileTransferService()
