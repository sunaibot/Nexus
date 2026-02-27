/**
 * 私密密码设置卡片
 * 用于管理后台设置用户的私密书签密码
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Trash2,
  Power,
  PowerOff,
  Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface PrivatePasswordStatus {
  hasPassword: boolean
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

interface PrivatePasswordCardProps {
  status: PrivatePasswordStatus | null
  isLoading: boolean
  error: string | null
  success: boolean
  onSetPassword: (password: string) => Promise<void>
  onUpdatePassword: (oldPassword: string, newPassword: string) => Promise<void>
  onDeletePassword: (password: string) => Promise<void>
  onDisable: () => Promise<void>
  onEnable: () => Promise<void>
  onRefresh: () => Promise<void>
}

export function PrivatePasswordCard({
  status,
  isLoading,
  error,
  success,
  onSetPassword,
  onUpdatePassword,
  onDeletePassword,
  onDisable,
  onEnable,
  onRefresh,
}: PrivatePasswordCardProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  // 设置密码表单
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  // 更新密码表单
  const [oldPassword, setOldPassword] = useState('')
  const [updateNewPassword, setUpdateNewPassword] = useState('')
  const [updateConfirmPassword, setUpdateConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showUpdatePassword, setShowUpdatePassword] = useState(false)

  // 删除密码表单
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  // 当前操作模式
  const [mode, setMode] = useState<'set' | 'update' | 'delete' | null>(null)

  // 刷新状态
  useEffect(() => {
    onRefresh()
  }, [])

  const handleSetPassword = async () => {
    setLocalError('')

    if (newPassword.length < 4) {
      setLocalError('密码长度至少为4位')
      return
    }

    if (newPassword !== confirmPassword) {
      setLocalError('两次输入的密码不一致')
      return
    }

    try {
      await onSetPassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setMode(null)
    } catch (err: any) {
      setLocalError(err.message || '设置密码失败')
    }
  }

  const handleUpdatePassword = async () => {
    setLocalError('')

    if (updateNewPassword.length < 4) {
      setLocalError('新密码长度至少为4位')
      return
    }

    if (updateNewPassword !== updateConfirmPassword) {
      setLocalError('两次输入的新密码不一致')
      return
    }

    try {
      await onUpdatePassword(oldPassword, updateNewPassword)
      setOldPassword('')
      setUpdateNewPassword('')
      setUpdateConfirmPassword('')
      setMode(null)
    } catch (err: any) {
      setLocalError(err.message || '更新密码失败')
    }
  }

  const handleDeletePassword = async () => {
    setLocalError('')

    if (!deletePassword) {
      setLocalError('请输入密码')
      return
    }

    try {
      await onDeletePassword(deletePassword)
      setDeletePassword('')
      setMode(null)
    } catch (err: any) {
      setLocalError(err.message || '删除密码失败')
    }
  }

  const handleToggleEnable = async () => {
    try {
      if (status?.isEnabled) {
        await onDisable()
      } else {
        await onEnable()
      }
    } catch (err: any) {
      // 错误已在父组件处理
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border backdrop-blur-xl overflow-hidden',
        'bg-white/5 border-white/10'
      )}
    >
      {/* 头部 */}
      <div
        className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              status?.hasPassword
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-white/5 text-gray-400'
            )}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                私密书签密码
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {status?.hasPassword
                  ? status?.isEnabled
                    ? '已设置并启用'
                    : '已设置但已禁用'
                  : '未设置私密密码'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status?.hasPassword && (
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                status?.isEnabled
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              )}>
                {status?.isEnabled ? '已启用' : '已禁用'}
              </span>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10"
          >
            <div className="p-6 space-y-6">
              {/* 状态信息 */}
              {status?.hasPassword && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    {status?.isEnabled ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <PowerOff className="w-5 h-5 text-gray-400" />
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      私密书签密码{status?.isEnabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleEnable}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                      status?.isEnabled
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {status?.isEnabled ? (
                      <>
                        <PowerOff className="w-4 h-4" />
                        禁用
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4" />
                        启用
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 操作按钮 */}
              {status?.hasPassword ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setMode(mode === 'update' ? null : 'update')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                      mode === 'update'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                  >
                    <Lock className="w-4 h-4" />
                    修改密码
                  </button>
                  <button
                    onClick={() => setMode(mode === 'delete' ? null : 'delete')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                      mode === 'delete'
                        ? 'bg-red-500 text-white'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    删除密码
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMode(mode === 'set' ? null : 'set')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                    mode === 'set'
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                  )}
                >
                  <Lock className="w-4 h-4" />
                  设置密码
                </button>
              )}

              {/* 设置密码表单 */}
              <AnimatePresence>
                {mode === 'set' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 p-4 rounded-xl bg-white/5"
                  >
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      设置私密密码
                    </h4>

                    {/* 新密码 */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value)
                          setLocalError('')
                        }}
                        placeholder="输入密码（至少4位）"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* 确认密码 */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          setLocalError('')
                        }}
                        placeholder="确认密码"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>

                    {/* 错误提示 */}
                    {localError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {localError}
                      </div>
                    )}

                    {/* 提交按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setMode(null)
                          setLocalError('')
                          setNewPassword('')
                          setConfirmPassword('')
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSetPassword}
                        disabled={isLoading || !newPassword || !confirmPassword}
                        className="flex-1 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? '设置中...' : '确认设置'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 更新密码表单 */}
                {mode === 'update' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 p-4 rounded-xl bg-white/5"
                  >
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      修改私密密码
                    </h4>

                    {/* 旧密码 */}
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => {
                          setOldPassword(e.target.value)
                          setLocalError('')
                        }}
                        placeholder="输入旧密码"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* 新密码 */}
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={updateNewPassword}
                        onChange={(e) => {
                          setUpdateNewPassword(e.target.value)
                          setLocalError('')
                        }}
                        placeholder="输入新密码（至少4位）"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* 确认新密码 */}
                    <div className="relative">
                      <input
                        type={showUpdatePassword ? 'text' : 'password'}
                        value={updateConfirmPassword}
                        onChange={(e) => {
                          setUpdateConfirmPassword(e.target.value)
                          setLocalError('')
                        }}
                        placeholder="确认新密码"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUpdatePassword(!showUpdatePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
                      >
                        {showUpdatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* 错误提示 */}
                    {localError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {localError}
                      </div>
                    )}

                    {/* 提交按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setMode(null)
                          setLocalError('')
                          setOldPassword('')
                          setUpdateNewPassword('')
                          setUpdateConfirmPassword('')
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleUpdatePassword}
                        disabled={isLoading || !oldPassword || !updateNewPassword || !updateConfirmPassword}
                        className="flex-1 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? '更新中...' : '确认更新'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 删除密码表单 */}
                {mode === 'delete' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <h4 className="font-medium text-red-400">
                      删除私密密码
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      删除后，所有私密书签将不再受密码保护。此操作不可恢复。
                    </p>

                    {/* 密码确认 */}
                    <div className="relative">
                      <input
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e) => {
                          setDeletePassword(e.target.value)
                          setLocalError('')
                        }}
                        placeholder="输入当前密码确认删除"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
                      >
                        {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* 错误提示 */}
                    {localError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {localError}
                      </div>
                    )}

                    {/* 提交按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setMode(null)
                          setLocalError('')
                          setDeletePassword('')
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleDeletePassword}
                        disabled={isLoading || !deletePassword}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? '删除中...' : '确认删除'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 全局错误和成功提示 */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  操作成功
                </div>
              )}

              {/* 说明文字 */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-medium text-blue-400 mb-2">使用说明</h4>
                <ul className="space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <li>• 设置私密密码后，您可以将书签标记为私密状态</li>
                  <li>• 私密书签在前台默认隐藏，需要输入密码才能查看</li>
                  <li>• 密码验证通过后，30分钟内无需重复输入</li>
                  <li>• 禁用密码后，私密书签仍然保留，但无需密码即可查看</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
