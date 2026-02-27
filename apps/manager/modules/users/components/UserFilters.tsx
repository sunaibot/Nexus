/**
 * 用户筛选组件
 * 提供搜索、角色筛选、状态筛选和排序功能
 */

import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react'
import { UserFilters as UserFiltersType, UserRole } from '../types/user'
import { cn } from '../../../lib/utils'

interface UserFiltersProps {
  filters: UserFiltersType
  onChange: (filters: UserFiltersType) => void
  totalUsers: number
  filteredCount: number
}

const roles: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: '全部角色' },
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' },
  { value: 'guest', label: '访客' },
]

const statuses = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '已启用' },
  { value: 'inactive', label: '已禁用' },
]

const sortOptions = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'username', label: '用户名' },
  { value: 'lastLogin', label: '最后登录' },
  { value: 'bookmarkCount', label: '书签数量' },
]

export function UserFilters({ filters, onChange, totalUsers, filteredCount }: UserFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery ||
    filters.role !== 'all' ||
    filters.status !== 'all' ||
    filters.sortBy !== 'createdAt' ||
    filters.sortOrder !== 'desc'

  const clearFilters = () => {
    onChange({
      searchQuery: '',
      role: 'all',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="搜索用户名或邮箱..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--color-glass-hover)]"
            >
              <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={filters.sortBy}
              onChange={(e) => onChange({ ...filters, sortBy: e.target.value as any })}
              className="pl-10 pr-8 py-3 rounded-xl outline-none appearance-none cursor-pointer"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-glass-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() =>
              onChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
            }
            className="p-3 rounded-xl transition-colors hover:bg-[var(--color-glass-hover)]"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
            }}
            title={filters.sortOrder === 'asc' ? '升序' : '降序'}
          >
            <ArrowUpDown
              className={cn('w-5 h-5 transition-transform', filters.sortOrder === 'asc' && 'rotate-180')}
              style={{ color: 'var(--color-text-muted)' }}
            />
          </button>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <SlidersHorizontal className="w-4 h-4" />
          <span>筛选：</span>
        </div>

        {/* 角色筛选 */}
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => onChange({ ...filters, role: role.value })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                filters.role === role.value
                  ? 'text-white'
                  : 'hover:bg-[var(--color-glass-hover)]'
              )}
              style={{
                background: filters.role === role.value ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: filters.role === role.value ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {role.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--color-glass-border)' }} />

        {/* 状态筛选 */}
        <div className="flex flex-wrap gap-1">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => onChange({ ...filters, status: status.value as any })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                filters.status === status.value
                  ? 'text-white'
                  : 'hover:bg-[var(--color-glass-hover)]'
              )}
              style={{
                background: filters.status === status.value ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: filters.status === status.value ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <>
            <div className="w-px h-6 mx-1" style={{ background: 'var(--color-glass-border)' }} />
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          </>
        )}
      </div>

      {/* 结果统计 */}
      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        显示 {filteredCount} 个用户，共 {totalUsers} 个
      </div>
    </div>
  )
}
