import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { BorderBeam } from '../components/ui/advanced-effects'
import { request } from '../lib/api'

interface ResetPasswordProps {
  onBack: () => void
  isDark?: boolean
  token?: string
}

export function ResetPassword({ onBack, isDark = true, token: initialToken }: ResetPasswordProps) {
  const [token, setToken] = useState(initialToken || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(false)

  // 验证令牌
  useEffect(() => {
    const verifyToken = async () => {
      // 从URL获取令牌
      const urlParams = new URLSearchParams(window.location.search)
      const urlToken = urlParams.get('token')
      const finalToken = initialToken || urlToken

      if (!finalToken) {
        setError('无效的密码重置链接')
        setIsVerifying(false)
        return
      }

      setToken(finalToken)

      try {
        const response = await request<{ success: boolean; error?: string; user?: any }>(`/auth/verify-reset-token?token=${finalToken}`)
        if (response.success) {
          setIsTokenValid(true)
        } else {
          setError(response.error || '链接已过期或无效')
        }
      } catch (err: any) {
        setError(err?.message || '验证失败')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [initialToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword) {
      setError('请输入新密码')
      return
    }

    if (newPassword.length < 6) {
      setError('密码长度至少为6位')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await request<{ success: boolean; error?: string; message?: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      })

      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.error || '重置失败，请稍后重试')
      }
    } catch (err: any) {
      setError(err?.message || '网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        <motion.div
          className={`text-center ${isDark ? 'text-white' : 'text-slate-800'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 border-2 border-t-transparent border-current rounded-full animate-spin mx-auto mb-4" />
          <p className={isDark ? 'text-white/60' : 'text-slate-500'}>验证链接中...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nebula-purple/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nebula-pink/10 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* Back Button */}
      <motion.button
        onClick={onBack}
        className={`absolute top-6 left-6 p-2 rounded-xl transition-colors z-10 ${
          isDark
            ? 'hover:bg-white/5 text-white/60 hover:text-white'
            : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Card */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={`relative p-8 rounded-3xl backdrop-blur-xl overflow-hidden ${
            isDark
              ? 'bg-white/[0.03] border border-white/[0.08]'
              : 'bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/50'
          }`}
        >
          <BorderBeam
            size={100}
            duration={12}
            colorFrom={isDark ? "rgba(102, 126, 234, 0.5)" : "rgba(59, 130, 246, 0.4)"}
            colorTo={isDark ? "rgba(236, 72, 153, 0.5)" : "rgba(147, 51, 234, 0.4)"}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                isDark
                  ? 'bg-gradient-to-br from-nebula-purple/20 to-nebula-pink/20'
                  : 'bg-gradient-to-br from-blue-100 to-purple-100'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              {success ? (
                <CheckCircle className={`w-10 h-10 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <KeyRound className={`w-10 h-10 ${isDark ? 'text-nebula-purple' : 'text-blue-600'}`} />
              )}
            </motion.div>

            <motion.h1
              className={`text-2xl font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {success ? '密码重置成功' : '设置新密码'}
            </motion.h1>
            <motion.p
              className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {success
                ? '您的密码已重置成功，请使用新密码登录'
                : isTokenValid
                  ? '请输入您的新密码'
                  : '链接验证失败'
              }
            </motion.p>
          </div>

          {success ? (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={onBack}
                className={`px-6 py-2.5 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                返回登录
              </motion.button>
            </motion.div>
          ) : isTokenValid ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* New Password Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <label className={`block text-sm mb-2 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                    新密码
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-white/30' : 'text-slate-400'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setError('')
                      }}
                      placeholder="请输入新密码（至少6位）"
                      className={`w-full pl-11 pr-12 py-3.5 rounded-xl border transition-colors ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-nebula-purple/50'
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white'
                      } focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                        isDark ? 'text-white/30 hover:text-white/50' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm Password Input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className={`block text-sm mb-2 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-white/30' : 'text-slate-400'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError('')
                      }}
                      placeholder="请再次输入新密码"
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border transition-colors ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-nebula-purple/50'
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white'
                      } focus:outline-none`}
                    />
                  </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-sm text-red-400"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl text-white font-medium relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-gradient-to-r from-nebula-purple to-nebula-pink'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    {isLoading ? '重置中...' : '重置密码'}
                  </span>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark
                      ? 'bg-gradient-to-r from-nebula-pink to-nebula-purple'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500'
                  }`} />
                </motion.button>
              </div>
            </form>
          ) : (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={onBack}
                className={`px-6 py-2.5 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                返回登录
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
