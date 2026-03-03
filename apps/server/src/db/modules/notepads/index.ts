/**
 * 便签模块
 * 提供便签的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface Notepad {
  id: string
  userId: string
  title: string
  content: string
  history: any[]
  files: any[]
  createdAt: string
  updatedAt: string
}

export function getNotepad(userId: string): Notepad | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM notepads WHERE userId = ?', [userId])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    history: JSON.parse(row[4] || '[]'),
    files: JSON.parse(row[5] || '[]'),
    createdAt: row[6],
    updatedAt: row[7]
  }
}

export function saveNotepad(content: string, history: any[], files: any[], userId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  const now = new Date().toISOString()
  const existing = getNotepad(userId)

  if (existing) {
    db.run(
      'UPDATE notepads SET content = ?, history = ?, files = ?, updatedAt = ? WHERE userId = ?',
      [content, JSON.stringify(history), JSON.stringify(files), now, userId]
    )
  } else {
    const id = generateId()
    db.run(
      'INSERT INTO notepads (id, userId, content, history, files, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, content, JSON.stringify(history), JSON.stringify(files), now, now]
    )
  }

  saveDatabase()
  return true
}

export function getAllNotepads(): Notepad[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM notepads ORDER BY updatedAt DESC')
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    history: JSON.parse(row[4] || '[]'),
    files: JSON.parse(row[5] || '[]'),
    createdAt: row[6],
    updatedAt: row[7]
  }))
}

export function deleteNotepad(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM notepads WHERE id = ?', [id])
  saveDatabase()
  return true
}

export function createNotepad(userId: string, title: string, content: string): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO notepads (id, userId, title, content, history, files, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, title, content, '[]', '[]', now, now]
  )

  saveDatabase()
  return id
}

export function updateNotepad(id: string, updates: Partial<Notepad>): boolean {
  const db = getDatabase()
  if (!db) return false

  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.content !== undefined) {
    fields.push('content = ?')
    values.push(updates.content)
  }
  if (updates.history !== undefined) {
    fields.push('history = ?')
    values.push(JSON.stringify(updates.history))
  }
  if (updates.files !== undefined) {
    fields.push('files = ?')
    values.push(JSON.stringify(updates.files))
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  db.run(`UPDATE notepads SET ${fields.join(', ')} WHERE id = ?`, values)
  saveDatabase()
  return true
}

export function getNotepadById(id: string): Notepad | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM notepads WHERE id = ?', [id])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    history: JSON.parse(row[4] || '[]'),
    files: JSON.parse(row[5] || '[]'),
    createdAt: row[6],
    updatedAt: row[7]
  }
}
