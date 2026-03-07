'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image,
  Link,
  Grid3X3,
  Upload,
  Sliders,
  Check,
  Loader2,
  Trash2,
  Play,
  Calendar,
  Clock,
  Sparkles,
  Library,
  Monitor,
  Settings2
} from 'lucide-react'
import { useWallpaper } from '../hooks/useWallpaper'
import { WallpaperUploader } from '../components/WallpaperUploader'
import { PresetWallpaperGrid } from '../components/PresetWallpaperGrid'
import { WallpaperLibrary } from '../components/WallpaperLibrary'
import { SlideshowSettings } from '../components/SlideshowSettings'
import { DynamicWallpaperSettings } from '../components/DynamicWallpaperSettings'
import { DailyWallpaperSettings } from '../components/DailyWallpaperSettings'
import { DisplaySettings } from '../components/DisplaySettings'
import { AdvancedEffectsSettings } from '../components/AdvancedEffectsSettings'
import { ScheduleSettings } from '../components/ScheduleSettings'
import { WallpaperPreview } from '../components/WallpaperPreview'
import { WallpaperProviderManager } from '../components/WallpaperProviderManager'
import type { WallpaperSource, WallpaperMode, ProviderWallpaper } from '../types'

// 主标签页
const MAIN_TABS: { id: 'source' | 'library' | 'mode' | 'display' | 'effects' | 'schedule'; label: string; icon: typeof Image }[] = [
  { id: 'source', label: '壁纸来源', icon: Upload },
  { id: 'library', label: '壁纸库', icon: Library },
  { id: 'mode', label: '显示模式', icon: Play },
  { id: 'display', label: '显示设置', icon: Monitor },
  { id: 'effects', label: '高级效果', icon: Sparkles },
  { id: 'schedule', label: '定时切换', icon: Clock },
]

// 来源标签
const SOURCE_TABS: { id: WallpaperSource | 'provider'; label: string; icon: typeof Image }[] = [
  { id: 'upload', label: '本地上传', icon: Upload },
  { id: 'url', label: '图片链接', icon: Link },
  { id: 'preset', label: '预设壁纸', icon: Grid3X3 },
  { id: 'provider', label: '壁纸源', icon: Library },
]

// 模式选项
const MODE_OPTIONS: { value: WallpaperMode; label: string; description: string; icon: typeof Image }[] = [
  { value: 'single', label: '单张壁纸', description: '使用单张静态壁纸', icon: Image },
  { value: 'slideshow', label: '轮播壁纸', description: '多张壁纸自动切换', icon: Play },
  { value: 'dynamic', label: '动态壁纸', description: '视频或 GIF 背景', icon: Play },
  { value: 'daily', label: '每日壁纸', description: '每天自动获取新壁纸', icon: Calendar },
]

export function WallpaperPage() {
  const {
    settings,
    wallpapers,
    isLoading,
    isSaving,
    error,
    isRefreshingDaily,
    uploadImage,
    setImageUrl,
    selectPreset,
    clearWallpaper,
    setBlur,
    setOverlay,
    setBrightness,
    setContrast,
    setSaturation,
    setEnabled,
    setMode,
    setDisplay,
    setSlideshow,
    setDynamic,
    setDaily,
    setEffects,
    setSchedule,
    refreshDailyWallpaper,
    toggleFavorite,
    deleteWallpaper,
    useWallpaper: applyWallpaper
  } = useWallpaper()

  const [activeTab, setActiveTab] = useState<typeof MAIN_TABS[number]['id']>('source')
  const [sourceTab, setSourceTab] = useState<WallpaperSource | 'provider'>(settings.source || 'upload')
  const [urlInput, setUrlInput] = useState(settings.imageUrl || '')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([])

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

  // 处理URL提交
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return
    await setImageUrl(urlInput)
    showSuccess()
  }

  // 处理清除
  const handleClear = async () => {
    await clearWallpaper()
    setUrlInput('')
  }

  // 处理效果变更
  const handleEffectChange = async (key: 'blur' | 'overlay' | 'brightness' | 'contrast' | 'saturation', value: number) => {
    switch (key) {
      case 'blur': await setBlur(value); break
      case 'overlay': await setOverlay(value); break
      case 'brightness': await setBrightness(value); break
      case 'contrast': await setContrast(value); break
      case 'saturation': await setSaturation(value); break
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          壁纸设置
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          自定义您的网站背景壁纸，支持轮播、动态壁纸、每日自动更换等高级功能
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
              {/* 主标签页 */}
              <div className="flex flex-wrap gap-2">
                {MAIN_TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
                {/* 壁纸来源 */}
                {activeTab === 'source' && (
                  <div className="space-y-6">
                    {/* 来源选择标签 */}
                    <div className="flex gap-2">
                      {SOURCE_TABS.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setSourceTab(tab.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                              background: sourceTab === tab.id ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                              color: sourceTab === tab.id ? 'white' : 'var(--color-text-muted)'
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* 上传 */}
                    {sourceTab === 'upload' && (
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

                    {/* URL */}
                    {sourceTab === 'url' && (
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

                    {/* 预设 */}
                    {sourceTab === 'preset' && (
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

                    {/* 壁纸源 */}
                    {sourceTab === 'provider' && (
                      <WallpaperProviderManager
                        onSelectWallpaper={(wallpaper: ProviderWallpaper) => {
                          setImageUrl(wallpaper.url)
                          showSuccess()
                        }}
                      />
                    )}
                  </div>
                )}

                {/* 壁纸库 */}
                {activeTab === 'library' && (
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      我的壁纸库
                    </h3>
                    <WallpaperLibrary
                      wallpapers={wallpapers}
                      selectedIds={selectedLibraryIds}
                      onSelect={(id: string) => {
                        const wallpaper = wallpapers.find((w: { id: string }) => w.id === id)
                        if (wallpaper) applyWallpaper(wallpaper)
                      }}
                      onSelectMultiple={setSelectedLibraryIds}
                      onDelete={deleteWallpaper}
                      onToggleFavorite={toggleFavorite}
                      onUse={applyWallpaper}
                    />
                  </div>
                )}

                {/* 显示模式 */}
                {activeTab === 'mode' && (
                  <div className="space-y-6">
                    <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      选择显示模式
                    </h3>

                    {/* 模式选择 */}
                    <div className="grid grid-cols-2 gap-3">
                      {MODE_OPTIONS.map((mode) => {
                        const Icon = mode.icon
                        return (
                          <button
                            key={mode.value}
                            onClick={() => setMode(mode.value)}
                            className="p-4 rounded-xl border text-left transition-all"
                            style={{
                              borderColor: settings.mode === mode.value ? 'var(--color-primary)' : 'var(--color-glass-border)',
                              background: settings.mode === mode.value ? 'var(--color-primary)/10' : 'var(--color-bg-primary)'
                            }}
                          >
                            <Icon className="w-6 h-6 mb-2" style={{ color: settings.mode === mode.value ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                            <div className="font-medium text-sm" style={{ color: settings.mode === mode.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                              {mode.label}
                            </div>
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {mode.description}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* 模式特定设置 */}
                    {settings.mode === 'slideshow' && (
                      <SlideshowSettings
                        settings={settings.slideshow}
                        wallpapers={wallpapers}
                        onChange={setSlideshow}
                      />
                    )}

                    {settings.mode === 'dynamic' && (
                      <DynamicWallpaperSettings
                        settings={settings.dynamic}
                        onChange={setDynamic}
                        onUpload={handleUpload}
                      />
                    )}

                    {settings.mode === 'daily' && (
                      <DailyWallpaperSettings
                        settings={settings.daily}
                        onChange={setDaily}
                        onRefresh={refreshDailyWallpaper}
                        isRefreshing={isRefreshingDaily}
                      />
                    )}
                  </div>
                )}

                {/* 显示设置 */}
                {activeTab === 'display' && (
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      显示设置
                    </h3>
                    <DisplaySettings
                      settings={settings.display}
                      blur={settings.blur}
                      overlay={settings.overlay}
                      brightness={settings.brightness}
                      contrast={settings.contrast}
                      saturation={settings.saturation}
                      onSettingsChange={setDisplay}
                      onEffectChange={handleEffectChange}
                    />
                  </div>
                )}

                {/* 高级效果 */}
                {activeTab === 'effects' && (
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      高级效果
                    </h3>
                    <AdvancedEffectsSettings
                      effects={settings.effects}
                      onChange={setEffects}
                    />
                  </div>
                )}

                {/* 定时切换 */}
                {activeTab === 'schedule' && (
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      定时切换设置
                    </h3>
                    <ScheduleSettings
                      settings={settings.schedule}
                      wallpapers={wallpapers}
                      onChange={setSchedule}
                    />
                  </div>
                )}
              </motion.div>

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
