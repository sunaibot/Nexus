/**
 * 文件快传 API 客户端
 */
import { request } from '../../lib/api'
import type { FileTransfer, FileTransferSettings, FileTransferStats, CreateFileTransferResponse } from './types'

/**
 * 获取所有文件列表（管理员）
 */
export async function fetchAllFileTransfers(): Promise<FileTransfer[]> {
  const response = await request<{ success: boolean; data: FileTransfer[] }>('/api/v2/file-transfers/all', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取当前用户的文件列表
 */
export async function fetchMyFileTransfers(): Promise<FileTransfer[]> {
  const response = await request<{ success: boolean; data: FileTransfer[] }>('/api/v2/file-transfers/my', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取文件快传设置
 */
export async function fetchFileTransferSettings(): Promise<FileTransferSettings> {
  const response = await request<{ success: boolean; data: FileTransferSettings }>('/api/v2/file-transfers/settings', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新文件快传设置
 */
export async function updateFileTransferSettings(settings: Partial<FileTransferSettings>): Promise<void> {
  await request<{ success: boolean }>('/api/v2/file-transfers/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
    requireAuth: true,
  })
}

/**
 * 获取文件快传统计
 */
export async function fetchFileTransferStats(): Promise<FileTransferStats> {
  const response = await request<{ success: boolean; data: FileTransferStats }>('/api/v2/file-transfers/stats', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 删除文件
 */
export async function deleteFileTransfer(deleteCode: string): Promise<void> {
  await request<{ success: boolean }>(`/api/v2/file-transfers/${deleteCode}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 上传文件
 */
export async function uploadFile(
  file: File,
  maxDownloads?: number,
  expiryHours?: number
): Promise<CreateFileTransferResponse> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        const base64Data = base64.split(',')[1]
        
        const response = await request<{ success: boolean; data: CreateFileTransferResponse }>('/api/v2/file-transfers/upload', {
          method: 'POST',
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            maxDownloads,
            expiryHours,
          }),
        })
        resolve(response.data)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 获取可用存储路径列表
 */
export async function fetchStoragePaths(): Promise<{ isDocker: boolean; currentPath: string; paths: import('./types').StoragePathInfo[] }> {
  const response = await request<{ success: boolean; data: { isDocker: boolean; currentPath: string; paths: import('./types').StoragePathInfo[] } }>('/api/v2/file-transfers/storage-paths', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 验证自定义存储路径
 */
export async function validateStoragePath(path: string): Promise<import('./types').PathValidationResponse> {
  const response = await request<{ success: boolean; data: import('./types').PathValidationResponse }>('/api/v2/file-transfers/validate-path', {
    method: 'POST',
    body: JSON.stringify({ path }),
    requireAuth: true,
  })
  return response.data
}

// API 集合
export const fileTransferApi = {
  fetchAll: fetchAllFileTransfers,
  fetchMy: fetchMyFileTransfers,
  fetchSettings: fetchFileTransferSettings,
  updateSettings: updateFileTransferSettings,
  fetchStats: fetchFileTransferStats,
  delete: deleteFileTransfer,
  upload: uploadFile,
  fetchStoragePaths,
  validateStoragePath,
}

export default fileTransferApi
