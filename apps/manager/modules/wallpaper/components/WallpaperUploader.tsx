'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Image, X, Check } from 'lucide-react'

interface WallpaperUploaderProps {
  currentImage?: string | null
  onUpload: (file: File) => Promise<string>
  onClear: () => void
}

export function WallpaperUploader({ currentImage, onUpload, onClear }: WallpaperUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    // 创建本地预览
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setIsUploading(true)

    try {
      const uploadedUrl = await onUpload(file)
      setPreviewUrl(uploadedUrl)
    } catch (error) {
      // 上传失败，恢复之前的图片
      setPreviewUrl(currentImage || null)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
      // 清除文件输入，允许再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClear = () => {
    setPreviewUrl(null)
    onClear()
  }

  return (
    <div className="space-y-3">
      {/* 上传区域 */}
      <div className="flex gap-4">
        {/* 上传按钮 */}
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition-all disabled:opacity-50"
          style={{ borderColor: 'var(--color-glass-border)' }}
        >
          {isUploading ? (
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" 
              style={{ color: 'var(--color-text-muted)' }}
            />
          ) : (
            <Upload className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
          )}
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {isUploading ? '上传中...' : '点击上传壁纸'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              支持 JPG、PNG、WebP，最大 5MB
            </p>
          </div>
        </motion.button>

        {/* 预览缩略图 */}
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0"
            style={{ 
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-glass-border)'
            }}
          >
            <img 
              src={previewUrl} 
              alt="壁纸预览" 
              className="w-full h-full object-cover"
            />
            {/* 清除按钮 */}
            <button
              onClick={handleClear}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            {/* 已上传标记 */}
            {!isUploading && (
              <div className="absolute bottom-1 right-1 p-1 rounded-full bg-green-500/80">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>
        )}

        {/* 空状态占位 */}
        {!previewUrl && (
          <div 
            className="w-32 h-32 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-glass-border)'
            }}
          >
            <Image className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
