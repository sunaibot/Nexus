/**
 * 文件提取页面
 * 用户输入提取码下载文件
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileUp, Lock, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

interface FileInfo {
  fileName: string
  fileSize: number
  fileType: string
  expiresAt: number
  maxDownloads: number
  currentDownloads: number
  hasPassword: boolean
  downloadToken: string
}

export default function FileExtractPage() {
  const { themeId } = useTheme()
  const [extractCode, setExtractCode] = useState('')
  const [password, setPassword] = useState('')
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'password' | 'result'>('input')
  const [copied, setCopied] = useState(false)

  const API_BASE_URL = '/api'

  // 验证提取码
  const handleExtract = useCallback(async () => {
    if (!extractCode.trim()) {
      setError('请输入提取码')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/v2/file-transfers/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractCode: extractCode.trim().toUpperCase(),
          password: password || undefined
        })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || '提取失败')
        return
      }

      setFileInfo(data.data)
      setStep('result')
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [extractCode, password])

  // 下载文件
  const handleDownload = useCallback(async () => {
    if (!fileInfo?.downloadToken) return
    
    const downloadUrl = `${API_BASE_URL}/v2/file-transfers/download/${fileInfo.downloadToken}`
    
    try {
      // 使用 fetch 获取文件，然后触发下载
      const response = await fetch(downloadUrl)
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '下载失败' }))
        setError(data.error || '文件下载失败')
        return
      }
      
      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = fileInfo.fileName
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/)
        if (match) {
          filename = decodeURIComponent(match[1])
        }
      }
      
      // 创建 Blob 并触发下载
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('下载错误:', err)
      setError('下载失败，请稍后重试')
    }
  }, [fileInfo])

  // 复制下载链接
  const handleCopyLink = useCallback(() => {
    if (!fileInfo?.downloadToken) return
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const downloadUrl = `${baseUrl}${API_BASE_URL}/v2/file-transfers/download/${fileInfo.downloadToken}`
    navigator.clipboard.writeText(downloadUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [fileInfo])

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化过期时间
  const formatExpiry = (expiresAt: number): string => {
    const hours = Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60))
    if (hours < 1) return '即将过期'
    if (hours < 24) return `${hours}小时后过期`
    const days = Math.floor(hours / 24)
    return `${days}天后过期`
  }

  // 获取主题颜色
  const getThemeColors = () => {
    const themes: Record<string, { bg: string; card: string; text: string; primary: string }> = {
      'dark': { bg: '#0a0a0f', card: 'rgba(255,255,255,0.05)', text: '#e2e8f0', primary: '#3b82f6' },
      'light': { bg: '#f8fafc', card: 'rgba(0,0,0,0.05)', text: '#1e293b', primary: '#3b82f6' },
      'cyberpunk': { bg: '#0a0a1a', card: 'rgba(139,92,246,0.1)', text: '#e0e7ff', primary: '#8b5cf6' },
      'nature': { bg: '#f0fdf4', card: 'rgba(34,197,94,0.1)', text: '#14532d', primary: '#22c55e' },
      'ocean': { bg: '#f0f9ff', card: 'rgba(14,165,233,0.1)', text: '#0c4a6e', primary: '#0ea5e9' },
      'sunset': { bg: '#fff7ed', card: 'rgba(249,115,22,0.1)', text: '#7c2d12', primary: '#f97316' },
    }
    return themes[themeId] || themes['dark']
  }

  const colors = getThemeColors()

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: colors.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: colors.card,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: colors.primary }}
          >
            <FileUp className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            文件提取
          </h1>
          <p className="text-sm opacity-60" style={{ color: colors.text }}>
            输入提取码获取文件
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* 输入提取码 */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  提取码
                </label>
                <input
                  type="text"
                  value={extractCode}
                  onChange={(e) => setExtractCode(e.target.value.toUpperCase())}
                  placeholder="请输入6位提取码"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl text-center text-lg tracking-widest font-mono uppercase transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `2px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    color: colors.text
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <motion.button
                onClick={handleExtract}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                style={{ background: colors.primary, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提取中...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    提取文件
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* 文件信息展示 */}
          {step === 'result' && fileInfo && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* 文件信息卡片 */}
              <div
                className="p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: colors.primary }}
                  >
                    <FileUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: colors.text }}>
                      {fileInfo.fileName}
                    </p>
                    <p className="text-sm opacity-60" style={{ color: colors.text }}>
                      {formatFileSize(fileInfo.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm" style={{ color: colors.text }}>
                  <div className="flex justify-between">
                    <span className="opacity-60">有效期</span>
                    <span>{formatExpiry(fileInfo.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">下载次数</span>
                    <span>{fileInfo.currentDownloads} / {fileInfo.maxDownloads}</span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-2">
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                  style={{ background: colors.primary }}
                >
                  <Download className="w-5 h-5" />
                  立即下载
                </motion.button>

                <motion.button
                  onClick={handleCopyLink}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: colors.text
                  }}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      复制下载链接
                    </>
                  )}
                </motion.button>
              </div>

              {/* 返回按钮 */}
              <button
                onClick={() => {
                  setStep('input')
                  setExtractCode('')
                  setPassword('')
                  setFileInfo(null)
                  setError('')
                }}
                className="w-full py-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: colors.text }}
              >
                提取其他文件
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 pt-4 text-center space-y-2">
          <div className="text-xs opacity-40" style={{ color: colors.text }}>
            文件将在过期后自动删除，请及时下载
          </div>
          <a 
            href="/" 
            className="text-xs opacity-60 hover:opacity-100 transition-opacity inline-flex items-center gap-1"
            style={{ color: colors.primary }}
          >
            <FileUp className="w-3 h-3" />
            需要上传文件？点击这里
          </a>
        </div>
      </motion.div>
    </div>
  )
}
