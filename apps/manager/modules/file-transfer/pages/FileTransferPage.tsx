import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  FileUp,
  Trash2,
  Download,
  Copy,
  RefreshCw,
  File,
  Image,
  Video,
  Music,
  FileText,
  Eye,
  X,
  Check,
  AlertCircle,
  Upload,
  Search,
  Filter,
  Calendar,
  HardDrive,
  MoreVertical,
  ChevronDown,
  BarChart3,
  Settings,
  Link,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderOpen,
  Save,
  CheckCircle,
  XCircle as XCircleIcon,
  Info
} from 'lucide-react'
import { useFileTransfers } from '../hooks/useFileTransfers'
import { fileTransferApi } from '../api'
import type { FileTransfer } from '../types'

// 文件类型图标
function FileTypeIcon({ fileType, className = 'w-5 h-5' }: { fileType: string; className?: string }) {
  if (fileType?.startsWith('image/')) return <Image className={`${className} text-blue-500`} />
  if (fileType?.startsWith('video/')) return <Video className={`${className} text-red-500`} />
  if (fileType?.startsWith('audio/')) return <Music className={`${className} text-purple-500`} />
  if (fileType?.includes('pdf')) return <FileText className={`${className} text-red-600`} />
  if (fileType?.includes('text')) return <FileText className={`${className} text-gray-600`} />
  return <File className={`${className} text-gray-500`} />
}

// 状态标签
function StatusBadge({ file }: { file: FileTransfer }) {
  const isExpired = file.expiresAt && Date.now() > file.expiresAt
  const isExhausted = file.currentDownloads >= file.maxDownloads && file.maxDownloads > 0
  const isActive = !isExpired && !isExhausted

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">
        <XCircle className="w-3 h-3" />
        已过期
      </span>
    )
  }

  if (isExhausted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20">
        <AlertTriangle className="w-3 h-3" />
        已用完
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500 border border-green-500/20">
      <CheckCircle2 className="w-3 h-3" />
      有效
    </span>
  )
}

// 下载进度条
function DownloadProgress({ current, max }: { current: number; max: number }) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const isExhausted = current >= max && max > 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isExhausted ? 'bg-red-500' : percentage > 80 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs whitespace-nowrap ${isExhausted ? 'text-red-500' : 'text-gray-500'}`}>
        {current}/{max === 0 ? '∞' : max}
      </span>
    </div>
  )
}

// 文件列表项
function FileTransferItem({
  file,
  onDelete,
  formatFileSize,
  formatExpiry,
  onViewDetails,
  selected,
  onSelect
}: {
  file: FileTransfer
  onDelete: (deleteCode: string) => void
  formatFileSize: (bytes: number) => string
  formatExpiry: (expiresAt: number) => string
  onViewDetails: (file: FileTransfer) => void
  selected: boolean
  onSelect: (checked: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const downloadUrl = `${baseUrl}/api/file-transfers/download/${file.downloadToken || file.extractCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(downloadUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isExpired = file.expiresAt && Date.now() > file.expiresAt
  const isExhausted = file.currentDownloads >= file.maxDownloads && file.maxDownloads > 0

  return (
    <div
      className={`group flex items-center gap-4 p-4 rounded-lg border transition-all ${
        selected
          ? 'bg-blue-500/5 border-blue-500/30'
          : 'bg-[var(--color-glass)] border-[var(--color-glass-border)] hover:border-blue-500/30 hover:shadow-md'
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
      />

      <div className="p-2 bg-[var(--color-glass-hover)] rounded-lg">
        <FileTypeIcon fileType={file.fileType} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className="font-medium truncate cursor-pointer hover:text-blue-500 transition-colors"
            title={file.fileName}
            style={{ color: 'var(--color-text)' }}
            onClick={() => onViewDetails(file)}
          >
            {file.fileName}
          </h4>
          <StatusBadge file={file} />
        </div>
        <div className="flex items-center gap-4 text-sm mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            {formatFileSize(file.fileSize)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatExpiry(file.expiresAt)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <DownloadProgress current={file.currentDownloads || 0} max={file.maxDownloads || 0} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
          title="复制下载链接"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>

        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
          title="下载"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Download className="w-4 h-4" />
        </a>

        <button
          onClick={() => onViewDetails(file)}
          className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
          title="查看详情"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(file.deleteCode)}
          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// 文件详情弹窗
function FileDetailModal({
  file,
  isOpen,
  onClose,
  formatFileSize,
  formatExpiry
}: {
  file: FileTransfer | null
  isOpen: boolean
  onClose: () => void
  formatFileSize: (bytes: number) => string
  formatExpiry: (expiresAt: number) => string
}) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!isOpen || !file) return null

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const downloadUrl = `${baseUrl}/api/file-transfers/download/${file.downloadToken || file.extractCode}`
  const extractUrl = `${baseUrl}/file-transfer?code=${file.extractCode}`

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const isExpired = file.expiresAt && Date.now() > file.expiresAt
  const isExhausted = file.currentDownloads >= file.maxDownloads && file.maxDownloads > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--color-glass)] rounded-xl border border-[var(--color-glass-border)] shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-glass-border)]">
          <div className="flex items-center gap-3">
            <FileTypeIcon fileType={file.fileType} className="w-6 h-6" />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              文件详情
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 文件名 */}
          <div>
            <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              文件名
            </label>
            <p className="mt-1 font-medium break-all" style={{ color: 'var(--color-text)' }}>
              {file.fileName}
            </p>
          </div>

          {/* 状态 */}
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                状态
              </label>
              <div className="mt-1">
                <StatusBadge file={file} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                文件大小
              </label>
              <p className="mt-1 font-medium" style={{ color: 'var(--color-text)' }}>
                {formatFileSize(file.fileSize)}
              </p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                文件类型
              </label>
              <p className="mt-1 font-medium" style={{ color: 'var(--color-text)' }}>
                {file.fileType || '未知'}
              </p>
            </div>
          </div>

          {/* 下载统计 */}
          <div>
            <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              下载统计
            </label>
            <div className="mt-2 p-3 bg-[var(--color-glass-hover)] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: 'var(--color-text-muted)' }}>下载进度</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {file.currentDownloads || 0} / {file.maxDownloads || 0}
                </span>
              </div>
              <DownloadProgress current={file.currentDownloads || 0} max={file.maxDownloads || 0} />
            </div>
          </div>

          {/* 时间信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                创建时间
              </label>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>
                {file.createdAt ? new Date(file.createdAt).toLocaleString('zh-CN') : '未知'}
              </p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                过期时间
              </label>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>
                {file.expiresAt ? new Date(file.expiresAt).toLocaleString('zh-CN') : '未知'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {formatExpiry(file.expiresAt)}
              </p>
            </div>
          </div>

          {/* 链接 */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              分享链接
            </label>

            {/* 提取页面链接 */}
            <div className="flex items-center gap-2 p-2 bg-[var(--color-glass-hover)] rounded-lg">
              <Link className="w-4 h-4 text-blue-500" />
              <input
                type="text"
                value={extractUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-text)' }}
              />
              <button
                onClick={() => handleCopy(extractUrl, 'extract')}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {copied === 'extract' ? '已复制' : '复制'}
              </button>
            </div>

            {/* 直接下载链接 */}
            <div className="flex items-center gap-2 p-2 bg-[var(--color-glass-hover)] rounded-lg">
              <Download className="w-4 h-4 text-green-500" />
              <input
                type="text"
                value={downloadUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-text)' }}
              />
              <button
                onClick={() => handleCopy(downloadUrl, 'download')}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                {copied === 'download' ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          {/* 提取码 */}
          <div>
            <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              提取码
            </label>
            <div className="mt-1 flex items-center gap-2">
              <code className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg font-mono text-lg">
                {file.extractCode}
              </code>
              <button
                onClick={() => handleCopy(file.extractCode, 'code')}
                className="p-1.5 rounded hover:bg-[var(--color-glass-hover)] transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {copied === 'code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--color-glass-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--color-glass-border)] hover:bg-[var(--color-glass-hover)] transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            关闭
          </button>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载文件
          </a>
        </div>
      </div>
    </div>
  )
}

// 上传区域
function UploadZone({ onUpload, uploading }: { onUpload: (file: File) => void; uploading: boolean }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onUpload(files[0])
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-500/5'
          : 'border-[var(--color-glass-border)] hover:border-blue-500/50'
        }
      `}
    >
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
      <div className="flex flex-col items-center gap-2">
        <div className="p-4 bg-blue-500/10 rounded-full">
          {uploading ? (
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-blue-500" />
          )}
        </div>
        <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
          {uploading ? '上传中...' : '点击或拖拽文件到此处上传'}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          支持任意文件类型，单文件最大 100MB
        </p>
      </div>
    </div>
  )
}

// 统计卡片
function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue'
}: {
  title: string
  value: number
  icon: React.ElementType
  trend?: string
  color?: 'blue' | 'green' | 'red' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    orange: 'bg-orange-500/10 text-orange-500'
  }

  return (
    <div className="p-5 bg-[var(--color-glass)] rounded-xl border border-[var(--color-glass-border)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{value}</p>
          {trend && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

// Tab 按钮
function TabButton({
  active,
  onClick,
  children,
  icon: Icon
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: React.ElementType
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
          : 'hover:bg-[var(--color-glass-hover)]'
      }`}
      style={active ? {} : { color: 'var(--color-text)' }}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

// 存储路径设置组件
function StoragePathSettings() {
  const [paths, setPaths] = useState<import('../types').StoragePathInfo[]>([])
  const [isDocker, setIsDocker] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationResult, setValidationResult] = useState<import('../types').PathValidationResponse | null>(null)
  const [selectedPath, setSelectedPath] = useState('')

  useEffect(() => {
    loadPaths()
  }, [])

  const loadPaths = async () => {
    setLoading(true)
    try {
      const data = await fileTransferApi.fetchStoragePaths()
      setPaths(data.paths)
      setIsDocker(data.isDocker)
      setCurrentPath(data.currentPath)
      setSelectedPath(data.currentPath)
    } catch (err) {
      console.error('加载存储路径失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleValidateCustomPath = async () => {
    if (!customPath.trim()) return
    try {
      const result = await fileTransferApi.validateStoragePath(customPath.trim())
      setValidationResult(result)
      if (result.usable) {
        setSelectedPath(customPath.trim())
      }
    } catch (err) {
      console.error('验证路径失败:', err)
    }
  }

  const handleSave = async () => {
    if (!selectedPath) return
    setSaving(true)
    try {
      await fileTransferApi.updateSettings({ storagePath: selectedPath })
      alert('存储路径已保存')
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Docker 环境提示 */}
      {isDocker && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-500">Docker 环境检测</p>
              <p className="text-sm text-blue-500/80 mt-1">
                当前运行在 Docker 容器中，建议使用数据卷挂载点 (/data/uploads) 以持久化存储文件。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 推荐路径列表 */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <FolderOpen className="w-4 h-4" />
          选择存储路径
        </h4>
        <div className="space-y-2">
          {paths.map((path) => (
            <div
              key={path.value}
              onClick={() => path.usable && setSelectedPath(path.value)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedPath === path.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : path.usable
                  ? 'border-[var(--color-glass-border)] hover:border-blue-500/50'
                  : 'border-red-500/30 bg-red-500/5 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${path.usable ? 'text-green-500' : 'text-red-500'}`}>
                  {path.usable ? <CheckCircle className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {path.label}
                    </span>
                    {path.recommended && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
                        推荐
                      </span>
                    )}
                    {currentPath === path.value && (
                      <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-500 rounded-full">
                        当前使用
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {path.description}
                  </p>
                  <p className="text-xs mt-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    完整路径: {path.fullPath}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className={path.exists ? 'text-green-500' : 'text-orange-500'}>
                      {path.exists ? '✓ 目录存在' : '⚠ 目录不存在（将自动创建）'}
                    </span>
                    <span className={path.writable ? 'text-green-500' : 'text-red-500'}>
                      {path.writable ? '✓ 可写入' : '✗ 不可写入'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 自定义路径 */}
      <div>
        <h4 className="font-medium mb-3" style={{ color: 'var(--color-text)' }}>
          自定义路径
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="输入自定义路径，如: /mnt/data/uploads"
            className="flex-1 px-4 py-2 bg-[var(--color-glass)] border border-[var(--color-glass-border)] rounded-lg text-sm"
            style={{ color: 'var(--color-text)' }}
          />
          <button
            onClick={handleValidateCustomPath}
            disabled={!customPath.trim()}
            className="px-4 py-2 bg-[var(--color-glass)] border border-[var(--color-glass-border)] rounded-lg text-sm hover:bg-[var(--color-glass-hover)] disabled:opacity-50"
            style={{ color: 'var(--color-text)' }}
          >
            验证
          </button>
        </div>
        {validationResult && (
          <div className={`mt-2 p-3 rounded-lg text-sm ${
            validationResult.usable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {validationResult.usable ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>路径可用{validationResult.created ? '（已自动创建）' : ''}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircleIcon className="w-4 h-4" />
                <span>路径不可用，请检查权限</span>
              </div>
            )}
            <p className="text-xs mt-1 opacity-80">完整路径: {validationResult.fullPath}</p>
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-glass-border)]">
        <button
          onClick={handleSave}
          disabled={saving || !selectedPath}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// 主页面
export default function FileTransferPage() {
  const {
    files,
    settings,
    stats,
    loading,
    uploading,
    fetchFiles,
    fetchSettings,
    fetchStats,
    deleteFile,
    uploadFile,
    formatFileSize,
    formatExpiry
  } = useFileTransfers()

  const [activeTab, setActiveTab] = useState('files')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'exhausted'>('all')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [detailFile, setDetailFile] = useState<FileTransfer | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    fetchFiles()
    fetchStats()
    fetchSettings()
  }, [fetchFiles, fetchStats, fetchSettings])

  // 筛选文件
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // 搜索筛选
      const matchesSearch =
        !searchQuery ||
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.extractCode.toLowerCase().includes(searchQuery.toLowerCase())

      // 状态筛选
      const isExpired = !!(file.expiresAt && Date.now() > file.expiresAt)
      const isExhausted = !!(file.currentDownloads >= file.maxDownloads && file.maxDownloads > 0)

      let matchesStatus = true
      if (statusFilter === 'active') matchesStatus = !isExpired && !isExhausted
      else if (statusFilter === 'expired') matchesStatus = isExpired
      else if (statusFilter === 'exhausted') matchesStatus = isExhausted

      return matchesSearch && matchesStatus
    })
  }, [files, searchQuery, statusFilter])

  // 全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }

  // 单选
  const handleSelectFile = (id: string, checked: boolean) => {
    const newSet = new Set(selectedFiles)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedFiles(newSet)
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) return

    const filesToDelete = files.filter(f => selectedFiles.has(f.id))
    for (const file of filesToDelete) {
      await deleteFile(file.deleteCode)
    }
    setSelectedFiles(new Set())
  }

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file)
      setActiveTab('files')
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleViewDetails = (file: FileTransfer) => {
    setDetailFile(file)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            文件快传
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            管理文件上传、下载和分享链接
          </p>
        </div>
        <button
          onClick={() => { fetchFiles(); fetchStats() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-glass-border)] hover:bg-[var(--color-glass-hover)] transition-colors"
          style={{ color: 'var(--color-text)' }}
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="总文件数" value={stats.total} icon={File} color="blue" />
          <StatsCard title="有效文件" value={stats.active} icon={CheckCircle2} color="green" trend="可正常下载" />
          <StatsCard title="已过期" value={stats.expired} icon={XCircle} color="red" />
          <StatsCard
            title="已用完"
            value={stats.total - stats.active - stats.expired}
            icon={AlertTriangle}
            color="orange"
          />
        </div>
      )}

      {/* Tab 导航 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-[var(--color-glass)] rounded-xl border border-[var(--color-glass-border)] w-fit">
          <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={File}>
            文件列表
          </TabButton>
          <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={Upload}>
            上传文件
          </TabButton>
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings}>
            设置
          </TabButton>
        </div>

        {activeTab === 'files' && selectedFiles.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              已选择 {selectedFiles.size} 项
            </span>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              批量删除
            </button>
          </div>
        )}
      </div>

      {/* Tab 内容 */}
      <div>
        {activeTab === 'files' && (
          <div className="space-y-4">
            {/* 搜索和筛选 */}
            <div className="flex items-center gap-4 p-4 bg-[var(--color-glass)] rounded-xl border border-[var(--color-glass-border)]">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="搜索文件名或提取码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-glass-border)] bg-transparent focus:border-blue-500 focus:outline-none transition-colors"
                  style={{ color: 'var(--color-text)' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-[var(--color-glass-border)] bg-transparent focus:border-blue-500 focus:outline-none"
                style={{ color: 'var(--color-text)' }}
              >
                <option value="all">全部状态</option>
                <option value="active">有效</option>
                <option value="expired">已过期</option>
                <option value="exhausted">已用完</option>
              </select>
            </div>

            {/* 文件列表 */}
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--color-text-muted)' }} />
                <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--color-glass-border)' }}>
                <File className="w-12 h-12 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
                <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  {searchQuery || statusFilter !== 'all' ? '没有匹配的文件' : '暂无文件'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    className="mt-4 px-4 py-2 rounded-lg border border-[var(--color-glass-border)] hover:bg-[var(--color-glass-hover)] transition-colors"
                    style={{ color: 'var(--color-text)' }}
                    onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
                  >
                    清除筛选
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* 表头 */}
                <div className="flex items-center gap-4 px-4 py-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="flex-1">文件信息</span>
                  <span className="w-32 text-center">操作</span>
                </div>

                {/* 文件项 */}
                {filteredFiles.map(file => (
                  <FileTransferItem
                    key={file.id}
                    file={file}
                    onDelete={deleteFile}
                    formatFileSize={formatFileSize}
                    formatExpiry={formatExpiry}
                    onViewDetails={handleViewDetails}
                    selected={selectedFiles.has(file.id)}
                    onSelect={(checked) => handleSelectFile(file.id, checked)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="p-6 bg-[var(--color-glass)] rounded-xl border border-[var(--color-glass-border)]">
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--color-text)' }}>上传文件</h3>
            <UploadZone onUpload={handleUpload} uploading={uploading} />

            {settings && (
              <div className="mt-6 p-4 bg-[var(--color-glass-hover)] rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Settings className="w-4 h-4" />
                  上传限制
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    <span>最大文件大小: {formatFileSize(settings.maxFileSize)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>默认下载次数: {settings.maxDownloads} 次</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>默认有效期: {settings.maxExpiryHours} 小时</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    <span>允许的文件类型: {settings.allowedFileTypes}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* 存储路径设置 */}
            <div className="p-6 bg-[var(--color-glass)] rounded-xl border border-[var(--color-glass-border)]">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <FolderOpen className="w-5 h-5" />
                存储路径设置
              </h3>
              <StoragePathSettings />
            </div>

            {/* 其他设置 */}
            <div className="p-6 bg-[var(--color-glass)] rounded-xl border border-[var(--color-glass-border)]">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Settings className="w-5 h-5" />
                文件快传设置
              </h3>
              {settings ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-[var(--color-glass-hover)] rounded-lg">
                      <label className="block text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <HardDrive className="w-4 h-4" />
                        最大文件大小
                      </label>
                      <div className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                        {formatFileSize(settings.maxFileSize)}
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--color-glass-hover)] rounded-lg">
                      <label className="block text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <Download className="w-4 h-4" />
                        默认下载次数
                      </label>
                      <div className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                        {settings.maxDownloads} 次
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--color-glass-hover)] rounded-lg">
                      <label className="block text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock className="w-4 h-4" />
                        默认有效期
                      </label>
                      <div className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                        {settings.maxExpiryHours} 小时
                      </div>
                    </div>
                    <div className="p-4 bg-[var(--color-glass-hover)] rounded-lg">
                      <label className="block text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <File className="w-4 h-4" />
                        允许的文件类型
                      </label>
                      <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        {settings.allowedFileTypes}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      其他设置修改功能即将推出，如需修改请联系管理员。
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>加载设置中...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      <FileDetailModal
        file={detailFile}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        formatFileSize={formatFileSize}
        formatExpiry={formatExpiry}
      />
    </div>
  )
}
