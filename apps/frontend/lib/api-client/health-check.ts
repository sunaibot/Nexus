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

// 健康检查结果状态
export type HealthCheckStatus = 'ok' | 'error' | 'timeout' | 'redirect'

// 健康检查结果
export interface HealthCheckResult {
  bookmarkId: string
  url: string
  title: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  status: HealthCheckStatus
  statusCode?: number
  responseTime: number
  error?: string
  redirectUrl?: string
}

// 健康检查摘要
export interface HealthCheckSummary {
  total: number
  ok: number
  error: number
  timeout: number
  redirect: number
  averageResponseTime: number
}

// 健康检查响应
export interface HealthCheckResponse {
  results: HealthCheckResult[]
  summary: HealthCheckSummary
}

/**
 * 检查书签健康状态
 */
export async function checkBookmarksHealth(): Promise<HealthCheckResponse> {
  const response = await request<{
    success: boolean
    data: HealthCheckResponse
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
