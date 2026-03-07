'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Shuffle,
  Clock,
  Image,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  X,
  Plus
} from 'lucide-react'
import type { SlideshowSettings as SlideshowSettingsType, WallpaperLibraryItem } from '../types'
import { WallpaperLibrary } from './WallpaperLibrary'

interface SlideshowSettingsProps {
  settings: SlideshowSettingsType
  wallpapers: WallpaperLibraryItem[]
  onChange: (settings: SlideshowSettingsType) => void
}

const TRANSITION_OPTIONS = [
  { value: 'fade', label: '淡入淡出', description: '平滑的透明度渐变' },
  { value: 'slide', label: '滑动', description: '水平滑动切换' },
  { value: 'zoom', label: '缩放', description: '放大缩小过渡' },
  { value: 'blur', label: '模糊', description: '模糊清晰过渡' },
] as const

const INTERVAL_OPTIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
  { value: 30, label: '30秒' },
  { value: 60, label: '1分钟' },
  { value: 300, label: '5分钟' },
  { value: 900, label: '15分钟' },
  { value: 1800, label: '30分钟' },
  { value: 3600, label: '1小时' },
]

export function SlideshowSettings({ settings, wallpapers, onChange }: SlideshowSettingsProps) {
  const [showLibrary, setShowLibrary] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(settings.wallpapers)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // 获取已选壁纸
  const selectedWallpapers = settings.wallpapers
    .map(id => wallpapers.find(w => w.id === id))
    .filter((w): w is WallpaperLibraryItem => w !== undefined)

  // 更新设置
  const updateSettings = (updates: Partial<SlideshowSettingsType>) => {
    onChange({ ...settings, ...updates })
  }

  // 添加壁纸到轮播
  const handleAddWallpapers = () => {
    const newIds = [...new Set([...settings.wallpapers, ...selectedIds])]
    updateSettings({ wallpapers: newIds })
    setShowLibrary(false)
    setSelectedIds([])
  }

  // 移除壁纸
  const handleRemoveWallpaper = (index: number) => {
    const newWallpapers = [...settings.wallpapers]
    newWallpapers.splice(index, 1)
    updateSettings({ wallpapers: newWallpapers })
  }

  // 重新排序
  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= settings.wallpapers.length) return
    const newWallpapers = [...settings.wallpapers]
    const [moved] = newWallpapers.splice(fromIndex, 1)
    newWallpapers.splice(toIndex, 0, moved)
    updateSettings({ wallpapers: newWallpapers })
  }

  return (
    <div className="space-y-6">
      {/* 启用开关 */}
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
            <Play className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div>
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>启用轮播</h4>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>自动切换多张壁纸</p>
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
          {/* 切换间隔 */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              <Clock className="w-4 h-4" />
              切换间隔
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERVAL_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateSettings({ interval: option.value })}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    background: settings.interval === option.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                    color: settings.interval === option.value ? 'white' : 'var(--color-text-muted)',
                    border: `1px solid ${settings.interval === option.value ? 'transparent' : 'var(--color-glass-border)'}`
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 过渡效果 */}
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              过渡效果
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TRANSITION_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateSettings({ transition: option.value })}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: settings.transition === option.value ? 'var(--color-primary)' : 'var(--color-glass-border)',
                    background: settings.transition === option.value ? 'var(--color-primary)/10' : 'var(--color-bg-primary)'
                  }}
                >
                  <div className="font-medium text-sm" style={{ color: settings.transition === option.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                    {option.label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 高级选项 */}
          <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
            <h4 className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>高级选项</h4>
            
            {/* 随机播放 */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <Shuffle className="w-4 h-4 inline mr-2" />
                随机播放顺序
              </span>
              <input
                type="checkbox"
                checked={settings.shuffle}
                onChange={(e) => updateSettings({ shuffle: e.target.checked })}
                className="w-4 h-4 rounded border"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>

            {/* 悬停暂停 */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <Pause className="w-4 h-4 inline mr-2" />
                鼠标悬停时暂停
              </span>
              <input
                type="checkbox"
                checked={settings.pauseOnHover}
                onChange={(e) => updateSettings({ pauseOnHover: e.target.checked })}
                className="w-4 h-4 rounded border"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>
          </div>

          {/* 轮播列表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                轮播壁纸 ({settings.wallpapers.length})
              </label>
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                <Plus className="w-4 h-4" />
                添加
              </button>
            </div>

            {selectedWallpapers.length === 0 ? (
              <div
                className="p-8 rounded-xl border border-dashed text-center cursor-pointer transition-colors hover:border-primary"
                style={{ borderColor: 'var(--color-glass-border)' }}
                onClick={() => setShowLibrary(true)}
              >
                <Image className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>点击添加壁纸到轮播</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedWallpapers.map((wallpaper, index) => (
                  <motion.div
                    key={wallpaper.id}
                    layout
                    className="flex items-center gap-3 p-2 rounded-lg border group"
                    style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-primary)' }}
                  >
                    <div className="cursor-move" style={{ color: 'var(--color-text-muted)' }}>
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="w-6 text-center text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {index + 1}
                    </span>
                    <img
                      src={wallpaper.thumbnail}
                      alt={wallpaper.name}
                      className="w-16 h-10 rounded object-cover"
                    />
                    <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {wallpaper.name}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMove(index, index - 1)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(index, index + 1)}
                        disabled={index === selectedWallpapers.length - 1}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveWallpaper(index)}
                        className="p-1 rounded hover:bg-red-500/20"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 壁纸库弹窗 */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'var(--color-bg-secondary)' }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>选择壁纸</h3>
              <button
                onClick={() => setShowLibrary(false)}
                className="p-2 rounded-lg hover:bg-white/10"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <WallpaperLibrary
                wallpapers={wallpapers}
                selectedIds={selectedIds}
                onSelect={(id) => {
                  if (selectedIds.includes(id)) {
                    setSelectedIds(selectedIds.filter(sid => sid !== id))
                  } else {
                    setSelectedIds([...selectedIds, id])
                  }
                }}
                onSelectMultiple={setSelectedIds}
                onDelete={() => {}}
                onToggleFavorite={() => {}}
                onUse={() => {}}
                showSelection={true}
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                已选择 {selectedIds.length} 张
              </span>
              <button
                onClick={() => setShowLibrary(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                取消
              </button>
              <button
                onClick={handleAddWallpapers}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                添加
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
