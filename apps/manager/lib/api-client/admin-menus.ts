import request, { requestWithCache, invalidateCache } from './client'

export interface AdminMenu {
  id: string
  name: string
  path?: string
  icon?: string
  orderIndex?: number
  parentId?: string
  enabled?: boolean
  isEnabled?: boolean
  isVisible?: boolean
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  pluginId?: string
  createdAt?: string
  updatedAt?: string
  children?: AdminMenu[]
}

export interface CreateAdminMenuData {
  name: string
  path?: string
  icon?: string
  orderIndex?: number
  parentId?: string
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  pluginId?: string
}

export interface UpdateAdminMenuData {
  name?: string
  path?: string
  icon?: string
  orderIndex?: number
  parentId?: string
  enabled?: boolean
  visibility?: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  pluginId?: string
}

export async function fetchAdminMenus(userId?: string): Promise<AdminMenu[]> {
  const endpoint = userId ? `/v2/admin-menus?userId=${userId}` : '/v2/admin-menus'
  // 开发环境下不使用缓存，确保获取最新数据
  const useCache = process.env.NODE_ENV === 'production'
  if (useCache) {
    const response = await requestWithCache<{ success: boolean; data: AdminMenu[] }>(endpoint, { requireAuth: true })
    return response.data || []
  } else {
    const response = await request<{ success: boolean; data: AdminMenu[] }>(endpoint, { requireAuth: true })
    return response.data || []
  }
}

export async function fetchAdminMenu(id: string, userId?: string): Promise<AdminMenu> {
  const endpoint = userId ? `/v2/admin-menus/${id}?userId=${userId}` : `/v2/admin-menus/${id}`
  const response = await request<{ success: boolean; data: AdminMenu }>(endpoint, { requireAuth: true })
  return response.data
}

export async function createAdminMenu(data: CreateAdminMenuData): Promise<AdminMenu> {
  const response = await request<{ success: boolean; data: AdminMenu }>('/v2/admin-menus', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify(data),
  })
  invalidateCache('/v2/admin-menus')
  return response.data
}

export async function updateAdminMenu(id: string, data: UpdateAdminMenuData): Promise<AdminMenu> {
  const response = await request<{ success: boolean; data: AdminMenu }>(`/v2/admin-menus/${id}`, {
    method: 'PUT',
    requireAuth: true,
    body: JSON.stringify(data),
  })
  invalidateCache('/v2/admin-menus')
  invalidateCache(`/v2/admin-menus/${id}`)
  return response.data
}

export async function deleteAdminMenu(id: string): Promise<void> {
  await request(`/v2/admin-menus/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('/v2/admin-menus')
  invalidateCache(`/v2/admin-menus/${id}`)
}

export async function addUserMenu(userId: string, menuId: string): Promise<void> {
  await request('/v2/admin-menus/user', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({ userId, menuId }),
  })
  invalidateCache('/v2/admin-menus')
}

export async function removeUserMenu(userId: string, menuId: string): Promise<void> {
  await request(`/v2/admin-menus/user/${userId}/${menuId}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('/v2/admin-menus')
}

export async function addRoleMenu(roleId: string, menuId: string): Promise<void> {
  await request('/v2/admin-menus/role', {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({ roleId, menuId }),
  })
  invalidateCache('/v2/admin-menus')
}

export async function removeRoleMenu(roleId: string, menuId: string): Promise<void> {
  await request(`/v2/admin-menus/role/${roleId}/${menuId}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  invalidateCache('/v2/admin-menus')
}

// 批量更新菜单排序
export interface ReorderMenuItem {
  id: string
  orderIndex: number
}

export async function reorderAdminMenus(items: ReorderMenuItem[]): Promise<{ updatedCount: number; totalCount: number }> {
  const response = await request<{ success: boolean; data: { updatedCount: number; totalCount: number } }>('/v2/admin-menus/reorder', {
    method: 'PATCH',
    requireAuth: true,
    body: JSON.stringify({ items }),
  })
  invalidateCache('/v2/admin-menus')
  return response.data
}

// 获取菜单统计信息
export interface MenuStats {
  bookmarks: number
  categories: number
  plugins: number
  menus: number
  users: number
  theme: number
  wallpaper: number
  [key: string]: number
}

export async function fetchMenuStats(): Promise<MenuStats> {
  const response = await request<{ success: boolean; data: MenuStats }>('/v2/admin-menus/stats', {
    requireAuth: true,
  })
  return response.data
}

// API对象导出
export const adminMenusApi = {
  fetchAll: fetchAdminMenus,
  fetchById: fetchAdminMenu,
  create: createAdminMenu,
  update: updateAdminMenu,
  delete: deleteAdminMenu,
  addUserMenu,
  removeUserMenu,
  addRoleMenu,
  removeRoleMenu,
  reorder: reorderAdminMenus,
  getStats: fetchMenuStats,
}
