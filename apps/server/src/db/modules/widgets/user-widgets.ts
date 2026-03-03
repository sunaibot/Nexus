/**
 * 用户小部件模块
 * 提供用户小部件的CRUD操作 (widgets 表)
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface Widget {
  id: string
  userId: string
  name: string
  type: string
  config: Record<string, any>
  orderIndex: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 获取用户的所有小部件
 */
export function getUserWidgets(userId: string): Widget[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    'SELECT * FROM widgets WHERE userId = ? ORDER BY orderIndex ASC, createdAt DESC',
    [userId]
  )
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    type: row[3],
    config: JSON.parse(row[4] || '{}'),
    orderIndex: row[5] || 0,
    isVisible: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }))
}

/**
 * 创建小部件
 */
export function createWidget(
  userId: string,
  name: string,
  type: string,
  config: Record<string, any>,
  orderIndex: number = 0
): Widget | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO widgets (id, userId, name, type, config, orderIndex, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, name, type, JSON.stringify(config), orderIndex, now, now]
  )
  saveDatabase()

  return {
    id,
    userId,
    name,
    type,
    config,
    orderIndex,
    isVisible: true,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 更新小部件
 */
export function updateWidget(
  id: string,
  userId: string,
  updates: Partial<Widget>
): boolean {
  const db = getDatabase()
  if (!db) return false

  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(JSON.stringify(updates.config))
  }
  if (updates.orderIndex !== undefined) {
    fields.push('orderIndex = ?')
    values.push(updates.orderIndex)
  }
  if (updates.isVisible !== undefined) {
    fields.push('isVisible = ?')
    values.push(updates.isVisible ? 1 : 0)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(new Date().toISOString())
  values.push(id)
  values.push(userId)

  db.run(
    `UPDATE widgets SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
    values
  )
  saveDatabase()
  return true
}

/**
 * 删除小部件
 */
export function deleteWidget(id: string, userId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM widgets WHERE id = ? AND userId = ?', [id, userId])
  saveDatabase()
  return true
}

/**
 * 根据ID获取小部件
 */
export function getWidgetById(id: string, userId: string): Widget | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec(
    'SELECT * FROM widgets WHERE id = ? AND userId = ?',
    [id, userId]
  )
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    type: row[3],
    config: JSON.parse(row[4] || '{}'),
    orderIndex: row[5] || 0,
    isVisible: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8]
  }
}
