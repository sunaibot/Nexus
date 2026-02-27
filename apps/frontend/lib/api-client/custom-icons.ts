import { request } from './client'

export interface CustomIcon {
  id: string
  name: string
  url: string
  userId?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCustomIconData {
  name: string
  url: string
  isPublic?: boolean
}

export interface UpdateCustomIconData {
  name?: string
  url?: string
  isPublic?: boolean
}

// 获取所有自定义图标
export async function fetchCustomIcons(): Promise<CustomIcon[]> {
  return request<CustomIcon[]>('/v2/custom-icons', {
    requireAuth: true,
  })
}

// 创建自定义图标
export async function createCustomIcon(data: CreateCustomIconData): Promise<CustomIcon> {
  return request<CustomIcon>('/v2/custom-icons', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

// 更新自定义图标
export async function updateCustomIcon(id: string, data: UpdateCustomIconData): Promise<CustomIcon> {
  return request<CustomIcon>(`/v2/custom-icons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

// 删除自定义图标
export async function deleteCustomIcon(id: string): Promise<void> {
  return request<void>(`/v2/custom-icons/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}
