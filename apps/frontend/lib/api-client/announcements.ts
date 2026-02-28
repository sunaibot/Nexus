/**
 * 公告 API 客户端
 * 提供系统公告管理功能
 */
import { request } from './client'

// 通知类型
export type NotificationType = 'announcement' | 'update' | 'maintenance' | 'feature' | 'security'

// 通知优先级
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low'

// 公告接口
export interface Announcement {
  id: string
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  targetRoles: string[]
  targetUsers?: string[]
  startAt: string
  endAt?: string
  isPublished: boolean
  publishedAt?: string
  publishedBy?: string
  readCount: number
  createdAt: string
  updatedAt: string
}

// 创建公告请求
export interface CreateAnnouncementRequest {
  title: string
  content: string
  type?: NotificationType
  priority?: NotificationPriority
  targetRoles?: string[]
  targetUsers?: string[]
  startAt?: string
  endAt?: string
  isPublished?: boolean
}

// 更新公告请求
export interface UpdateAnnouncementRequest extends Partial<CreateAnnouncementRequest> {}

// 公告查询参数
export interface AnnouncementsQueryParams {
  type?: NotificationType
  limit?: number
  includeExpired?: boolean
}

/**
 * 获取公告列表
 */
export async function fetchAnnouncements(params?: AnnouncementsQueryParams): Promise<Announcement[]> {
  const queryParams = new URLSearchParams()
  if (params?.type) queryParams.append('type', params.type)
  if (params?.limit) queryParams.append('limit', String(params.limit))
  if (params?.includeExpired) queryParams.append('includeExpired', 'true')
  
  const query = queryParams.toString()
  const url = `/v2/announcements${query ? `?${query}` : ''}`
  
  const response = await request<{ success: boolean; data: Announcement[] }>(url, {
    requireAuth: false, // 公开接口
  })
  return response.data
}

/**
 * 获取公告详情
 */
export async function fetchAnnouncementById(id: string): Promise<Announcement> {
  const response = await request<{ success: boolean; data: Announcement }>(`/v2/announcements/${id}`, {
    requireAuth: false, // 公开接口
  })
  return response.data
}

/**
 * 创建公告（管理员）
 */
export async function createAnnouncement(data: CreateAnnouncementRequest): Promise<Announcement> {
  const response = await request<{ success: boolean; data: Announcement }>('/v2/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新公告（管理员）
 */
export async function updateAnnouncement(id: string, data: UpdateAnnouncementRequest): Promise<Announcement> {
  const response = await request<{ success: boolean; data: Announcement }>(`/v2/announcements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 删除公告（管理员）
 */
export async function deleteAnnouncement(id: string): Promise<{ deleted: boolean }> {
  const response = await request<{ success: boolean; data: { deleted: boolean } }>(`/v2/announcements/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
  return response.data
}

/**
 * 发布公告（管理员）
 */
export async function publishAnnouncement(id: string): Promise<Announcement> {
  const response = await request<{ success: boolean; data: Announcement }>(`/v2/announcements/${id}/publish`, {
    method: 'POST',
    requireAuth: true,
  })
  return response.data
}

/**
 * 公告 API 对象
 */
export const announcementsApi = {
  fetchAll: fetchAnnouncements,
  fetchById: fetchAnnouncementById,
  create: createAnnouncement,
  update: updateAnnouncement,
  delete: deleteAnnouncement,
  publish: publishAnnouncement,
}

export default announcementsApi
