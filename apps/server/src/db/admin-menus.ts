import { getDatabase, saveDatabase, generateId } from './core.js'
import { queryAll, queryOne, run } from '../utils/database.js'

export interface AdminMenu {
  id: string
  parentId?: string
  name: string
  labelKey?: string
  icon?: string
  path?: string
  pluginId?: string
  isVisible: boolean
  isEnabled: boolean
  orderIndex: number
  visibility: 'public' | 'private' | 'role'
  allowedRoles?: string[]
  createdAt: string
  updatedAt: string
}

export interface UserMenu {
  userId: string
  menuId: string
  isVisible: boolean
  isEnabled: boolean
  orderIndex?: number
  createdAt: string
  updatedAt: string
}

export interface RoleMenu {
  role: string
  menuId: string
  isVisible: boolean
  isEnabled: boolean
  orderIndex?: number
  createdAt: string
  updatedAt: string
}

export function createAdminMenu(
  name: string,
  labelKey?: string,
  icon?: string,
  path?: string,
  parentId?: string,
  pluginId?: string,
  visibility: 'public' | 'private' | 'role' = 'public',
  allowedRoles?: string[]
): string | null {
  const id = generateId()
  const now = new Date().toISOString()

  run(
    'INSERT INTO admin_menus (id, parentId, name, labelKey, icon, path, pluginId, isVisible, isEnabled, orderIndex, visibility, allowedRoles, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0, ?, ?, ?, ?)',
    [id, parentId || null, name, labelKey || '', icon || '', path || '', pluginId || null, visibility, allowedRoles ? JSON.stringify(allowedRoles) : null, now, now]
  )

  return id
}

export function getAdminMenus(visibleOnly: boolean = true, enabledOnly: boolean = true): AdminMenu[] {
  let query = 'SELECT * FROM admin_menus'
  const params: any[] = []
  const conditions: string[] = []

  if (visibleOnly) {
    conditions.push('isVisible = 1')
  }
  if (enabledOnly) {
    conditions.push('isEnabled = 1')
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY orderIndex ASC, createdAt DESC'

  const results = queryAll(query, params)
  return results.map((row: any) => ({
    id: row.id,
    parentId: row.parentId || undefined,
    name: row.name,
    labelKey: row.labelKey || undefined,
    icon: row.icon || undefined,
    path: row.path || undefined,
    pluginId: row.pluginId || undefined,
    isVisible: row.isVisible === 1,
    isEnabled: row.isEnabled === 1,
    orderIndex: row.orderIndex || 0,
    visibility: (row.visibility as 'public' | 'private' | 'role') || 'public',
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

export function getAdminMenusForUser(userId: string, userRole: string): AdminMenu[] {
  const allMenus = getAdminMenus(true, true)
  
  return allMenus.filter(menu => {
    if (menu.visibility === 'public') {
      return true
    }
    
    if (menu.visibility === 'role' && menu.allowedRoles?.includes(userRole)) {
      return true
    }
    
    const userMenu = getUserMenu(userId, menu.id)
    if (userMenu && userMenu.isVisible && userMenu.isEnabled) {
      return true
    }
    
    const roleMenu = getRoleMenu(userRole, menu.id)
    if (roleMenu && roleMenu.isVisible && roleMenu.isEnabled) {
      return true
    }
    
    return false
  })
}

export function getAdminMenuById(id: string): AdminMenu | null {
  const row = queryOne('SELECT * FROM admin_menus WHERE id = ?', [id])
  if (!row) return null

  return {
    id: row.id,
    parentId: row.parentId || undefined,
    name: row.name,
    labelKey: row.labelKey || undefined,
    icon: row.icon || undefined,
    path: row.path || undefined,
    pluginId: row.pluginId || undefined,
    isVisible: row.isVisible === 1,
    isEnabled: row.isEnabled === 1,
    orderIndex: row.orderIndex || 0,
    visibility: (row.visibility as 'public' | 'private' | 'role') || 'public',
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function getAdminMenusByPluginId(pluginId: string): AdminMenu[] {
  const results = queryAll('SELECT * FROM admin_menus WHERE pluginId = ? ORDER BY orderIndex ASC, createdAt DESC', [pluginId])
  return results.map((row: any) => ({
    id: row.id,
    parentId: row.parentId || undefined,
    name: row.name,
    labelKey: row.labelKey || undefined,
    icon: row.icon || undefined,
    path: row.path || undefined,
    pluginId: row.pluginId || undefined,
    isVisible: row.isVisible === 1,
    isEnabled: row.isEnabled === 1,
    orderIndex: row.orderIndex || 0,
    visibility: (row.visibility as 'public' | 'private' | 'role') || 'public',
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

export function updateAdminMenu(id: string, updates: Partial<Omit<AdminMenu, 'id' | 'createdAt' | 'updatedAt'>>): boolean {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.parentId !== undefined) {
    fields.push('parentId = ?')
    values.push(updates.parentId || null)
  }
  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.labelKey !== undefined) {
    fields.push('labelKey = ?')
    values.push(updates.labelKey || '')
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?')
    values.push(updates.icon || '')
  }
  if (updates.path !== undefined) {
    fields.push('path = ?')
    values.push(updates.path || '')
  }
  if (updates.pluginId !== undefined) {
    fields.push('pluginId = ?')
    values.push(updates.pluginId || null)
  }
  if (updates.isVisible !== undefined) {
    fields.push('isVisible = ?')
    values.push(updates.isVisible ? 1 : 0)
  }
  if (updates.isEnabled !== undefined) {
    fields.push('isEnabled = ?')
    values.push(updates.isEnabled ? 1 : 0)
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

  run(`UPDATE admin_menus SET ${fields.join(', ')} WHERE id = ?`, values)
  return true
}

export function deleteAdminMenu(id: string): boolean {
  run('DELETE FROM admin_menus WHERE id = ? OR parentId = ?', [id, id])
  run('DELETE FROM user_menus WHERE menuId = ?', [id])
  run('DELETE FROM role_menus WHERE menuId = ?', [id])
  return true
}

export function buildMenuTree(menus: AdminMenu[]): (AdminMenu & { children?: AdminMenu[] })[] {
  const menuMap = new Map<string, AdminMenu & { children?: AdminMenu[] }>()
  const rootMenus: (AdminMenu & { children?: AdminMenu[] })[] = []

  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })

  menus.forEach(menu => {
    const menuWithChildren = menuMap.get(menu.id)!
    if (menu.parentId && menuMap.has(menu.parentId)) {
      menuMap.get(menu.parentId)!.children!.push(menuWithChildren)
    } else {
      rootMenus.push(menuWithChildren)
    }
  })

  return rootMenus
}

export function createUserMenu(
  userId: string,
  menuId: string,
  isVisible: boolean = true,
  isEnabled: boolean = true,
  orderIndex?: number
): boolean {
  const now = new Date().toISOString()

  run(
    'INSERT OR REPLACE INTO user_menus (userId, menuId, isVisible, isEnabled, orderIndex, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, menuId, isVisible ? 1 : 0, isEnabled ? 1 : 0, orderIndex || null, now, now]
  )

  return true
}

export function getUserMenu(userId: string, menuId: string): UserMenu | null {
  const row = queryOne('SELECT * FROM user_menus WHERE userId = ? AND menuId = ?', [userId, menuId])
  if (!row) return null

  return {
    userId: row.userId,
    menuId: row.menuId,
    isVisible: row.isVisible === 1,
    isEnabled: row.isEnabled === 1,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function getUserMenus(userId: string): UserMenu[] {
  const results = queryAll('SELECT * FROM user_menus WHERE userId = ?', [userId])
  return results.map((row: any) => ({
    userId: row.userId,
    menuId: row.menuId,
    isVisible: row.isVisible === 1,
    isEnabled: row.isEnabled === 1,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

export function updateUserMenu(userId: string, menuId: string, updates: Partial<Omit<UserMenu, 'userId' | 'menuId' | 'createdAt'>>): boolean {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.isVisible !== undefined) {
    fields.push('isVisible = ?')
    values.push(updates.isVisible ? 1 : 0)
  }
  if (updates.isEnabled !== undefined) {
    fields.push('isEnabled = ?')
    values.push(updates.isEnabled ? 1 : 0)
  }
  if (updates.orderIndex !== undefined) {
    fields.push('orderIndex = ?')
    values.push(updates.orderIndex)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(userId)
  values.push(menuId)

  run(`UPDATE user_menus SET ${fields.join(', ')} WHERE userId = ? AND menuId = ?`, values)
  return true
}

export function deleteUserMenu(userId: string, menuId: string): boolean {
  run('DELETE FROM user_menus WHERE userId = ? AND menuId = ?', [userId, menuId])
  return true
}

export function createRoleMenu(
  role: string,
  menuId: string,
  isVisible: boolean = true,
  isEnabled: boolean = true,
  orderIndex?: number
): boolean {
  const now = new Date().toISOString()

  run(
    'INSERT OR REPLACE INTO role_menus (role, menuId, isVisible, isEnabled, orderIndex, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [role, menuId, isVisible ? 1 : 0, isEnabled ? 1 : 0, orderIndex || null, now, now]
  )

  return true
}

export function getRoleMenu(role: string, menuId: string): RoleMenu | null {
  const row = queryOne('SELECT * FROM role_menus WHERE role = ? AND menuId = ?', [role, menuId])
  if (!row) return null

  return {
    role: row.role,
    menuId: row.menuId,
    isVisible: row.isVisible === 1,
    isEnabled: row.isEnabled === 1,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function getRoleMenus(role: string): RoleMenu[] {
  const results = queryAll('SELECT * FROM role_menus WHERE role = ?', [role])
  return results.map((row: any) => ({
    role: row.role,
    menuId: row.menuId,
    isVisible: row.isVisible === 1,
    isEnabled: row.isEnabled === 1,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

export function updateRoleMenu(role: string, menuId: string, updates: Partial<Omit<RoleMenu, 'role' | 'menuId' | 'createdAt'>>): boolean {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: any[] = []

  if (updates.isVisible !== undefined) {
    fields.push('isVisible = ?')
    values.push(updates.isVisible ? 1 : 0)
  }
  if (updates.isEnabled !== undefined) {
    fields.push('isEnabled = ?')
    values.push(updates.isEnabled ? 1 : 0)
  }
  if (updates.orderIndex !== undefined) {
    fields.push('orderIndex = ?')
    values.push(updates.orderIndex)
  }

  if (fields.length === 0) return false

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(role)
  values.push(menuId)

  run(`UPDATE role_menus SET ${fields.join(', ')} WHERE role = ? AND menuId = ?`, values)
  return true
}

export function deleteRoleMenu(role: string, menuId: string): boolean {
  run('DELETE FROM role_menus WHERE role = ? AND menuId = ?', [role, menuId])
  return true
}
