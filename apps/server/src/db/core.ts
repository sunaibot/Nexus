/**
 * 数据库核心模块
 * 统一数据库实例管理和核心工具函数
 */

import type { Database as SqlJsDatabase } from 'sql.js'
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { CacheManager } from '../utils/cache.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ========== 数据库实例 ==========
let db: SqlJsDatabase | null = null

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function setDatabase(database: SqlJsDatabase): void {
  db = database
}

// ========== 路径配置 ==========
// 通过环境变量 DB_PATH 控制数据库路径
// 开发: ./data/zen-garden.db
// Docker: /data/zen-garden.db
export function getDbPath(): string {
  return process.env.DB_PATH || './data/zen-garden.db'
}

// 通过环境变量 FILES_PATH 控制文件路径
export function getFilesPath(): string {
  return process.env.FILES_PATH || './files'
}

// ========== 数据库保存机制 ==========
let saveTimeout: NodeJS.Timeout | null = null
const SAVE_DELAY = 1000 // 1秒防抖

export function requestSaveDatabase(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    forceSaveDatabase()
  }, SAVE_DELAY)
}

export function forceSaveDatabase(): void {
  if (!db) return
  
  try {
    const dbPath = getDbPath()
    const data = db.export()
    const dir = path.dirname(dbPath)
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(dbPath, Buffer.from(data))
    console.log('💾 Database saved to:', dbPath)
  } catch (error) {
    console.error('❌ Failed to save database:', error)
  }
}

export function saveDatabase(): void {
  requestSaveDatabase()
}

// ========== 工具函数 ==========
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ========== 缓存系统 ==========
// 使用 CacheManager 替代简单的 Map 实现
const dbCache = new CacheManager(300000) // 5分钟默认TTL

export function setCache(key: string, value: any, ttlSeconds: number = 300): void {
  dbCache.set(key, value, ttlSeconds * 1000)
}

export function getCache(key: string): any | undefined {
  return dbCache.get(key) ?? undefined
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    dbCache.clear()
    return
  }
  
  dbCache.deletePattern(pattern)
}
