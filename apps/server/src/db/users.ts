import { getDatabase, generateId, hashPassword, saveDatabase } from './core.js'

export async function createUser(username: string, password: string, email?: string, role: string = 'user') {
  const db = getDatabase()
  if (!db) return null
  const id = generateId()
  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO users (id, username, password, email, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
    [id, username, passwordHash, email || null, role, now, now]
  )
  saveDatabase()
  return id
}

export function getUsers() {
  const db = getDatabase()
  if (!db) return []
  const result = db.exec('SELECT id, username, email, role, isActive, createdAt FROM users ORDER BY createdAt DESC')
  if (result.length === 0) return []
  return result[0].values.map((row: any[]) => ({
    id: row[0],
    username: row[1],
    email: row[2],
    role: row[3],
    isActive: row[4],
    createdAt: row[5]
  }))
}

// 允许的更新字段白名单
const ALLOWED_USER_UPDATE_FIELDS = ['username', 'email', 'role', 'isActive'] as const
type AllowedUpdateField = typeof ALLOWED_USER_UPDATE_FIELDS[number]

export function updateUser(userId: string, updates: Partial<Record<AllowedUpdateField, any>>) {
  const db = getDatabase()
  if (!db) return
  
  const setParts: string[] = []
  const params: any[] = []
  
  // 遍历允许的字段，防止非法字段更新
  for (const field of ALLOWED_USER_UPDATE_FIELDS) {
    if (updates[field] !== undefined) {
      setParts.push(`${field} = ?`)
      // isActive 需要转换为数字
      if (field === 'isActive') {
        params.push(updates[field] ? 1 : 0)
      } else {
        params.push(updates[field])
      }
    }
  }
  
  if (setParts.length === 0) return
  
  setParts.push('updatedAt = ?')
  params.push(new Date().toISOString())
  params.push(userId)
  
  db.run(`UPDATE users SET ${setParts.join(', ')} WHERE id = ?`, params)
  saveDatabase()
}

export function getUserById(id: string) {
  const db = getDatabase()
  if (!db) return null
  const result = db.exec('SELECT * FROM users WHERE id = ?', [id])
  if (result.length === 0) return null
  const row = result[0].values[0]
  return {
    id: row[0],
    username: row[1],
    password: row[2],
    email: row[3],
    role: row[4],
    isActive: row[5],
    isDefaultPassword: row[6],
    createdAt: row[7],
    updatedAt: row[8]
  }
}

export function getUserByUsername(username: string) {
  const db = getDatabase()
  if (!db) return null
  const result = db.exec('SELECT * FROM users WHERE username = ?', [username])
  if (result.length === 0) return null
  const row = result[0].values[0]
  return {
    id: row[0],
    username: row[1],
    password: row[2],
    email: row[3],
    role: row[4],
    isActive: row[5],
    isDefaultPassword: row[6],
    createdAt: row[7],
    updatedAt: row[8]
  }
}

export function getUserByEmail(email: string) {
  const db = getDatabase()
  if (!db) return null
  const result = db.exec('SELECT * FROM users WHERE email = ? AND isActive = 1', [email])
  if (result.length === 0) return null
  const row = result[0].values[0]
  return {
    id: row[0],
    username: row[1],
    password: row[2],
    email: row[3],
    role: row[4],
    isActive: row[5],
    isDefaultPassword: row[6],
    createdAt: row[7],
    updatedAt: row[8]
  }
}

export function createPasswordResetToken(userId: string, token: string, expiresAt: number): void {
  const db = getDatabase()
  if (!db) return
  const id = generateId()
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO password_reset_tokens (id, userId, token, expiresAt, used, createdAt) VALUES (?, ?, ?, ?, 0, ?)',
    [id, userId, token, expiresAt, now]
  )
  saveDatabase()
}

export function getUserByResetToken(token: string) {
  const db = getDatabase()
  if (!db) return null
  const result = db.exec(
    'SELECT u.* FROM users u JOIN password_reset_tokens t ON u.id = t.userId WHERE t.token = ? AND t.expiresAt > ? AND t.used = 0',
    [token, Date.now()]
  )
  if (result.length === 0) return null
  const row = result[0].values[0]
  return {
    id: row[0],
    username: row[1],
    password: row[2],
    email: row[3],
    role: row[4],
    isActive: row[5],
    isDefaultPassword: row[6],
    createdAt: row[7],
    updatedAt: row[8]
  }
}

export function markResetTokenUsed(token: string): void {
  const db = getDatabase()
  if (!db) return
  db.run('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token])
  saveDatabase()
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const db = getDatabase()
  if (!db) return
  const passwordHash = await hashPassword(newPassword)
  const now = new Date().toISOString()
  db.run(
    'UPDATE users SET password = ?, isDefaultPassword = 0, updatedAt = ? WHERE id = ?',
    [passwordHash, now, userId]
  )
  saveDatabase()
}

export function cleanupExpiredResetTokens(): void {
  const db = getDatabase()
  if (!db) return
  db.run('DELETE FROM password_reset_tokens WHERE expiresAt < ? OR used = 1', [Date.now()])
  saveDatabase()
}
