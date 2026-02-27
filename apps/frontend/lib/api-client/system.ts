import { request } from './client'
import type {
  ApiResponse,
  SystemStats,
  HealthStatus,
  SiteSettings,
} from '../../types'

export async function getHealth(): Promise<HealthStatus> {
  const response = await request<ApiResponse<HealthStatus>>(
    '/health',
    { requireAuth: false }
  )
  return response.data || { status: 'error', version: 'unknown' }
}

export async function getStats(): Promise<SystemStats> {
  const response = await request<ApiResponse<SystemStats>>(
    '/v2/system/stats',
    { requireAuth: true }
  )
  return response.data || { bookmarks: 0, categories: 0, users: 0 }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const response = await request<ApiResponse<SiteSettings>>(
    '/v2/settings/site',
    { requireAuth: false }
  )
  return response.data || {
    siteName: 'NOWEN',
    theme: 'auto',
  }
}

export async function updateSiteSettings(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const response = await request<ApiResponse<SiteSettings>>(
    '/v2/settings/site',
    {
      method: 'PUT',
      body: JSON.stringify(settings),
      requireAuth: true,
    }
  )
  return response.data!
}

export async function getSystemInfo(): Promise<{
  version: string
  nodeVersion: string
  platform: string
  uptime: number
}> {
  const response = await request<
    ApiResponse<{
      version: string
      nodeVersion: string
      platform: string
      uptime: number
    }>
  >('/v2/system/info', { requireAuth: true })
  return response.data!
}

export const systemApi = {
  getHealth,
  getStats,
  getSiteSettings,
  updateSiteSettings,
  getSystemInfo,
}

export default systemApi
