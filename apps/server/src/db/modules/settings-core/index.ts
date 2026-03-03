/**
 * 设置核心模块
 * 提供用户设置和全局设置的基础操作
 */

import { getDatabase, saveDatabase, getCache, setCache, clearCache } from '../../core.js'

export function getUserSettings(userId: string): Record<string, string> {
  const db = getDatabase()
  if (!db) return {}

  const cacheKey = `settings:${userId}`
  const cached = getCache(cacheKey) as Record<string, string> | undefined
  if (cached) return cached

  const result = db.exec('SELECT key, value FROM settings WHERE userId = ?', [userId])
  const settings: Record<string, string> = {}

  if (result.length > 0) {
    result[0].values.forEach((row: any[]) => {
      settings[row[0]] = row[1]
    })
  }

  setCache(cacheKey, settings, 300000)
  return settings
}

export function setUserSettings(updates: Record<string, string>, userId: string): void {
  const db = getDatabase()
  if (!db) return

  const now = new Date().toISOString()

  for (const [key, value] of Object.entries(updates)) {
    db.run(
      'INSERT OR REPLACE INTO settings (key, userId, value, updatedAt) VALUES (?, ?, ?, ?)',
      [key, userId, value, now]
    )
  }

  saveDatabase()
  clearCache(`settings:${userId}`)
}

export function getGlobalSetting(key: string): string | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT value FROM settings WHERE key = ? AND userId IS NULL', [key])
  if (result.length === 0) return null
  return result[0].values[0][0]
}

export function setGlobalSetting(key: string, value: string): void {
  const db = getDatabase()
  if (!db) return

  const now = new Date().toISOString()
  db.run(
    'INSERT OR REPLACE INTO settings (key, userId, value, updatedAt) VALUES (?, NULL, ?, ?)',
    [key, value, now]
  )
  saveDatabase()
}

// ========== 分类折叠状态 ==========
export function getAllCategoryCollapseStates(): Record<string, boolean> {
  const db = getDatabase()
  if (!db) return {}

  const result = db.exec('SELECT key, value FROM settings WHERE key LIKE ?', ['category_collapse_%'])
  const states: Record<string, boolean> = {}

  if (result.length > 0) {
    result[0].values.forEach((row: any[]) => {
      const categoryId = row[0].replace('category_collapse_', '')
      states[categoryId] = row[1] === 'true'
    })
  }

  return states
}

export function setCategoryCollapseState(categoryId: string, collapsed: boolean): void {
  const db = getDatabase()
  if (!db) return

  const now = new Date().toISOString()
  db.run(
    'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
    [`category_collapse_${categoryId}`, collapsed ? 'true' : 'false', now]
  )
  saveDatabase()
}
