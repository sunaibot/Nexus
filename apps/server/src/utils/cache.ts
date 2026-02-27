// 高效的内存缓存系统
interface CacheEntry<T> {
  value: T
  expiresAt: number | null
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private defaultTTL: number = 60000 // 默认 1 分钟

  constructor(defaultTTL?: number) {
    if (defaultTTL) {
      this.defaultTTL = defaultTTL
    }
  }

  // 设置缓存
  set(key: string, value: T, ttl?: number): void {
    const expiresAt = ttl !== undefined ? Date.now() + ttl : null
    this.cache.set(key, { value, expiresAt })
  }

  // 获取缓存
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // 检查是否过期
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  // 获取或设置缓存（带工厂函数）
  async getOrSet(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    this.set(key, value, ttl)
    return value
  }

  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 按模式删除缓存
  deletePattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    
    return count
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
  }

  // 获取缓存大小
  size(): number {
    return this.cache.size
  }

  // 获取所有缓存键
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

// 全局缓存实例
export const globalCache = new CacheManager()

// 用户数据缓存（时间更短）
export const userCache = new CacheManager(30000) // 30 秒

// 设置数据缓存（时间更长）
export const settingsCache = new CacheManager(300000) // 5 分钟
