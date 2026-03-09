import { request } from './client'

// 安全配置
export interface SecurityConfig {
  maxLoginAttempts: number
  lockDurationMinutes: number
  sessionTimeoutHours: number
  passwordMinLength: number
  requireStrongPassword: boolean
  enableIpFilter: boolean
  enableAuditLog: boolean
}

// 文件传输配置
export interface FileTransferConfig {
  maxFileSizeMB: number
  maxExpiryHours: number
  maxDownloads: number
  allowedFileTypes: string[]
  blockedFileTypes: string[]
  uploadPath: string
  enableVirusScan: boolean
  chunkSizeMB: number
  maxConcurrentUploads: number
}

// 上传配置
export interface UploadConfig {
  chunkSizeMB: number
  maxConcurrent: number
  maxFileSizeMB: number
  tempDir: string
  expireTimeHours: number
  cleanupIntervalMinutes: number
}

// 通知配置
export interface NotificationConfig {
  cooldownMinutes: number
  maxRetries: number
  retryIntervalMinutes: number
}

// 健康检查配置
export interface HealthCheckConfig {
  intervalMinutes: number
  timeoutSeconds: number
  maxRetries: number
}

// 速率限制配置
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

// 站点配置
export interface SiteConfig {
  title: string
  description: string
  favicon: string
  logo: string
  footerText: string
  enableRegistration: boolean
  enableGuestAccess: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
}

// 日志配置
export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableConsole: boolean
  enableFile: boolean
  maxFileSizeMB: number
  maxFiles: number
  logDir: string
}

// 跨域配置
export interface CorsConfig {
  allowedOrigins: string[]
  allowCredentials: boolean
  allowMethods: string[]
  allowHeaders: string[]
  maxAge: number
}

// 所有配置
export interface SystemConfigs {
  security: SecurityConfig
  fileTransfer: FileTransferConfig
  upload: UploadConfig
  notification: NotificationConfig
  healthCheck: HealthCheckConfig
  rateLimit: RateLimitConfig
  site: SiteConfig
  log: LogConfig
  cors: CorsConfig
}

// 获取所有配置
export async function getAllSystemConfigs(): Promise<SystemConfigs> {
  const response = await request<{ success: boolean; data: SystemConfigs }>('/v2/system-configs', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取系统配置失败')
  }
  return response.data
}

// 获取安全配置
export async function getSecuritySystemConfig(): Promise<SecurityConfig> {
  const response = await request<{ success: boolean; data: SecurityConfig }>('/v2/system-configs/security', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取安全配置失败')
  }
  return response.data
}

// 更新安全配置
export async function updateSecuritySystemConfig(config: Partial<SecurityConfig>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/security', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新安全配置失败')
  }
}

// 获取文件传输配置
export async function getFileTransferSystemConfig(): Promise<FileTransferConfig> {
  const response = await request<{ success: boolean; data: FileTransferConfig }>('/v2/system-configs/file-transfer', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取文件传输配置失败')
  }
  return response.data
}

// 更新文件传输配置
export async function updateFileTransferSystemConfig(config: Partial<FileTransferConfig>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/file-transfer', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新文件传输配置失败')
  }
}

// 获取上传配置
export async function getUploadSystemConfig(): Promise<UploadConfig> {
  const response = await request<{ success: boolean; data: UploadConfig }>('/v2/system-configs/upload', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取上传配置失败')
  }
  return response.data
}

// 更新上传配置
export async function updateUploadSystemConfig(config: Partial<UploadConfig>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/upload', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新上传配置失败')
  }
}

// 获取通知配置
export async function getNotificationSystemConfig(): Promise<NotificationConfig> {
  const response = await request<{ success: boolean; data: NotificationConfig }>('/v2/system-configs/notification', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取通知配置失败')
  }
  return response.data
}

// 更新通知配置
export async function updateNotificationSystemConfig(config: Partial<NotificationConfig>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/notification', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新通知配置失败')
  }
}

// 批量更新配置
export async function batchUpdateSystemConfigs(configs: Partial<SystemConfigs>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/batch', {
    method: 'PUT',
    body: JSON.stringify(configs),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '批量更新配置失败')
  }
}

// 重置为默认配置
export async function resetSystemConfigsToDefaults(): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/reset', {
    method: 'POST',
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '重置配置失败')
  }
}

// 获取默认配置
export async function getSystemConfigDefaults(): Promise<SystemConfigs> {
  const response = await request<{ success: boolean; data: SystemConfigs }>('/v2/system-configs/defaults', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取默认配置失败')
  }
  return response.data
}

// 获取站点配置
export async function getSiteSystemConfig(): Promise<SiteConfig> {
  const response = await request<{ success: boolean; data: SiteConfig }>('/v2/system-configs/site', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取站点配置失败')
  }
  return response.data
}

// 更新站点配置
export async function updateSiteSystemConfig(config: Partial<SiteConfig>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/site', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新站点配置失败')
  }
}

// 获取日志配置
export async function getLogSystemConfig(): Promise<LogConfig> {
  const response = await request<{ success: boolean; data: LogConfig }>('/v2/system-configs/log', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取日志配置失败')
  }
  return response.data
}

// 更新日志配置
export async function updateLogSystemConfig(config: Partial<LogConfig>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/log', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新日志配置失败')
  }
}

// 获取跨域配置
export async function getCorsSystemConfig(): Promise<CorsConfig> {
  const response = await request<{ success: boolean; data: CorsConfig }>('/v2/system-configs/cors', {
    requireAuth: true
  })
  if (!response.success) {
    throw new Error('获取跨域配置失败')
  }
  return response.data
}

// 更新跨域配置
export async function updateCorsSystemConfig(config: Partial<CorsConfig>): Promise<void> {
  const response = await request<{ success: boolean; message: string }>('/v2/system-configs/cors', {
    method: 'PUT',
    body: JSON.stringify(config),
    requireAuth: true
  })
  if (!response.success) {
    throw new Error(response.message || '更新跨域配置失败')
  }
}

// API对象导出
export const systemConfigsApi = {
  getAll: getAllSystemConfigs,
  batchUpdate: batchUpdateSystemConfigs,
  reset: resetSystemConfigsToDefaults,
  getDefaults: getSystemConfigDefaults,
  security: {
    get: getSecuritySystemConfig,
    update: updateSecuritySystemConfig,
  },
  fileTransfer: {
    get: getFileTransferSystemConfig,
    update: updateFileTransferSystemConfig,
  },
  upload: {
    get: getUploadSystemConfig,
    update: updateUploadSystemConfig,
  },
  notification: {
    get: getNotificationSystemConfig,
    update: updateNotificationSystemConfig,
  },
  site: {
    get: getSiteSystemConfig,
    update: updateSiteSystemConfig,
  },
  log: {
    get: getLogSystemConfig,
    update: updateLogSystemConfig,
  },
  cors: {
    get: getCorsSystemConfig,
    update: updateCorsSystemConfig,
  },
}
