'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Image, 
  Link, 
  Grid3X3, 
  Upload, 
  Sliders, 
  Check,
  Loader2,
  Trash2
} from 'lucide-react'
import { useWallpaper } from '../hooks/useWallpaper'
import { WallpaperPreview, WallpaperUploader, PresetWallpaperGrid } from '../components'
import type { WallpaperSource } from '../types'

// 标签页类型
const TABS: { id: WallpaperSource; label: string; icon: typeof Image }[] = [
  { id: 'upload', label: '本地上传', icon: Upload },
  { id: 'url', label: '图片链接', icon: Link },
  { id: 'preset', label: '预设壁纸', icon: Grid3X3 },
]

export function WallpaperPage() {
  const {
    settings,
    isLoading,
    isSaving,
    error,
    uploadImage,
    setImageUrl,
    selectPreset,
    clearWallpaper,
    setBlur,
    setOverlay,
    setEnabled
  } = useWallpaper()

  const [activeTab, setActiveTab] = useState<WallpaperSource>(settings.source || 'upload')
  const [urlInput, setUrlInput] = useState(settings.imageUrl || '')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 处理URL提交
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return
    await setImageUrl(urlInput)
    showSuccess()
  }

  // 显示保存成功
  const showSuccess = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  // 处理上传
  const handleUpload = async (file: File): Promise<string> => {
    const url = await uploadImage(file)
    showSuccess()
    return url
  }

  // 处理预设选择
  const handlePresetSelect = async (preset: { id: string; url: string }) => {
    await selectPreset(preset as any)
    showSuccess()
  }

  // 处理清除
  const handleClear = async () => {
    await clearWallpaper()
    setUrlInput('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          壁纸设置
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          自定义您的网站背景壁纸
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧设置面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 启用开关 */}
          <div 
            className="p-4 rounded-xl border"
            style={{ 
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-glass-border)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-bg-primary)' }}
                >
                  <Image className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    启用壁纸
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    在背景显示自定义图片
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnabled(!settings.enabled)}
                className="relative w-14 h-7 rounded-full transition-all duration-300"
                style={{
                  background: settings.enabled 
                    ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                    : 'var(--color-glass)',
                  boxShadow: settings.enabled 
                    ? '0 0 20px var(--color-glow)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  border: `2px solid ${settings.enabled ? 'transparent' : 'var(--color-glass-border)'}`
                }}
              >
                <motion.div
                  animate={{ 
                    x: settings.enabled ? 28 : 2,
                    scale: settings.enabled ? 1.1 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-5 h-5 rounded-full shadow-md"
                  style={{
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              </button>
            </div>
          </div>

          {settings.enabled && (
            <>
              {/* 来源选择标签 */}
              <div 
                className="p-4 rounded-xl border"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-glass-border)'
                }}
              >
                <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  选择壁纸来源
                </h3>
                <div className="flex gap-2">
                  {TABS.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-primary text-white'
                            : 'hover:bg-white/5'
                        }`}
                        style={{
                          background: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                          color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)'
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 内容区域 */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-glass-border)'
                }}
              >
                {activeTab === 'upload' && (
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      上传本地图片
                    </h3>
                    <WallpaperUploader
                      currentImage={settings.imageData}
                      onUpload={handleUpload}
                      onClear={handleClear}
                    />
                  </div>
                )}

                {activeTab === 'url' && (
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      使用图片链接
                    </h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/wallpaper.jpg"
                        className="flex-1 px-4 py-2.5 rounded-lg border bg-transparent text-sm"
                        style={{
                          borderColor: 'var(--color-glass-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <button
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim() || isSaving}
                        className="px-4 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '应用'
                        )}
                      </button>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                      支持 JPG、PNG、WebP 格式的图片链接
                    </p>
                  </div>
                )}

                {activeTab === 'preset' && (
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      选择预设壁纸
                    </h3>
                    <PresetWallpaperGrid
                      selectedId={settings.presetId || undefined}
                      onSelect={handlePresetSelect}
                    />
                  </div>
                )}
              </motion.div>

              {/* 效果设置 */}
              <div 
                className="p-4 rounded-xl border"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-glass-border)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Sliders className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                  <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    效果设置
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* 模糊度 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        模糊度
                      </label>
                      <span className="text-sm font-medium">{settings.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={settings.blur}
                      onChange={(e) => setBlur(parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ 
                        background: 'var(--color-bg-primary)',
                        accentColor: 'var(--color-primary)'
                      }}
                    />
                  </div>

                  {/* 遮罩透明度 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        遮罩透明度
                      </label>
                      <span className="text-sm font-medium">{settings.overlay}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={settings.overlay}
                      onChange={(e) => setOverlay(parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ 
                        background: 'var(--color-bg-primary)',
                        accentColor: 'var(--color-primary)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 清除壁纸 */}
              <button
                onClick={handleClear}
                className="w-full p-4 rounded-xl border flex items-center justify-center gap-2 text-sm transition-colors hover:bg-red-500/10"
                style={{ 
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <Trash2 className="w-4 h-4" />
                清除壁纸设置
              </button>
            </>
          )}
        </div>

        {/* 右侧预览面板 */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <WallpaperPreview settings={settings} />

            {/* 保存状态 */}
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-lg flex items-center gap-2 text-sm"
                style={{ 
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: 'rgb(34, 197, 94)'
                }}
              >
                <Check className="w-4 h-4" />
                设置已保存
              </motion.div>
            )}

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'rgb(239, 68, 68)'
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
