import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileUp,
  Trash2,
  RefreshCw,
  Search,
  File,
  Image,
  Video,
  Music,
  FileText,
  Download,
  Copy,
  Check,
  X,
  Eye,
  AlertCircle,
  Settings,
  Database,
  HardDrive,
  Clock,
  BarChart3
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useToast } from '../../../../components/admin/Toast'
import type { UnifiedPlugin } from '../../api-unified'

// 文件传输数据类型
interface FileTransfer {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  extractCode: string
  deleteCode: string
  maxDownloads: number
  currentDownloads: number
  expiresAt: number
  createdAt: string
  updatedAt: string
  createdBy?: string
}

// 统计类型
interface FileTransferStats {
  total: number
  active: number
  expired: number
  totalSize: number
}

// 设置类型
interface FileTransferSettings {
  maxFileSize: number
  maxDownloads: number
  maxExpiryHours: number
  allowedFileTypes: string
  uploadPath?: string
  requireAuth?: boolean
  enablePassword?: boolean
}

interface FileTransferManagerProps {
  plugin: UnifiedPlugin
  onPluginUpdate?: (plugin: UnifiedPlugin) => void
}

// 文件类型图标
function FileTypeIcon({ fileType }: { fileType: string }) {
  if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />
  if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-red-500" />
  if (fileType.startsWith('audio/')) return <Music className="w-5 h-5 text-purple-500" />
  if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />
  if (fileType.includes('text')) return <FileText className="w-5 h-5 text-gray-600" />
  return <File className="w-5 h-5 text-gray-500" />
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化过期时间
function formatExpiry(expiresAt: number): string {
  const now = Date.now()
  const diff = expiresAt - now
  if (diff <= 0) return '已过期'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}小时后过期`
  const days = Math.floor(hours / 24)
  return `${days}天后过期`
}

export default function FileTransferManager({ plugin, onPluginUpdate }: FileTransferManagerProps) {
  const { showToast } = useToast()
  const [files, setFiles] = useState<FileTransfer[]>([])
  const [stats, setStats] = useState<FileTransferStats | null>(null)
  const [settings, setSettings] = useState<FileTransferSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'files' | 'stats' | 'settings'>('files')
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [editedSettings, setEditedSettings] = useState<FileTransferSettings | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  
  // 批量操作状态
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [showBatchActions, setShowBatchActions] = useState(false)
  const [batchAction, setBatchAction] = useState<'delete' | 'extend' | 'downloads' | null>(null)
  const [batchValue, setBatchValue] = useState('')
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/v2/file-transfers/all`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('获取文件列表失败')
      const data = await res.json()
      if (data.success) {
        setFiles(data.data || [])
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '获取文件列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // 加载统计
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/v2/file-transfers/stats`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('获取统计失败')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('获取统计失败:', err)
    }
  }, [])

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/v2/file-transfers/settings`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('获取设置失败')
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
        setEditedSettings(data.data)
      }
    } catch (err) {
      console.error('获取设置失败:', err)
    }
  }, [])

  useEffect(() => {
    loadFiles()
    loadStats()
    loadSettings()
  }, [loadFiles, loadStats, loadSettings])

  // 删除文件
  const handleDelete = async (deleteCode: string) => {
    if (!confirm('确定要删除这个文件吗？')) return
    
    try {
      const res = await fetch(`/api/v2/file-transfers/${deleteCode}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) throw new Error('删除失败')
      
      showToast('success', '文件已删除')
      loadFiles()
      loadStats()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '删除失败')
    }
  }

  // 复制提取码
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    showToast('success', '提取码已复制')
  }

  // 复制下载链接
  const handleCopyLink = (extractCode: string) => {
    const url = `${window.location.origin}/api/v2/file-transfers/download/${extractCode}`
    navigator.clipboard.writeText(url)
    showToast('success', '下载链接已复制')
  }

  // 保存设置
  const handleSaveSettings = async () => {
    if (!editedSettings) return
    
    setIsSavingSettings(true)
    try {
      const res = await fetch(`/api/v2/file-transfers/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editedSettings)
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || '保存设置失败')
      }
      
      const data = await res.json()
      if (data.success) {
        setSettings(editedSettings)
        setIsEditingSettings(false)
        showToast('success', '设置已保存')
      } else {
        throw new Error(data.error || '保存设置失败')
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '保存设置失败')
    } finally {
      setIsSavingSettings(false)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditedSettings(settings)
    setIsEditingSettings(false)
  }

  // 更新编辑中的设置
  const updateEditedSetting = (key: keyof FileTransferSettings, value: any) => {
    setEditedSettings(prev => prev ? { ...prev, [key]: value } : null)
  }

  // 批量选择文件
  const toggleSelectFile = (id: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
    }
  }

  // 退出批量模式
  const exitBatchMode = () => {
    setIsBatchMode(false)
    setSelectedFiles(new Set())
    setShowBatchActions(false)
    setBatchAction(null)
    setBatchValue('')
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedFiles.size === 0) {
      showToast('error', '请先选择文件')
      return
    }
    
    if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？此操作不可撤销。`)) {
      return
    }
    
    setIsProcessingBatch(true)
    let successCount = 0
    let failCount = 0
    
    try {
      const selectedFileList = files.filter(f => selectedFiles.has(f.id))
      
      for (const file of selectedFileList) {
        try {
          const res = await fetch(`/api/v2/file-transfers/${file.deleteCode}`, {
            method: 'DELETE',
            credentials: 'include'
          })
          if (res.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }
      
      if (successCount > 0) {
        showToast('success', `成功删除 ${successCount} 个文件`)
        loadFiles()
        loadStats()
      }
      if (failCount > 0) {
        showToast('error', `${failCount} 个文件删除失败`)
      }
    } finally {
      setIsProcessingBatch(false)
      exitBatchMode()
    }
  }

  // 批量延长过期时间
  const handleBatchExtend = async () => {
    if (selectedFiles.size === 0) {
      showToast('error', '请先选择文件')
      return
    }
    
    const hours = parseInt(batchValue)
    if (isNaN(hours) || hours <= 0) {
      showToast('error', '请输入有效的小时数')
      return
    }
    
    setIsProcessingBatch(true)
    let successCount = 0
    let failCount = 0
    
    try {
      const selectedFileList = files.filter(f => selectedFiles.has(f.id))
      
      for (const file of selectedFileList) {
        try {
          const newExpiry = Date.now() + hours * 60 * 60 * 1000
          const res = await fetch(`/api/v2/file-transfers/${file.deleteCode}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ expiresAt: newExpiry })
          })
          if (res.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }
      
      if (successCount > 0) {
        showToast('success', `成功延长 ${successCount} 个文件的过期时间`)
        loadFiles()
      }
      if (failCount > 0) {
        showToast('error', `${failCount} 个文件延长失败`)
      }
    } finally {
      setIsProcessingBatch(false)
      exitBatchMode()
    }
  }

  // 批量修改下载次数
  const handleBatchUpdateDownloads = async () => {
    if (selectedFiles.size === 0) {
      showToast('error', '请先选择文件')
      return
    }
    
    const downloads = parseInt(batchValue)
    if (isNaN(downloads) || downloads <= 0) {
      showToast('error', '请输入有效的下载次数')
      return
    }
    
    setIsProcessingBatch(true)
    let successCount = 0
    let failCount = 0
    
    try {
      const selectedFileList = files.filter(f => selectedFiles.has(f.id))
      
      for (const file of selectedFileList) {
        try {
          const res = await fetch(`/api/v2/file-transfers/${file.deleteCode}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ maxDownloads: downloads })
          })
          if (res.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }
      
      if (successCount > 0) {
        showToast('success', `成功修改 ${successCount} 个文件的下载次数`)
        loadFiles()
      }
      if (failCount > 0) {
        showToast('error', `${failCount} 个文件修改失败`)
      }
    } finally {
      setIsProcessingBatch(false)
      exitBatchMode()
    }
  }

  // 过滤文件
  const filteredFiles = files.filter(file => 
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.extractCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 标签页 */}
      <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'files' 
              ? 'text-white' 
              : 'hover:text-white',
          )}
          style={{
            background: activeTab === 'files' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'files' ? 'white' : 'var(--color-text-muted)'
          }}
        >
          <Database className="w-4 h-4" />
          文件管理
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'stats' 
              ? 'text-white' 
              : 'hover:text-white',
          )}
          style={{
            background: activeTab === 'stats' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'stats' ? 'white' : 'var(--color-text-muted)'
          }}
        >
          <BarChart3 className="w-4 h-4" />
          统计分析
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'settings' 
              ? 'text-white' 
              : 'hover:text-white',
          )}
          style={{
            background: activeTab === 'settings' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'settings' ? 'white' : 'var(--color-text-muted)'
          }}
        >
          <Settings className="w-4 h-4" />
          插件设置
        </button>
      </div>

      {/* 文件管理 */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* 批量操作工具栏 */}
          {isBatchMode ? (
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{ 
                    background: 'var(--color-glass)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {selectedFiles.size === filteredFiles.length ? '取消全选' : '全选'}
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    (已选 {selectedFiles.size} 个)
                  </span>
                </button>
                {!showBatchActions ? (
                  <>
                    <button
                      onClick={() => { setShowBatchActions(true); setBatchAction('delete'); }}
                      disabled={selectedFiles.size === 0}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444'
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      批量删除
                    </button>
                    <button
                      onClick={() => { setShowBatchActions(true); setBatchAction('extend'); }}
                      disabled={selectedFiles.size === 0}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                      style={{ 
                        background: 'var(--color-glass)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Clock className="w-4 h-4" />
                      延长过期时间
                    </button>
                    <button
                      onClick={() => { setShowBatchActions(true); setBatchAction('downloads'); }}
                      disabled={selectedFiles.size === 0}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                      style={{ 
                        background: 'var(--color-glass)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Download className="w-4 h-4" />
                      修改下载次数
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    {batchAction === 'extend' && (
                      <>
                        <input
                          type="number"
                          value={batchValue}
                          onChange={(e) => setBatchValue(e.target.value)}
                          placeholder="延长小时数"
                          className="w-32 px-3 py-1.5 rounded-lg text-sm"
                          style={{ 
                            background: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-glass-border)',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                        <button
                          onClick={handleBatchExtend}
                          disabled={isProcessingBatch}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                          style={{ 
                            background: 'var(--color-primary)',
                            color: 'white'
                          }}
                        >
                          {isProcessingBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          确认
                        </button>
                      </>
                    )}
                    {batchAction === 'downloads' && (
                      <>
                        <input
                          type="number"
                          value={batchValue}
                          onChange={(e) => setBatchValue(e.target.value)}
                          placeholder="新的下载次数"
                          className="w-32 px-3 py-1.5 rounded-lg text-sm"
                          style={{ 
                            background: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-glass-border)',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                        <button
                          onClick={handleBatchUpdateDownloads}
                          disabled={isProcessingBatch}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                          style={{ 
                            background: 'var(--color-primary)',
                            color: 'white'
                          }}
                        >
                          {isProcessingBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          确认
                        </button>
                      </>
                    )}
                    {batchAction === 'delete' && (
                      <button
                        onClick={handleBatchDelete}
                        disabled={isProcessingBatch}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                        style={{ 
                          background: '#ef4444',
                          color: 'white'
                        }}
                      >
                        {isProcessingBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        确认删除 {selectedFiles.size} 个文件
                      </button>
                    )}
                    <button
                      onClick={() => { setShowBatchActions(false); setBatchAction(null); setBatchValue(''); }}
                      disabled={isProcessingBatch}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      style={{ 
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      <X className="w-4 h-4" />
                      取消
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={exitBatchMode}
                disabled={isProcessingBatch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <X className="w-4 h-4" />
                退出批量模式
              </button>
            </div>
          ) : null}
          
          {/* 搜索和刷新 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="搜索文件名或提取码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg"
                style={{ 
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
            <button
              onClick={() => { loadFiles(); loadStats(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors"
              style={{ 
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-glass-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            {!isBatchMode && (
              <button
                onClick={() => setIsBatchMode(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors"
                style={{ 
                  background: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                <Database className="w-4 h-4" />
                批量操作
              </button>
            )}
          </div>

          {/* 文件列表 */}
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-8 text-center rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
              <FileUp className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>暂无文件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => {
                const isExpired = Date.now() > file.expiresAt
                const isExhausted = file.currentDownloads >= file.maxDownloads
                const isSelected = selectedFiles.has(file.id)
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl"
                    style={{ 
                      background: isSelected ? 'var(--color-glass)' : 'var(--color-bg-tertiary)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-glass-border)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* 批量选择复选框 */}
                      {isBatchMode && (
                        <button
                          onClick={() => toggleSelectFile(file.id)}
                          className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-glass-border)',
                            background: isSelected ? 'var(--color-primary)' : 'transparent'
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>
                      )}
                      
                      <div className="p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                        <FileTypeIcon fileType={file.fileType} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {file.fileName}
                        </h4>
                        <div className="flex items-center gap-3 text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>·</span>
                          <span>{formatExpiry(file.expiresAt)}</span>
                          <span>·</span>
                          <span>下载 {file.currentDownloads}/{file.maxDownloads}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 状态标签 */}
                        <span 
                          className="px-2 py-1 rounded-full text-xs"
                          style={{
                            background: isExpired || isExhausted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: isExpired || isExhausted ? '#ef4444' : '#22c55e'
                          }}
                        >
                          {isExpired ? '已过期' : isExhausted ? '已用完' : '有效'}
                        </span>

                        {/* 提取码 */}
                        <button
                          onClick={() => handleCopy(file.extractCode)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-mono"
                          style={{ 
                            background: 'var(--color-glass)',
                            color: 'var(--color-text-primary)'
                          }}
                          title="点击复制提取码"
                        >
                          {copiedCode === file.extractCode ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {file.extractCode}
                        </button>

                        {/* 复制链接 */}
                        <button
                          onClick={() => handleCopyLink(file.extractCode)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ 
                            background: 'var(--color-glass)',
                            color: 'var(--color-text-muted)'
                          }}
                          title="复制下载链接"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* 删除 */}
                        <button
                          onClick={() => handleDelete(file.deleteCode)}
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                          style={{ color: 'var(--color-text-muted)' }}
                          title="删除文件"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 统计分析 */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>总文件数</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats.total}
            </p>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <Eye className="w-6 h-6 text-green-500" />
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>有效文件</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats.active}
            </p>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <HardDrive className="w-6 h-6 text-purple-500" />
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>总存储</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {formatFileSize(stats.totalSize)}
            </p>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <X className="w-6 h-6 text-red-500" />
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>已过期</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats.expired}
            </p>
          </div>
        </div>
      )}

      {/* 插件设置 */}
      {activeTab === 'settings' && settings && editedSettings && (
        <div className="p-6 rounded-xl space-y-6" style={{ background: 'var(--color-bg-tertiary)' }}>
          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            {isEditingSettings ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSavingSettings}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    background: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  {isSavingSettings ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSavingSettings ? '保存中...' : '保存设置'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditingSettings(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  background: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                <Settings className="w-4 h-4" />
                编辑设置
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                最大文件大小 (MB)
              </label>
              <input
                type="number"
                value={Math.round(editedSettings.maxFileSize / 1024 / 1024)}
                onChange={(e) => updateEditedSetting('maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                disabled={!isEditingSettings}
                min={1}
                max={1024}
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ 
                  background: isEditingSettings ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                当前: {formatFileSize(editedSettings.maxFileSize)}
              </p>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                默认下载次数
              </label>
              <input
                type="number"
                value={editedSettings.maxDownloads}
                onChange={(e) => updateEditedSetting('maxDownloads', parseInt(e.target.value))}
                disabled={!isEditingSettings}
                min={1}
                max={100}
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ 
                  background: isEditingSettings ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                默认有效期（小时）
              </label>
              <input
                type="number"
                value={editedSettings.maxExpiryHours}
                onChange={(e) => updateEditedSetting('maxExpiryHours', parseInt(e.target.value))}
                disabled={!isEditingSettings}
                min={1}
                max={720}
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ 
                  background: isEditingSettings ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                允许的文件类型
              </label>
              <input
                type="text"
                value={editedSettings.allowedFileTypes}
                onChange={(e) => updateEditedSetting('allowedFileTypes', e.target.value)}
                disabled={!isEditingSettings}
                placeholder="*表示允许所有类型"
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ 
                  background: isEditingSettings ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                用逗号分隔，如: jpg,png,pdf,doc
              </p>
            </div>
          </div>

          {!isEditingSettings && (
            <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: 'var(--color-glass)' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                点击"编辑设置"按钮可修改以上配置。修改后将立即生效，但不会影响已上传的文件。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
