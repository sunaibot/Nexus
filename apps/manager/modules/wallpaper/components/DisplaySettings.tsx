'use client'

import { motion } from 'framer-motion'
import {
  Monitor,
  Maximize,
  Minimize,
  Move,
  Grid3X3,
  Image,
  Layers,
  Sun,
  Contrast,
  Droplets
} from 'lucide-react'
import type { DisplaySettings as DisplaySettingsType, WallpaperFit, WallpaperAttachment } from '../types'

interface DisplaySettingsProps {
  settings: DisplaySettingsType
  blur: number
  overlay: number
  brightness: number
  contrast: number
  saturation: number
  onSettingsChange: (settings: DisplaySettingsType) => void
  onEffectChange: (key: 'blur' | 'overlay' | 'brightness' | 'contrast' | 'saturation', value: number) => void
}

const FIT_OPTIONS: { value: WallpaperFit; label: string; description: string; icon: typeof Maximize }[] = [
  { value: 'cover', label: '填充', description: '保持比例填充整个屏幕', icon: Maximize },
  { value: 'contain', label: '适应', description: '完整显示图片', icon: Minimize },
  { value: 'stretch', label: '拉伸', description: '拉伸填满屏幕', icon: Grid3X3 },
  { value: 'tile', label: '平铺', description: '重复平铺显示', icon: Layers },
  { value: 'center', label: '居中', description: '居中显示原图', icon: Move },
]

const ATTACHMENT_OPTIONS: { value: WallpaperAttachment; label: string; description: string }[] = [
  { value: 'fixed', label: '固定', description: '不随页面滚动' },
  { value: 'scroll', label: '滚动', description: '随页面滚动' },
]

const POSITION_OPTIONS = [
  { value: 'center', label: '居中' },
  { value: 'top', label: '顶部' },
  { value: 'bottom', label: '底部' },
  { value: 'left', label: '左侧' },
  { value: 'right', label: '右侧' },
  { value: 'top-left', label: '左上' },
  { value: 'top-right', label: '右上' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-right', label: '右下' },
] as const

export function DisplaySettings({
  settings,
  blur,
  overlay,
  brightness,
  contrast,
  saturation,
  onSettingsChange,
  onEffectChange
}: DisplaySettingsProps) {
  const updateSettings = (updates: Partial<DisplaySettingsType>) => {
    onSettingsChange({ ...settings, ...updates })
  }

  return (
    <div className="space-y-6">
      {/* 填充模式 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          <Maximize className="w-4 h-4" />
          填充模式
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FIT_OPTIONS.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => updateSettings({ fit: option.value })}
                className="p-3 rounded-xl border text-left transition-all"
                style={{
                  borderColor: settings.fit === option.value ? 'var(--color-primary)' : 'var(--color-glass-border)',
                  background: settings.fit === option.value ? 'var(--color-primary)/10' : 'var(--color-bg-primary)'
                }}
              >
                <Icon className="w-5 h-5 mb-2" style={{ color: settings.fit === option.value ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                <div className="font-medium text-sm" style={{ color: settings.fit === option.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                  {option.label}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {option.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 固定方式 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          <Move className="w-4 h-4" />
          固定方式
        </label>
        <div className="flex gap-3">
          {ATTACHMENT_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => updateSettings({ attachment: option.value })}
              className="flex-1 p-3 rounded-xl border text-left transition-all"
              style={{
                borderColor: settings.attachment === option.value ? 'var(--color-primary)' : 'var(--color-glass-border)',
                background: settings.attachment === option.value ? 'var(--color-primary)/10' : 'var(--color-bg-primary)'
              }}
            >
              <div className="font-medium text-sm" style={{ color: settings.attachment === option.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                {option.label}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 位置 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          <Grid3X3 className="w-4 h-4" />
          图片位置
        </label>
        <div className="flex flex-wrap gap-2">
          {POSITION_OPTIONS.map(pos => (
            <button
              key={pos.value}
              onClick={() => updateSettings({ position: pos.value as any })}
              className="px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                background: settings.position === pos.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                color: settings.position === pos.value ? 'white' : 'var(--color-text-muted)',
                border: `1px solid ${settings.position === pos.value ? 'transparent' : 'var(--color-glass-border)'}`
              }}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* 基础效果 */}
      <div className="space-y-4 p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
        <h4 className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>基础效果</h4>

        {/* 模糊度 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Droplets className="w-4 h-4" />
              模糊度
            </label>
            <span className="text-sm font-medium">{blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={blur}
            onChange={(e) => onEffectChange('blur', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
          />
        </div>

        {/* 遮罩透明度 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Layers className="w-4 h-4" />
              遮罩透明度
            </label>
            <span className="text-sm font-medium">{overlay}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            value={overlay}
            onChange={(e) => onEffectChange('overlay', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
          />
        </div>

        {/* 亮度 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Sun className="w-4 h-4" />
              亮度
            </label>
            <span className="text-sm font-medium">{brightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={brightness}
            onChange={(e) => onEffectChange('brightness', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
          />
        </div>

        {/* 对比度 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Contrast className="w-4 h-4" />
              对比度
            </label>
            <span className="text-sm font-medium">{contrast}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={contrast}
            onChange={(e) => onEffectChange('contrast', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
          />
        </div>

        {/* 饱和度 */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Image className="w-4 h-4" />
              饱和度
            </label>
            <span className="text-sm font-medium">{saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => onEffectChange('saturation', parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: 'var(--color-bg-primary)', accentColor: 'var(--color-primary)' }}
          />
        </div>
      </div>
    </div>
  )
}
