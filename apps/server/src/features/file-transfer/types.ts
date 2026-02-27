/**
 * 文件快传模块类型定义
 * 复用现有 file_transfers 表结构
 */

/** 文件快传记录 - 对应数据库表 */
export interface FileTransfer {
  id: string
  extractCode: string      // 提取码
  deleteCode: string       // 删除码
  fileName: string         // 文件名
  fileSize: number         // 文件大小(字节)
  fileType: string         // 文件类型
  filePath: string         // 文件存储路径
  maxDownloads: number     // 最大下载次数
  currentDownloads: number // 当前下载次数
  expiresAt: number        // 过期时间戳
  createdAt: string        // 创建时间
  userId?: string          // 上传用户ID
  uploaderIp?: string      // 上传者IP
}

/** 文件快传设置 - 对应数据库表 */
export interface FileTransferSettings {
  id: string
  maxFileSize: number      // 最大文件大小
  allowedFileTypes: string // 允许的文件类型
  maxDownloads: number     // 默认最大下载次数
  maxExpiryHours: number   // 默认最大有效期(小时)
  adminPassword: string    // 管理密码
  storagePath?: string     // 存储路径
}

/** 创建快传请求参数 */
export interface CreateFileTransferRequest {
  fileData: string         // Base64编码的文件数据
  fileName: string
  fileSize: number
  fileType: string
  maxDownloads?: number    // 可选，使用默认值
  expiryHours?: number     // 可选，使用默认值
}

/** 创建快传响应 */
export interface CreateFileTransferResponse {
  extractCode: string
  deleteCode: string
  expiresAt: number
  maxDownloads: number
}

/** 快传分享链接配置 */
export interface ShareLinkConfig {
  extractCode: string
  password?: string        // 访问密码
  expiresAt?: number       // 自定义过期时间
  maxDownloads?: number    // 自定义下载次数
}

/** 用户快传配额 */
export interface FileTransferQuota {
  dailyLimit: number       // 每日限额(字节)
  usedToday: number        // 今日已使用
  remaining: number        // 剩余额度
  maxExpiryHours: number   // 最大有效期
}

/** 文件预览信息 */
export interface FilePreviewInfo {
  canPreview: boolean
  previewType: 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'none'
  thumbnailUrl?: string
  previewUrl?: string
}

/** 快传审计日志 */
export interface FileTransferAudit {
  action: 'upload' | 'download' | 'delete' | 'preview'
  fileId: string
  fileName: string
  userId?: string
  ip: string
  userAgent: string
  timestamp: string
  metadata?: Record<string, any>
}

/** 文件快传统计 */
export interface FileTransferStats {
  total: number
  active: number
  expired: number
}
