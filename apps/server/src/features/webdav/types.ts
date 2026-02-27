/**
 * WebDAV模块类型定义
 * 支持多协议书签同步
 */

/** WebDAV协议类型 */
export enum WebDAVProtocol {
  WEBDAV = 'webdav',        // 标准WebDAV
  NEXTCLOUD = 'nextcloud',  // NextCloud
  ONEDRIVE = 'onedrive',    // OneDrive
  DROPBOX = 'dropbox',      // Dropbox
  CUSTOM = 'custom',        // 自定义
}

/** 同步方向 */
export enum SyncDirection {
  UPLOAD = 'upload',        // 仅上传
  DOWNLOAD = 'download',    // 仅下载
  BIDIRECTIONAL = 'bidirectional', // 双向同步
}

/** 同步状态 */
export enum SyncStatus {
  IDLE = 'idle',            // 空闲
  SYNCING = 'syncing',      // 同步中
  SUCCESS = 'success',      // 同步成功
  ERROR = 'error',          // 同步失败
  CONFLICT = 'conflict',    // 冲突
}

/** WebDAV配置 */
export interface WebDAVConfig {
  id: string
  name: string
  protocol: WebDAVProtocol
  serverUrl: string
  username: string
  password: string
  remotePath: string
  syncDirection: SyncDirection
  autoSync: boolean
  syncInterval: number      // 同步间隔（分钟）
  lastSync?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/** 同步结果 */
export interface SyncResult {
  success: boolean
  direction: SyncDirection
  uploaded: number
  downloaded: number
  conflicts: number
  errors: string[]
  timestamp: string
}

/** 书签数据结构 */
export interface BookmarkData {
  version: string
  exportDate: string
  bookmarks: BookmarkItem[]
  categories: CategoryItem[]
}

/** 书签项 */
export interface BookmarkItem {
  id: string
  title: string
  url: string
  category: string
  favicon?: string
  description?: string
  order: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

/** 分类项 */
export interface CategoryItem {
  id: string
  name: string
  icon?: string
  color?: string
  order: number
}

/** 冲突信息 */
export interface SyncConflict {
  bookmarkId: string
  localBookmark: BookmarkItem
  remoteBookmark: BookmarkItem
  resolution?: 'local' | 'remote' | 'merge'
}

/** 同步历史 */
export interface SyncHistory {
  id: string
  configId: string
  status: SyncStatus
  direction: SyncDirection
  uploaded: number
  downloaded: number
  conflicts: number
  errors: string[]
  startedAt: string
  completedAt?: string
}

/** 协议特定配置 */
export interface ProtocolConfig {
  headers?: Record<string, string>
  authType?: 'basic' | 'bearer' | 'oauth'
  apiVersion?: string
  customEndpoints?: Record<string, string>
}

/** 连接测试结果 */
export interface ConnectionTestResult {
  success: boolean
  message: string
  serverInfo?: {
    name?: string
    version?: string
    capabilities?: string[]
  }
}
