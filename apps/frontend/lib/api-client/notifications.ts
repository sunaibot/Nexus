/**
 * 通知 API 客户端
 * 提供通知管理和推送功能
 */
import { request } from './client'

// 通知类型
export type NotificationType = 'system' | 'bookmark' | 'category' | 'announcement' | 'update' | 'maintenance' | 'feature' | 'security'

// 通知优先级
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low'

// 通知渠道
export type NotificationChannel = 'web' | 'email' | 'webhook' | 'feishu' | 'dingtalk' | 'wechat'

// 通知接口
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  priority: NotificationPriority
  channels: NotificationChannel[]
  isRead: boolean
  readAt?: string
  data?: Record<string, unknown>
  createdAt: string
}

// 通知配置接口
export interface NotificationConfig {
  id: string
  userId: string
  channel: NotificationChannel
  enabled: boolean
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// 通知渠道信息接口
export interface NotificationChannelInfo {
  value: NotificationChannel
  name: string
  description: string
}

// 分页信息接口
export interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// 通知列表响应接口
export interface NotificationsResponse {
  notifications: Notification[]
  pagination: PaginationInfo
}

// 创建通知请求
export interface CreateNotificationRequest {
  type: NotificationType
  title: string
  content: string
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  data?: Record<string, unknown>
}

// 保存通知配置请求
export interface SaveNotificationConfigRequest {
  channel: NotificationChannel
  enabled: boolean
  config?: Record<string, unknown>
}

// 通知查询参数
export interface NotificationsQueryParams {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

/**
 * 获取用户通知列表
 */
export async function fetchNotifications(params?: NotificationsQueryParams): Promise<NotificationsResponse> {
  const queryParams = new URLSearchParams()
  if (params?.unreadOnly) queryParams.append('unreadOnly', 'true')
  if (params?.limit) queryParams.append('limit', String(params.limit))
  if (params?.offset) queryParams.append('offset', String(params.offset))
  
  const query = queryParams.toString()
  const url = `/v2/notifications/notifications${query ? `?${query}` : ''}`
  
  const response = await request<{ success: boolean; data: Notification[]; pagination: PaginationInfo }>(url, {
    requireAuth: true,
  })
  
  return {
    notifications: response.data,
    pagination: response.pagination,
  }
}

/**
 * 获取未读通知数量
 */
export async function fetchUnreadCount(): Promise<number> {
  const response = await request<{ success: boolean; data: { count: number } }>('/v2/notifications/notifications/unread-count', {
    requireAuth: true,
  })
  return response.data.count
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  await request<{ success: boolean }>(`/v2/notifications/notifications/${id}/read`, {
    method: 'PUT',
    requireAuth: true,
  })
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await request<{ success: boolean }>('/v2/notifications/notifications/read-all', {
    method: 'PUT',
    requireAuth: true,
  })
}

/**
 * 删除通知
 */
export async function deleteNotification(id: string): Promise<void> {
  await request<{ success: boolean }>(`/v2/notifications/notifications/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 创建通知（管理员）
 */
export async function createNotification(data: CreateNotificationRequest): Promise<Notification> {
  const response = await request<{ success: boolean; data: Notification }>('/v2/notifications/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取通知配置
 */
export async function fetchNotificationConfigs(): Promise<NotificationConfig[]> {
  const response = await request<{ success: boolean; data: NotificationConfig[] }>('/v2/notifications/notifications/configs', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 保存通知配置
 */
export async function saveNotificationConfig(data: SaveNotificationConfigRequest): Promise<void> {
  await request<{ success: boolean }>('/v2/notifications/notifications/configs', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 获取支持的渠道列表
 */
export async function fetchNotificationChannels(): Promise<NotificationChannelInfo[]> {
  const response = await request<{ success: boolean; data: NotificationChannelInfo[] }>('/v2/notifications/notifications/channels', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 通知 API 对象
 */
export const notificationsApi = {
  fetchAll: fetchNotifications,
  fetchUnreadCount,
  markAsRead: markNotificationAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  delete: deleteNotification,
  create: createNotification,
  configs: {
    fetchAll: fetchNotificationConfigs,
    save: saveNotificationConfig,
  },
  channels: {
    fetchAll: fetchNotificationChannels,
  },
}

export default notificationsApi
