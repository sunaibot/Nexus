/**
 * 高级缓存管理器
 * 支持请求去重、缓存过期、内存管理、标签失效
 */

import { RequestOptions } from './client'

// 缓存项接口
interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
  tags: string[]
  size: number
}

// 缓存配置
interface CacheConfig {
  maxSize: number // 最大缓存大小（字节）
  maxItems: number // 最大缓存项数
  defaultTTL: number // 默认过期时间（毫秒）
}

// 默认配置
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxItems: 1000,
  defaultTTL: 5 * 60 * 1000, // 5分钟
}

// 计算对象大小（近似值）
function estimateSize(obj: unknown): number {
  const str = JSON.stringify(obj)
  // UTF-8 编码，中文字符占3字节
  let size = 0
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    size += code <= 0x007f ? 1 : code <= 0x07ff ? 2 : 3
  }
  return size
}

class CacheManager {
  private cache = new Map<string, CacheItem<unknown>>()
  private pendingRequests = new Map<string, Promise<unknown>>()
  private config: CacheConfig
  private currentSize = 0

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // 定期清理过期缓存
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000) // 每分钟清理一次
    }
  }

  /**
   * 生成缓存键
   */
  private generateKey(endpoint: string, options?: RequestOptions): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${endpoint}:${body}`
  }

  /**
   * 获取缓存项
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.delete(key)
      return null
    }
    
    return item.data as T
  }

  /**
   * 设置缓存项
   */
  set<T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }): void {
    const size = estimateSize(data)
    
    // 如果单个项超过最大限制，不缓存
    if (size > this.config.maxSize * 0.1) {
      console.warn(`[Cache] Item too large (${size} bytes), skipping cache`)
      return
    }

    // 检查是否需要清理空间
    while (
      this.currentSize + size > this.config.maxSize ||
      this.cache.size >= this.config.maxItems
    ) {
      this.evictLRU()
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (options?.ttl || this.config.defaultTTL),
      tags: options?.tags || [],
      size,
    }

    // 如果已存在，先减去旧大小
    const existing = this.cache.get(key)
    if (existing) {
      this.currentSize -= existing.size
    }

    this.cache.set(key, item as CacheItem<unknown>)
    this.currentSize += size
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const item = this.cache.get(key)
    if (item) {
      this.currentSize -= item.size
      return this.cache.delete(key)
    }
    return false
  }

  /**
   * 根据标签失效缓存
   */
  invalidateByTags(tags: string[]): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.some(tag => tags.includes(tag))) {
        this.delete(key)
      }
    }
  }

  /**
   * 根据模式失效缓存
   */
  invalidateByPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*')) 
      : pattern
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key)
      }
    }
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.currentSize = 0
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      items: this.cache.size,
      size: this.currentSize,
      sizeMB: (this.currentSize / 1024 / 1024).toFixed(2),
      maxSizeMB: (this.config.maxSize / 1024 / 1024).toFixed(2),
      usagePercent: ((this.currentSize / this.config.maxSize) * 100).toFixed(1),
    }
  }

  /**
   * 请求去重 - 如果相同的请求正在进行中，返回现有的 Promise
   */
  async dedupe<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // 检查是否有进行中的请求
    const pending = this.pendingRequests.get(key)
    if (pending) {
      console.log(`[Cache] Reusing pending request for: ${key}`)
      return pending as Promise<T>
    }

    // 创建新的请求
    const promise = fetcher().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * 带缓存的请求
   */
  async request<T>(
    endpoint: string,
    fetcher: () => Promise<T>,
    options?: RequestOptions & {
      cacheKey?: string
      ttl?: number
      tags?: string[]
      dedupe?: boolean
      skipCache?: boolean
    }
  ): Promise<T> {
    const key = options?.cacheKey || this.generateKey(endpoint, options)

    // 检查缓存
    if (!options?.skipCache) {
      const cached = this.get<T>(key)
      if (cached !== null) {
        console.log(`[Cache] Hit: ${key}`)
        return cached
      }
    }

    // 请求去重
    if (options?.dedupe !== false) {
      return this.dedupe(key, async () => {
        const data = await fetcher()
        if (!options?.skipCache) {
          this.set(key, data, { ttl: options?.ttl, tags: options?.tags })
        }
        return data
      })
    }

    // 直接请求
    const data = await fetcher()
    if (!options?.skipCache) {
      this.set(key, data, { ttl: options?.ttl, tags: options?.tags })
    }
    return data
  }

  /**
   * LRU 淘汰策略
   */
  private evictLRU(): void {
    let oldest: { key: string; timestamp: number } | null = null

    for (const [key, item] of this.cache.entries()) {
      if (!oldest || item.timestamp < oldest.timestamp) {
        oldest = { key, timestamp: item.timestamp }
      }
    }

    if (oldest) {
      this.delete(oldest.key)
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired items`)
    }
  }
}

// 导出单例实例
export const cacheManager = new CacheManager()

// 便捷函数
export const requestWithCache = <T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  options?: Parameters<CacheManager['request']>[2]
) => cacheManager.request(endpoint, fetcher, options)

export const invalidateCache = (pattern: string | RegExp) => 
  cacheManager.invalidateByPattern(pattern)

export const invalidateCacheByTags = (tags: string[]) => 
  cacheManager.invalidateByTags(tags)

export const getCacheStats = () => cacheManager.getStats()
