'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { PresetWallpaper } from '../types'

interface PresetWallpaperGridProps {
  selectedId?: string | null
  onSelect: (preset: PresetWallpaper) => void
}

// 预设壁纸列表
const PRESET_WALLPAPERS: PresetWallpaper[] = [
  // 自然风景
  {
    id: 'nature-1',
    name: '山脉晨曦',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=60',
    category: 'nature',
    tags: ['mountain', 'sunrise', 'landscape'],
    source: 'preset'
  },
  {
    id: 'nature-2',
    name: '海洋日落',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=60',
    category: 'nature',
    tags: ['ocean', 'sunset', 'beach'],
    source: 'preset'
  },
  {
    id: 'nature-3',
    name: '森林小径',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=60',
    category: 'nature',
    tags: ['forest', 'path', 'trees'],
    source: 'preset'
  },
  {
    id: 'nature-4',
    name: '星空银河',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=60',
    category: 'nature',
    tags: ['stars', 'galaxy', 'night'],
    source: 'preset'
  },
  // 抽象艺术
  {
    id: 'abstract-1',
    name: '渐变流光',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=60',
    category: 'abstract',
    tags: ['gradient', 'colorful', 'abstract'],
    source: 'preset'
  },
  {
    id: 'abstract-2',
    name: '几何图案',
    url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400&q=60',
    category: 'abstract',
    tags: ['geometric', 'pattern', 'abstract'],
    source: 'preset'
  },
  // 城市建筑
  {
    id: 'city-1',
    name: '城市夜景',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&q=60',
    category: 'city',
    tags: ['city', 'night', 'lights'],
    source: 'preset'
  },
  {
    id: 'city-2',
    name: '摩天大楼',
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=60',
    category: 'city',
    tags: ['skyscraper', 'building', 'urban'],
    source: 'preset'
  },
  // 极简风格
  {
    id: 'minimal-1',
    name: '纯白简约',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=60',
    category: 'minimal',
    tags: ['minimal', 'white', 'clean'],
    source: 'preset'
  },
  {
    id: 'minimal-2',
    name: '灰色纹理',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=60',
    category: 'minimal',
    tags: ['minimal', 'gray', 'texture'],
    source: 'preset'
  },
  // 深色模式
  {
    id: 'dark-1',
    name: '深邃星空',
    url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&q=60',
    category: 'dark',
    tags: ['dark', 'stars', 'space'],
    source: 'preset'
  },
  {
    id: 'dark-2',
    name: '暗夜极光',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=60',
    category: 'dark',
    tags: ['dark', 'aurora', 'night'],
    source: 'preset'
  },
]

// 分类标签
const CATEGORY_LABELS: Record<string, string> = {
  nature: '自然风景',
  abstract: '抽象艺术',
  city: '城市建筑',
  minimal: '极简风格',
  dark: '深色模式'
}

export function PresetWallpaperGrid({ selectedId, onSelect }: PresetWallpaperGridProps) {
  // 按分类分组
  const grouped = PRESET_WALLPAPERS.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = []
    }
    acc[preset.category].push(preset)
    return acc
  }, {} as Record<string, PresetWallpaper[]>)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, presets]) => (
        <div key={category}>
          <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {CATEGORY_LABELS[category]}
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {presets.map((preset) => (
              <motion.button
                key={preset.id}
                onClick={() => onSelect(preset)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative aspect-square rounded-lg overflow-hidden group"
                style={{ 
                  border: selectedId === preset.id 
                    ? '2px solid var(--color-primary)' 
                    : '2px solid transparent'
                }}
              >
                <img
                  src={preset.thumbnail}
                  alt={preset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* 悬停遮罩 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                
                {/* 选中标记 */}
                {selectedId === preset.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
                
                {/* 名称提示 */}
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{preset.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
