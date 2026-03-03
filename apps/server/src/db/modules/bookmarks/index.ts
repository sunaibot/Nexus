/**
 * 书签数据库模块
 * 提供书签相关的数据库操作
 */

import { queryAll, queryOne, run } from '../../../utils/index.js'
import { generateId } from '../../index.js'
import { booleanize } from '../../../utils/index.js'

export type Visibility = 'public' | 'personal' | 'private'

export interface Bookmark {
  id: string
  url: string
  internalUrl?: string | null
  title: string
  description?: string | null
  favicon?: string | null
  ogImage?: string | null
  icon?: string | null
  iconUrl?: string | null
  category?: string | null
  tags?: string | null
  notes?: string | null
  orderIndex: number
  isPinned: number
  isReadLater: number
  isRead: number
  visibility: Visibility
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookmarkInput {
  url: string
  internalUrl?: string | null
  title: string
  description?: string | null
  favicon?: string | null
  ogImage?: string | null
  icon?: string | null
  iconUrl?: string | null
  category?: string | null
  tags?: string | null
  notes?: string | null
  isReadLater?: boolean
  visibility?: Visibility
}

export interface UpdateBookmarkInput {
  url?: string
  internalUrl?: string | null
  title?: string
  description?: string | null
  favicon?: string | null
  ogImage?: string | null
  icon?: string | null
  iconUrl?: string | null
  category?: string | null
  tags?: string | null
  notes?: string | null
  orderIndex?: number
  isPinned?: boolean
  isReadLater?: boolean
  isRead?: boolean
  visibility?: Visibility
}

export interface PaginationQuery {
  page: number
  pageSize: number
  search?: string
  category?: string
  isPinned?: boolean
  isReadLater?: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * 构建书签查询条件
 */
export function buildBookmarkQuery(
  user: any,
  visibility?: string,
  includePublic?: boolean
): { query: string; params: any[] } {
  let query: string
  let params: any[] = []

  if (user?.role === 'admin') {
    if (visibility) {
      query = `SELECT * FROM bookmarks WHERE visibility = ?`
      params = [visibility]
    } else {
      query = `SELECT * FROM bookmarks ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
    }
  } else if (user) {
    if (visibility) {
      if (visibility === 'public') {
        query = `SELECT * FROM bookmarks WHERE visibility = 'public'`
      } else if (visibility === 'personal' || visibility === 'private') {
        query = `SELECT * FROM bookmarks WHERE visibility = ? AND userId = ?`
        params = [visibility, user.id]
      } else {
        query = `SELECT * FROM bookmarks WHERE userId = ?`
        params = [user.id]
      }
    } else {
      query = `
        SELECT * FROM bookmarks 
        WHERE visibility = 'public' 
        OR (visibility IN ('personal', 'private') AND userId = ?)
        OR userId IS NULL
        ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
      `
      params = [user.id]
    }
  } else {
    query = `SELECT * FROM bookmarks WHERE visibility = 'public'`
  }

  if (!query.includes('ORDER BY')) {
    query += ` ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
  }

  return { query, params }
}

/**
 * 获取书签列表
 */
export function getBookmarks(user: any, visibility?: string, includePublic?: boolean): Bookmark[] {
  const { query, params } = buildBookmarkQuery(user, visibility, includePublic)
  return queryAll(query, params).map(booleanize)
}

/**
 * 获取公共书签
 */
export function getPublicBookmarks(): Bookmark[] {
  const query = `SELECT * FROM bookmarks WHERE visibility = 'public' ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
  return queryAll(query).map(booleanize)
}

/**
 * 获取所有书签（管理员）
 */
export function getAllBookmarks(): Bookmark[] {
  const query = `SELECT * FROM bookmarks ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`
  return queryAll(query).map(booleanize)
}

/**
 * 分页获取书签
 */
export function getPaginatedBookmarks(
  user: any,
  query: PaginationQuery
): PaginatedResult<Bookmark> {
  const { page, pageSize, search, category, isPinned, isReadLater, sortBy, sortOrder } = query

  const conditions: string[] = user.role === 'admin' ? [] : ['userId = ?']
  const params: any[] = user.role === 'admin' ? [] : [user.id]

  if (search) {
    conditions.push('(title LIKE ? OR url LIKE ? OR description LIKE ?)')
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern, searchPattern)
  }

  if (category) {
    if (category === 'uncategorized') {
      conditions.push('(category IS NULL OR category = "")')
    } else {
      conditions.push('category = ?')
      params.push(category)
    }
  }

  if (typeof isPinned === 'boolean') {
    conditions.push('isPinned = ?')
    params.push(isPinned ? 1 : 0)
  }

  if (typeof isReadLater === 'boolean') {
    conditions.push('isReadLater = ?')
    params.push(isReadLater ? 1 : 0)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = queryOne(`SELECT COUNT(*) as total FROM bookmarks ${whereClause}`, params)
  const total = countResult?.total || 0

  const offset = (page - 1) * pageSize
  const totalPages = Math.ceil(total / pageSize)

  let orderClause = 'ORDER BY isPinned DESC'
  if (sortBy === 'orderIndex') {
    orderClause += `, orderIndex ${sortOrder.toUpperCase()}, createdAt DESC`
  } else {
    orderClause += `, ${sortBy} ${sortOrder.toUpperCase()}`
  }

  const bookmarks = queryAll(`
    SELECT * FROM bookmarks
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])

  return {
    items: bookmarks.map(booleanize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    }
  }
}

/**
 * 根据ID获取书签
 */
export function getBookmarkById(id: string, userId?: string): Bookmark | null {
  let bookmark
  if (userId) {
    bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ? AND userId = ?', [id, userId])
  } else {
    bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ?', [id])
  }
  return bookmark ? booleanize(bookmark) : null
}

/**
 * 根据ID和可见性获取书签
 */
export function getBookmarkByIdAndVisibility(id: string, visibility: Visibility): Bookmark | null {
  const bookmark = queryOne('SELECT * FROM bookmarks WHERE id = ? AND visibility = ?', [id, visibility])
  return bookmark ? booleanize(bookmark) : null
}

/**
 * 创建书签
 */
export function createBookmark(userId: string, input: CreateBookmarkInput): Bookmark {
  const maxOrder = queryOne('SELECT MAX(orderIndex) as max FROM bookmarks WHERE userId = ?', [userId])
  const newOrderIndex = (maxOrder?.max ?? -1) + 1

  const id = generateId()
  const now = new Date().toISOString()

  run(`
    INSERT INTO bookmarks (id, url, internalUrl, title, description, favicon, ogImage, icon, iconUrl, category, tags, notes, orderIndex, isReadLater, visibility, userId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, input.url, input.internalUrl || null, input.title, input.description || null, input.favicon || null,
    input.ogImage || null, input.icon || null, input.iconUrl || null, input.category || null,
    input.tags || null, input.notes || null, newOrderIndex, input.isReadLater ? 1 : 0,
    input.visibility || 'personal', userId, now, now
  ])

  return getBookmarkById(id, userId)!
}

/**
 * 更新书签
 */
export function updateBookmark(
  id: string,
  userId: string,
  isAdmin: boolean,
  updates: UpdateBookmarkInput,
  isOwnBookmark: boolean
): Bookmark | null {
  const now = new Date().toISOString()

  if (!isOwnBookmark) {
    // 只允许修改 category 和 orderIndex
    run(`
      UPDATE bookmarks SET
        category = ?, orderIndex = ?, updatedAt = ?
      WHERE id = ?
    `, [
      updates.category, updates.orderIndex, now, id
    ])
  } else {
    run(`
      UPDATE bookmarks SET
        url = ?, internalUrl = ?, title = ?, description = ?, favicon = ?, ogImage = ?, icon = ?, iconUrl = ?,
        category = ?, tags = ?, notes = ?, orderIndex = ?, isPinned = ?,
        isReadLater = ?, isRead = ?, visibility = ?, updatedAt = ?
      WHERE id = ? AND userId = ?
    `, [
      updates.url, updates.internalUrl || null, updates.title, updates.description, updates.favicon, updates.ogImage, updates.icon, updates.iconUrl,
      updates.category, updates.tags, updates.notes || null, updates.orderIndex, updates.isPinned ? 1 : 0,
      updates.isReadLater ? 1 : 0, updates.isRead ? 1 : 0, updates.visibility || 'personal', now, id, userId
    ])
  }

  return getBookmarkById(id)
}

/**
 * 更新书签可见性
 */
export function updateBookmarkVisibility(
  id: string,
  visibility: Visibility,
  isAdmin: boolean,
  userId?: string
): Bookmark | null {
  const now = new Date().toISOString()

  if (isAdmin) {
    run('UPDATE bookmarks SET visibility = ?, updatedAt = ? WHERE id = ?', [visibility, now, id])
  } else if (userId) {
    run('UPDATE bookmarks SET visibility = ?, updatedAt = ? WHERE id = ? AND userId = ?', [visibility, now, id, userId])
  }

  return getBookmarkById(id)
}

/**
 * 删除书签
 */
export function deleteBookmark(id: string, userId: string): boolean {
  const result = run('DELETE FROM bookmarks WHERE id = ? AND userId = ?', [id, userId])
  return result.changes > 0
}

/**
 * 重排序书签
 */
export function reorderBookmarks(items: { id: string; orderIndex: number }[], userId: string): void {
  for (const item of items) {
    run('UPDATE bookmarks SET orderIndex = ? WHERE id = ? AND userId = ?', [item.orderIndex, item.id, userId])
  }
}
