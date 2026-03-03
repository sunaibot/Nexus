/**
 * 私密模式模块
 * 提供私密模式密码管理
 */

import { getDatabase, saveDatabase } from '../../core.js'

export function getPrivatePassword(): string | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT value FROM settings WHERE key = ?', ['private_password'])
  if (result.length === 0) return null
  return result[0].values[0][0]
}

export function setPrivatePassword(passwordHash: string): void {
  const db = getDatabase()
  if (!db) return

  const now = new Date().toISOString()
  db.run(
    'INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
    ['private_password', passwordHash, now]
  )
  saveDatabase()
}

export function verifyPrivatePassword(password: string): boolean {
  const db = getDatabase()
  if (!db) return false

  const result = db.exec('SELECT value FROM settings WHERE key = ?', ['private_password'])
  if (result.length === 0) return false

  const storedHash = result[0].values[0][0]
  // 简化的密码验证，实际应该使用 bcrypt
  return storedHash === password
}

export function hasPrivatePassword(): boolean {
  const db = getDatabase()
  if (!db) return false

  const result = db.exec('SELECT 1 FROM settings WHERE key = ?', ['private_password'])
  return result.length > 0
}
