'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Image,
  Sparkles,
  Save,
  Search,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import type { DailyWallpaperSettings as DailyWallpaperSettingsType, WallpaperCategory } from '../types'

interface DailyWallpaperSettingsProps {
  settings: DailyWallpaperSettingsType
  onChange: (settings: DailyWallpaperSettingsType) => void
  onRefresh: () => Promise<void>
  isRefreshing: boolean
}

const SOURCES = [
  { 
    value: 'unsplash', 
    label: 'Unsplash',
    description: '高质量免费摄影图片',
    icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop'
  },
  { 
    value: 'pexels', 
    label: 'Pexels',
    description: '免费素材图片和视频',
    icon: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&w=100&h=100&fit=crop'
  },
  { 
    value: 'picsum', 
    label: 'Lorem Picsum',
    description: '随机占位图片服务',
    icon: 'https://picsum.photos/100/100?random=1'
  },
  { 
    value: 'bing', 
    label: 'Bing 每日图片',
    description: '微软必应每日壁纸',
    icon: 'https://www.bing.com/th?id=OHR.AncientOrkney_ROW1151325237_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp'
  },
] as const

const CATEGORIES: { value: WallpaperCategory | ''; label: string }[] = [
  { value: '', label: '随机' },
  { value: 'nature', label: '自然' },
  { value: 'city', label: '城市' },
  { value: 'abstract', label: '抽象' },
  { value: 'minimal', label: '极简' },
  { value: 'architecture', label: '建筑' },
  { value: 'space', label: '太空' },
  { value: 'scenery', label: '风景' },
]

const UPDATE_TIMES = [
  { value: '00:00', label: '午夜 (00:00)' },
  { value: '06:00', label: '早晨 (06:00)' },
  { value: '08:00', label: '上午 (08:00)' },
  { value: '12:00', label: '中午 (12:00)' },
  { value: '18:00', label: '傍晚 (18:00)' },
  { value: '20:00', label: '晚上 (20:00)' },
]

const POPULAR_KEYWORDS = [
  'nature', 'landscape', 'architecture', 'minimal', 'abstract',
  'ocean', 'mountain', 'forest', 'city', 'sky', 'sunset', 'space'
]

export function DailyWallpaperSettings({
  settings,
  onChange,
  onRefresh,
  isRefreshing
}: DailyWallpaperSettingsProps) {
  const [keywordInput, setKeywordInput] = useState('')

  const updateSettings = (updates: Partial<DailyWallpaperSettingsType>) => {
    onChange({ ...settings, ...updates })
  }

  // 添加关键词
  const addKeyword = () => {
    if (!keywordInput.trim()) return
    const newKeywords = [...(settings.keywords || []), keywordInput.trim()]
    updateSettings({ keywords: newKeywords })
    setKeywordInput('')
  }

  // 移除关键词
  const removeKeyword = (keyword: string) => {
    const newKeywords = (settings.keywords || []).filter(k => k !== keyword)
    updateSettings({ keywords: newKeywords })
  }

  // 添加热门关键词
  const addPopularKeyword = (keyword: string) => {
    if (settings.keywords?.includes(keyword)) return
    const newKeywords = [...(settings.keywords || []), keyword]
    updateSettings({ keywords: newKeywords })
  }

  return (
    <div className="space-y-6">
      {/* 启用开关 */}
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
            <Calendar className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div>
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>启用每日壁纸</h4>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>每天自动更换新壁纸</p>
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
          {/* 图片来源 */}
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              图片来源
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SOURCES.map(source => (
                <button
                  key={source.value}
                  onClick={() => updateSettings({ source: source.value })}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: settings.source === source.value ? 'var(--color-primary)' : 'var(--color-glass-border)',
                    background: settings.source === source.value ? 'var(--color-primary)/10' : 'var(--color-bg-primary)'
                  }}
                >
                  <img
                    src={source.icon}
                    alt={source.label}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm" style={{ color: settings.source === source.value ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                      {source.label}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {source.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 分类选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              壁纸分类
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => updateSettings({ category: cat.value || undefined })}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    background: settings.category === cat.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                    color: settings.category === cat.value ? 'white' : 'var(--color-text-muted)',
                    border: `1px solid ${settings.category === cat.value ? 'transparent' : 'var(--color-glass-border)'}`
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 关键词筛选 */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              <Search className="w-4 h-4" />
              关键词筛选
            </label>
            
            {/* 输入框 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="输入关键词 (如: nature, city...)"
                className="flex-1 px-4 py-2 rounded-lg border text-sm"
                style={{
                  borderColor: 'var(--color-glass-border)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-primary)'
                }}
              />
              <button
                onClick={addKeyword}
                disabled={!keywordInput.trim()}
                className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                添加
              </button>
            </div>

            {/* 热门关键词 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>热门:</span>
              {POPULAR_KEYWORDS.map(keyword => (
                <button
                  key={keyword}
                  onClick={() => addPopularKeyword(keyword)}
                  disabled={settings.keywords?.includes(keyword)}
                  className="px-2 py-0.5 rounded text-xs capitalize transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  {keyword}
                </button>
              ))}
            </div>

            {/* 已选关键词 */}
            {settings.keywords && settings.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {settings.keywords.map(keyword => (
                  <span
                    key={keyword}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:opacity-70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 更新时间 */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              <Clock className="w-4 h-4" />
              每日更新时间
            </label>
            <div className="flex flex-wrap gap-2">
              {UPDATE_TIMES.map(time => (
                <button
                  key={time.value}
                  onClick={() => updateSettings({ updateTime: time.value })}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    background: settings.updateTime === time.value ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                    color: settings.updateTime === time.value ? 'white' : 'var(--color-text-muted)',
                    border: `1px solid ${settings.updateTime === time.value ? 'transparent' : 'var(--color-glass-border)'}`
                  }}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* 保存到库 */}
          <label className="flex items-center justify-between p-4 rounded-xl border cursor-pointer" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
            <div className="flex items-center gap-3">
              <Save className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>保存到壁纸库</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>自动将每日壁纸添加到您的收藏</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.saveToLibrary}
              onChange={(e) => updateSettings({ saveToLibrary: e.target.checked })}
              className="w-5 h-5 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </label>

          {/* 立即刷新 */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border transition-all hover:border-primary disabled:opacity-50"
            style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {isRefreshing ? '获取中...' : '立即获取新壁纸'}
            </span>
          </button>
        </>
      )}
    </div>
  )
}
