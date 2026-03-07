'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Search,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Clock,
  Star,
  Image,
  Tag,
  X,
  Check,
  MoreVertical,
  FolderHeart,
  History
} from 'lucide-react'
import type {
  WallpaperLibraryItem,
  WallpaperCategory,
  WallpaperFilter
} from '../types'

// 分类配置
const CATEGORIES: { id: WallpaperCategory | 'all'; label: string; icon: typeof Image }[] = [
  { id: 'all', label: '全部', icon: Grid3X3 },
  { id: 'nature', label: '自然', icon: Image },
  { id: 'city', label: '城市', icon: Image },
  { id: 'abstract', label: '抽象', icon: Image },
  { id: 'minimal', label: '极简', icon: Image },
  { id: 'dark', label: '暗色', icon: Image },
  { id: 'anime', label: '动漫', icon: Image },
  { id: 'scenery', label: '风景', icon: Image },
  { id: 'architecture', label: '建筑', icon: Image },
  { id: 'space', label: '太空', icon: Image },
  { id: 'other', label: '其他', icon: Image },
]

// 排序选项
const SORT_OPTIONS = [
  { value: 'newest', label: '最新添加' },
  { value: 'oldest', label: '最早添加' },
  { value: 'mostUsed', label: '使用最多' },
  { value: 'lastUsed', label: '最近使用' },
  { value: 'name', label: '名称' },
] as const

interface WallpaperLibraryProps {
  wallpapers: WallpaperLibraryItem[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onSelectMultiple: (ids: string[]) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onUse: (wallpaper: WallpaperLibraryItem) => void
  showSelection?: boolean
}

export function WallpaperLibrary({
  wallpapers,
  selectedIds,
  onSelect,
  onSelectMultiple,
  onDelete,
  onToggleFavorite,
  onUse,
  showSelection = false
}: WallpaperLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<WallpaperCategory | 'all'>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<WallpaperFilter['sortBy']>('newest')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // 获取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    wallpapers.forEach(w => w.tags.forEach(t => tags.add(t)))
    return Array.from(tags).sort()
  }, [wallpapers])

  // 筛选和排序壁纸
  const filteredWallpapers = useMemo(() => {
    let result = [...wallpapers]

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(w =>
        w.name.toLowerCase().includes(query) ||
        w.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    // 分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter(w => w.category === selectedCategory)
    }

    // 收藏筛选
    if (showFavoritesOnly) {
      result = result.filter(w => w.isFavorite)
    }

    // 标签筛选
    if (selectedTag) {
      result = result.filter(w => w.tags.includes(selectedTag))
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'mostUsed':
          return b.useCount - a.useCount
        case 'lastUsed':
          if (!a.usedAt && !b.usedAt) return 0
          if (!a.usedAt) return 1
          if (!b.usedAt) return -1
          return new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN')
        default:
          return 0
      }
    })

    return result
  }, [wallpapers, searchQuery, selectedCategory, showFavoritesOnly, sortBy, selectedTag])

  // 处理多选
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectMultiple(selectedIds.filter(sid => sid !== id))
    } else {
      onSelectMultiple([...selectedIds, id])
    }
  }

  // 全选
  const handleSelectAll = () => {
    if (selectedIds.length === filteredWallpapers.length) {
      onSelectMultiple([])
    } else {
      onSelectMultiple(filteredWallpapers.map(w => w.id))
    }
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 搜索 */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索壁纸..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm"
            style={{
              borderColor: 'var(--color-glass-border)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg-primary)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 收藏筛选 */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
            showFavoritesOnly ? 'bg-primary text-white' : ''
          }`}
          style={{
            background: showFavoritesOnly ? 'var(--color-primary)' : 'var(--color-bg-primary)',
            color: showFavoritesOnly ? 'white' : 'var(--color-text-muted)',
            border: `1px solid ${showFavoritesOnly ? 'transparent' : 'var(--color-glass-border)'}`
          }}
        >
          <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          收藏
        </button>

        {/* 排序 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as WallpaperFilter['sortBy'])}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg-primary)'
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* 视图切换 */}
        <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-glass-border)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className="p-2 transition-colors"
            style={{
              background: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
              color: viewMode === 'grid' ? 'white' : 'var(--color-text-muted)'
            }}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="p-2 transition-colors"
            style={{
              background: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
              color: viewMode === 'list' ? 'white' : 'var(--color-text-muted)'
            }}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const count = cat.id === 'all'
            ? wallpapers.length
            : wallpapers.filter(w => w.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
              style={{
                background: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                color: selectedCategory === cat.id ? 'white' : 'var(--color-text-muted)',
                border: `1px solid ${selectedCategory === cat.id ? 'transparent' : 'var(--color-glass-border)'}`
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              <span className="ml-1 opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Tag className="w-4 h-4 mt-1" style={{ color: 'var(--color-text-muted)' }} />
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className="px-2 py-1 rounded text-xs transition-all"
              style={{
                background: selectedTag === tag ? 'var(--color-accent)' : 'var(--color-bg-primary)',
                color: selectedTag === tag ? 'white' : 'var(--color-text-muted)'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 全选操作 */}
      {showSelection && filteredWallpapers.length > 0 && (
        <div className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <div
              className="w-4 h-4 rounded border flex items-center justify-center"
              style={{
                borderColor: 'var(--color-glass-border)',
                background: selectedIds.length === filteredWallpapers.length ? 'var(--color-primary)' : 'transparent'
              }}
            >
              {selectedIds.length === filteredWallpapers.length && <Check className="w-3 h-3 text-white" />}
            </div>
            全选 ({selectedIds.length}/{filteredWallpapers.length})
          </button>
        </div>
      )}

      {/* 壁纸列表 */}
      {filteredWallpapers.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>没有找到壁纸</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
          <AnimatePresence>
            {filteredWallpapers.map((wallpaper) => (
              <motion.div
                key={wallpaper.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-lg ${
                  viewMode === 'list' ? 'flex items-center gap-4 p-2' : ''
                }`}
                style={{
                  borderColor: selectedIds.includes(wallpaper.id) ? 'var(--color-primary)' : 'var(--color-glass-border)',
                  background: 'var(--color-bg-secondary)'
                }}
                onClick={() => showSelection ? handleToggleSelect(wallpaper.id) : onUse(wallpaper)}
              >
                {/* 缩略图 */}
                <div
                  className={`relative overflow-hidden ${viewMode === 'grid' ? 'aspect-video' : 'w-20 h-14 rounded-lg'}`}
                >
                  <img
                    src={wallpaper.thumbnail}
                    alt={wallpaper.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  {/* 选中状态 */}
                  {selectedIds.includes(wallpaper.id) && (
                    <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {/* 收藏标记 */}
                  {wallpaper.isFavorite && (
                    <div className="absolute top-2 left-2">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </div>
                  )}
                  {/* 悬停操作 */}
                  {!showSelection && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(wallpaper.id)
                        }}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${wallpaper.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(wallpaper.id)
                        }}
                        className="p-2 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className={`${viewMode === 'grid' ? 'p-3' : 'flex-1'}`}>
                  <h4 className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {wallpaper.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{CATEGORIES.find(c => c.id === wallpaper.category)?.label}</span>
                    {wallpaper.useCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <History className="w-3 h-3" />
                          {wallpaper.useCount}次
                        </span>
                      </>
                    )}
                  </div>
                  {viewMode === 'list' && wallpaper.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {wallpaper.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{ background: 'var(--color-bg-primary)' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 删除确认弹窗 */}
                {showDeleteConfirm === wallpaper.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDelete(wallpaper.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm"
                    >
                      删除
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-sm"
                    >
                      取消
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
