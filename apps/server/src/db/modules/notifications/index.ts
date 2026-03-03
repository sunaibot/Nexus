/**
 * 通知模块
 * 提供通知配置和历史记录的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface NotificationHistory {
  id: string
  configId: string | null
  type: string
  title: string
  content: string
  level: string
  isRead: boolean
  createdAt: string
}

export function getNotificationConfig(): Record<string, any> {
  const db = getDatabase()
  if (!db) return {}

  const result = db.exec('SELECT key, value FROM settings WHERE key LIKE ?', ['notification_%'])
  const config: Record<string, any> = {}

  if (result.length > 0) {
    result[0].values.forEach((row: any[]) => {
      try {
        config[row[0].replace('notification_', '')] = JSON.parse(row[1])
      } catch {
        config[row[0].replace('notification_', '')] = row[1]
      }
    })
  }

  return config
}

export function saveNotificationConfig(config: Record<string, any>): void {
  const db = getDatabase()
  if (!db) return

  const now = new Date().toISOString()

  for (const [key, value] of Object.entries(config)) {
    db.run(
      'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
      [`notification_${key}`, JSON.stringify(value), now]
    )
  }

  saveDatabase()
}

export function getNotificationHistory(limit: number = 100): NotificationHistory[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM notification_history ORDER BY createdAt DESC LIMIT ?', [limit])
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    configId: row[1],
    type: row[2],
    title: row[3],
    content: row[4],
    level: row[5],
    isRead: row[6] === 1,
    createdAt: row[7]
  }))
}

export function clearNotificationHistory(): void {
  const db = getDatabase()
  if (!db) return

  db.run('DELETE FROM notification_history')
  saveDatabase()
}

export function createNotificationHistory(data: {
  configId?: string | null
  type: string
  title: string
  content: string
  level: string
}): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO notification_history (id, configId, type, title, content, level, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
    [id, data.configId || null, data.type, data.title, data.content, data.level, now]
  )

  saveDatabase()
  return id
}
