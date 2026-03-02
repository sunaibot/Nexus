/**
 * 大文件分片上传管理器
 * 第三阶段 - 文件传输优化核心组件
 *
 * 功能特性：
 * 1. 分片上传 - 支持大文件分片上传
 * 2. 断点续传 - 支持上传中断后恢复
 * 3. 并发控制 - 限制并发上传分片数
 * 4. 完整性校验 - MD5校验确保文件完整
 * 5. 自动清理 - 定期清理过期分片
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { logger } from './logger.js'

// ========== 类型定义 ==========

interface ChunkInfo {
  index: number
  size: number
  hash: string
  uploaded: boolean
}

interface UploadSession {
  id: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  chunks: ChunkInfo[]
  fileHash: string
  createdAt: number
  updatedAt: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  uploadPath: string
  metadata?: Record<string, any>
}

interface UploadConfig {
  chunkSize: number           // 分片大小（字节）
  maxConcurrent: number       // 最大并发数
  maxFileSize: number         // 最大文件大小
  tempDir: string             // 临时目录
  expireTime: number          // 会话过期时间（毫秒）
  cleanupInterval: number     // 清理间隔（毫秒）
}

interface UploadProgress {
  sessionId: string
  uploadedChunks: number
  totalChunks: number
  progress: number
  status: UploadSession['status']
}

// ========== 默认配置 ==========

import { getUploadConfig } from '../core/config/index.js'

function getDynamicConfig(): UploadConfig {
  const config = getUploadConfig()
  return {
    chunkSize: config.chunkSizeMB * 1024 * 1024,
    maxConcurrent: config.maxConcurrent,
    maxFileSize: config.maxFileSizeMB * 1024 * 1024,
    tempDir: config.tempDir,
    expireTime: config.expireTimeHours * 60 * 60 * 1000,
    cleanupInterval: config.cleanupIntervalMinutes * 60 * 1000
  }
}

const DEFAULT_CONFIG: UploadConfig = {
  chunkSize: 5 * 1024 * 1024,      // 5MB
  maxConcurrent: 3,                 // 最多3个并发
  maxFileSize: 1024 * 1024 * 1024,  // 1GB
  tempDir: 'uploads/temp',
  expireTime: 24 * 60 * 60 * 1000,  // 24小时
  cleanupInterval: 60 * 60 * 1000   // 1小时
}

// ========== 分片上传管理器 ==========

export class ChunkUploadManager {
  private config: UploadConfig
  private sessions: Map<string, UploadSession> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<UploadConfig> = {}) {
    const dynamicConfig = getDynamicConfig()
    this.config = { ...DEFAULT_CONFIG, ...dynamicConfig, ...config }
    this.ensureTempDir()
    this.startCleanup()
  }

  /**
   * 创建上传会话
   */
  createSession(
    fileName: string,
    fileSize: number,
    fileHash: string,
    metadata?: Record<string, any>
  ): UploadSession {
    // 检查文件大小
    if (fileSize > this.config.maxFileSize) {
      throw new Error(`文件大小超过限制: ${this.formatBytes(fileSize)} > ${this.formatBytes(this.config.maxFileSize)}`)
    }

    const sessionId = this.generateSessionId()
    const totalChunks = Math.ceil(fileSize / this.config.chunkSize)

    const session: UploadSession = {
      id: sessionId,
      fileName,
      fileSize,
      chunkSize: this.config.chunkSize,
      totalChunks,
      chunks: Array.from({ length: totalChunks }, (_, i) => ({
        index: i,
        size: Math.min(this.config.chunkSize, fileSize - i * this.config.chunkSize),
        hash: '',
        uploaded: false
      })),
      fileHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending',
      uploadPath: path.join(this.config.tempDir, sessionId),
      metadata
    }

    this.sessions.set(sessionId, session)

    // 创建上传目录
    if (!fs.existsSync(session.uploadPath)) {
      fs.mkdirSync(session.uploadPath, { recursive: true })
    }

    logger.info('[ChunkUpload] 创建上传会话', {
      sessionId,
      fileName,
      fileSize,
      totalChunks
    })

    return session
  }

  /**
   * 获取上传会话
   */
  getSession(sessionId: string): UploadSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * 上传分片
   */
  async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunkData: Buffer,
    chunkHash: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('上传会话不存在或已过期')
    }

    if (session.status === 'completed') {
      throw new Error('文件已上传完成')
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new Error('分片索引无效')
    }

    const chunk = session.chunks[chunkIndex]

    // 校验分片大小
    if (chunkData.length !== chunk.size) {
      throw new Error(`分片大小不匹配: ${chunkData.length} != ${chunk.size}`)
    }

    // 校验分片哈希
    const calculatedHash = this.calculateHash(chunkData)
    if (calculatedHash !== chunkHash) {
      throw new Error('分片校验失败')
    }

    // 保存分片
    const chunkPath = path.join(session.uploadPath, `chunk-${chunkIndex}`)
    await fs.promises.writeFile(chunkPath, chunkData)

    // 更新分片状态
    chunk.hash = chunkHash
    chunk.uploaded = true
    session.updatedAt = Date.now()

    if (session.status === 'pending') {
      session.status = 'uploading'
    }

    logger.debug('[ChunkUpload] 分片上传成功', {
      sessionId,
      chunkIndex,
      chunkSize: chunkData.length
    })
  }

  /**
   * 检查分片状态
   */
  checkChunks(sessionId: string): { uploaded: number[]; missing: number[] } {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('上传会话不存在或已过期')
    }

    const uploaded: number[] = []
    const missing: number[] = []

    for (const chunk of session.chunks) {
      if (chunk.uploaded) {
        uploaded.push(chunk.index)
      } else {
        missing.push(chunk.index)
      }
    }

    return { uploaded, missing }
  }

  /**
   * 合并分片
   */
  async mergeChunks(sessionId: string, targetPath: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('上传会话不存在或已过期')
    }

    // 检查是否所有分片都已上传
    const missingChunks = session.chunks.filter(c => !c.uploaded)
    if (missingChunks.length > 0) {
      throw new Error(`还有 ${missingChunks.length} 个分片未上传`)
    }

    // 确保目标目录存在
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // 创建写入流
    const writeStream = fs.createWriteStream(targetPath)

    try {
      // 按顺序合并分片
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(session.uploadPath, `chunk-${i}`)
        const chunkData = await fs.promises.readFile(chunkPath)
        writeStream.write(chunkData)
      }

      await new Promise((resolve, reject) => {
        writeStream.end(() => resolve(void 0))
        writeStream.on('error', reject)
      })

      // 校验文件哈希
      const fileHash = await this.calculateFileHash(targetPath)
      if (fileHash !== session.fileHash) {
        // 删除不完整的文件
        fs.unlinkSync(targetPath)
        throw new Error('文件完整性校验失败')
      }

      // 更新状态
      session.status = 'completed'
      session.updatedAt = Date.now()

      // 清理临时文件
      this.cleanupSession(sessionId)

      logger.info('[ChunkUpload] 文件合并完成', {
        sessionId,
        fileName: session.fileName,
        targetPath
      })

      return targetPath
    } catch (error) {
      // 清理不完整的文件
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath)
      }
      session.status = 'failed'
      throw error
    }
  }

  /**
   * 获取上传进度
   */
  getProgress(sessionId: string): UploadProgress {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('上传会话不存在或已过期')
    }

    const uploadedChunks = session.chunks.filter(c => c.uploaded).length
    const progress = Math.round((uploadedChunks / session.totalChunks) * 100)

    return {
      sessionId,
      uploadedChunks,
      totalChunks: session.totalChunks,
      progress,
      status: session.status
    }
  }

  /**
   * 取消上传
   */
  cancelUpload(sessionId: string): void {
    this.cleanupSession(sessionId)
    logger.info('[ChunkUpload] 上传已取消', { sessionId })
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): UploadSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSessions: number
    pending: number
    uploading: number
    completed: number
    failed: number
  } {
    const sessions = this.getAllSessions()
    return {
      totalSessions: sessions.length,
      pending: sessions.filter(s => s.status === 'pending').length,
      uploading: sessions.filter(s => s.status === 'uploading').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      failed: sessions.filter(s => s.status === 'failed').length
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // 清理所有会话
    for (const sessionId of this.sessions.keys()) {
      this.cleanupSession(sessionId)
    }

    this.sessions.clear()
    logger.info('[ChunkUpload] 上传管理器已销毁')
  }

  // ========== 私有方法 ==========

  /**
   * 确保临时目录存在
   */
  private ensureTempDir(): void {
    if (!fs.existsSync(this.config.tempDir)) {
      fs.mkdirSync(this.config.tempDir, { recursive: true })
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 计算哈希
   */
  private calculateHash(data: Buffer): string {
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * 计算文件哈希
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5')
      const stream = fs.createReadStream(filePath)

      stream.on('data', (data) => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  /**
   * 清理会话
   */
  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    // 删除临时文件
    if (fs.existsSync(session.uploadPath)) {
      fs.rmSync(session.uploadPath, { recursive: true, force: true })
    }

    // 删除会话记录
    this.sessions.delete(sessionId)

    logger.debug('[ChunkUpload] 清理会话', { sessionId })
  }

  /**
   * 启动清理定时器
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 执行清理
   */
  private performCleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [sessionId, session] of this.sessions.entries()) {
      // 清理过期的会话
      if (now - session.updatedAt > this.config.expireTime) {
        this.cleanupSession(sessionId)
        cleaned++
        continue
      }

      // 清理已完成的会话（保留1小时）
      if (session.status === 'completed' && now - session.updatedAt > 3600000) {
        this.cleanupSession(sessionId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.debug('[ChunkUpload] 清理过期会话', { cleaned })
    }
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// ========== 全局实例 ==========

let globalManager: ChunkUploadManager | null = null

/**
 * 初始化分片上传管理器
 */
export function initChunkUploadManager(config?: Partial<UploadConfig>): ChunkUploadManager {
  if (globalManager) {
    logger.warn('[ChunkUpload] 管理器已初始化，返回现有实例')
    return globalManager
  }

  globalManager = new ChunkUploadManager(config)
  return globalManager
}

/**
 * 获取分片上传管理器
 */
export function getChunkUploadManager(): ChunkUploadManager {
  if (!globalManager) {
    throw new Error('分片上传管理器未初始化，请先调用 initChunkUploadManager()')
  }
  return globalManager
}

/**
 * 销毁分片上传管理器
 */
export function destroyChunkUploadManager(): void {
  if (globalManager) {
    globalManager.destroy()
    globalManager = null
  }
}

// ========== 便捷函数 ==========

/**
 * 创建上传会话
 */
export function createUploadSession(
  fileName: string,
  fileSize: number,
  fileHash: string,
  metadata?: Record<string, any>
): UploadSession {
  return getChunkUploadManager().createSession(fileName, fileSize, fileHash, metadata)
}

/**
 * 上传分片
 */
export function uploadChunk(
  sessionId: string,
  chunkIndex: number,
  chunkData: Buffer,
  chunkHash: string
): Promise<void> {
  return getChunkUploadManager().uploadChunk(sessionId, chunkIndex, chunkData, chunkHash)
}

/**
 * 合并分片
 */
export function mergeChunks(sessionId: string, targetPath: string): Promise<string> {
  return getChunkUploadManager().mergeChunks(sessionId, targetPath)
}

/**
 * 获取上传进度
 */
export function getUploadProgress(sessionId: string): UploadProgress {
  return getChunkUploadManager().getProgress(sessionId)
}

/**
 * 检查分片状态
 */
export function checkUploadChunks(sessionId: string): { uploaded: number[]; missing: number[] } {
  return getChunkUploadManager().checkChunks(sessionId)
}
