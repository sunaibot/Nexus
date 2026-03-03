/**
 * IP过滤模块
 * 提供IP黑白名单的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface IpFilter {
  id: string
  ip: string
  type: 'whitelist' | 'blacklist'
  description: string
  createdAt: string
}

export function addIpFilter(ip: string, type: 'whitelist' | 'blacklist', description?: string): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO ip_filters (id, ip, type, description, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, ip, type, description || '', now]
  )

  saveDatabase()
  return id
}

export function removeIpFilter(ip: string, type: 'whitelist' | 'blacklist'): void {
  const db = getDatabase()
  if (!db) return

  db.run('DELETE FROM ip_filters WHERE ip = ? AND type = ?', [ip, type])
  saveDatabase()
}

export function getIpFilters(type?: 'whitelist' | 'blacklist'): IpFilter[] {
  const db = getDatabase()
  if (!db) return []

  let query = 'SELECT * FROM ip_filters'
  const params: any[] = []

  if (type) {
    query += ' WHERE type = ?'
    params.push(type)
  }

  query += ' ORDER BY createdAt DESC'

  const result = db.exec(query, params)
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    ip: row[1],
    type: row[2],
    description: row[3],
    createdAt: row[4]
  }))
}

export function checkIpAccess(ip: string): { allowed: boolean; reason?: string } {
  const db = getDatabase()
  if (!db) return { allowed: true }

  // 检查白名单
  const whitelist = db.exec('SELECT 1 FROM ip_filters WHERE type = ? AND ip = ?', ['whitelist', ip])
  if (whitelist.length > 0) {
    return { allowed: true }
  }

  // 检查是否有白名单规则（如果有白名单，不在白名单中的都被拒绝）
  const hasWhitelist = db.exec('SELECT 1 FROM ip_filters WHERE type = ? LIMIT 1', ['whitelist'])
  if (hasWhitelist.length > 0) {
    return { allowed: false, reason: 'IP not in whitelist' }
  }

  // 检查黑名单
  const blacklist = db.exec('SELECT 1 FROM ip_filters WHERE type = ? AND ip = ?', ['blacklist', ip])
  if (blacklist.length > 0) {
    return { allowed: false, reason: 'IP in blacklist' }
  }

  return { allowed: true }
}
