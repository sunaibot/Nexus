import { motion } from 'framer-motion'
import { Folder, Bookmark, TrendingUp, Clock, Star, Layers } from 'lucide-react'
import { Category } from '../../../types/bookmark'
import { Bookmark as BookmarkType } from '../../../types/bookmark'

interface CategoryStatsProps {
  categories: Category[]
  bookmarks: BookmarkType[]
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend?: string
  color: string
  delay?: number
}

function StatCard({ icon: Icon, label, value, trend, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 rounded-xl border"
      style={{ 
        background: 'var(--color-glass)',
        borderColor: 'var(--color-glass-border)'
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ 
              background: 'var(--color-success)20',
              color: 'var(--color-success)'
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div 
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {value}
        </div>
        <div 
          className="text-xs mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  )
}

export function CategoryStats({ categories, bookmarks }: CategoryStatsProps) {
  // 计算统计数据
  const totalCategories = categories.length
  const totalBookmarks = bookmarks.length
  const avgBookmarksPerCategory = totalCategories > 0 
    ? Math.round(totalBookmarks / totalCategories * 10) / 10 
    : 0
  
  // 找出书签最多的分类
  const categoryBookmarkCounts = categories.map(cat => ({
    category: cat,
    count: bookmarks.filter(b => b.category === cat.id).length
  }))
  
  const topCategory = categoryBookmarkCounts.sort((a, b) => b.count - a.count)[0]
  
  // 计算空分类数量
  const emptyCategories = categoryBookmarkCounts.filter(c => c.count === 0).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Folder}
        label="总分类数"
        value={totalCategories}
        color="#8b5cf6"
        delay={0}
      />
      <StatCard
        icon={Bookmark}
        label="总书签数"
        value={totalBookmarks}
        color="#ec4899"
        delay={0.1}
      />
      <StatCard
        icon={TrendingUp}
        label="平均书签/分类"
        value={avgBookmarksPerCategory}
        color="#10b981"
        delay={0.2}
      />
      <StatCard
        icon={Layers}
        label="空分类"
        value={emptyCategories}
        color={emptyCategories > 0 ? '#ef4444' : '#6b7280'}
        delay={0.3}
      />
    </div>
  )
}

// 分类详情统计
interface CategoryDetailStatsProps {
  category: Category
  bookmarks: BookmarkType[]
}

export function CategoryDetailStats({ category, bookmarks }: CategoryDetailStatsProps) {
  const categoryBookmarks = bookmarks.filter(b => b.category === category.id)
  const bookmarkCount = categoryBookmarks.length
  
  // 计算最近添加的书签
  const recentBookmarks = categoryBookmarks
    .filter(b => b.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5)
  
  // 计算置顶书签
  const pinnedCount = categoryBookmarks.filter(b => b.isPinned).length
  
  // 计算稍后阅读
  const readLaterCount = categoryBookmarks.filter(b => b.isReadLater).length

  return (
    <div className="space-y-4">
      {/* 快速统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div 
          className="p-3 rounded-lg text-center"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            {bookmarkCount}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            书签
          </div>
        </div>
        <div 
          className="p-3 rounded-lg text-center"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--color-accent)' }}
          >
            {pinnedCount}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            置顶
          </div>
        </div>
        <div 
          className="p-3 rounded-lg text-center"
          style={{ background: 'var(--color-bg-tertiary)' }}
        >
          <div 
            className="text-xl font-bold"
            style={{ color: 'var(--color-warning)' }}
          >
            {readLaterCount}
          </div>
          <div 
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            稍后读
          </div>
        </div>
      </div>

      {/* 最近添加 */}
      {recentBookmarks.length > 0 && (
        <div>
          <h4 
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            最近添加
          </h4>
          <div className="space-y-2">
            {recentBookmarks.map(bookmark => (
              <div
                key={bookmark.id}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ background: 'var(--color-bg-tertiary)' }}
              >
                {bookmark.favicon ? (
                  <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded" />
                ) : (
                  <Bookmark className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                )}
                <span 
                  className="text-sm truncate flex-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {bookmark.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
