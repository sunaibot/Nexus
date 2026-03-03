/**
 * 自定义指标模块
 * 提供自定义指标的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface CustomMetric {
  id: string
  userId: string
  name: string
  type: string
  script: string
  unit: string
  active: boolean
  createdAt: string
  updatedAt: string
  command?: string
  url?: string
  method?: string
  headers?: string
  body?: string
  timeout?: number
}

export interface MetricHistory {
  id: string
  metricId: string
  value: number | string
  recordedAt: string
}

export function createCustomMetric(
  userId: string,
  name: string,
  type: string,
  script: string,
  unit?: string
): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO custom_metrics (id, userId, name, type, script, unit, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [id, userId, name, type, script, unit || '', now, now]
  )

  saveDatabase()
  return id
}

export function getCustomMetricsByUser(userId: string, activeOnly: boolean = false): CustomMetric[] {
  const db = getDatabase()
  if (!db) return []

  let query = 'SELECT * FROM custom_metrics WHERE userId = ?'
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
    type: row[3],
    script: row[4],
    unit: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8],
    command: row[9],
    url: row[10],
    method: row[11],
    headers: row[12],
    body: row[13],
    timeout: row[14]
  }))
}

export function getCustomMetric(id: string): CustomMetric | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM custom_metrics WHERE id = ?', [id])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    type: row[3],
    script: row[4],
    unit: row[5],
    active: row[6] === 1,
    createdAt: row[7],
    updatedAt: row[8],
    command: row[9],
    url: row[10],
    method: row[11],
    headers: row[12],
    body: row[13],
    timeout: row[14]
  }
}

export function updateCustomMetric(id: string, updates: Partial<CustomMetric>): boolean {
  const db = getDatabase()
  if (!db) return false

  const now = new Date().toISOString()
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
  if (updates.script !== undefined) {
    fields.push('script = ?')
    values.push(updates.script)
  }
  if (updates.unit !== undefined) {
    fields.push('unit = ?')
    values.push(updates.unit)
  }
  if (updates.active !== undefined) {
    fields.push('active = ?')
    values.push(updates.active ? 1 : 0)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.run(`UPDATE custom_metrics SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function deleteCustomMetric(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM custom_metrics WHERE id = ?', [id])
  db.run('DELETE FROM custom_metric_history WHERE metricId = ?', [id])
  saveDatabase()
  return true
}

export function addCustomMetricHistory(metricId: string, value: number | string): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO custom_metric_history (id, metricId, value, recordedAt) VALUES (?, ?, ?, ?)',
    [id, metricId, value, now]
  )

  saveDatabase()
  return id
}

export function getCustomMetricHistory(metricId: string, limit: number = 100): MetricHistory[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM custom_metric_history WHERE metricId = ? ORDER BY recordedAt DESC LIMIT ?', [metricId, limit])
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    metricId: row[1],
    value: row[2],
    recordedAt: row[3]
  }))
}

export function clearCustomMetricHistory(metricId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM custom_metric_history WHERE metricId = ?', [metricId])
  saveDatabase()
  return true
}
