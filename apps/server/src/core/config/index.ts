/**
 * 统一配置管理模块
 * 支持从数据库动态加载配置，替代硬编码配置
 */

import { getDatabase, saveDatabase } from '../../db/core.js'

// ========== 配置类型定义 ==========

export interface SecurityConfig {
  // 登录安全
  maxLoginAttempts: number
  lockDurationMinutes: number
  sessionTimeoutHours: number
  // 密码策略
  minPasswordLength: number
  requireStrongPassword: boolean
  passwordExpiryDays: number
  // CSRF
  csrfTokenExpiryMinutes: number
  // 请求限制
  maxRequestSizeMB: number
  maxJsonSizeMB: number
}

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

export interface UploadConfig {
  chunkSizeMB: number
  maxConcurrent: number
  maxFileSizeMB: number
  tempDir: string
  expireTimeHours: number
  cleanupIntervalMinutes: number
}

export interface NotificationConfig {
  cooldownMinutes: number
  maxRetries: number
  retryIntervalMinutes: number
  enableEmail: boolean
  enablePush: boolean
}

export interface HealthCheckConfig {
  checkIntervalMinutes: number
  timeoutSeconds: number
  maxRetries: number
  notifyOnFailure: boolean
}

export interface RateLimitConfig {
  windowMinutes: number
  maxRequests: number
  skipSuccessfulRequests: boolean
}

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

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableConsole: boolean
  enableFile: boolean
  maxFileSizeMB: number
  maxFiles: number
  logDir: string
}

export interface CorsConfig {
  allowedOrigins: string[]
  allowCredentials: boolean
  allowMethods: string[]
  allowHeaders: string[]
  maxAge: number
}

export interface SystemConfig {
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

// ========== 默认配置 ==========

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 3,
  lockDurationMinutes: 15,
  sessionTimeoutHours: 24,
  minPasswordLength: 6,
  requireStrongPassword: false,
  passwordExpiryDays: 90,
  csrfTokenExpiryMinutes: 60,
  maxRequestSizeMB: 100,
  maxJsonSizeMB: 10
}

const DEFAULT_FILE_TRANSFER_CONFIG: FileTransferConfig = {
  maxFileSizeMB: 100,
  maxExpiryHours: 72,
  maxDownloads: 10,
  allowedFileTypes: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md',
    'zip', 'rar', '7z', 'tar', 'gz',
    'mp3', 'mp4', 'avi', 'mov', 'wmv'
  ],
  blockedFileTypes: [
    'exe', 'dll', 'bat', 'cmd', 'sh', 'bin',
    'php', 'php3', 'php4', 'php5', 'phtml',
    'jsp', 'jspx', 'war', 'ear',
    'asp', 'aspx', 'ascx', 'ashx',
    'py', 'pyc', 'pyo', 'rb', 'pl', 'cgi',
    'htaccess', 'htpasswd',
    'js', 'vbs', 'wsf', 'wsh',
    'jar', 'class', 'so', 'o'
  ],
  uploadPath: './uploads',
  enableVirusScan: false,
  chunkSizeMB: 5,
  maxConcurrentUploads: 3
}

const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  chunkSizeMB: 5,
  maxConcurrent: 3,
  maxFileSizeMB: 1024,
  tempDir: 'uploads/temp',
  expireTimeHours: 24,
  cleanupIntervalMinutes: 60
}

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  cooldownMinutes: 5,
  maxRetries: 3,
  retryIntervalMinutes: 5,
  enableEmail: false,
  enablePush: false
}

const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  checkIntervalMinutes: 5,
  timeoutSeconds: 10,
  maxRetries: 3,
  notifyOnFailure: true
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMinutes: 15,
  maxRequests: 100,
  skipSuccessfulRequests: false
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  title: 'Nexus',
  description: '智能书签管理系统',
  favicon: '/favicon.ico',
  logo: '/logo.png',
  footerText: '© 2024 Nexus. All rights reserved.',
  enableRegistration: true,
  enableGuestAccess: true,
  maintenanceMode: false,
  maintenanceMessage: '系统维护中，请稍后再试'
}

const DEFAULT_LOG_CONFIG: LogConfig = {
  level: 'info',
  enableConsole: true,
  enableFile: true,
  maxFileSizeMB: 10,
  maxFiles: 5,
  logDir: './logs'
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [],
  allowCredentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400
}

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  security: DEFAULT_SECURITY_CONFIG,
  fileTransfer: DEFAULT_FILE_TRANSFER_CONFIG,
  upload: DEFAULT_UPLOAD_CONFIG,
  notification: DEFAULT_NOTIFICATION_CONFIG,
  healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
  rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
  site: DEFAULT_SITE_CONFIG,
  log: DEFAULT_LOG_CONFIG,
  cors: DEFAULT_CORS_CONFIG
}

// ========== 配置管理类 ==========

class ConfigManager {
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 60000 // 1分钟缓存

  /**
   * 获取配置值
   */
  get<T>(key: string, defaultValue: T): T {
    const cached = this.getFromCache<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const db = getDatabase()
    if (!db) {
      return defaultValue
    }

    try {
      const result = db.exec('SELECT value FROM system_configs WHERE key = ?', [key])
      if (result.length > 0 && result[0].values.length > 0) {
        const value = JSON.parse(result[0].values[0][0] as string)
        this.setCache(key, value)
        return value
      }
    } catch (error) {
      console.error(`[ConfigManager] Failed to get config ${key}:`, error)
    }

    return defaultValue
  }

  /**
   * 设置配置值
   */
  set<T>(key: string, value: T): boolean {
    const db = getDatabase()
    if (!db) {
      return false
    }

    try {
      const now = new Date().toISOString()
      db.run(
        'INSERT OR REPLACE INTO system_configs (key, value, updatedAt) VALUES (?, ?, ?)',
        [key, JSON.stringify(value), now]
      )
      saveDatabase()
      this.setCache(key, value)
      return true
    } catch (error) {
      console.error(`[ConfigManager] Failed to set config ${key}:`, error)
      return false
    }
  }

  /**
   * 批量设置配置
   */
  setBatch(configs: Record<string, any>): boolean {
    const db = getDatabase()
    if (!db) {
      return false
    }

    try {
      const now = new Date().toISOString()
      db.run('BEGIN TRANSACTION')

      for (const [key, value] of Object.entries(configs)) {
        db.run(
          'INSERT OR REPLACE INTO system_configs (key, value, updatedAt) VALUES (?, ?, ?)',
          [key, JSON.stringify(value), now]
        )
        this.setCache(key, value)
      }

      db.run('COMMIT')
      saveDatabase()
      return true
    } catch (error) {
      console.error('[ConfigManager] Failed to set batch configs:', error)
      db.run('ROLLBACK')
      return false
    }
  }

  /**
   * 获取所有配置
   */
  getAll(): SystemConfig {
    return {
      security: this.get<SecurityConfig>('security', DEFAULT_SECURITY_CONFIG),
      fileTransfer: this.get<FileTransferConfig>('fileTransfer', DEFAULT_FILE_TRANSFER_CONFIG),
      upload: this.get<UploadConfig>('upload', DEFAULT_UPLOAD_CONFIG),
      notification: this.get<NotificationConfig>('notification', DEFAULT_NOTIFICATION_CONFIG),
      healthCheck: this.get<HealthCheckConfig>('healthCheck', DEFAULT_HEALTH_CHECK_CONFIG),
      rateLimit: this.get<RateLimitConfig>('rateLimit', DEFAULT_RATE_LIMIT_CONFIG),
      site: this.get<SiteConfig>('site', DEFAULT_SITE_CONFIG),
      log: this.get<LogConfig>('log', DEFAULT_LOG_CONFIG),
      cors: this.get<CorsConfig>('cors', DEFAULT_CORS_CONFIG)
    }
  }

  /**
   * 重置为默认配置
   */
  resetToDefaults(): boolean {
    return this.setBatch({
      security: DEFAULT_SECURITY_CONFIG,
      fileTransfer: DEFAULT_FILE_TRANSFER_CONFIG,
      upload: DEFAULT_UPLOAD_CONFIG,
      notification: DEFAULT_NOTIFICATION_CONFIG,
      healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
      rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
      site: DEFAULT_SITE_CONFIG,
      log: DEFAULT_LOG_CONFIG,
      cors: DEFAULT_CORS_CONFIG
    })
  }

  /**
   * 从缓存获取
   */
  private getFromCache<T>(key: string): T | undefined {
    const expiry = this.cacheExpiry.get(key)
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
      return undefined
    }
    return this.cache.get(key) as T
  }

  /**
   * 设置缓存
   */
  private setCache<T>(key: string, value: T): void {
    this.cache.set(key, value)
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL)
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }
}

// ========== 导出单例 ==========

export const configManager = new ConfigManager()

// ========== 便捷访问函数 ==========

export function getSecurityConfig(): SecurityConfig {
  return configManager.get<SecurityConfig>('security', DEFAULT_SECURITY_CONFIG)
}

export function getFileTransferConfig(): FileTransferConfig {
  return configManager.get<FileTransferConfig>('fileTransfer', DEFAULT_FILE_TRANSFER_CONFIG)
}

export function getUploadConfig(): UploadConfig {
  return configManager.get<UploadConfig>('upload', DEFAULT_UPLOAD_CONFIG)
}

export function getNotificationConfig(): NotificationConfig {
  return configManager.get<NotificationConfig>('notification', DEFAULT_NOTIFICATION_CONFIG)
}

export function getHealthCheckConfig(): HealthCheckConfig {
  return configManager.get<HealthCheckConfig>('healthCheck', DEFAULT_HEALTH_CHECK_CONFIG)
}

export function getRateLimitConfig(): RateLimitConfig {
  return configManager.get<RateLimitConfig>('rateLimit', DEFAULT_RATE_LIMIT_CONFIG)
}

// ========== 配置更新函数 ==========

export function updateSecurityConfig(config: Partial<SecurityConfig>): boolean {
  const current = getSecurityConfig()
  return configManager.set('security', { ...current, ...config })
}

export function updateFileTransferConfig(config: Partial<FileTransferConfig>): boolean {
  const current = getFileTransferConfig()
  return configManager.set('fileTransfer', { ...current, ...config })
}

export function updateUploadConfig(config: Partial<UploadConfig>): boolean {
  const current = getUploadConfig()
  return configManager.set('upload', { ...current, ...config })
}

export function updateNotificationConfig(config: Partial<NotificationConfig>): boolean {
  const current = getNotificationConfig()
  return configManager.set('notification', { ...current, ...config })
}

export function updateHealthCheckConfig(config: Partial<HealthCheckConfig>): boolean {
  const current = getHealthCheckConfig()
  return configManager.set('healthCheck', { ...current, ...config })
}

export function updateRateLimitConfig(config: Partial<RateLimitConfig>): boolean {
  const current = getRateLimitConfig()
  return configManager.set('rateLimit', { ...current, ...config })
}

export function getSiteConfig(): SiteConfig {
  return configManager.get<SiteConfig>('site', DEFAULT_SITE_CONFIG)
}

export function updateSiteConfig(config: Partial<SiteConfig>): boolean {
  const current = getSiteConfig()
  return configManager.set('site', { ...current, ...config })
}

export function getLogConfig(): LogConfig {
  return configManager.get<LogConfig>('log', DEFAULT_LOG_CONFIG)
}

export function updateLogConfig(config: Partial<LogConfig>): boolean {
  const current = getLogConfig()
  return configManager.set('log', { ...current, ...config })
}

export function getCorsConfig(): CorsConfig {
  return configManager.get<CorsConfig>('cors', DEFAULT_CORS_CONFIG)
}

export function updateCorsConfig(config: Partial<CorsConfig>): boolean {
  const current = getCorsConfig()
  return configManager.set('cors', { ...current, ...config })
}

// ========== 导出默认值（用于参考） ==========

export {
  DEFAULT_SECURITY_CONFIG,
  DEFAULT_FILE_TRANSFER_CONFIG,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_HEALTH_CHECK_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_SITE_CONFIG,
  DEFAULT_LOG_CONFIG,
  DEFAULT_CORS_CONFIG,
  DEFAULT_SYSTEM_CONFIG
}
