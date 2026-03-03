import request, { requestWithCache, invalidateCache } from './client'

export interface Plugin {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  icon?: string
  isEnabled: boolean
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreatePluginData {
  name: string
  description?: string
  version: string
  author?: string
  icon?: string
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  config?: Record<string, unknown>
}

export interface UpdatePluginData {
  name?: string
  description?: string
  version?: string
  author?: string
  icon?: string
  isEnabled?: boolean
  visibility?: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  config?: Record<string, unknown>
}

export interface Plugin {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  icon?: string
  isEnabled: boolean
  isInstalled?: boolean  // 添加isInstalled字段
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export async function fetchPlugins(userId?: string, includeUninstalled?: boolean): Promise<Plugin[]> {
  let endpoint = userId ? `/v2/plugins?userId=${userId}` : '/v2/plugins'
  if (includeUninstalled) {
    endpoint += endpoint.includes('?') ? '&includeUninstalled=true' : '?includeUninstalled=true'
  }
  const response = await requestWithCache<{ success: boolean; data: Plugin[] }>(endpoint, { requireAuth: true })
  return response.data || []
}

export async function fetchPlugin(id: string, userId?: string): Promise<Plugin> {
  const endpoint = userId ? `/v2/plugins/${id}?userId=${userId}` : `/v2/plugins/${id}`
  const response = await request<{ success: boolean; data: Plugin }>(endpoint, { requireAuth: true })
  return response.data
}

export async function createPlugin(data: CreatePluginData): Promise<Plugin> {
  const response = await request<{ success: boolean; data: Plugin }>('/v2/plugins', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify(data),
  })
  invalidateCache('/v2/plugins')
  return response.data
}

export async function updatePlugin(id: string, data: UpdatePluginData): Promise<Plugin> {
  const response = await request<{ success: boolean; data: Plugin }>(`/v2/plugins/${id}`, {
    method: 'PATCH',
    requireAuth: true,
    body: JSON.stringify(data),
  })
  invalidateCache('/v2/plugins')
  invalidateCache(`/v2/plugins/${id}`)
  return response.data
}

export async function deletePlugin(id: string): Promise<void> {
  await request(`/v2/plugins/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('/v2/plugins')
  invalidateCache(`/v2/plugins/${id}`)
}

// 安装插件（支持重新安装已卸载的插件）
export async function installPlugin(id: string): Promise<void> {
  await request(`/v2/plugins/${id}/install`, {
    method: 'POST',
    requireAuth: true,
  })
  invalidateCache('/v2/plugins')
  invalidateCache(`/v2/plugins/${id}`)
}

export async function addUserPlugin(userId: string, pluginId: string): Promise<void> {
  await request('/v2/plugins/user', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({ userId, pluginId }),
  })
  invalidateCache('/v2/plugins')
}

export async function removeUserPlugin(userId: string, pluginId: string): Promise<void> {
  await request(`/v2/plugins/user/${userId}/${pluginId}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('/v2/plugins')
}

export async function addRolePlugin(roleId: string, pluginId: string): Promise<void> {
  await request('/v2/plugins/role', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({ roleId, pluginId }),
  })
  invalidateCache('/v2/plugins')
}

export async function removeRolePlugin(roleId: string, pluginId: string): Promise<void> {
  await request(`/v2/plugins/role/${roleId}/${pluginId}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('/v2/plugins')
}

// API对象导出
export const pluginsApi = {
  fetchAll: fetchPlugins,
  fetchById: fetchPlugin,
  create: createPlugin,
  update: updatePlugin,
  delete: deletePlugin,
  install: installPlugin,
  addUserPlugin,
  removeUserPlugin,
  addRolePlugin,
  removeRolePlugin,
}
