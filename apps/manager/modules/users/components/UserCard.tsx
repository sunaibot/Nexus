/**
 * 用户卡片组件
 * 展示用户基本信息和书签统计
 */

import { motion } from 'framer-motion'
import {
  Shield,
  User,
  BookMarked,
  FolderOpen,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react'
import { UserDetail, UserRole } from '../types/user'
import { cn } from '../../../lib/utils'

interface UserCardProps {
  user: UserDetail
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleStatus?: () => void
  index?: number
}

const roleConfig: Record<UserRole, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: '管理员', color: '#8b5cf6', icon: Shield },
  user: { label: '普通用户', color: '#3b82f6', icon: User },
  guest: { label: '访客', color: '#6b7280', icon: User },
}

export function UserCard({
  user,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  index = 0,
}: UserCardProps) {
  const role = roleConfig[user.role]
  const RoleIcon = role.icon

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'group relative rounded-xl p-4 transition-all cursor-pointer',
        'border hover:shadow-lg',
        isSelected && 'ring-2 ring-primary'
      )}
      style={{
        background: 'var(--color-bg-secondary)',
        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-glass-border)',
      }}
      onClick={onSelect}
    >
      {/* 选择指示器 */}
      <div
        className={cn(
          'absolute top-3 right-3 w-5 h-5 rounded border flex items-center justify-center transition-all',
          isSelected && 'bg-primary border-primary'
        )}
        style={{
          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
          background: isSelected ? 'var(--color-primary)' : 'transparent',
        }}
      >
        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
      </div>

      {/* 用户信息 */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: role.color + '20' }}
        >
          <RoleIcon className="w-6 h-6" style={{ color: role.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {user.username}
          </h3>
          {user.email && (
            <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
              {user.email}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: role.color + '20', color: role.color }}
            >
              {role.label}
            </span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                user.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              )}
            >
              {user.isActive ? (
                <>
                  <CheckCircle className="w-3 h-3" /> 已启用
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" /> 已禁用
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div
          className="rounded-lg p-2 flex items-center gap-2"
          style={{ background: 'var(--color-glass)' }}
        >
          <BookMarked className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {user.stats.bookmarkCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              书签
            </div>
          </div>
        </div>
        <div
          className="rounded-lg p-2 flex items-center gap-2"
          style={{ background: 'var(--color-glass)' }}
        >
          <FolderOpen className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {user.stats.categoryCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              分类
            </div>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          创建于 {formatDate(user.createdAt)}
        </div>
        {user.lastLoginAt && (
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            最后登录 {formatDate(user.lastLoginAt)}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleStatus?.()
          }}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
            user.isActive ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-green-500/10 hover:text-green-500'
          )}
          style={{ color: 'var(--color-text-muted)' }}
        >
          {user.isActive ? '禁用' : '启用'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.()
          }}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Edit2 className="w-3 h-3 inline mr-1" />
          编辑
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.()
          }}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/10 hover:text-red-500 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Trash2 className="w-3 h-3 inline mr-1" />
          删除
        </button>
      </div>
    </motion.div>
  )
}
