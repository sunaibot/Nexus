/**
 * 文件快传模块类型定义
 */

/** 文件快传记录 */
export interface FileTransfer {
  id: string
  extractCode: string      // 提取码
  downloadToken?: string   // 下载token（用于下载链接）
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
  preview?: FilePreviewInfo // 预览信息
}

/** 文件预览信息 */
export interface FilePreviewInfo {
  canPreview: boolean
  previewType: 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'none'
  thumbnailUrl?: string
  previewUrl?: string
}

/** 文件快传设置 */
export interface FileTransferSettings {
  id: string
  maxFileSize: number      // 最大文件大小
  allowedFileTypes: string // 允许的文件类型
  maxDownloads: number     // 默认最大下载次数
  maxExpiryHours: number   // 默认最大有效期(小时)
  storagePath?: string     // 存储路径
}

/** 文件快传统计 */
export interface FileTransferStats {
  total: number
  active: number
  expired: number
}

/** 创建快传响应 */
export interface CreateFileTransferResponse {
  extractCode: string
  downloadToken: string
  deleteCode: string
  expiresAt: number
  maxDownloads: number
}

/** 存储路径信息 */
export interface StoragePathInfo {
  value: string
  label: string
  description: string
  recommended: boolean
  fullPath: string
  exists: boolean
  writable: boolean
  usable: boolean
}

/** 存储路径列表响应 */
export interface StoragePathsResponse {
  isDocker: boolean
  currentPath: string
  paths: StoragePathInfo[]
}

/** 路径验证响应 */
export interface PathValidationResponse {
  path: string
  fullPath: string
  exists: boolean
  writable: boolean
  created: boolean
  usable: boolean
}
