/**
 * 链接检测服务层
 * 复用现有 health-check 逻辑，增加智能策略和故障自愈
 */

import { HealthCheckResult, LinkStatus, CheckStrategy, HealthCheckConfig, AutoHealConfig, BookmarkHealth, HealthStats } from './types.js'

/**
 * 默认检测配置
 */
const DEFAULT_CONFIG: HealthCheckConfig = {
  timeout: 10000,           // 10秒超时
  strategy: CheckStrategy.HEAD,
  followRedirect: false,    // 不自动跟随，手动处理
  retryCount: 1,
  retryDelay: 1000,
}

/**
 * 链接检测服务类
 */
export class HealthCheckService {
  private static instance: HealthCheckService
  private cache: Map<string, { result: HealthCheckResult; expiresAt: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000  // 5分钟缓存

  private constructor() {}

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService()
    }
    return HealthCheckService.instance
  }

  /**
   * 检测单个链接
   * @param url 链接地址
   * @param config 检测配置
   * @returns 检测结果
   */
  async checkUrl(url: string, config: Partial<HealthCheckConfig> = {}): Promise<{
    status: LinkStatus
    statusCode?: number
    responseTime: number
    error?: string
    redirectUrl?: string
  }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const start = Date.now()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), finalConfig.timeout)

      // 根据策略选择请求方法
      const method = finalConfig.strategy === CheckStrategy.HEAD ? 'HEAD' : 'GET'

      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
        },
        redirect: finalConfig.followRedirect ? 'follow' : 'manual',
      })

      clearTimeout(timeout)
      const responseTime = Date.now() - start

      // 处理重定向
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get('location') || undefined
        return {
          status: LinkStatus.REDIRECT,
          statusCode: response.status,
          responseTime,
          redirectUrl,
        }
      }

      // HEAD请求可能被拒绝，回退到GET
      if (response.status === 405 || response.status === 403) {
        return this.checkWithGet(url, finalConfig, start)
      }

      return {
        status: response.ok ? LinkStatus.OK : LinkStatus.ERROR,
        statusCode: response.status,
        responseTime,
      }
    } catch (error: any) {
      const responseTime = Date.now() - start

      // 判断错误类型
      if (error.name === 'AbortError') {
        return {
          status: LinkStatus.TIMEOUT,
          responseTime,
          error: '请求超时',
        }
      }

      return {
        status: LinkStatus.ERROR,
        responseTime,
        error: error.message || '请求失败',
      }
    }
  }

  /**
   * 使用GET请求检测
   */
  private async checkWithGet(url: string, config: HealthCheckConfig, startTime: number): Promise<{
    status: LinkStatus
    statusCode?: number
    responseTime: number
    error?: string
    redirectUrl?: string
  }> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), config.timeout - (Date.now() - startTime))

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: config.followRedirect ? 'follow' : 'manual',
      })

      clearTimeout(timeout)
      const responseTime = Date.now() - startTime

      if (response.status >= 300 && response.status < 400) {
        return {
          status: LinkStatus.REDIRECT,
          statusCode: response.status,
          responseTime,
          redirectUrl: response.headers.get('location') || undefined,
        }
      }

      return {
        status: response.ok ? LinkStatus.OK : LinkStatus.ERROR,
        statusCode: response.status,
        responseTime,
      }
    } catch (error: any) {
      return {
        status: LinkStatus.ERROR,
        responseTime: Date.now() - startTime,
        error: error.message || 'GET请求失败',
      }
    }
  }

  /**
   * 批量检测书签
   * @param bookmarks 书签列表
   * @param config 检测配置
   * @returns 批量检测结果
   */
  async batchCheck(
    bookmarks: { id: string; url: string; title: string; favicon?: string; icon?: string; iconUrl?: string; category?: string }[],
    config: Partial<HealthCheckConfig> = {}
  ): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = []

    // 串行检测，避免并发过大
    for (const bookmark of bookmarks) {
      // 检查缓存
      const cached = this.getCachedResult(bookmark.id)
      if (cached) {
        results.push(cached)
        continue
      }

      const checkResult = await this.checkUrl(bookmark.url, config)

      const result: HealthCheckResult = {
        bookmarkId: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        favicon: bookmark.favicon,
        icon: bookmark.icon,
        iconUrl: bookmark.iconUrl,
        category: bookmark.category,
        status: checkResult.status,
        statusCode: checkResult.statusCode,
        responseTime: checkResult.responseTime,
        error: checkResult.error,
        redirectUrl: checkResult.redirectUrl,
        checkedAt: new Date().toISOString(),
      }

      // 缓存结果
      this.cacheResult(bookmark.id, result)
      results.push(result)

      // 延迟，避免请求过快
      await this.delay(100)
    }

    return results
  }

  /**
   * 智能检测策略
   * 根据历史检测结果自动选择最佳策略
   * @param url 链接地址
   * @param history 历史检测记录
   * @returns 检测结果
   */
  async smartCheck(url: string, history?: { status: LinkStatus; strategy: CheckStrategy }[]): Promise<{
    status: LinkStatus
    statusCode?: number
    responseTime: number
    strategy: CheckStrategy
    error?: string
  }> {
    // 如果有历史记录，分析最佳策略
    if (history && history.length > 0) {
      const headSuccess = history.filter(h => h.strategy === CheckStrategy.HEAD && h.status === LinkStatus.OK).length
      const getSuccess = history.filter(h => h.strategy === CheckStrategy.GET && h.status === LinkStatus.OK).length

      // 如果HEAD经常失败，直接使用GET
      if (headSuccess === 0 && getSuccess > 0) {
        const result = await this.checkUrl(url, { strategy: CheckStrategy.GET })
        return { ...result, strategy: CheckStrategy.GET }
      }
    }

    // 默认先用HEAD
    const result = await this.checkUrl(url, { strategy: CheckStrategy.HEAD })
    return { ...result, strategy: CheckStrategy.HEAD }
  }

  /**
   * 故障自愈检查
   * 检测链接是否可用，如果不可用尝试备用URL
   * @param bookmark 书签信息
   * @param healConfig 自愈配置
   * @returns 检测结果和自愈建议
   */
  async checkWithHeal(
    bookmark: { id: string; url: string; title: string },
    healConfig?: AutoHealConfig
  ): Promise<{
    result: HealthCheckResult
    healed: boolean
    healUrl?: string
    suggestion?: string
  }> {
    // 先检测原链接
    const checkResult = await this.checkUrl(bookmark.url)

    const result: HealthCheckResult = {
      bookmarkId: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      status: checkResult.status,
      statusCode: checkResult.statusCode,
      responseTime: checkResult.responseTime,
      error: checkResult.error,
      redirectUrl: checkResult.redirectUrl,
      checkedAt: new Date().toISOString(),
    }

    // 如果检测失败且启用了自愈
    if (checkResult.status !== LinkStatus.OK && healConfig?.enabled && healConfig.healUrl) {
      // 检测备用URL
      const healCheck = await this.checkUrl(healConfig.healUrl)

      if (healCheck.status === LinkStatus.OK) {
        return {
          result,
          healed: true,
          healUrl: healConfig.healUrl,
          suggestion: `原链接不可用，建议使用备用链接: ${healConfig.healUrl}`,
        }
      }
    }

    // 如果是重定向，提供建议
    if (checkResult.status === LinkStatus.REDIRECT && checkResult.redirectUrl) {
      return {
        result,
        healed: false,
        suggestion: `链接已重定向到: ${checkResult.redirectUrl}`,
      }
    }

    return { result, healed: false }
  }

  /**
   * 获取统计信息
   * @param results 检测结果列表
   * @returns 统计信息
   */
  getStats(results: HealthCheckResult[]): HealthStats {
    const total = results.length
    const healthy = results.filter(r => r.status === LinkStatus.OK).length
    const redirect = results.filter(r => r.status === LinkStatus.REDIRECT).length
    const timeout = results.filter(r => r.status === LinkStatus.TIMEOUT).length
    const error = results.filter(r => r.status === LinkStatus.ERROR).length

    const responseTimes = results.map(r => r.responseTime)
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    return {
      total,
      healthy,
      unhealthy: redirect + timeout + error,
      unknown: results.filter(r => r.status === LinkStatus.UNKNOWN).length,
      averageResponseTime: Math.round(averageResponseTime),
      lastCheck: new Date().toISOString(),
    }
  }

  /**
   * 从缓存获取结果
   */
  private getCachedResult(bookmarkId: string): HealthCheckResult | null {
    const cached = this.cache.get(bookmarkId)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result
    }
    if (cached) {
      this.cache.delete(bookmarkId)
    }
    return null
  }

  /**
   * 缓存结果
   */
  private cacheResult(bookmarkId: string, result: HealthCheckResult): void {
    this.cache.set(bookmarkId, {
      result,
      expiresAt: Date.now() + this.CACHE_TTL,
    })
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * 服务实例导出
 */
export const healthCheckService = HealthCheckService.getInstance()
