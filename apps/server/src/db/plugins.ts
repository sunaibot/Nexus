import { getDatabase, saveDatabase, generateId } from './core.js'
import { queryAll, queryOne, run } from '../utils/database.js'

export interface Plugin {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  icon?: string
  isEnabled: boolean
  isInstalled: boolean
  config?: Record<string, any>
  orderIndex: number
  visibility: 'public' | 'private' | 'role'
  allowedRoles?: string[]
  createdAt: string
  updatedAt: string
}

export interface UserPlugin {
  userId: string
  pluginId: string
  isEnabled: boolean
  config?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface RolePlugin {
  role: string
  pluginId: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export function createPlugin(
  name: string,
  description?: string,
  version: string = '1.0.0',
  author?: string,
  icon?: string,
  config?: Record<string, any>,
  visibility: 'public' | 'private' | 'role' = 'public',
  allowedRoles?: string[]
): string | null {
  const db = getDatabase()
  if (!db) return null

  const id = generateId()
  const now = new Date().toISOString()

  run(
    'INSERT INTO plugins (id, name, description, version, author, icon, isEnabled, isInstalled, config, orderIndex, visibility, allowedRoles, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, 0, ?, ?, ?, ?)',
    [id, name, description || '', version, author || '', icon || '', config ? JSON.stringify(config) : null, visibility, allowedRoles ? JSON.stringify(allowedRoles) : null, now, now]
  )

  return id
}

export function getPlugins(enabledOnly: boolean = false): Plugin[] {
  let query = 'SELECT * FROM plugins'
  const params: any[] = []

  if (enabledOnly) {
    query += ' WHERE isEnabled = 1'
  }

  query += ' ORDER BY orderIndex ASC, createdAt DESC'

  const results = queryAll(query, params)
  return results.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version || '1.0.0',
    author: row.author,
    icon: row.icon,
    isEnabled: row.isEnabled === 1,
    isInstalled: row.isInstalled === 1,
    config: row.config ? JSON.parse(row.config) : undefined,
    orderIndex: row.orderIndex || 0,
    visibility: (row.visibility as 'public' | 'private' | 'role') || 'public',
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

export function getPluginsForUser(userId: string, userRole: string): Plugin[] {
  const db = getDatabase()
  if (!db) return []

  const allPlugins = getPlugins(true)
  
  return allPlugins.filter(plugin => {
    if (plugin.visibility === 'public') {
      return true
    }
    
    if (plugin.visibility === 'role' && plugin.allowedRoles?.includes(userRole)) {
      return true
    }
    
    const userPlugin = getUserPlugin(userId, plugin.id)
    if (userPlugin && userPlugin.isEnabled) {
      return true
    }
    
    const rolePlugin = getRolePlugin(userRole, plugin.id)
    if (rolePlugin && rolePlugin.isEnabled) {
      return true
    }
    
    return false
  })
}

export function getPluginById(id: string): Plugin | null {
  const row = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version || '1.0.0',
    author: row.author,
    icon: row.icon,
    isEnabled: row.isEnabled === 1,
    isInstalled: row.isInstalled === 1,
    config: row.config ? JSON.parse(row.config) : undefined,
    orderIndex: row.orderIndex || 0,
    visibility: (row.visibility as 'public' | 'private' | 'role') || 'public',
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function updatePlugin(id: string, updates: Partial<Omit<Plugin, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.version !== undefined) {
    fields.push('version = ?')
    values.push(updates.version)
  }
  if (updates.author !== undefined) {
    fields.push('author = ?')
    values.push(updates.author)
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?')
    values.push(updates.icon)
  }
  if (updates.isEnabled !== undefined) {
    fields.push('isEnabled = ?')
    values.push(updates.isEnabled ? 1 : 0)
  }
  if (updates.isInstalled !== undefined) {
    fields.push('isInstalled = ?')
    values.push(updates.isInstalled ? 1 : 0)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(updates.config ? JSON.stringify(updates.config) : null)
  }
  if (updates.orderIndex !== undefined) {
    fields.push('orderIndex = ?')
    values.push(updates.orderIndex)
  }
  if (updates.visibility !== undefined) {
    fields.push('visibility = ?')
    values.push(updates.visibility)
  }
  if (updates.allowedRoles !== undefined) {
    fields.push('allowedRoles = ?')
    values.push(updates.allowedRoles ? JSON.stringify(updates.allowedRoles) : null)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  run(`UPDATE plugins SET ${fields.join(', ')} WHERE id = ?`, values)
  return true
}

export function deletePlugin(id: string): boolean {
  run('DELETE FROM plugins WHERE id = ?', [id])
  run('DELETE FROM admin_menus WHERE pluginId = ?', [id])
  run('DELETE FROM user_plugins WHERE pluginId = ?', [id])
  run('DELETE FROM role_plugins WHERE pluginId = ?', [id])
  return true
}

export function enablePlugin(id: string): boolean {
  return updatePlugin(id, { isEnabled: true })
}

export function disablePlugin(id: string): boolean {
  return updatePlugin(id, { isEnabled: false })
}

export function createUserPlugin(
  userId: string,
  pluginId: string,
  isEnabled: boolean = true,
  config?: Record<string, any>
): boolean {
  const now = new Date().toISOString()

  run(
    'INSERT OR REPLACE INTO user_plugins (userId, pluginId, isEnabled, config, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, pluginId, isEnabled ? 1 : 0, config ? JSON.stringify(config) : null, now, now]
  )

  return true
}

export function getUserPlugin(userId: string, pluginId: string): UserPlugin | null {
  const row = queryOne('SELECT * FROM user_plugins WHERE userId = ? AND pluginId = ?', [userId, pluginId])
  if (!row) return null

  return {
    userId: row.userId,
    pluginId: row.pluginId,
    isEnabled: row.isEnabled === 1,
    config: row.config ? JSON.parse(row.config) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function getUserPlugins(userId: string): UserPlugin[] {
  const results = queryAll('SELECT * FROM user_plugins WHERE userId = ?', [userId])
  return results.map((row: any) => ({
    userId: row.userId,
    pluginId: row.pluginId,
    isEnabled: row.isEnabled === 1,
    config: row.config ? JSON.parse(row.config) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

export function updateUserPlugin(userId: string, pluginId: string, updates: Partial<Omit<UserPlugin, 'userId' | 'pluginId' | 'createdAt'>>): boolean {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.isEnabled !== undefined) {
    fields.push('isEnabled = ?')
    values.push(updates.isEnabled ? 1 : 0)
  }
  if (updates.config !== undefined) {
    fields.push('config = ?')
    values.push(updates.config ? JSON.stringify(updates.config) : null)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(userId)
  values.push(pluginId)

  run(`UPDATE user_plugins SET ${fields.join(', ')} WHERE userId = ? AND pluginId = ?`, values)
  return true
}

export function deleteUserPlugin(userId: string, pluginId: string): boolean {
  run('DELETE FROM user_plugins WHERE userId = ? AND pluginId = ?', [userId, pluginId])
  return true
}

export function createRolePlugin(
  role: string,
  pluginId: string,
  isEnabled: boolean = true
): boolean {
  const now = new Date().toISOString()

  run(
    'INSERT OR REPLACE INTO role_plugins (role, pluginId, isEnabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [role, pluginId, isEnabled ? 1 : 0, now, now]
  )

  return true
}

export function getRolePlugin(role: string, pluginId: string): RolePlugin | null {
  const row = queryOne('SELECT * FROM role_plugins WHERE role = ? AND pluginId = ?', [role, pluginId])
  if (!row) return null

  return {
    role: row.role,
    pluginId: row.pluginId,
    isEnabled: row.isEnabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function getRolePlugins(role: string): RolePlugin[] {
  const results = queryAll('SELECT * FROM role_plugins WHERE role = ?', [role])
  return results.map((row: any) => ({
    role: row.role,
    pluginId: row.pluginId,
    isEnabled: row.isEnabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

export function updateRolePlugin(role: string, pluginId: string, updates: Partial<Omit<RolePlugin, 'role' | 'pluginId' | 'createdAt'>>): boolean {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.isEnabled !== undefined) {
    fields.push('isEnabled = ?')
    values.push(updates.isEnabled ? 1 : 0)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(role)
  values.push(pluginId)

  run(`UPDATE role_plugins SET ${fields.join(', ')} WHERE role = ? AND pluginId = ?`, values)
  return true
}

export function deleteRolePlugin(role: string, pluginId: string): boolean {
  run('DELETE FROM role_plugins WHERE role = ? AND pluginId = ?', [role, pluginId])
  return true
}
