/**
 * RSS订阅 API 客户端
 * 提供RSS订阅源管理功能
 */
import { request } from './client'

// RSS订阅源接口
export interface RssFeed {
  id: string
  userId: string
  title: string
  url: string
  description?: string
  isActive: boolean
  lastFetchedAt?: string
  fetchError?: string
  createdAt: string
  updatedAt: string
}

// RSS文章接口
export interface RssArticle {
  id: string
  feedId: string
  title: string
  link: string
  description?: string
  content?: string
  author?: string
  publishedAt?: string
  isRead: boolean
  isStarred: boolean
  createdAt: string
}

// 创建RSS订阅源请求
export interface CreateRssFeedRequest {
  url: string
  title?: string
  description?: string
}

// 更新RSS订阅源请求
export interface UpdateRssFeedRequest {
  title?: string
  url?: string
  description?: string
  isActive?: boolean
}

// 收藏文章请求
export interface StarArticleRequest {
  isStarred: boolean
}

/**
 * 获取RSS订阅源列表
 */
export async function fetchRssFeeds(activeOnly?: boolean): Promise<RssFeed[]> {
  const url = activeOnly ? '/v2/rss/feeds?activeOnly=true' : '/v2/rss/feeds'
  const response = await request<{ success: boolean; data: RssFeed[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取RSS订阅源详情
 */
export async function fetchRssFeedById(id: string): Promise<RssFeed> {
  const response = await request<{ success: boolean; data: RssFeed }>(`/v2/rss/feeds/${id}`, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 创建RSS订阅源
 */
export async function createRssFeed(data: CreateRssFeedRequest): Promise<{ id: string }> {
  const response = await request<{ success: boolean; id: string }>('/v2/rss/feeds', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return { id: response.id }
}

/**
 * 更新RSS订阅源
 */
export async function updateRssFeed(id: string, data: UpdateRssFeedRequest): Promise<void> {
  await request<{ success: boolean }>(`/v2/rss/feeds/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    requireAuth: true,
  })
}

/**
 * 删除RSS订阅源
 */
export async function deleteRssFeed(id: string): Promise<void> {
  await request<{ success: boolean }>(`/v2/rss/feeds/${id}`, {
    method: 'DELETE',
    requireAuth: true,
  })
}

/**
 * 获取RSS文章列表
 */
export async function fetchRssArticles(feedId?: string, unreadOnly?: boolean): Promise<RssArticle[]> {
  const params = new URLSearchParams()
  if (feedId) params.append('feedId', feedId)
  if (unreadOnly) params.append('unreadOnly', 'true')
  
  const query = params.toString()
  const url = `/v2/rss/articles${query ? `?${query}` : ''}`
  
  const response = await request<{ success: boolean; data: RssArticle[] }>(url, {
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取未读文章数量
 */
export async function fetchRssUnreadCount(feedId?: string): Promise<number> {
  const url = feedId ? `/v2/rss/unread-count?feedId=${feedId}` : '/v2/rss/unread-count'
  const response = await request<{ success: boolean; data: { count: number } }>(url, {
    requireAuth: true,
  })
  return response.data.count
}

/**
 * 标记文章为已读
 */
export async function markRssArticleAsRead(id: string): Promise<void> {
  await request<{ success: boolean }>(`/v2/rss/articles/${id}/read`, {
    method: 'PATCH',
    requireAuth: true,
  })
}

/**
 * 标记所有文章为已读
 */
export async function markAllRssArticlesAsRead(feedId?: string): Promise<void> {
  await request<{ success: boolean }>('/v2/rss/mark-all-read', {
    method: 'POST',
    body: JSON.stringify({ feedId }),
    requireAuth: true,
  })
}

/**
 * 收藏/取消收藏文章
 */
export async function starRssArticle(id: string, isStarred: boolean): Promise<void> {
  await request<{ success: boolean }>(`/v2/rss/articles/${id}/star`, {
    method: 'PATCH',
    body: JSON.stringify({ isStarred }),
    requireAuth: true,
  })
}

/**
 * RSS API 对象
 */
export const rssApi = {
  feeds: {
    fetchAll: fetchRssFeeds,
    fetchById: fetchRssFeedById,
    create: createRssFeed,
    update: updateRssFeed,
    delete: deleteRssFeed,
  },
  articles: {
    fetchAll: fetchRssArticles,
    fetchUnreadCount: fetchRssUnreadCount,
    markAsRead: markRssArticleAsRead,
    markAllAsRead: markAllRssArticlesAsRead,
    star: starRssArticle,
  },
}

export default rssApi
