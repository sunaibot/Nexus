'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  Film,
  Volume2,
  VolumeX,
  Upload,
  Link,
  Play,
  Pause,
  Gauge,
  AlertCircle
} from 'lucide-react'
import type { DynamicWallpaperSettings as DynamicWallpaperSettingsType } from '../types'

interface DynamicWallpaperSettingsProps {
  settings: DynamicWallpaperSettingsType
  onChange: (settings: DynamicWallpaperSettingsType) => void
  onUpload: (file: File) => Promise<string>
}

const PLAYBACK_SPEEDS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '正常' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
]

export function DynamicWallpaperSettings({
  settings,
  onChange,
  onUpload
}: DynamicWallpaperSettingsProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState(settings.videoUrl || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const updateSettings = (updates: Partial<DynamicWallpaperSettingsType>) => {
    onChange({ ...settings, ...updates })
  }

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setUploadError('请上传 MP4、WebM、OGG 视频或 GIF 文件')
      return
    }

    // 验证文件大小 (最大 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('文件大小不能超过 50MB')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      const url = await onUpload(file)
      if (file.type === 'image/gif') {
        updateSettings({ gifUrl: url, videoUrl: undefined })
      } else {
        updateSettings({ videoUrl: url, gifUrl: undefined })
      }
    } catch (err) {
      setUploadError('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  // 处理URL提交
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    
    // 简单的URL验证
    const isGif = urlInput.toLowerCase().endsWith('.gif')
    if (isGif) {
      updateSettings({ gifUrl: urlInput, videoUrl: undefined })
    } else {
      updateSettings({ videoUrl: urlInput, gifUrl: undefined })
    }
  }

  // 切换播放状态
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const hasMedia = settings.videoUrl || settings.gifUrl

  return (
    <div className="space-y-6">
      {/* 启用开关 */}
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
            <Film className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div>
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>启用动态壁纸</h4>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>使用视频或 GIF 作为背景</p>
          </div>
        </div>
        <button
          onClick={() => updateSettings({ enabled: !settings.enabled })}
          className="relative w-14 h-7 rounded-full transition-all duration-300"
          style={{
            background: settings.enabled
              ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
              : 'var(--color-glass)',
            boxShadow: settings.enabled ? '0 0 20px var(--color-glow)' : 'inset 0 2px 4px rgba(0,0,0,0.2)',
            border: `2px solid ${settings.enabled ? 'transparent' : 'var(--color-glass-border)'}`
          }}
        >
          <motion.div
            animate={{ x: settings.enabled ? 28 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* 来源选择 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === 'upload' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                color: activeTab === 'upload' ? 'white' : 'var(--color-text-muted)'
              }}
            >
              <Upload className="w-4 h-4" />
              本地上传
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === 'url' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                color: activeTab === 'url' ? 'white' : 'var(--color-text-muted)'
              }}
            >
              <Link className="w-4 h-4" />
              外部链接
            </button>
          </div>

          {/* 上传区域 */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {!hasMedia ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-primary"
                  style={{ borderColor: 'var(--color-glass-border)' }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Video className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                      )}
                    </div>
                    <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {isUploading ? '上传中...' : '点击上传视频或 GIF'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      支持 MP4、WebM、OGG 和 GIF 格式，最大 50MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-glass-border)' }}>
                  {/* 预览 */}
                  <div className="relative aspect-video bg-black">
                    {settings.videoUrl ? (
                      <video
                        ref={videoRef}
                        src={settings.videoUrl}
                        className="w-full h-full object-contain"
                        loop
                        muted={settings.muted}
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    ) : settings.gifUrl ? (
                      <img
                        src={settings.gifUrl}
                        alt="GIF preview"
                        className="w-full h-full object-contain"
                      />
                    ) : null}
                    
                    {/* 播放控制 */}
                    {settings.videoUrl && (
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          {isPlaying ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white ml-1" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                  
                  {/* 操作栏 */}
                  <div className="flex items-center justify-between p-3" style={{ background: 'var(--color-bg-secondary)' }}>
                    <span className="text-sm truncate flex-1 mr-4" style={{ color: 'var(--color-text-muted)' }}>
                      {settings.videoUrl || settings.gifUrl}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}
                      >
                        更换
                      </button>
                      <button
                        onClick={() => updateSettings({ videoUrl: undefined, gifUrl: undefined })}
                        className="px-3 py-1.5 rounded-lg text-sm bg-red-500/20 text-red-500"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)' }}>
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* URL输入 */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="flex-1 px-4 py-2.5 rounded-lg border bg-transparent text-sm"
                  style={{
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--color-primary)' }}
                >
                  应用
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                支持直接链接到 MP4、WebM、OGG 视频文件或 GIF 图片
              </p>

              {hasMedia && (
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-glass-border)' }}>
                  <div className="relative aspect-video bg-black">
                    {settings.videoUrl ? (
                      <video
                        src={settings.videoUrl}
                        className="w-full h-full object-contain"
                        loop
                        muted={settings.muted}
                        autoPlay
                        playsInline
                      />
                    ) : settings.gifUrl ? (
                      <img
                        src={settings.gifUrl}
                        alt="GIF preview"
                        className="w-full h-full object-contain"
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 播放设置 */}
          {hasMedia && (
            <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
              <h4 className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>播放设置</h4>
              
              {/* 静音开关 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.muted ? (
                    <VolumeX className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  ) : (
                    <Volume2 className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  )}
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>静音播放</span>
                </div>
                <button
                  onClick={() => updateSettings({ muted: !settings.muted })}
                  className="relative w-12 h-6 rounded-full transition-all duration-300"
                  style={{
                    background: settings.muted
                      ? 'var(--color-glass)'
                      : 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    border: `1px solid ${settings.muted ? 'var(--color-glass-border)' : 'transparent'}`
                  }}
                >
                  <motion.div
                    animate={{ x: settings.muted ? 2 : 26 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              {/* 播放速度 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>播放速度</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PLAYBACK_SPEEDS.map(speed => (
                    <button
                      key={speed.value}
                      onClick={() => updateSettings({ playbackSpeed: speed.value })}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        background: settings.playbackSpeed === speed.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                        color: settings.playbackSpeed === speed.value ? 'white' : 'var(--color-text-muted)'
                      }}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
