/**
 * Session 认证 API 客户端（管理后台）
 * 使用后端 Session 管理登录状态
 */

import { API_BASE } from './api'

export interface LoginResponse {
  success: boolean
  user?: {
    id: string
    username: string
    email?: string
    role?: string
  }
  error?: string
  requirePasswordChange?: boolean
}

export interface VerifyResponse {
  valid: boolean
  user?: {
    id: string
    username: string
    email?: string
    role?: string
  }
}

/**
 * 管理员登录 - 使用 Session
 */
export async function sessionAdminLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/api/v2/session-auth/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include', // 允许接收 Cookie
  })

  const data = await response.json()

  if (data.success && data.user) {
    // 登录成功后，保存用户信息到 localStorage（用于显示）
    localStorage.setItem('admin_username', data.user.username)
    localStorage.setItem('admin_authenticated', 'true')
    localStorage.setItem('admin_login_time', Date.now().toString())
    if (data.user.role) {
      localStorage.setItem('admin_role', data.user.role)
    }
  }

  return data
}

/**
 * 验证 Session 是否有效
 */
export async function sessionAdminVerify(): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE}/api/v2/session-auth/admin/verify`, {
    method: 'GET',
    credentials: 'include', // Session 通过 Cookie 自动发送
  })

  if (!response.ok) {
    return { valid: false }
  }

  return response.json()
}

/**
 * 管理员登出 - 销毁 Session
 */
export async function sessionAdminLogout(): Promise<void> {
  await fetch(`${API_BASE}/api/v2/session-auth/admin/logout`, {
    method: 'POST',
    credentials: 'include', // Session 通过 Cookie 自动发送
  })

  // 清除本地存储
  localStorage.removeItem('admin_username')
  localStorage.removeItem('admin_authenticated')
  localStorage.removeItem('admin_login_time')
  localStorage.removeItem('admin_role')
}

/**
 * 异步检查登录状态（通过后端验证 Session）
 */
export async function checkSessionAuthStatusAsync(): Promise<{
  isValid: boolean
  username: string | null
}> {
  try {
    const response = await sessionAdminVerify()
    if (response.valid && response.user) {
      // 更新本地存储
      localStorage.setItem('admin_username', response.user.username)
      localStorage.setItem('admin_authenticated', 'true')
      localStorage.setItem('admin_login_time', Date.now().toString())
      if (response.user.role) {
        localStorage.setItem('admin_role', response.user.role)
      }
      return {
        isValid: true,
        username: response.user.username,
      }
    }
    return {
      isValid: false,
      username: null,
    }
  } catch {
    return {
      isValid: false,
      username: null,
    }
  }
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentSessionUser(): Promise<{
  id: string
  username: string
  email?: string
  role?: string
} | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v2/session-auth/me`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch {
    return null
  }
}
