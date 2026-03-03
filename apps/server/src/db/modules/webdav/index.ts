/**
 * WebDAV配置模块
 * 提供WebDAV配置的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface WebdavConfig {
  id: string
  userId: string
  name: string
  url: string
  username: string
  password: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export function createWebdavConfig(
  userId: string,
  name: string,
  url: string,
  username: string,
  password: string
): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO webdav_configs (id, userId, name, url, username, password, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, name, url, username, password, now, now]
  )

  saveDatabase()
  return id
}

export function getWebdavConfigs(activeOnly: boolean = false): WebdavConfig[] {
  const db = getDatabase()
  if (!db) return []

  let query = 'SELECT * FROM webdav_configs'
  if (activeOnly) {
    query += ' WHERE active = 1'
  }
  query += ' ORDER BY createdAt DESC'

  const result = db.exec(query)
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    username: row[4],
    password: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }))
}

export function getWebdavConfig(id: string): WebdavConfig | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM webdav_configs WHERE id = ?', [id])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    url: row[3],
    username: row[4],
    password: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }
}

export function updateWebdavConfig(id: string, updates: Partial<WebdavConfig>): boolean {
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
  if (updates.username !== undefined) {
    fields.push('username = ?')
    values.push(updates.username)
  }
  if (updates.password !== undefined) {
    fields.push('password = ?')
    values.push(updates.password)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.run(`UPDATE webdav_configs SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteWebdavConfig(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM webdav_configs WHERE id = ?', [id])
  saveDatabase()
  return true
}
