'use client'

import { motion } from 'framer-motion'
import { Monitor, ImageOff } from 'lucide-react'
import type { WallpaperSettings as LocalWallpaperSettings } from '../types'
import type { WallpaperSettings as ApiWallpaperSettings } from '@/lib/api'

type WallpaperSettings = LocalWallpaperSettings | ApiWallpaperSettings

interface WallpaperPreviewProps {
  settings: WallpaperSettings
  title?: string
}

export function WallpaperPreview({ settings, title = '壁纸预览' }: WallpaperPreviewProps) {
  const { enabled, source, imageData, imageUrl, blur, overlay = 30 } = settings

  // 获取预览图片URL
  const getPreviewUrl = (): string | null => {
    if (!enabled) return null

    switch (source) {
      case 'upload':
        return imageData || null
      case 'url':
        return imageUrl || null
      case 'unsplash':
        return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
      default:
        return null
    }
  }

  const previewUrl = getPreviewUrl()

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ 
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-glass-border)'
      }}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 p-4 border-b"
        style={{ borderColor: 'var(--color-glass-border)' }}
      >
        <Monitor className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {title}
        </span>
      </div>

      {/* 预览区域 */}
      <div className="p-4">
        <div 
          className="relative rounded-lg overflow-hidden aspect-video"
          style={{ 
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-glass-border)'
          }}
        >
          {previewUrl ? (
            <>
              {/* 壁纸图片 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${previewUrl})`,
                  filter: `blur(${blur}px)`,
                }}
              />
              
              {/* 遮罩层 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${overlay / 100})`,
                }}
              />

              {/* 模拟内容 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <h3 
                  className="text-xl font-bold mb-2 relative z-10"
                  style={{ 
                    color: overlay > 50 ? 'rgba(255,255,255,0.9)' : 'var(--color-text-primary)'
                  }}
                >
                  网站标题
                </h3>
                <p 
                  className="text-sm relative z-10"
                  style={{ 
                    color: overlay > 50 ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)'
                  }}
                >
                  探索精选网站导航
                </p>
              </div>
            </>
          ) : (
            /* 无壁纸状态 */
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ImageOff className="w-12 h-12 mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                未启用壁纸
              </p>
            </div>
          )}
        </div>

        {/* 设置信息 */}
        {enabled && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-2 rounded-lg text-center"
              style={{ background: 'var(--color-bg-primary)' }}
            >
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>来源</div>
              <div className="text-sm font-medium">
                {source === 'upload' ? '本地上传' : 
                 source === 'url' ? '图片链接' : 
                 source === 'unsplash' ? 'Unsplash' : '预设'}
              </div>
            </div>
            <div className="p-2 rounded-lg text-center"
              style={{ background: 'var(--color-bg-primary)' }}
            >
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>模糊度</div>
              <div className="text-sm font-medium">{blur}px</div>
            </div>
            <div className="p-2 rounded-lg text-center"
              style={{ background: 'var(--color-bg-primary)' }}
            >
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>遮罩</div>
              <div className="text-sm font-medium">{overlay}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
