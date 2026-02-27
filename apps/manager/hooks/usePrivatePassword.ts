/**
 * 管理后台私密密码管理 Hook
 */

import { useState, useCallback, useEffect } from 'react'

const API_BASE_URL = '/api'

export interface PrivatePasswordStatus {
  hasPassword: boolean
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

interface UsePrivatePasswordReturn {
  status: PrivatePasswordStatus | null
  isLoading: boolean
  error: string | null
  success: boolean
  refreshStatus: () => Promise<void>
  setPassword: (password: string) => Promise<void>
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>
  deletePassword: (password: string) => Promise<void>
  disable: () => Promise<void>
  enable: () => Promise<void>
  clearError: () => void
  clearSuccess: () => void
}

function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

export function usePrivatePassword(): UsePrivatePasswordReturn {
  const [status, setStatus] = useState<PrivatePasswordStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken() || ''}`,
  })

  // 获取私密密码状态
  const refreshStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password/status`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error('获取状态失败')
      }

      const data = await response.json()
      if (data.success) {
        setStatus(data.data)
      } else {
        throw new Error(data.error || '获取状态失败')
      }
    } catch (err: any) {
      setError(err.message || '获取状态失败')
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
    setSuccess(false)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ password }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        await refreshStatus()
      } else {
        throw new Error(data.error || '设置密码失败')
      }
    } catch (err: any) {
      setError(err.message || '设置密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 更新密码
  const updatePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        await refreshStatus()
      } else {
        throw new Error(data.error || '更新密码失败')
      }
    } catch (err: any) {
      setError(err.message || '更新密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 删除密码
  const deletePassword = useCallback(async (password: string) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ password }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        await refreshStatus()
      } else {
        throw new Error(data.error || '删除密码失败')
      }
    } catch (err: any) {
      setError(err.message || '删除密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  // 禁用密码
  const disable = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password/disable`, {
        method: 'PATCH',
        headers: getHeaders(),
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        await refreshStatus()
      } else {
        throw new Error(data.error || '禁用密码失败')
      }
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
    setSuccess(false)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/users/me/private-password/enable`, {
        method: 'PATCH',
        headers: getHeaders(),
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        await refreshStatus()
      } else {
        throw new Error(data.error || '启用密码失败')
      }
    } catch (err: any) {
      setError(err.message || '启用密码失败')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshStatus])

  const clearError = useCallback(() => setError(null), [])
  const clearSuccess = useCallback(() => setSuccess(false), [])

  return {
    status,
    isLoading,
    error,
    success,
    refreshStatus,
    setPassword,
    updatePassword,
    deletePassword,
    disable,
    enable,
    clearError,
    clearSuccess,
  }
}
