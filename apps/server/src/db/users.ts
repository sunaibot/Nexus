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

export function updateUser(userId: string, updates: { username?: string; email?: string; role?: string; isActive?: boolean }) {
  const db = getDatabase()
  if (!db) return
  const setParts: string[] = []
  const params: any[] = []
  
  if (updates.username !== undefined) {
    setParts.push('username = ?')
    params.push(updates.username)
  }
  if (updates.email !== undefined) {
    setParts.push('email = ?')
    params.push(updates.email)
  }
  if (updates.role !== undefined) {
    setParts.push('role = ?')
    params.push(updates.role)
  }
  if (updates.isActive !== undefined) {
    setParts.push('isActive = ?')
    params.push(updates.isActive ? 1 : 0)
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
