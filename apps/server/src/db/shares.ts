import { getDatabase, generateId, saveDatabase } from './core.js'
import crypto from 'crypto'

export function createShare(bookmarkId: string, expiresAt?: number, createdBy?: string) {
  const db = getDatabase()
  if (!db) return null
  const id = generateId()
  const shareToken = crypto.randomBytes(16).toString('hex')
  db.run(
    'INSERT INTO shares (id, bookmarkId, shareToken, expiresAt, isActive, createdBy, createdAt) VALUES (?, ?, ?, ?, 1, ?, ?)',
    [id, bookmarkId, shareToken, expiresAt || null, createdBy || null, new Date().toISOString()]
  )
  saveDatabase()
  return shareToken
}

export function getShareByToken(shareToken: string) {
  const db = getDatabase()
  if (!db) return null
  const stmt = db.prepare('SELECT * FROM shares WHERE shareToken = ? AND isActive = 1')
  stmt.bind([shareToken])
  if (stmt.step()) {
    const result = stmt.getAsObject() as any
    stmt.free()
    if (result.expiresAt && Date.now() > result.expiresAt) {
      return null
    }
    return result
  }
  stmt.free()
  return null
}

export function deactivateShare(shareId: string) {
  const db = getDatabase()
  if (!db) return
  db.run('UPDATE shares SET isActive = 0 WHERE id = ?', [shareId])
  saveDatabase()
}
