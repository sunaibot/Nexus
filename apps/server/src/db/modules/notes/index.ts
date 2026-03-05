/**
 * 笔记模块
 * 提供笔记和笔记文件夹的CRUD操作
 */

import { getDatabase, saveDatabase, generateId } from '../../core.js'

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  isMarkdown: boolean
  tags: string | null
  folderId: string | null
  isPinned: boolean
  isArchived: boolean
  // 待办事项增强字段
  isTodo?: boolean
  priority?: number
  dueDate?: string | null
  completedAt?: string | null
  tagColors?: string | null
  createdAt: string
  updatedAt: string
}

export interface NoteFolder {
  id: string
  userId: string
  name: string
  parentId: string | null
  orderIndex: number
  color?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 获取用户的笔记列表
 */
export function getUserNotes(
  userId: string,
  options?: {
    folderId?: string
    isArchived?: boolean
    search?: string
  }
): Note[] {
  const db = getDatabase()
  if (!db) return []

  let query = 'SELECT * FROM notes WHERE userId = ?'
  const params: any[] = [userId]

  if (options?.folderId) {
    query += ' AND folderId = ?'
    params.push(options.folderId)
  }

  if (options?.isArchived !== undefined) {
    query += options.isArchived ? ' AND isArchived = 1' : ' AND isArchived = 0'
  }

  if (options?.search) {
    query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)'
    const searchTerm = `%${options.search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  query += ' ORDER BY isPinned DESC, updatedAt DESC'

  const result = db.exec(query, params)
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    isMarkdown: row[4] === 1,
    tags: row[5],
    folderId: row[6],
    isPinned: row[7] === 1,
    isArchived: row[8] === 1,
    // 待办事项增强字段
    isTodo: row[11] === 1,
    priority: row[12] || 0,
    dueDate: row[13],
    completedAt: row[14],
    tagColors: row[15],
    createdAt: row[9],
    updatedAt: row[10]
  }))
}

/**
 * 获取单个笔记
 */
export function getNoteById(id: string, userId: string): Note | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec(
    'SELECT * FROM notes WHERE id = ? AND userId = ?',
    [id, userId]
  )
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    isMarkdown: row[4] === 1,
    tags: row[5],
    folderId: row[6],
    isPinned: row[7] === 1,
    isArchived: row[8] === 1,
    // 待办事项增强字段
    isTodo: row[11] === 1,
    priority: row[12] || 0,
    dueDate: row[13],
    completedAt: row[14],
    tagColors: row[15],
    createdAt: row[9],
    updatedAt: row[10]
  }
}

/**
 * 创建笔记
 */
export function createNote(
  userId: string,
  title: string,
  content: string = '',
  options?: {
    isMarkdown?: boolean
    tags?: string
    folderId?: string
    isTodo?: boolean
    priority?: number
    dueDate?: string
    tagColors?: string
  }
): Note | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO notes (id, userId, title, content, isMarkdown, tags, folderId, isPinned, isArchived, isTodo, priority, dueDate, tagColors, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      title,
      content,
      options?.isMarkdown ? 1 : 0,
      options?.tags || null,
      options?.folderId || null,
      options?.isTodo ? 1 : 0,
      options?.priority || 0,
      options?.dueDate || null,
      options?.tagColors || null,
      now,
      now
    ]
  )
  saveDatabase()

  return {
    id,
    userId,
    title,
    content,
    isMarkdown: options?.isMarkdown ?? true,
    tags: options?.tags || null,
    folderId: options?.folderId || null,
    isPinned: false,
    isArchived: false,
    isTodo: options?.isTodo || false,
    priority: options?.priority || 0,
    dueDate: options?.dueDate || null,
    tagColors: options?.tagColors || null,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 更新笔记
 */
export function updateNote(
  id: string,
  userId: string,
  updates: Partial<Note>
): boolean {
  const db = getDatabase()
  if (!db) return false

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
  if (updates.isMarkdown !== undefined) {
    fields.push('isMarkdown = ?')
    values.push(updates.isMarkdown ? 1 : 0)
  }
  if (updates.tags !== undefined) {
    fields.push('tags = ?')
    values.push(updates.tags)
  }
  if (updates.folderId !== undefined) {
    fields.push('folderId = ?')
    values.push(updates.folderId)
  }
  if (updates.isPinned !== undefined) {
    fields.push('isPinned = ?')
    values.push(updates.isPinned ? 1 : 0)
  }
  if (updates.isArchived !== undefined) {
    fields.push('isArchived = ?')
    values.push(updates.isArchived ? 1 : 0)
  }
  // 待办事项增强字段
  if (updates.isTodo !== undefined) {
    fields.push('isTodo = ?')
    values.push(updates.isTodo ? 1 : 0)
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?')
    values.push(updates.priority)
  }
  if (updates.dueDate !== undefined) {
    fields.push('dueDate = ?')
    values.push(updates.dueDate)
  }
  if (updates.completedAt !== undefined) {
    fields.push('completedAt = ?')
    values.push(updates.completedAt)
  }
  if (updates.tagColors !== undefined) {
    fields.push('tagColors = ?')
    values.push(updates.tagColors)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(new Date().toISOString())
  values.push(id)
  values.push(userId)

  db.run(
    `UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
    values
  )
  saveDatabase()
  return true
}

/**
 * 删除笔记
 */
export function deleteNote(id: string, userId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM notes WHERE id = ? AND userId = ?', [id, userId])
  saveDatabase()
  return true
}

/**
 * 获取所有笔记（管理员用）
 */
export function getAllNotes(): Note[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM notes ORDER BY updatedAt DESC')
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    title: row[2],
    content: row[3],
    isMarkdown: row[4] === 1,
    tags: row[5],
    folderId: row[6],
    isPinned: row[7] === 1,
    isArchived: row[8] === 1,
    // 待办事项增强字段
    isTodo: row[11] === 1,
    priority: row[12] || 0,
    dueDate: row[13],
    completedAt: row[14],
    tagColors: row[15],
    createdAt: row[9],
    updatedAt: row[10]
  }))
}

// ========== 笔记文件夹 ==========

/**
 * 获取用户的文件夹列表
 */
export function getUserNoteFolders(userId: string): NoteFolder[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec(
    'SELECT * FROM note_folders WHERE userId = ? ORDER BY orderIndex ASC, createdAt DESC',
    [userId]
  )
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    parentId: row[3],
    orderIndex: row[4] || 0,
    color: row[7],
    createdAt: row[5],
    updatedAt: row[6]
  }))
}

/**
 * 获取所有文件夹（管理员用）
 */
export function getAllNoteFolders(): NoteFolder[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM note_folders ORDER BY orderIndex ASC, createdAt DESC')
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    name: row[2],
    parentId: row[3],
    orderIndex: row[4] || 0,
    color: row[7],
    createdAt: row[5],
    updatedAt: row[6]
  }))
}

/**
 * 获取单个文件夹
 */
export function getNoteFolderById(id: string, userId: string): NoteFolder | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec(
    'SELECT * FROM note_folders WHERE id = ? AND userId = ?',
    [id, userId]
  )
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    userId: row[1],
    name: row[2],
    parentId: row[3],
    orderIndex: row[4] || 0,
    color: row[7],
    createdAt: row[5],
    updatedAt: row[6]
  }
}

/**
 * 创建文件夹
 */
export function createNoteFolder(
  userId: string,
  name: string,
  parentId?: string,
  orderIndex: number = 0,
  color?: string
): NoteFolder | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT INTO note_folders (id, userId, name, parentId, orderIndex, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, name, parentId || null, orderIndex, color || null, now, now]
  )
  saveDatabase()

  return {
    id,
    userId,
    name,
    parentId: parentId || null,
    orderIndex,
    color: color || null,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 更新文件夹
 */
export function updateNoteFolder(
  id: string,
  userId: string,
  updates: Partial<NoteFolder>
): boolean {
  const db = getDatabase()
  if (!db) return false

  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.parentId !== undefined) {
    fields.push('parentId = ?')
    values.push(updates.parentId)
  }
  if (updates.orderIndex !== undefined) {
    fields.push('orderIndex = ?')
    values.push(updates.orderIndex)
  }
  if (updates.color !== undefined) {
    fields.push('color = ?')
    values.push(updates.color)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(new Date().toISOString())
  values.push(id)
  values.push(userId)

  db.run(
    `UPDATE note_folders SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
    values
  )
  saveDatabase()
  return true
}

/**
 * 删除文件夹
 */
export function deleteNoteFolder(id: string, userId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM note_folders WHERE id = ? AND userId = ?', [id, userId])
  saveDatabase()
  return true
}
