/**
 * 文件快传数据访问层
 * 封装数据库操作，复用现有db.js函数
 */

import {
  createFileTransfer as dbCreateFileTransfer,
  getFileTransferByExtractCode as dbGetByExtractCode,
  getFileTransferByDeleteCode as dbGetByDeleteCode,
  getFileTransferByDownloadToken as dbGetByDownloadToken,
  incrementFileTransferDownload as dbIncrementDownload,
  deleteFileTransfer as dbDeleteFileTransfer,
  getUserFileTransfers as dbGetUserFileTransfers,
  getAllFileTransfers as dbGetAllFileTransfers,
  cleanupExpiredFileTransfers as dbCleanupExpired,
  getFileTransferSettings as dbGetSettings,
  updateFileTransferSettings as dbUpdateSettings,
  getFileTransferStats as dbGetStats,
} from '../../db/index.js'
import { FileTransfer, FileTransferSettings, FileTransferStats } from './types.js'

/**
 * 文件快传仓库类
 * 提供统一的数据访问接口
 */
export class FileTransferRepository {
  private static instance: FileTransferRepository

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): FileTransferRepository {
    if (!FileTransferRepository.instance) {
      FileTransferRepository.instance = new FileTransferRepository()
    }
    return FileTransferRepository.instance
  }

  /**
   * 创建文件快传记录
   * @param fileName 文件名
   * @param fileSize 文件大小
   * @param fileType 文件类型
   * @param fileData 文件数据(Base64)
   * @param maxDownloads 最大下载次数
   * @param expiryHours 有效期(小时)
   * @param userId 用户ID
   * @param uploaderIp 上传者IP
   * @returns 创建结果
   */
  async create(
    userId: string | undefined,
    fileName: string,
    fileSize: number,
    fileType: string,
    filePath: string,
    extractCode: string,
    extractPassword: string,
    deleteCode: string,
    deletePassword: string,
    downloadToken: string,
    maxDownloads: number,
    expiryHours: number
  ): Promise<{ id: string; extractCode: string; extractPassword: string; deleteCode: string; deletePassword: string; downloadToken: string; expiresAt: number } | null> {
    return dbCreateFileTransfer(
      userId,
      fileName,
      fileSize,
      fileType,
      filePath,
      extractCode,
      extractPassword,
      deleteCode,
      deletePassword,
      downloadToken,
      maxDownloads,
      expiryHours
    )
  }

  /**
   * 通过提取码获取文件
   * @param extractCode 提取码
   * @returns 文件记录
   */
  async findByExtractCode(extractCode: string): Promise<FileTransfer | null> {
    return dbGetByExtractCode(extractCode)
  }

  /**
   * 通过删除码获取文件
   * @param deleteCode 删除码
   * @returns 文件记录
   */
  async findByDeleteCode(deleteCode: string): Promise<FileTransfer | null> {
    return dbGetByDeleteCode(deleteCode)
  }

  /**
   * 通过下载token获取文件
   * @param downloadToken 下载token
   * @returns 文件记录
   */
  async findByDownloadToken(downloadToken: string): Promise<FileTransfer | null> {
    return dbGetByDownloadToken(downloadToken)
  }

  /**
   * 增加下载次数
   * @param extractCode 提取码
   * @returns 是否成功
   */
  async incrementDownload(extractCode: string): Promise<boolean> {
    return dbIncrementDownload(extractCode)
  }

  /**
   * 删除文件记录
   * @param id 文件ID
   * @returns 删除结果
   */
  async delete(id: string): Promise<{ success: boolean; filePath?: string }> {
    return dbDeleteFileTransfer(id)
  }

  /**
   * 获取用户的文件列表
   * @param userId 用户ID
   * @returns 文件列表
   */
  async findByUser(userId: string): Promise<FileTransfer[]> {
    return dbGetUserFileTransfers(userId)
  }

  /**
   * 获取所有文件(管理员用)
   * @returns 文件列表
   */
  async findAll(): Promise<FileTransfer[]> {
    return dbGetAllFileTransfers()
  }

  /**
   * 清理过期文件
   * @returns 清理结果
   */
  async cleanupExpired(): Promise<{ count: number; filePaths: string[] }> {
    return dbCleanupExpired()
  }

  /**
   * 获取系统设置
   * @returns 设置信息
   */
  async getSettings(): Promise<ReturnType<typeof dbGetSettings>> {
    return dbGetSettings()
  }

  /**
   * 更新系统设置
   * @param settings 设置信息
   * @returns 是否成功
   */
  async updateSettings(settings: Partial<FileTransferSettings>): Promise<boolean> {
    return dbUpdateSettings(settings)
  }

  /**
   * 获取统计信息
   * @returns 统计数据
   */
  async getStats(): Promise<FileTransferStats> {
    return dbGetStats()
  }
}

/**
 * 仓库实例导出
 */
export const fileTransferRepository = FileTransferRepository.getInstance()
