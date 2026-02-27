/**
 * 用户私密密码 API 客户端
 */

import { apiClient } from './client'

export interface PrivatePasswordStatus {
  hasPassword: boolean
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface VerifyPasswordResult {
  valid: boolean
}

/**
 * 获取私密密码状态
 */
export async function getPrivatePasswordStatus(): Promise<PrivatePasswordStatus> {
  const response = await apiClient.request<{ success: boolean; data: PrivatePasswordStatus }>(
    '/v2/users/me/private-password/status',
    {
      method: 'GET',
      requireAuth: true,
    }
  )
  return response.data
}

/**
 * 设置私密密码
 */
export async function setPrivatePassword(password: string): Promise<void> {
  await apiClient.request<{ success: boolean }>(
    '/v2/users/me/private-password',
    {
      method: 'POST',
      body: JSON.stringify({ password }),
      requireAuth: true,
    }
  )
}

/**
 * 验证私密密码
 */
export async function verifyPrivatePassword(password: string): Promise<boolean> {
  const response = await apiClient.request<{ success: boolean; data: VerifyPasswordResult }>(
    '/v2/users/me/private-password/verify',
    {
      method: 'POST',
      body: JSON.stringify({ password }),
      requireAuth: true,
    }
  )
  return response.data.valid
}

/**
 * 更新私密密码
 */
export async function updatePrivatePassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiClient.request<{ success: boolean }>(
    '/v2/users/me/private-password',
    {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
      requireAuth: true,
    }
  )
}

/**
 * 禁用私密密码
 */
export async function disablePrivatePassword(): Promise<void> {
  await apiClient.request<{ success: boolean }>(
    '/v2/users/me/private-password/disable',
    {
      method: 'PATCH',
      requireAuth: true,
    }
  )
}

/**
 * 启用私密密码
 */
export async function enablePrivatePassword(): Promise<void> {
  await apiClient.request<{ success: boolean }>(
    '/v2/users/me/private-password/enable',
    {
      method: 'PATCH',
      requireAuth: true,
    }
  )
}

/**
 * 删除私密密码
 */
export async function deletePrivatePassword(password: string): Promise<void> {
  await apiClient.request<{ success: boolean }>(
    '/v2/users/me/private-password',
    {
      method: 'DELETE',
      body: JSON.stringify({ password }),
      requireAuth: true,
    }
  )
}

// API 对象导出
export const privatePasswordApi = {
  getStatus: getPrivatePasswordStatus,
  set: setPrivatePassword,
  verify: verifyPrivatePassword,
  update: updatePrivatePassword,
  disable: disablePrivatePassword,
  enable: enablePrivatePassword,
  delete: deletePrivatePassword,
}
