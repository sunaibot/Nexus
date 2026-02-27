import { request, invalidateCache } from './client'
import type {
  ApiResponse,
  LoginResponse,
  VerifyResponse,
  AuthStatus,
  RegisterParams,
} from '../../types'

export async function adminLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await request<LoginResponse>('/v2/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    requireAuth: false,
  })

  if (response.success && response.token) {
    localStorage.setItem('admin_token', response.token)
    localStorage.setItem('admin_user', JSON.stringify(response.user))
    localStorage.setItem('admin_role', response.user.role)
  }

  return response
}

export async function adminVerify(): Promise<VerifyResponse> {
  return request<VerifyResponse>('/v2/auth/admin/verify', {
    requireAuth: true,
  })
}

export async function adminLogout(): Promise<void> {
  await request<ApiResponse<void>>('/v2/auth/admin/logout', {
    method: 'POST',
    requireAuth: true,
  })
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_role')
  invalidateCache()
}

export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const response = await adminVerify()
    return {
      isValid: response.valid,
      username: response.user?.username || null,
    }
  } catch {
    return {
      isValid: false,
      username: null,
    }
  }
}

export function clearAuthStatus(): void {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_role')
  invalidateCache()
}

export async function userRegister(
  params: RegisterParams
): Promise<LoginResponse> {
  const response = await request<LoginResponse>('/v2/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
    requireAuth: false,
  })

  if (response.success && response.token) {
    localStorage.setItem('admin_token', response.token)
    localStorage.setItem('admin_user', JSON.stringify(response.user))
    localStorage.setItem('admin_role', response.user.role)
  }

  return response
}

export async function userLogin(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await request<LoginResponse>('/v2/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    requireAuth: false,
  })

  if (response.success && response.token) {
    localStorage.setItem('admin_token', response.token)
    localStorage.setItem('admin_user', JSON.stringify(response.user))
    localStorage.setItem('admin_role', response.user.role)
  }

  return response
}

export async function userLogout(): Promise<void> {
  await request<ApiResponse<void>>('/v2/auth/logout', {
    method: 'POST',
    requireAuth: true,
  })
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_role')
  invalidateCache()
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  await request<ApiResponse<void>>('/v2/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
    requireAuth: true,
  })
}

export async function savePasswordHint(hint: string): Promise<void> {
  await request<ApiResponse<void>>('/v2/auth/password-hint', {
    method: 'POST',
    body: JSON.stringify({ hint }),
    requireAuth: true,
  })
}

export async function getPasswordHint(): Promise<string | null> {
  const response = await request<ApiResponse<{ hint: string }>>(
    '/v2/auth/password-hint',
    { requireAuth: false }
  )
  return response.data?.hint || null
}

export const authApi = {
  adminLogin,
  adminVerify,
  adminLogout,
  checkAuthStatus,
  clearAuthStatus,
  userRegister,
  userLogin,
  userLogout,
  changePassword,
  savePasswordHint,
  getPasswordHint,
}

export default authApi
