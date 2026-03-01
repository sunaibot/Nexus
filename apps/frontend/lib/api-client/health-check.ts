/**
 * 健康检查 API 客户端
 * 提供系统健康状态检查功能
 */

import { request } from './client'

// 健康状态接口
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: boolean
    storage: boolean
    memory: boolean
  }
}

/**
 * 检查书签健康状态
 */
export async function checkBookmarksHealth(): Promise<{
  total: number
  broken: number
  duplicates: number
  issues: Array<{
    id: string
    title: string
    url: string
    issue: string
  }>
}> {
  const response = await request<{
    success: boolean
    data: {
      total: number
      broken: number
      duplicates: number
      issues: Array<{
        id: string
        title: string
        url: string
        issue: string
      }>
    }
  }>('/v2/health/bookmarks', {
    method: 'GET',
    requireAuth: true,
  })
  return response.data
}

/**
 * 获取系统健康状态
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await request<{
    success: boolean
    data: HealthStatus
  }>('/v2/health', {
    method: 'GET',
    requireAuth: false,
  })
  return response.data
}

/**
 * 健康检查 API 对象
 */
export const healthCheckApi = {
  check: checkBookmarksHealth,
  getStatus: getHealthStatus,
}

export default healthCheckApi
