import { request } from './client'

export interface CsrfPathOption {
  path: string
  description: string
  category: string
  reason: string
  selected: boolean
}

export interface SecurityConfig {
  csrf: {
    enabled: boolean
    ignorePaths: string[]
    defaultPaths: string[]
    pathOptions: CsrfPathOption[]
  }
  ipFilter: {
    enabled: boolean
    whitelist: string[]
    blacklist: string[]
  }
  rateLimit: {
    enabled: boolean
    config: {
      windowMs: number
      maxRequests: number
    }
  }
}

export interface SecurityLog {
  id: string
  action: string
  actionType: string
  actionLabel: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: any
  ip: string
  ipLocation: {
    country: string
    region: string
    city: string
    isp: string
    display: string
    fullDisplay: string
  }
  userAgent: {
    raw: string
    browser: {
      name: string
      version: string
    }
    os: {
      name: string
      version: string
    }
    device: string
  }
  createdAt: string
  timeAgo: string
}

export interface SecurityStats {
  todayRequests: number
  failedLogins: number
  csrfBlocked: number
  recentAlerts: Array<{
    id: string
    action: string
    ip: string
    createdAt: string
  }>
}

export interface LogsResponse {
  logs: SecurityLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 获取安全配置
export async function getSecurityConfig(): Promise<SecurityConfig> {
  const response = await request<{ success: boolean; data: SecurityConfig }>('/v2/security/config', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取安全配置失败')
  }
  return response.data
}

// 更新 CSRF 配置
export async function updateCsrfConfig(ignorePaths: string[]): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/security/csrf', {
    method: 'PUT',
    body: JSON.stringify({ ignorePaths }),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新 CSRF 配置失败')
  }
}

// 获取安全日志
export async function getSecurityLogs(
  page: number = 1,
  limit: number = 20,
  type?: string
): Promise<LogsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (type) params.append('type', type)

  const response = await request<{ success: boolean; data: LogsResponse }>(
    `/v2/security/logs?${params.toString()}`,
    { requireAuth: true }
  )
  if (!response.success) {
    throw new Error('获取安全日志失败')
  }
  return response.data
}

// 获取安全统计
export async function getSecurityStats(): Promise<SecurityStats> {
  const response = await request<{ success: boolean; data: SecurityStats }>('/v2/security/stats', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取安全统计失败')
  }
  return response.data
}

// API对象导出
export const securityApi = {
  getConfig: getSecurityConfig,
  updateCsrfConfig,
  getLogs: getSecurityLogs,
  getStats: getSecurityStats,
}
