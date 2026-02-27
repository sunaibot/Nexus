/**
 * 链接检测模块类型定义
 * 复用现有 health-check 功能
 */

/** 链接状态 */
export enum LinkStatus {
  OK = 'ok',                // 正常
  ERROR = 'error',          // 错误
  TIMEOUT = 'timeout',      // 超时
  REDIRECT = 'redirect',    // 重定向
  UNKNOWN = 'unknown',      // 未知
}

/** 检测策略 */
export enum CheckStrategy {
  HEAD = 'HEAD',            // HEAD请求（快速）
  GET = 'GET',              // GET请求（完整）
  PING = 'PING',            // Ping检测
}

/** 健康检测结果 */
export interface HealthCheckResult {
  bookmarkId: string
  url: string
  title: string
  favicon?: string
  icon?: string
  iconUrl?: string
  category?: string
  status: LinkStatus
  statusCode?: number
  responseTime: number
  error?: string
  redirectUrl?: string
  checkedAt: string
}

/** 批量检测结果 */
export interface BatchCheckResult {
  total: number
  success: number
  failed: number
  timeout: number
  redirect: number
  results: HealthCheckResult[]
}

/** 检测配置 */
export interface HealthCheckConfig {
  timeout: number           // 超时时间（毫秒）
  strategy: CheckStrategy   // 检测策略
  followRedirect: boolean   // 是否跟随重定向
  retryCount: number        // 重试次数
  retryDelay: number        // 重试延迟（毫秒）
}

/** 故障自愈配置 */
export interface AutoHealConfig {
  enabled: boolean          // 是否启用
  healUrl?: string          // 备用URL
  notifyOnHeal: boolean     // 修复后通知
}

/** 书签健康状态 */
export interface BookmarkHealth {
  bookmarkId: string
  url: string
  status: LinkStatus
  lastCheck: string
  failCount: number
  autoHealEnabled: boolean
  healUrl?: string
}

/** 检测历史记录 */
export interface CheckHistory {
  bookmarkId: string
  checks: {
    status: LinkStatus
    responseTime: number
    checkedAt: string
  }[]
}

/** 统计信息 */
export interface HealthStats {
  total: number
  healthy: number
  unhealthy: number
  unknown: number
  averageResponseTime: number
  lastCheck: string
}
