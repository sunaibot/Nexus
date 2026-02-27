/**
 * 书签数据库操作
 */

import { getDatabase, saveDatabase, generateId, hashPassword, verifyPassword } from './core.js'

export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  category?: string
  tags?: string
  icon?: string
  isPinned?: boolean
  orderIndex?: number
  clickCount?: number
  isPrivate?: boolean
  userId?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 获取所有书签
 */
export function getAllBookmarks(): Bookmark[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM bookmarks ORDER BY orderIndex ASC, createdAt DESC')
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    url: row[1],
    title: row[2],
    description: row[3],
    category: row[4],
    tags: row[5],
    icon: row[6],
    isPinned: row[7] === 1,
    orderIndex: row[8],
    clickCount: row[9],
    isPrivate: row[10] === 1,
    userId: row[11],
    createdAt: row[12],
    updatedAt: row[13]
  }))
}

/**
 * 根据ID获取书签
 */
export function getBookmarkById(id: string): Bookmark | null {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM bookmarks WHERE id = ?', [id])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    url: row[1],
    title: row[2],
    description: row[3],
    category: row[4],
    tags: row[5],
    icon: row[6],
    isPinned: row[7] === 1,
    orderIndex: row[8],
    clickCount: row[9],
    isPrivate: row[10] === 1,
    userId: row[11],
    createdAt: row[12],
    updatedAt: row[13]
  }
}

/**
 * 创建书签
 */
export function createBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Bookmark {
  const db = getDatabase()
  if (!db) throw new Error('Database not initialized')

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO bookmarks (id, url, title, description, category, tags, icon, isPinned, orderIndex, clickCount, isPrivate, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      bookmark.url,
      bookmark.title,
      bookmark.description || null,
      bookmark.category || null,
      bookmark.tags || null,
      bookmark.icon || null,
      bookmark.isPinned ? 1 : 0,
      bookmark.orderIndex || 0,
      bookmark.clickCount || 0,
      bookmark.isPrivate ? 1 : 0,
      bookmark.userId || null,
      now,
      now
    ]
  )

  saveDatabase()

  return {
    ...bookmark,
    id,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 更新书签
 */
export function updateBookmark(id: string, updates: Partial<Bookmark>): Bookmark | null {
  const db = getDatabase()
  if (!db) return null

  const bookmark = getBookmarkById(id)
  if (!bookmark) return null

  const now = new Date().toISOString()
  const updated = { ...bookmark, ...updates, updatedAt: now }

  db.run(
    `UPDATE bookmarks SET
      url = ?, title = ?, description = ?, category = ?, tags = ?, icon = ?,
      isPinned = ?, orderIndex = ?, clickCount = ?, isPrivate = ?, userId = ?, updatedAt = ?
     WHERE id = ?`,
    [
      updated.url,
      updated.title,
      updated.description || null,
      updated.category || null,
      updated.tags || null,
      updated.icon || null,
      updated.isPinned ? 1 : 0,
      updated.orderIndex || 0,
      updated.clickCount || 0,
      updated.isPrivate ? 1 : 0,
      updated.userId || null,
      now,
      id
    ]
  )

  saveDatabase()
  return updated
}

/**
 * 删除书签
 */
export function deleteBookmark(id: string): boolean {
  const db = getDatabase()
  if (!db) return false

  db.run('DELETE FROM bookmarks WHERE id = ?', [id])
  saveDatabase()
  return true
}

/**
 * 根据分类获取书签
 */
export function getBookmarksByCategory(category: string): Bookmark[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM bookmarks WHERE category = ? ORDER BY orderIndex ASC', [category])
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    url: row[1],
    title: row[2],
    description: row[3],
    category: row[4],
    tags: row[5],
    icon: row[6],
    isPinned: row[7] === 1,
    orderIndex: row[8],
    clickCount: row[9],
    isPrivate: row[10] === 1,
    userId: row[11],
    createdAt: row[12],
    updatedAt: row[13]
  }))
}

/**
 * 根据用户ID获取书签
 */
export function getBookmarksByUserId(userId: string): Bookmark[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM bookmarks WHERE userId = ? OR userId IS NULL ORDER BY orderIndex ASC, createdAt DESC', [userId])
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    url: row[1],
    title: row[2],
    description: row[3],
    category: row[4],
    tags: row[5],
    icon: row[6],
    isPinned: row[7] === 1,
    orderIndex: row[8],
    clickCount: row[9],
    isPrivate: row[10] === 1,
    userId: row[11],
    createdAt: row[12],
    updatedAt: row[13]
  }))
}

/**
 * 获取公开书签（非私密）
 */
export function getPublicBookmarks(): Bookmark[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM bookmarks WHERE isPrivate = 0 OR isPrivate IS NULL ORDER BY orderIndex ASC, createdAt DESC')
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    url: row[1],
    title: row[2],
    description: row[3],
    category: row[4],
    tags: row[5],
    icon: row[6],
    isPinned: row[7] === 1,
    orderIndex: row[8],
    clickCount: row[9],
    isPrivate: row[10] === 1,
    userId: row[11],
    createdAt: row[12],
    updatedAt: row[13]
  }))
}

/**
 * 获取私密书签
 */
export function getPrivateBookmarks(): Bookmark[] {
  const db = getDatabase()
  if (!db) return []

  const result = db.exec('SELECT * FROM bookmarks WHERE isPrivate = 1 ORDER BY orderIndex ASC, createdAt DESC')
  if (result.length === 0) return []

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    url: row[1],
    title: row[2],
    description: row[3],
    category: row[4],
    tags: row[5],
    icon: row[6],
    isPinned: row[7] === 1,
    orderIndex: row[8],
    clickCount: row[9],
    isPrivate: row[10] === 1,
    userId: row[11],
    createdAt: row[12],
    updatedAt: row[13]
  }))
}

/**
 * 增加点击次数
 */
export function incrementClickCount(id: string): void {
  const db = getDatabase()
  if (!db) return

  db.run('UPDATE bookmarks SET clickCount = COALESCE(clickCount, 0) + 1 WHERE id = ?', [id])
  saveDatabase()
}

// ========== 私密书签密码管理（书签维度 - 保留兼容） ==========

/**
 * 设置书签私密密码
 */
export async function setPrivateBookmarkPassword(bookmarkId: string, password: string) {
  const db = getDatabase()
  if (!db) return null

  const passwordHash = await hashPassword(password)
  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    'INSERT OR REPLACE INTO private_bookmark_passwords (id, bookmarkId, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [id, bookmarkId, passwordHash, now, now]
  )

  saveDatabase()
}

/**
 * 验证书签私密密码
 */
export async function verifyPrivateBookmarkPassword(bookmarkId: string, password: string) {
  const db = getDatabase()
  if (!db) return false

  const result = db.exec('SELECT passwordHash FROM private_bookmark_passwords WHERE bookmarkId = ?', [bookmarkId])
  if (result.length === 0) return false

  const passwordHash = result[0].values[0][0]
  return verifyPassword(password, passwordHash)
}

/**
 * 移除书签私密密码
 */
export function removePrivateBookmarkPassword(bookmarkId: string) {
  const db = getDatabase()
  if (!db) return

  db.run('DELETE FROM private_bookmark_passwords WHERE bookmarkId = ?', [bookmarkId])
  saveDatabase()
}

/**
 * 获取书签私密密码信息
 */
export function getPrivateBookmarkPassword(bookmarkId: string) {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT * FROM private_bookmark_passwords WHERE bookmarkId = ?', [bookmarkId])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    bookmarkId: row[1],
    passwordHash: row[2],
    createdAt: row[3],
    updatedAt: row[4]
  }
}

// ========== 用户私密密码管理（用户维度 - 新） ==========

/**
 * 设置用户私密密码
 */
export async function setUserPrivatePassword(userId: string, password: string) {
  const db = getDatabase()
  if (!db) return null

  const passwordHash = await hashPassword(password)
  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT OR REPLACE INTO user_private_passwords 
     (id, userId, passwordHash, isEnabled, createdAt, updatedAt) 
     VALUES (?, ?, ?, 1, ?, ?)`,
    [id, userId, passwordHash, now, now]
  )

  saveDatabase()
  return { id, userId }
}

/**
 * 验证用户私密密码
 */
export async function verifyUserPrivatePassword(userId: string, password: string) {
  const db = getDatabase()
  if (!db) return false

  const result = db.exec('SELECT passwordHash FROM user_private_passwords WHERE userId = ? AND isEnabled = 1', [userId])
  if (result.length === 0) return false

  const passwordHash = result[0].values[0][0]
  return verifyPassword(password, passwordHash)
}

/**
 * 检查用户是否设置了私密密码
 */
export function hasUserPrivatePassword(userId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  const result = db.exec('SELECT 1 FROM user_private_passwords WHERE userId = ? AND isEnabled = 1', [userId])
  return result.length > 0
}

/**
 * 获取用户私密密码信息
 */
export function getUserPrivatePasswordInfo(userId: string) {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT id, isEnabled, createdAt, updatedAt FROM user_private_passwords WHERE userId = ?', [userId])
  if (result.length === 0) return null

  const row = result[0].values[0]
  return {
    id: row[0],
    isEnabled: row[1] === 1,
    createdAt: row[2],
    updatedAt: row[3]
  }
}

/**
 * 更新用户私密密码
 */
export async function updateUserPrivatePassword(userId: string, newPassword: string) {
  const db = getDatabase()
  if (!db) return null

  const passwordHash = await hashPassword(newPassword)
  const now = new Date().toISOString()

  db.run(
    'UPDATE user_private_passwords SET passwordHash = ?, updatedAt = ? WHERE userId = ?',
    [passwordHash, now, userId]
  )

  saveDatabase()
  return true
}

/**
 * 禁用用户私密密码
 */
export function disableUserPrivatePassword(userId: string) {
  const db = getDatabase()
  if (!db) return

  db.run(
    'UPDATE user_private_passwords SET isEnabled = 0, updatedAt = ? WHERE userId = ?',
    [new Date().toISOString(), userId]
  )
  saveDatabase()
}

/**
 * 启用用户私密密码
 */
export function enableUserPrivatePassword(userId: string) {
  const db = getDatabase()
  if (!db) return

  db.run(
    'UPDATE user_private_passwords SET isEnabled = 1, updatedAt = ? WHERE userId = ?',
    [new Date().toISOString(), userId]
  )
  saveDatabase()
}

/**
 * 删除用户私密密码
 */
export function removeUserPrivatePassword(userId: string) {
  const db = getDatabase()
  if (!db) return

  db.run('DELETE FROM user_private_passwords WHERE userId = ?', [userId])
  saveDatabase()
}

// ========== 书签备注 ==========

export function getBookmarkNote(bookmarkId: string) {
  const db = getDatabase()
  if (!db) return null

  const result = db.exec('SELECT notes FROM bookmarks WHERE id = ?', [bookmarkId])
  if (result.length === 0) return null

  const notes = result[0].values[0][0]
  if (!notes) return null

  try {
    return JSON.parse(notes)
  } catch {
    return { content: notes, isMarkdown: false }
  }
}

export function saveBookmarkNote(bookmarkId: string, content: string, isMarkdown: boolean = false) {
  const db = getDatabase()
  if (!db) return false

  const notes = JSON.stringify({ content, isMarkdown })
  db.run('UPDATE bookmarks SET notes = ? WHERE id = ?', [notes, bookmarkId])
  saveDatabase()
  return true
}
