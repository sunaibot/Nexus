/**
 * 文件快传模块
 * 提供文件快传的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface FileTransfer {
  id: string
  userId?: string  // 改为可选的 undefined 类型以兼容
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  extractCode: string
  extractPassword: string
  deleteCode: string
  deletePassword: string
  downloadToken: string
  maxDownloads: number
  downloadCount: number
  currentDownloads: number  // 兼容字段，与 downloadCount 相同
  expiryHours: number
  createdAt: string
  expiresAt: number
  uploaderIp?: string        // 兼容字段
}

export function createFileTransfer(
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
): { id: string; extractCode: string; extractPassword: string; deleteCode: string; deletePassword: string; downloadToken: string; expiresAt: number } | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()
  const expiresAt = Date.now() + expiryHours * 60 * 60 * 1000

  db.run(
    'INSERT INTO file_transfers (id, userId, fileName, fileSize, fileType, filePath, extractCode, extractPassword, deleteCode, deletePassword, downloadToken, maxDownloads, downloadCount, expiryHours, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
    [id, userId || null, fileName, fileSize, fileType, filePath, extractCode, extractPassword, deleteCode, deletePassword, downloadToken, maxDownloads, expiryHours, now, expiresAt]
  )

  saveDatabase()
  return { id, extractCode, extractPassword, deleteCode, deletePassword, downloadToken, expiresAt }
}

export function getFileTransferByExtractCode(extractCode: string): FileTransfer | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM file_transfers WHERE extractCode = ?', [extractCode])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15],
    currentDownloads: row[12]  // 映射 downloadCount 到 currentDownloads
  }
}

export function getFileTransferByDownloadToken(downloadToken: string): FileTransfer | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM file_transfers WHERE downloadToken = ?', [downloadToken])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15],
    currentDownloads: row[12]
  }
}

export function incrementDownloadCount(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('UPDATE file_transfers SET downloadCount = downloadCount + 1 WHERE id = ?', [id])
  saveDatabase()
  return true
}

// 别名导出，兼容旧代码
export const incrementFileTransferDownload = incrementDownloadCount

export function deleteFileTransfer(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM file_transfers WHERE id = ?', [id])
  saveDatabase()
  return true
}

// 别名导出，兼容旧代码
export const deleteFileTransferById = deleteFileTransfer

export function getFileTransferByDeleteCode(deleteCode: string): FileTransfer | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM file_transfers WHERE deleteCode = ?', [deleteCode])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15],
    currentDownloads: row[12]
  }
}

export function getUserFileTransfers(userId: string): FileTransfer[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM file_transfers WHERE userId = ? ORDER BY createdAt DESC', [userId])
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15],
    currentDownloads: row[12]
  }))
}

export function getAllFileTransfers(): FileTransfer[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM file_transfers ORDER BY createdAt DESC')
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    fileName: row[2],
    fileSize: row[3],
    fileType: row[4],
    filePath: row[5],
    extractCode: row[6],
    extractPassword: row[7],
    deleteCode: row[8],
    deletePassword: row[9],
    downloadToken: row[10],
    maxDownloads: row[11],
    downloadCount: row[12],
    expiryHours: row[13],
    createdAt: row[14],
    expiresAt: row[15],
    currentDownloads: row[12]
  }))
}

export function cleanupExpiredFileTransfers(): number {
  const db = getDatabase()
  if (!db) return 0

  const now = Date.now()
  const result = db.exec('DELETE FROM file_transfers WHERE expiresAt <= ?', [now])
  saveDatabase()
  return result.length > 0 ? result[0].values?.length || 0 : 0
}

export async function getFileTransferSettings(): Promise<{
  id: string
  maxFileSize: number
  maxExpiryHours: number
  maxDownloads: number
  allowedFileTypes: string[]
  blockedFileTypes: string[]
  uploadPath: string
  enableVirusScan: boolean
  chunkSizeMB: number
  maxConcurrentUploads: number
}> {
  const { getFileTransferConfig } = await import('../../../core/config/index.js')
  const config = getFileTransferConfig()

  return {
    id: 'system',
    maxFileSize: config.maxFileSizeMB * 1024 * 1024,
    maxExpiryHours: config.maxExpiryHours,
    maxDownloads: config.maxDownloads,
    allowedFileTypes: config.allowedFileTypes,
    blockedFileTypes: config.blockedFileTypes,
    uploadPath: config.uploadPath,
    enableVirusScan: config.enableVirusScan,
    chunkSizeMB: config.chunkSizeMB,
    maxConcurrentUploads: config.maxConcurrentUploads
  }
}

export async function updateFileTransferSettings(settings: any): Promise<boolean> {
  const { updateFileTransferConfig } = await import('../../../core/config/index.js')

  const configUpdate: any = {}
  if (settings.maxFileSize !== undefined) {
    configUpdate.maxFileSizeMB = Math.floor(settings.maxFileSize / (1024 * 1024))
  }
  if (settings.maxExpiryHours !== undefined) {
    configUpdate.maxExpiryHours = settings.maxExpiryHours
  }
  if (settings.maxDownloads !== undefined) {
    configUpdate.maxDownloads = settings.maxDownloads
  }
  if (settings.allowedFileTypes !== undefined) {
    configUpdate.allowedFileTypes = settings.allowedFileTypes
  }
  if (settings.uploadPath !== undefined) {
    configUpdate.uploadPath = settings.uploadPath
  }

  return updateFileTransferConfig(configUpdate)
}

export function getFileTransferStats(): { total: number; active: number; expired: number } {
  const db = getDatabase()
  if (!db) return { total: 0, active: 0, expired: 0 }

  const total = db.exec('SELECT COUNT(*) FROM file_transfers')[0]?.values[0][0] || 0
  const active = db.exec('SELECT COUNT(*) FROM file_transfers WHERE expiresAt > ?', [Date.now()])[0]?.values[0][0] || 0
  const expired = db.exec('SELECT COUNT(*) FROM file_transfers WHERE expiresAt <= ?', [Date.now()])[0]?.values[0][0] || 0

  return { total, active, expired }
}
