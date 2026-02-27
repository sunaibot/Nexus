/**
 * 用户表单组件
 * 用于创建和编辑用户
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { UserRole, CreateUserData, UpdateUserData } from '../types/user'
import { cn } from '../../../lib/utils'

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<boolean>
  initialData?: {
    username: string
    email?: string
    role: UserRole
  } | null
  mode: 'create' | 'edit'
}

const roles: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'admin',
    label: '管理员',
    description: '拥有所有权限，可以管理用户、系统设置等',
  },
  {
    value: 'user',
    label: '普通用户',
    description: '可以管理自己的书签和分类',
  },
  {
    value: 'guest',
    label: '访客',
    description: '只能查看公开内容，无法创建书签',
  },
]

export function UserForm({ isOpen, onClose, onSubmit, initialData, mode }: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserData & { confirmPassword?: string }>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'user',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username,
        password: '',
        confirmPassword: '',
        email: initialData.email || '',
        role: initialData.role,
      })
    } else {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        role: 'user',
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空'
    } else if (formData.username.length < 2) {
      newErrors.username = '用户名至少2个字符'
    }

    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = '密码不能为空'
      } else if (formData.password.length < 6) {
        newErrors.password = '密码至少6个字符'
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致'
      }
    } else {
      // 编辑模式下，如果填写了密码则验证
      if (formData.password && formData.password.length < 6) {
        newErrors.password = '密码至少6个字符'
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致'
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const submitData: CreateUserData | UpdateUserData =
        mode === 'create'
          ? {
              username: formData.username,
              password: formData.password,
              email: formData.email || undefined,
              role: formData.role,
            }
          : {
              username: formData.username,
              email: formData.email || undefined,
              role: formData.role,
              ...(formData.password ? { password: formData.password } : {}),
            }

      const success = await onSubmit(submitData)
      if (success) {
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {mode === 'create' ? '添加用户' : '编辑用户'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <User className="w-4 h-4 inline mr-1" />
                用户名
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl outline-none transition-all',
                  errors.username && 'ring-2 ring-red-500'
                )}
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: `1px solid ${errors.username ? '#ef4444' : 'var(--color-glass-border)'}`,
                  color: 'var(--color-text-primary)',
                }}
                placeholder="输入用户名"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <Mail className="w-4 h-4 inline mr-1" />
                邮箱（可选）
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl outline-none transition-all',
                  errors.email && 'ring-2 ring-red-500'
                )}
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: `1px solid ${errors.email ? '#ef4444' : 'var(--color-glass-border)'}`,
                  color: 'var(--color-text-primary)',
                }}
                placeholder="输入邮箱地址"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <Lock className="w-4 h-4 inline mr-1" />
                {mode === 'create' ? '密码' : '新密码（留空则不修改）'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl outline-none transition-all pr-10',
                    errors.password && 'ring-2 ring-red-500'
                  )}
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: `1px solid ${errors.password ? '#ef4444' : 'var(--color-glass-border)'}`,
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder={mode === 'create' ? '输入密码' : '输入新密码（可选）'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--color-glass-hover)]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            {formData.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Lock className="w-4 h-4 inline mr-1" />
                  确认密码
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl outline-none transition-all pr-10',
                      errors.confirmPassword && 'ring-2 ring-red-500'
                    )}
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: `1px solid ${errors.confirmPassword ? '#ef4444' : 'var(--color-glass-border)'}`,
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="再次输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--color-glass-hover)]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </motion.div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                <Shield className="w-4 h-4 inline mr-1" />
                角色
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all',
                      formData.role === role.value
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-[var(--color-glass-hover)]'
                    )}
                    style={{
                      background: formData.role === role.value ? 'var(--color-primary)/5' : 'var(--color-bg-tertiary)',
                      border: `1px solid ${formData.role === role.value ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {role.label}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {role.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium transition-colors"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
                }}
              >
                {isSubmitting ? '保存中...' : mode === 'create' ? '创建用户' : '保存修改'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
