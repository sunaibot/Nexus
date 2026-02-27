/**
 * 私密密码切换按钮
 * 显示眼睛图标，点击后输入密码显示私密书签
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Lock, X } from 'lucide-react'
import { usePrivatePassword } from '../hooks/usePrivatePassword'
import { cn } from '../lib/utils'

interface PrivatePasswordToggleProps {
  onVisibilityChange?: (showPrivate: boolean) => void
}

export function PrivatePasswordToggle({ onVisibilityChange }: PrivatePasswordToggleProps) {
  const {
    status,
    isLoading,
    isVerified,
    verifyPassword,
    clearVerification,
  } = usePrivatePassword()

  const [showDialog, setShowDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // 如果没有设置私密密码，不显示按钮
  if (!status?.hasPassword) {
    return null
  }

  const handleToggle = () => {
    if (isVerified) {
      // 已验证，切换隐藏
      clearVerification()
      onVisibilityChange?.(false)
    } else {
      // 未验证，显示输入框
      setShowDialog(true)
      setPassword('')
      setError('')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('请输入密码')
      return
    }

    const valid = await verifyPassword(password)
    if (valid) {
      setShowDialog(false)
      setPassword('')
      setError('')
      onVisibilityChange?.(true)
    } else {
      setError('密码不正确')
    }
  }

  const handleClose = () => {
    setShowDialog(false)
    setPassword('')
    setError('')
  }

  return (
    <>
      {/* 切换按钮 */}
      <motion.button
        onClick={handleToggle}
        className={cn(
          'relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer',
          isVerified
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10'
        )}
        style={{ color: isVerified ? undefined : 'var(--text-secondary)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isVerified ? '点击隐藏私密书签' : '点击显示私密书签'}
      >
        {isVerified ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
        
        {/* 状态指示点 */}
        {status?.isEnabled && !isVerified && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full" />
        )}
      </motion.button>

      {/* 密码输入弹窗 */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--glass-border)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20">
                    <Lock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      私密书签
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      输入密码查看私密内容
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 密码输入表单 */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="请输入私密密码"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl bg-white/5 border transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                      error ? 'border-red-500/50' : 'border-white/10'
                    )}
                    style={{ color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !password.trim()}
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-xl font-medium transition-all',
                      'bg-purple-500 hover:bg-purple-600 text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isLoading ? '验证中...' : '确认'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
