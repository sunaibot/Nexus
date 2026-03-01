/**
 * 名言 API 客户端
 * 提供名言警句管理功能
 */
import { request } from './client'

// 名言接口
export interface Quote {
  id?: string
  text: string
  author: string
  source?: string
  category?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 获取随机名言
 */
export async function fetchRandomQuote(): Promise<Quote> {
  const response = await request<{ success: boolean; data: Quote }>('/v2/quotes/random', {
    requireAuth: false, // 公开接口
  })
  return response.data
}

/**
 * 获取名言列表
 */
export async function fetchQuotes(): Promise<Quote[]> {
  const response = await request<{ success: boolean; data: Quote[] }>('/v2/quotes', {
    requireAuth: true,
  })
  return response.data
}

/**
 * 更新名言列表（本地存储）
 * 由于后端没有提供更新接口，此函数仅更新本地状态
 */
export async function updateQuotes(
  quotes: string[],
  useDefault: boolean
): Promise<{ success: boolean }> {
  // 本地存储名言设置
  localStorage.setItem('custom_quotes', JSON.stringify(quotes))
  localStorage.setItem('use_default_quotes', JSON.stringify(useDefault))
  return { success: true }
}

/**
 * 名言 API 对象
 */
export const quotesApi = {
  fetchRandom: fetchRandomQuote,
  fetchAll: fetchQuotes,
  update: updateQuotes,
}

export default quotesApi
