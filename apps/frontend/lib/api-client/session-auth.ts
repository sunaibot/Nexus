/**
 * Session 认证 API 客户端
 * 提供基于后端 Session 的认证功能
 */

import { request, ApiError } from './client'

// Session 认证状态
export interface SessionAuthStatus {
  isValid: boolean
  username?: string
  role?: string
  requirePasswordChange?: boolean
}

// 管理员登录
export async function sessionAdminLogin(
  username: string,
  password: string
): Promise<{
  success: boolean
  user?: {
    id: string
    username: string
    email: string
    role: string
  }
  requirePasswordChange?: boolean
  error?: string
  locked?: boolean
  remainingTime?: number
}> {
  try {
    const response = await request<{
      success: boolean
      user?: {
        id: string
        username: string
        email: string
        role: string
      }
      requirePasswordChange?: boolean
      error?: string
      locked?: boolean
      remainingTime?: number
    }>('/v2/session-auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      requireAuth: false,
    })
    return response
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        locked: error.status === 423,
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '登录失败',
    }
  }
}

// 管理员登出
export async function sessionAdminLogout(): Promise<{ success: boolean }> {
  try {
    const response = await request<{ success: boolean }>(
      '/v2/session-auth/admin/logout',
      {
        method: 'POST',
        requireAuth: true,
      }
    )
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false }
  }
}

// 检查 Session 认证状态
export function checkSessionAuthStatus():
  | { isValid: true; username: string; role: string }
  | { isValid: false; username: null; role: null } {
  // 同步检查 - 返回默认值，实际状态需要异步获取
  return { isValid: false, username: null, role: null }
}

// 异步检查 Session 认证状态
export async function checkSessionAuthStatusAsync(): Promise<{
  isValid: boolean
  username?: string
  role?: string
  requirePasswordChange?: boolean
}> {
  try {
    const response = await request<{
      valid: boolean
      user?: {
        id: string
        username: string
        email: string
        role: string
      }
    }>('/v2/session-auth/admin/verify', {
      method: 'GET',
      requireAuth: true,
    })

    if (response.valid && response.user) {
      return {
        isValid: true,
        username: response.user.username,
        role: response.user.role,
      }
    }
    return { isValid: false }
  } catch (error) {
    // 401 错误表示未登录，这是正常情况
    if (error instanceof ApiError && error.status === 401) {
      return { isValid: false }
    }
    console.error('Check session auth status error:', error)
    return { isValid: false }
  }
}

// 清除 Session 认证状态
export function clearSessionAuthStatus(): void {
  // Session 由后端管理，前端不需要做特殊处理
  console.log('[SessionAuth] Auth status cleared')
}

// Session 认证 API 对象
export const sessionAuthApi = {
  adminLogin: sessionAdminLogin,
  adminLogout: sessionAdminLogout,
  checkStatus: checkSessionAuthStatus,
  checkStatusAsync: checkSessionAuthStatusAsync,
  clearStatus: clearSessionAuthStatus,
}

export default sessionAuthApi
