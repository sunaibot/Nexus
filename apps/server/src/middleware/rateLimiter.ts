import { Request, Response, NextFunction } from 'express'
import { getEnv } from '../utils/envValidator.js'
import { AppError, ErrorCode } from '../types/error-codes.js'
import { logger } from '../utils/logger.js'

// ========== 请求频率限制 (Rate Limiter) ==========

interface RateLimitRecord {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: Request) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  skip?: (req: Request) => boolean
  onLimitReached?: (req: Request, res: Response) => void
  message?: string
  useAppError?: boolean
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// 存储每个 IP 的请求记录
const rateLimitStore = new Map<string, RateLimitRecord>()

// 清理过期的限制记录（每5分钟）
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000)

// 生成默认键（IP + 路由）
function defaultKeyGenerator(req: Request): string {
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown') as string
  const route = req.route?.path || req.path
  return `${ip}:${route}`
}

// 创建限流中间件
export function createRateLimiter(options: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skip,
    onLimitReached,
    message = '请求过于频繁，请稍后再试',
    useAppError = false
  } = options

  return (req: Request, res: Response, next: NextFunction) => {
    const env = getEnv()

    // 如果禁用了频率限制，直接放行
    if (!env.ENABLE_RATE_LIMIT) {
      return next()
    }

    // 检查是否跳过
    if (skip?.(req)) {
      return next()
    }

    // 获取客户端 IP
    const key = keyGenerator(req)
    const now = Date.now()

    let record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // 新记录或已过期，重置
      record = { count: 1, resetTime: now + windowMs }
      rateLimitStore.set(key, record)
    } else {
      // 增加计数
      record.count++
    }

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString())
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString())

    // 监听响应完成，如果需要跳过成功请求
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400 && record) {
          record.count = Math.max(0, record.count - 1)
        }
      })
    }

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)

      // 设置 Retry-After 头
      res.setHeader('Retry-After', retryAfter.toString())

      // 调用自定义处理函数
      if (onLimitReached) {
        onLimitReached(req, res)
      }

      // 使用 AppError 或普通错误
      if (useAppError) {
        return next(new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, `请求过于频繁，请${retryAfter}秒后重试`))
      }

      return res.status(429).json({
        error: message,
        retryAfter
      })
    }

    next()
  }
}

// 从环境变量获取配置
const getRateLimitConfig = () => {
  const env = getEnv()
  return {
    maxSystemMonitorRequests: env.MAX_SYSTEM_MONITOR_REQUESTS,
    maxStaticInfoRequests: env.MAX_STATIC_INFO_REQUESTS,
  }
}

// ========== 预设的限流器 ==========

// 通用限流器
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: 1000,
  message: '请求过于频繁，请稍后再试'
})

// 公开API限流器 - 对公开接口更宽松
export const publicApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: 300,       // 公开接口允许更多请求
  message: '请求过于频繁，请稍后再试'
})

// 认证限流器
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  maxRequests: 20,
  message: '登录尝试次数过多，请15分钟后再试'
})

// 元数据限流器
export const metadataLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: 30,
  message: '请求过于频繁，请稍后再试'
})

// 系统监控限流器
export const systemMonitorLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: getRateLimitConfig().maxSystemMonitorRequests || 10,
  message: '请求过于频繁，请稍后再试'
})

// 静态信息限流器
export const staticInfoLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 分钟
  maxRequests: getRateLimitConfig().maxStaticInfoRequests || 60,
  message: '请求过于频繁，请稍后再试'
})

// ========== 新版限流预设配置 ==========

// 严格限流（用于敏感操作如登录）
export const strictRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5,
  useAppError: true
})

// 标准限流
export const standardRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100,
  useAppError: true
})

// 宽松限流
export const relaxedRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 300,
  useAppError: true
})

// API 限流
export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 60,
  useAppError: true
})

// 上传限流
export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  maxRequests: 10,
  keyGenerator: (req) => {
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown') as string
    return `upload:${ip}`
  },
  useAppError: true
})

// 登录限流（基于用户名或IP）
export const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5,
  keyGenerator: (req) => {
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown') as string
    const username = req.body?.username || 'unknown'
    return `login:${ip}:${username}`
  },
  skip: (req) => req.method === 'GET',
  useAppError: true
})

// 管理员操作限流
export const adminRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 30,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous'
    return `admin:${userId}`
  },
  useAppError: true
})

// 限流预设集合（向后兼容）
export const rateLimitPresets = {
  strict: strictRateLimit,
  standard: standardRateLimit,
  relaxed: relaxedRateLimit,
  api: apiRateLimit,
  upload: uploadRateLimit,
  login: loginRateLimit,
  admin: adminRateLimit
}

// ========== 熔断器实现 ==========

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerConfig {
  failureThreshold: number
  successThreshold: number
  resetTimeout: number
  monitorPeriod: number
}

interface CircuitStats {
  failures: number
  successes: number
  lastFailureTime: number
  state: CircuitState
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig
  private stats: CircuitStats = {
    failures: 0,
    successes: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  }

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      successThreshold: 3,
      resetTimeout: 30000,
      monitorPeriod: 60000,
      ...config
    }
  }

  getState(): CircuitState {
    // 检查是否需要从 OPEN 转换到 HALF_OPEN
    if (this.stats.state === 'OPEN') {
      const now = Date.now()
      if (now - this.stats.lastFailureTime > this.config.resetTimeout) {
        this.stats.state = 'HALF_OPEN'
        this.stats.successes = 0
        logger.info('Circuit breaker entering HALF_OPEN state')
      }
    }
    return this.stats.state
  }

  recordSuccess(): void {
    if (this.stats.state === 'HALF_OPEN') {
      this.stats.successes++
      if (this.stats.successes >= this.config.successThreshold) {
        this.stats.state = 'CLOSED'
        this.stats.failures = 0
        logger.info('Circuit breaker CLOSED - service recovered')
      }
    } else {
      this.stats.failures = Math.max(0, this.stats.failures - 1)
    }
  }

  recordFailure(): void {
    this.stats.failures++
    this.stats.lastFailureTime = Date.now()

    if (this.stats.state === 'HALF_OPEN') {
      this.stats.state = 'OPEN'
      logger.warn('Circuit breaker OPEN - service failed in HALF_OPEN state')
    } else if (this.stats.failures >= this.config.failureThreshold) {
      this.stats.state = 'OPEN'
      logger.warn(`Circuit breaker OPEN - ${this.stats.failures} consecutive failures`)
    }
  }

  canExecute(): boolean {
    const state = this.getState()
    return state === 'CLOSED' || state === 'HALF_OPEN'
  }

  getStats(): CircuitStats {
    return { ...this.stats }
  }

  reset(): void {
    this.stats = {
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    }
  }
}

// ========== 高级限流器类 ==========

export class RateLimiter {
  private config: RateLimitConfig
  private requests: Map<string, RateLimitRecord> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    }
    this.startCleanup()
  }

  checkLimit(key: string): RateLimitResult {
    const now = Date.now()
    const record = this.requests.get(key)

    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      this.requests.set(key, newRecord)

      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: newRecord.resetTime
      }
    }

    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      }
    }

    record.count++

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  reset(key: string): void {
    this.requests.delete(key)
  }

  resetAll(): void {
    this.requests.clear()
  }

  getStats(): { totalKeys: number; totalRequests: number } {
    let totalRequests = 0
    for (const record of this.requests.values()) {
      totalRequests += record.count
    }
    return {
      totalKeys: this.requests.size,
      totalRequests
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.requests.clear()
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.requests.entries()) {
        if (now > record.resetTime) {
          this.requests.delete(key)
        }
      }
    }, 60000)
  }
}

// ========== 中间件导出 ==========

// 限流中间件（向后兼容）
export const rateLimitMiddleware = (options: Partial<RateLimitConfig> = {}) => {
  const config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    useAppError: true,
    ...options
  }
  return createRateLimiter(config)
}

// 熔断器中间件
export const circuitBreakerMiddleware = (breaker: CircuitBreaker) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!breaker.canExecute()) {
      return next(new AppError(ErrorCode.SERVICE_UNAVAILABLE, '服务暂时不可用，请稍后重试'))
    }

    // 监听响应以记录成功/失败
    res.on('finish', () => {
      if (res.statusCode >= 500) {
        breaker.recordFailure()
      } else {
        breaker.recordSuccess()
      }
    })

    next()
  }
}

// 创建 API 限流器（向后兼容）
export const createApiRateLimiter = (options: Partial<RateLimitConfig> = {}) => {
  return createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
    useAppError: true,
    ...options
  })
}

// 获取限流统计
export const getRateLimitStats = () => {
  return {
    totalKeys: rateLimitStore.size,
    keys: Array.from(rateLimitStore.keys())
  }
}

// 重置所有限流器
export const resetAllRateLimiters = () => {
  rateLimitStore.clear()
  logger.info('All rate limiters reset')
}

// 向后兼容的别名
export const createRateLimit = createRateLimiter

// 默认导出
export default createRateLimiter
