/**
 * 稍后阅读切换按钮组件
 */

import React from 'react'
import { motion } from 'framer-motion'
import { BookMarked, X } from 'lucide-react'

interface ReadLaterToggleProps {
  readLaterCount: number
  showReadLaterOnly: boolean
  onToggle: () => void
}

export function ReadLaterToggle({ 
  readLaterCount, 
  showReadLaterOnly, 
  onToggle 
}: ReadLaterToggleProps) {
  if (readLaterCount === 0) return null

  if (showReadLaterOnly) {
    return (
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          稍后阅读
        </h2>
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X className="w-4 h-4" />
          返回全部书签
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex justify-center mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
          color: 'var(--color-primary)',
        }}
      >
        <BookMarked className="w-5 h-5" />
        查看全部稍后阅读 ({readLaterCount})
      </button>
    </motion.div>
  )
}
