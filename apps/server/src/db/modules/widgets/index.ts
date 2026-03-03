/**
 * 自定义小部件模块
 * 提供自定义小部件的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface CustomWidget {
  id: string
  userId: string
  type: string
  title: string
  config: Record<string, any>
  active: boolean
  createdAt: string
  updatedAt: string
}

export function createCustomWidget(type: string, title: string, config: any, userId: string): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO custom_widgets (id, userId, type, title, config, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, type, title, JSON.stringify(config || {}), now, now]
  )
  saveDatabase()
  return id
}

export function getCustomWidgetsByUser(userId: string, activeOnly: boolean = false): CustomWidget[] {
  const db = getDatabase()
  if (!db) return []

  let query = 'SELECT * FROM custom_widgets WHERE userId = ?'
  if (activeOnly) {
    query += ' AND active = 1'
  }
  query += ' ORDER BY createdAt DESC'

  const result = db.exec(query, [userId])
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    type: row[2],
    title: row[3],
    config: JSON.parse(row[4] || '{}'),
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }))
}

export function getCustomWidgetById(id: string): CustomWidget | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM custom_widgets WHERE id = ?', [id])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    type: row[2],
    title: row[3],
    config: JSON.parse(row[4] || '{}'),
    active: row[5] === 1,
    createdAt: row[6],
    updatedAt: row[7]
  }
}

export function updateCustomWidget(id: string, updates: Partial<CustomWidget>): boolean {
  const db = getDatabase()
  if (!db) return false

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(JSON.stringify(updates.config))
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.run(`UPDATE custom_widgets SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteCustomWidget(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM custom_widgets WHERE id = ?', [id])
  saveDatabase()
  return true
}
