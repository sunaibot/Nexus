/**
 * 服务监控模块
 * 提供服务监控的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface ServiceMonitor {
  id: string
  userId: string
  name: string
  url: string
  type: string
  active: boolean
  createdAt: string
  updatedAt: string
  method?: string
  expectedStatus?: number
  checkInterval?: number
  timeout?: number
}

export function createServiceMonitor(
  userId: string,
  name: string,
  url: string,
  method?: string,
  expectedStatus?: number,
  checkInterval?: number,
  timeout?: number
): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO service_monitors (id, userId, name, url, method, expectedStatus, checkInterval, timeout, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, name, url, method || 'GET', expectedStatus || 200, checkInterval || 300, timeout || 30, now, now]
  )

  saveDatabase()
  return id
}

export function getServiceMonitorsByUser(userId: string, activeOnly: boolean = false): ServiceMonitor[] {
  const db = getDatabase()
  if (!db) return []

  let query = 'SELECT * FROM service_monitors WHERE userId = ?'
  if (activeOnly) {
    query += ' AND active = 1'
  }
  query += ' ORDER BY createdAt DESC'

  const result = db.exec(query, [userId])
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    type: row[4],
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }))
}

export function getServiceMonitorById(id: string): ServiceMonitor | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM service_monitors WHERE id = ?', [id])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    type: row[4],
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }
}

export function updateServiceMonitor(id: string, updates: Partial<ServiceMonitor>): boolean {
  const db = getDatabase()
  if (!db) return false

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.url !== undefined) {
    fields.push('url = ?')
    values.push(updates.url)
  }
  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.run(`UPDATE service_monitors SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteServiceMonitor(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM service_monitors WHERE id = ?', [id])
  saveDatabase()
  return true
}
