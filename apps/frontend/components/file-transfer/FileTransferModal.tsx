import React, { useState, useRef, useCallback } from 'react'
import { X, Upload, File, Copy, Check, Download, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { request } from '@/lib/api-legacy'

interface FileTransferModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UploadResult {
  extractCode: string
  downloadToken: string
  deleteCode: string
  expiresAt: number
  maxDownloads: number
}

export function FileTransferModal({ isOpen, onClose }: FileTransferModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [extractCode, setExtractCode] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1]

          const response = await request<{ success: boolean; data: UploadResult }>(
            '/v2/file-transfers/upload',
            {
              method: 'POST',
              body: JSON.stringify({
                fileData: base64Data,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type || 'application/octet-stream',
              }),
            }
          )

          if (response.success) {
            setUploadResult(response.data)
          } else {
            setError('上传失败')
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : '上传失败')
        } finally {
          setUploading(false)
        }
      }
      reader.onerror = () => {
        setError('读取文件失败')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('上传失败')
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }, [])

  const handleCopyLink = useCallback(() => {
    if (uploadResult) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      // 使用 downloadToken 而非 extractCode，增加安全性
      const downloadUrl = `${baseUrl}/api/v2/file-transfers/download/${uploadResult.downloadToken}`
      navigator.clipboard.writeText(downloadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [uploadResult])

  const handleCopyExtractCode = useCallback(() => {
    if (uploadResult) {
      navigator.clipboard.writeText(uploadResult.extractCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [uploadResult])

  const handleReset = useCallback(() => {
    setUploadResult(null)
    setError(null)
    setCopied(false)
  }, [])

  const handleDownload = useCallback(() => {
    if (uploadResult?.downloadToken) {
      window.open(`/api/v2/file-transfers/download/${uploadResult.downloadToken}`, '_blank')
    }
  }, [uploadResult])

  const formatExpiry = (expiresAt: number): string => {
    const hours = Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60))
    if (hours < 24) return `${hours}小时`
    const days = Math.floor(hours / 24)
    return `${days}天`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg rounded-2xl p-6"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          </button>

          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            文件快传
          </h2>

          {uploadResult ? (
            // 上传成功结果
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  上传成功！
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  文件已准备好分享
                </p>
              </div>

              <div className="space-y-4">
                {/* 提取码 */}
                <div>
                  <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                    提取码
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={uploadResult.extractCode}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg border text-center font-mono text-lg tracking-wider"
                      style={{ 
                        background: 'var(--color-glass-hover)',
                        borderColor: 'var(--color-glass-border)',
                        color: 'var(--color-text)'
                      }}
                    />
                    <button
                      onClick={handleCopyExtractCode}
                      className="px-4 py-2 rounded-lg border hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--color-glass-border)' }}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 下载链接 */}
                <div>
                  <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                    下载链接
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/v2/file-transfers/download/${uploadResult.downloadToken}`}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg border text-sm"
                      style={{ 
                        background: 'var(--color-glass-hover)',
                        borderColor: 'var(--color-glass-border)',
                        color: 'var(--color-text)'
                      }}
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 rounded-lg border hover:bg-white/10 transition-colors"
                      style={{ borderColor: 'var(--color-glass-border)' }}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 信息提示 */}
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    有效期 {formatExpiry(uploadResult.expiresAt)}，最多下载 {uploadResult.maxDownloads} 次
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  继续上传
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border hover:bg-white/10 transition-colors"
                  style={{ borderColor: 'var(--color-glass-border)', color: 'var(--color-text)' }}
                >
                  关闭
                </button>
              </div>
            </div>
          ) : (
            // 上传区域
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-500/5 scale-[1.02]' 
                    : 'border-white/20 hover:border-blue-500/50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-glass-hover)' }}
                  >
                    {uploading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Upload className="w-8 h-8 text-blue-500" />
                      </motion.div>
                    ) : (
                      <Upload className="w-8 h-8 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {uploading ? '上传中...' : '点击或拖拽文件到此处'}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      支持任意文件类型，单文件最大 100MB
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {error}
                  </p>
                </div>
              )}

              {/* 下载文件区域 */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  已有提取码？
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入提取码"
                    value={extractCode}
                    onChange={(e) => setExtractCode(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border text-sm"
                    style={{ 
                      background: 'var(--color-glass-hover)',
                      borderColor: 'var(--color-glass-border)',
                      color: 'var(--color-text)'
                    }}
                  />
                  <button
                    onClick={handleDownload}
                    disabled={!extractCode}
                    className="px-4 py-2 rounded-lg border hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ borderColor: 'var(--color-glass-border)', color: 'var(--color-text)' }}
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FileTransferModal
