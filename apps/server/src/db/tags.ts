import { getDatabase, generateId, saveDatabase } from './core.js'

export function createTag(name: string, color?: string, userId?: string) {
  const db = getDatabase()
  if (!db) return null
  const id = generateId()
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO tags (id, name, color, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, color || null, userId || null, now, now]
  )
  saveDatabase()
  return id
}

export function getTags(userId?: string) {
  const db = getDatabase()
  if (!db) return []
  const query = userId 
    ? 'SELECT * FROM tags WHERE userId = ? ORDER BY name'
    : 'SELECT * FROM tags ORDER BY name'
  const params = userId ? [userId] : []
  const result = db.exec(query, params)
  if (result.length === 0) return []
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    name: row[1],
    color: row[2],
    userId: row[3],
    createdAt: row[4],
    updatedAt: row[5]
  }))
}

export function addTagToBookmark(bookmarkId: string, tagId: string) {
  const db = getDatabase()
  if (!db) return
  const id = generateId()
  db.run(
    'INSERT OR IGNORE INTO bookmark_tags (id, bookmarkId, tagId, createdAt) VALUES (?, ?, ?, ?)',
    [id, bookmarkId, tagId, new Date().toISOString()]
  )
  saveDatabase()
}

export function removeTagFromBookmark(bookmarkId: string, tagId: string) {
  const db = getDatabase()
  if (!db) return
  db.run(
    'DELETE FROM bookmark_tags WHERE bookmarkId = ? AND tagId = ?',
    [bookmarkId, tagId]
  )
  saveDatabase()
}

export function getBookmarkTags(bookmarkId: string) {
  const db = getDatabase()
  if (!db) return []
  const result = db.exec(
    'SELECT t.* FROM tags t INNER JOIN bookmark_tags bt ON t.id = bt.tagId WHERE bt.bookmarkId = ?',
    [bookmarkId]
  )
  if (result.length === 0) return []
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    name: row[1],
    color: row[2],
    userId: row[3],
    createdAt: row[4],
    updatedAt: row[5]
  }))
}
