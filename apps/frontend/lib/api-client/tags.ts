/**
 * 标签 API 客户端
 * 提供标签管理功能
 */
import { request } from './client'

// 标签接口
export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  description?: string
  bookmarkCount?: number
  createdAt: string
  updatedAt: string
}

// 书签接口（用于标签详情）
export interface BookmarkWithTag {
  id: string
  title: string
  url: string
  description?: string
  categoryId?: string
  isPublic: boolean
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

// 标签详情接口
export interface TagDetail extends Tag {
  bookmarks: BookmarkWithTag[]
}

// 创建标签请求
export interface CreateTagRequest {
  name: string
  color?: string
  description?: string
}

// 更新标签请求
export interface UpdateTagRequest {
  name?: string
  color?: string
  description?: string
}

/**
 * 获取所有标签
 */
export async function fetchTags(): Promise<Tag[]> {
  const response = await request<{ success: boolean; data: Tag[] }>('/v2/tags', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取标签详情
 */
export async function fetchTagById(id: string): Promise<TagDetail> {
  const response = await request<{ success: boolean; data: TagDetail }>(`/v2/tags/${id}`, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 创建标签
 */
export async function createTag(data: CreateTagRequest): Promise<Tag> {
  const response = await request<{ success: boolean; data: Tag }>('/v2/tags', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新标签
 */
export async function updateTag(id: string, data: UpdateTagRequest): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除标签
 */
export async function deleteTag(id: string): Promise<void> {
  await request<{ success: boolean; data: { id: string } }>(`/v2/tags/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 标签 API 对象
 */
export const tagsApi = {
  fetchAll: fetchTags,
  fetchById: fetchTagById,
  create: createTag,
  update: updateTag,
  delete: deleteTag,
}

export default tagsApi
