/**
 * API响应缓存中间件
 * 为频繁访问的API提供缓存支持
 */

import { Request, Response, NextFunction } from 'express'
import { CacheManager } from '../utils/cache.js'

/**
 * 缓存配置选项
 */
interface CacheOptions {
  ttl: number           // 缓存时间（毫秒）
  keyGenerator?: (req: Request) => string  // 自定义缓存键生成器
  condition?: (req: Request) => boolean    // 缓存条件
  tags?: string[]       // 缓存标签，用于批量清除
}

/**
 * API缓存管理器
 */
class ApiCacheManager {
  private cache: CacheManager<{ data: any; statusCode: number }>
  private tagIndex: Map<string, Set<string>> = new Map()

  constructor() {
    this.cache = new CacheManager()
    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
  }

  /**
   * 生成缓存键
   */
  generateKey(req: Request): string {
    const { method, originalUrl, body } = req
    const userId = (req as any).user?.id || 'anonymous'
    
    // GET请求使用URL作为键
    if (method === 'GET') {
      return `cache:${userId}:${originalUrl}`
    }
    
    // 其他方法使用URL+请求体哈希
    const bodyHash = body ? JSON.stringify(body) : ''
    return `cache:${userId}:${method}:${originalUrl}:${this.hashString(bodyHash)}`
  }

  /**
   * 简单的字符串哈希
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 获取缓存
   */
  get(key: string): { data: any; statusCode: number } | null {
    return this.cache.get(key)
  }

  /**
   * 设置缓存
   */
  set(key: string, value: { data: any; statusCode: number }, ttl: number, tags: string[] = []): void {
    this.cache.set(key, value, ttl)
    
    // 更新标签索引
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    }
  }

  /**
   * 按标签清除缓存
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag)
    if (!keys) return 0
    
    let count = 0
    for (const key of keys) {
      this.cache.delete(key)
      count++
    }
    this.tagIndex.delete(tag)
    return count
  }

  /**
   * 按模式清除缓存
   */
  invalidateByPattern(pattern: string): number {
    return this.cache.deletePattern(pattern)
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; tags: number } {
    return {
      size: this.cache.size(),
      tags: this.tagIndex.size
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    // CacheManager内部会自动处理过期
    // 这里可以添加额外的清理逻辑
  }
}

// 全局API缓存实例
export const apiCache = new ApiCacheManager()

/**
 * API缓存中间件
 */
export function apiCacheMiddleware(options: CacheOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next()
    }

    // 检查缓存条件
    if (options.condition && !options.condition(req)) {
      return next()
    }

    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(req) 
      : apiCache.generateKey(req)

    // 尝试从缓存获取
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`[Cache] HIT: ${req.originalUrl}`)
      return res.status(cached.statusCode).json(cached.data)
    }

    // 拦截响应
    const originalJson = res.json.bind(res)
    res.json = function(data: any) {
      // 只缓存成功的响应
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(
          cacheKey, 
          { data, statusCode: res.statusCode },
          options.ttl,
          options.tags
        )
        console.log(`[Cache] SET: ${req.originalUrl}`)
      }
      return originalJson(data)
    }

    next()
  }
}

/**
 * 清除缓存中间件
 * 用于在数据修改后自动清除相关缓存
 */
export function invalidateCache(tags?: string[], patterns?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 拦截响应
    const originalJson = res.json.bind(res)
    
    res.json = function(data: any) {
      // 只在成功的写操作后清除缓存
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let cleared = 0
        
        // 按标签清除
        if (tags) {
          for (const tag of tags) {
            cleared += apiCache.invalidateByTag(tag)
          }
        }
        
        // 按模式清除
        if (patterns) {
          for (const pattern of patterns) {
            cleared += apiCache.invalidateByPattern(pattern)
          }
        }
        
        if (cleared > 0) {
          console.log(`[Cache] INVALIDATED: ${cleared} entries`)
        }
      }
      
      return originalJson(data)
    }
    
    next()
  }
}

/**
 * 缓存统计端点
 */
export function cacheStatsHandler(req: Request, res: Response): void {
  const stats = apiCache.getStats()
  res.json({
    success: true,
    data: {
      cacheSize: stats.size,
      tagCount: stats.tags,
      memoryUsage: process.memoryUsage()
    }
  })
}

/**
 * 清除所有缓存端点（管理员）
 */
export function clearCacheHandler(req: Request, res: Response): void {
  apiCache.clear()
  console.log('[Cache] All cache cleared')
  res.json({
    success: true,
    message: '缓存已清除'
  })
}

/**
 * 预定义的缓存配置
 */
export const cacheConfigs = {
  // 书签列表缓存（1分钟）
  bookmarks: {
    ttl: 60000,
    tags: ['bookmarks']
  },
  
  // 分类列表缓存（5分钟）
  categories: {
    ttl: 300000,
    tags: ['categories']
  },
  
  // 公开书签缓存（10分钟）
  publicBookmarks: {
    ttl: 600000,
    tags: ['public-bookmarks']
  },
  
  // 设置缓存（10分钟）
  settings: {
    ttl: 600000,
    tags: ['settings']
  },
  
  // 用户列表缓存（30秒）
  users: {
    ttl: 30000,
    tags: ['users']
  },
  
  // RSS缓存（5分钟）
  rss: {
    ttl: 300000,
    tags: ['rss']
  },
  
  // 名言缓存（1小时）
  quotes: {
    ttl: 3600000,
    tags: ['quotes']
  },

  // Tab 列表缓存（5分钟）
  tabs: {
    ttl: 300000,
    tags: ['tabs']
  }
}
