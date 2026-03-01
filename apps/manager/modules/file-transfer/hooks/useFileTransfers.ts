/**
 * 文件快传数据管理 Hook
 */
import { useState, useEffect, useCallback } from 'react'
import { fileTransferApi } from '../api'
import type { FileTransfer, FileTransferSettings, FileTransferStats } from '../types'

export function useFileTransfers() {
  const [files, setFiles] = useState<FileTransfer[]>([])
  const [settings, setSettings] = useState<FileTransferSettings | null>(null)
  const [stats, setStats] = useState<FileTransferStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取所有文件
  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fileTransferApi.fetchAll()
      setFiles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文件列表失败')
      console.error('获取文件列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取设置
  const fetchSettings = useCallback(async () => {
    try {
      const data = await fileTransferApi.fetchSettings()
      setSettings(data)
    } catch (err) {
      console.error('获取设置失败:', err)
    }
  }, [])

  // 获取统计
  const fetchStats = useCallback(async () => {
    try {
      const data = await fileTransferApi.fetchStats()
      setStats(data)
    } catch (err) {
      console.error('获取统计失败:', err)
    }
  }, [])

  // 删除文件
  const deleteFile = useCallback(async (deleteCode: string) => {
    try {
      await fileTransferApi.delete(deleteCode)
      setFiles(prev => prev.filter(f => f.deleteCode !== deleteCode))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      console.error('删除失败:', err)
    }
  }, [])

  // 上传文件
  const uploadFile = useCallback(async (
    file: File,
    maxDownloads?: number,
    expiryHours?: number
  ) => {
    setUploading(true)
    setError(null)
    try {
      const result = await fileTransferApi.upload(file, maxDownloads, expiryHours)
      await fetchFiles()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
      throw err
    } finally {
      setUploading(false)
    }
  }, [fetchFiles])

  // 更新设置
  const updateSettings = useCallback(async (newSettings: Partial<FileTransferSettings>) => {
    try {
      await fileTransferApi.updateSettings(newSettings)
      setSettings(prev => prev ? { ...prev, ...newSettings } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新设置失败')
      console.error('更新设置失败:', err)
    }
  }, [])

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // 格式化过期时间
  const formatExpiry = useCallback((expiresAt: number): string => {
    // 处理无效日期
    if (!expiresAt || isNaN(expiresAt)) return '未知'
    
    const now = Date.now()
    const diff = expiresAt - now
    if (diff <= 0) return '已过期'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return '即将过期'
    if (hours < 24) return `${hours}小时后过期`
    const days = Math.floor(hours / 24)
    return `${days}天后过期`
  }, [])

  return {
    files,
    settings,
    stats,
    loading,
    uploading,
    error,
    fetchFiles,
    fetchSettings,
    fetchStats,
    deleteFile,
    uploadFile,
    updateSettings,
    formatFileSize,
    formatExpiry,
  }
}

export default useFileTransfers
