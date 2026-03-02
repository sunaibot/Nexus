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

  const API_BASE = 'http://localhost:8787'

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v2/file-transfers/all`, {
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
      const res = await fetch(`${API_BASE}/api/v2/file-transfers/stats`, {
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
      const res = await fetch(`${API_BASE}/api/v2/file-transfers/settings`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('获取设置失败')
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
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
      const res = await fetch(`${API_BASE}/api/v2/file-transfers/${deleteCode}`, {
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
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl"
                    style={{ 
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-glass-border)'
                    }}
                  >
                    <div className="flex items-center gap-4">
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
      {activeTab === 'settings' && settings && (
        <div className="p-6 rounded-xl space-y-6" style={{ background: 'var(--color-bg-tertiary)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                最大文件大小
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formatFileSize(settings.maxFileSize)}
                  disabled
                  className="flex-1 px-4 py-2.5 rounded-lg"
                  style={{ 
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                默认下载次数
              </label>
              <input
                type="number"
                value={settings.maxDownloads}
                disabled
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ 
                  background: 'var(--color-bg-secondary)',
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
                value={settings.maxExpiryHours}
                disabled
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ 
                  background: 'var(--color-bg-secondary)',
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
                value={settings.allowedFileTypes}
                disabled
                className="w-full px-4 py-2.5 rounded-lg"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: 'var(--color-glass)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              设置修改功能即将推出，如需修改请联系管理员。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
