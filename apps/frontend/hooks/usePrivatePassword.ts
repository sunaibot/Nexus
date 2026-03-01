/**
 * 用户私密密码管理 Hook
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getPrivatePasswordStatus,
  setPrivatePassword,
  verifyPrivatePassword,
  updatePrivatePassword,
  disablePrivatePassword,
  enablePrivatePassword,
  deletePrivatePassword,
  type PrivatePasswordStatus,
} from '../lib/api-client'
import { checkSessionAuthStatusAsync } from '../lib/api-client/session-auth'

interface UsePrivatePasswordReturn {
  // 状态
  status: PrivatePasswordStatus | null
  isLoading: boolean
  error: string | null
  
  // 验证状态
  isVerified: boolean
  
  // 方法
  refreshStatus: () => Promise<void>
  setPassword: (password: string) => Promise<void>
  verifyPassword: (password: string) => Promise<boolean>
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>
  disable: () => Promise<void>
  enable: () => Promise<void>
  deletePassword: (password: string) => Promise<void>
  clearVerification: () => void
}

// 本地存储键
const VERIFICATION_KEY = 'private_password_verified'
const VERIFICATION_EXPIRY = 30 * 60 * 1000 // 30分钟过期

export function usePrivatePassword(): UsePrivatePasswordReturn {
  const [status, setStatus] = useState<PrivatePasswordStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  // 检查本地验证状态
  useEffect(() => {
    const checkVerification = () => {
      const verified = localStorage.getItem(VERIFICATION_KEY)
      if (verified) {
        try {
          const { timestamp } = JSON.parse(verified)
          if (Date.now() - timestamp < VERIFICATION_EXPIRY) {
            setIsVerified(true)
          } else {
            localStorage.removeItem(VERIFICATION_KEY)
          }
        } catch {
          localStorage.removeItem(VERIFICATION_KEY)
        }
      }
    }
    checkVerification()
  }, [])

  // 获取私密密码状态
  const refreshStatus = useCallback(async () => {
    // 检查是否已登录（使用 Session 认证）
    const authStatus = await checkSessionAuthStatusAsync()
    if (!authStatus.isValid) {
      setStatus(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getPrivatePasswordStatus()
      setStatus(data)
    } catch (err: any) {
      // 401错误不显示错误信息，这是正常的未登录状态
      if (err.status === 401) {
        setStatus(null)
      } else {
        setError(err.message || '获取状态失败')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  // 设置密码
  const setPassword = useCallback(async (password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await setPrivatePassword(password)
      await refreshStatus()
    } catch (err: any) {
      setError(err.message || '设置密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 验证密码
  const verifyPassword = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const valid = await verifyPrivatePassword(password)
      if (valid) {
        setIsVerified(true)
        localStorage.setItem(VERIFICATION_KEY, JSON.stringify({ timestamp: Date.now() }))
      }
      return valid
    } catch (err: any) {
      setError(err.message || '验证密码失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 更新密码
  const updatePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await updatePrivatePassword(oldPassword, newPassword)
      await refreshStatus()
    } catch (err: any) {
      setError(err.message || '更新密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 禁用密码
  const disable = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await disablePrivatePassword()
      await refreshStatus()
    } catch (err: any) {
      setError(err.message || '禁用密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 启用密码
  const enable = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await enablePrivatePassword()
      await refreshStatus()
    } catch (err: any) {
      setError(err.message || '启用密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 删除密码
  const deletePassword = useCallback(async (password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await deletePrivatePassword(password)
      await refreshStatus()
      setIsVerified(false)
      localStorage.removeItem(VERIFICATION_KEY)
    } catch (err: any) {
      setError(err.message || '删除密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 清除验证状态
  const clearVerification = useCallback(() => {
    setIsVerified(false)
    localStorage.removeItem(VERIFICATION_KEY)
  }, [])

  return {
    status,
    isLoading,
    error,
    isVerified,
    refreshStatus,
    setPassword,
    verifyPassword,
    updatePassword,
    disable,
    enable,
    deletePassword,
    clearVerification,
  }
}
