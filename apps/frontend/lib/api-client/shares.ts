/**
 * 分享 API 客户端
 * 提供内容分享功能
 */
import { request } from './client'

// 分享类型
export type ShareType = 'bookmark' | 'category' | 'note' | 'collection'

// 分享接口
export interface Share {
  id: string
  shareCode: string
  type: ShareType
  resourceId: string
  expiresAt: string
  createdAt: string
}

// 分享内容接口
export interface ShareContent {
  code: string
  content: unknown
}

// 创建分享请求
export interface CreateShareRequest {
  type: ShareType
  resourceId: string
  expiresIn?: number // 过期时间（秒），默认86400（1天）
}

/**
 * 创建分享
 */
export async function createShare(data: CreateShareRequest): Promise<Share> {
  const response = await request<{ success: boolean; data: Share }>('/v2/shares', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取分享内容
 */
export async function fetchShareContent(code: string): Promise<ShareContent> {
  const response = await request<{ success: boolean; data: ShareContent }>(`/v2/shares/${code}`, {
    requireAuth: false, // 公开接口
  })
  return response.data
}

/**
 * 分享 API 对象
 */
export const sharesApi = {
  create: createShare,
  fetchContent: fetchShareContent,
}

export default sharesApi
