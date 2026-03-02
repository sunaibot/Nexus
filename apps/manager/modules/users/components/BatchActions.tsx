/**
 * 批量操作组件
 * 提供批量启用、禁用、删除功能
 */

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Trash2, X, Users } from 'lucide-react'
import { BatchAction } from '../types/user'
import { cn } from '../../../lib/utils'

interface BatchActionsProps {
  selectedCount: number
  onAction: (action: BatchAction) => void
  onClear: () => void
}

const actions: { value: BatchAction; label: string; icon: typeof CheckCircle; color: string }[] = [
  { value: 'activate', label: '批量启用', icon: CheckCircle, color: '#22c55e' },
  { value: 'deactivate', label: '批量禁用', icon: XCircle, color: '#f59e0b' },
  { value: 'delete', label: '批量删除', icon: Trash2, color: '#ef4444' },
]

export function BatchActions({ selectedCount, onAction, onClear }: BatchActionsProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
        style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}
          >
            <Users className="w-4 h-4 text-white" />
          </div>
          <span style={{ color: 'var(--color-text-primary)' }}>
            已选择 <strong>{selectedCount}</strong> 个用户
          </span>
          <button
            onClick={onClear}
            className="p-1 rounded hover:bg-[var(--color-glass-hover)] transition-colors"
          >
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.value}
                onClick={() => {
                  if (action.value === 'delete') {
                    if (confirm(`确定要删除选中的 ${selectedCount} 个用户吗？此操作不可恢复。`)) {
                      onAction(action.value)
                    }
                  } else {
                    onAction(action.value)
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90'
                )}
                style={{ background: action.color + '20', color: action.color }}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
