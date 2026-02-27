/**
 * BookmarkService - 书签业务逻辑层
 * 封装所有书签相关的数据库操作和业务规则
 */

import { BaseService } from './BaseService.js'
import {
  PaginationParams,
  PaginationResult,
  SortParams,
  NotFoundError,
  ValidationError,
  PermissionError,
  QueryCondition
} from './types.js'
import { queryAll, queryOne, run, booleanize } from '../utils/index.js'
import {
  getBookmarkById,
  setPrivateBookmarkPassword,
  verifyPrivateBookmarkPassword,
  removePrivateBookmarkPassword,
  getPrivateBookmarkPassword
} from '../db/index.js'

// ========== 类型定义 ==========

export type Visibility = 'public' | 'personal' | 'private'

export interface Bookmark {
  id: string
  url: string
  internalUrl?: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string
  notes?: string
  orderIndex: number
  isPinned: boolean
  isReadLater: boolean
  clickCount: number
  visibility: Visibility
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookmarkDTO {
  url: string
  internalUrl?: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string
  notes?: string
  isReadLater?: boolean
  visibility?: Visibility
  userId: string
}

export interface UpdateBookmarkDTO {
  url?: string
  internalUrl?: string
  title?: string
  description?: string
  favicon?: string
  ogImage?: string
  icon?: string
  iconUrl?: string
  category?: string
  tags?: string
  notes?: string
  isPinned?: boolean
  isReadLater?: boolean
  visibility?: Visibility
}

export interface BookmarkFilters {
  userId?: string
  visibility?: Visibility
  category?: string
  isPinned?: boolean
  isReadLater?: boolean
  search?: string
}

export interface ReorderItem {
  id: string
  orderIndex: number
}

// ========== Service 实现 ==========

export class BookmarkService extends BaseService<
  Bookmark,
  CreateBookmarkDTO,
  UpdateBookmarkDTO
> {
  protected tableName = 'bookmarks'
  protected defaultSortField = 'createdAt'
  protected sortableFields = ['createdAt', 'updatedAt', 'title', 'orderIndex', 'clickCount']

  // ========== 实体映射 ==========

  protected mapToEntity(row: unknown): Bookmark {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      url: data.url as string,
      internalUrl: data.internalUrl as string | undefined,
      title: data.title as string,
      description: data.description as string | undefined,
      favicon: data.favicon as string | undefined,
      ogImage: data.ogImage as string | undefined,
      icon: data.icon as string | undefined,
      iconUrl: data.iconUrl as string | undefined,
      category: data.category as string | undefined,
      tags: data.tags as string | undefined,
      notes: data.notes as string | undefined,
      orderIndex: (data.orderIndex as number) || 0,
      isPinned: booleanize({ isPinned: data.isPinned }).isPinned as boolean,
      isReadLater: booleanize({ isReadLater: data.isReadLater }).isReadLater as boolean,
      clickCount: (data.clickCount as number) || 0,
      visibility: (data.visibility as Visibility) || 'personal',
      userId: data.userId as string,
      createdAt: data.createdAt as string,
      updatedAt: data.updatedAt as string
    }
  }

  protected mapCreateToFields(data: CreateBookmarkDTO): Record<string, unknown> {
    // 获取当前用户的最大 orderIndex
    const maxOrder = queryOne(
      'SELECT MAX(orderIndex) as max FROM bookmarks WHERE userId = ?',
      [data.userId]
    )
    const newOrderIndex = ((maxOrder?.max as number) ?? -1) + 1

    return {
      url: data.url,
      internalUrl: data.internalUrl || null,
      title: data.title,
      description: data.description || null,
      favicon: data.favicon || null,
      ogImage: data.ogImage || null,
      icon: data.icon || null,
      iconUrl: data.iconUrl || null,
      category: data.category || null,
      tags: data.tags || null,
      notes: data.notes || null,
      orderIndex: newOrderIndex,
      isPinned: 0,
      isReadLater: data.isReadLater ? 1 : 0,
      clickCount: 0,
      visibility: data.visibility || 'personal',
      userId: data.userId
    }
  }

  protected mapUpdateToFields(data: UpdateBookmarkDTO): Record<string, unknown> {
    const fields: Record<string, unknown> = {}

    if (data.url !== undefined) fields.url = data.url
    if (data.internalUrl !== undefined) fields.internalUrl = data.internalUrl || null
    if (data.title !== undefined) fields.title = data.title
    if (data.description !== undefined) fields.description = data.description || null
    if (data.favicon !== undefined) fields.favicon = data.favicon || null
    if (data.ogImage !== undefined) fields.ogImage = data.ogImage || null
    if (data.icon !== undefined) fields.icon = data.icon || null
    if (data.iconUrl !== undefined) fields.iconUrl = data.iconUrl || null
    if (data.category !== undefined) fields.category = data.category || null
    if (data.tags !== undefined) fields.tags = data.tags || null
    if (data.notes !== undefined) fields.notes = data.notes || null
    if (data.isPinned !== undefined) fields.isPinned = data.isPinned ? 1 : 0
    if (data.isReadLater !== undefined) fields.isReadLater = data.isReadLater ? 1 : 0
    if (data.visibility !== undefined) fields.visibility = data.visibility

    return fields
  }

  // ========== 自定义查询方法 ==========

  /**
   * 获取公开书签（无需登录）
   */
  getPublicBookmarks(): Bookmark[] {
    const conditions: QueryCondition[] = [
      { field: 'visibility', operator: 'eq', value: 'public' }
    ]

    return this.queryWithOptions({
      conditions,
      orderBy: [
        { field: 'isPinned', direction: 'desc' },
        { field: 'orderIndex', direction: 'asc' },
        { field: 'createdAt', direction: 'desc' }
      ]
    })
  }

  /**
   * 获取用户可访问的书签（包括公开和个人）
   */
  getAccessibleBookmarks(userId: string, visibility?: Visibility): Bookmark[] {
    if (visibility) {
      if (visibility === 'public') {
        return this.getPublicBookmarks()
      }
      // personal 或 private
      return this.queryWithOptions({
        conditions: [
          { field: 'visibility', operator: 'eq', value: visibility },
          { field: 'userId', operator: 'eq', value: userId }
        ],
        orderBy: [
          { field: 'isPinned', direction: 'desc' },
          { field: 'orderIndex', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' }
        ]
      })
    }

    // 返回公开 + 用户的个人书签
    const query = `
      SELECT * FROM bookmarks
      WHERE visibility = 'public'
      OR (visibility IN ('personal', 'private') AND userId = ?)
      ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC
    `
    const rows = queryAll(query, [userId])
    return rows.map(row => this.mapToEntity(row))
  }

  /**
   * 获取所有书签（管理员）
   */
  getAllBookmarks(): Bookmark[] {
    return this.findAll()
  }

  /**
   * 分页获取书签（带搜索和过滤）
   */
  getBookmarksPaginated(
    userId: string,
    pagination: PaginationParams,
    filters?: {
      search?: string
      category?: string
      isPinned?: boolean
      isReadLater?: boolean
    },
    sort?: SortParams
  ): PaginationResult<Bookmark> {
    const { page, pageSize } = pagination
    const offset = (page - 1) * pageSize

    // 构建 WHERE 条件
    const conditions: string[] = ['userId = ?']
    const params: unknown[] = [userId]

    if (filters?.search) {
      conditions.push('(title LIKE ? OR url LIKE ? OR description LIKE ?)')
      const searchPattern = `%${filters.search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (filters?.category) {
      if (filters.category === 'uncategorized') {
        conditions.push('(category IS NULL OR category = "")')
      } else {
        conditions.push('category = ?')
        params.push(filters.category)
      }
    }

    if (filters?.isPinned !== undefined) {
      conditions.push('isPinned = ?')
      params.push(filters.isPinned ? 1 : 0)
    }

    if (filters?.isReadLater !== undefined) {
      conditions.push('isReadLater = ?')
      params.push(filters.isReadLater ? 1 : 0)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // 获取总数
    const countResult = queryOne(
      `SELECT COUNT(*) as total FROM bookmarks ${whereClause}`,
      params
    )
    const total = (countResult?.total as number) || 0
    const totalPages = Math.ceil(total / pageSize)

    // 构建排序
    let orderClause = 'ORDER BY isPinned DESC'
    if (sort?.sortBy === 'orderIndex') {
      orderClause += `, orderIndex ${sort.sortOrder.toUpperCase()}, createdAt DESC`
    } else if (sort) {
      orderClause += `, ${sort.sortBy} ${sort.sortOrder.toUpperCase()}`
    } else {
      orderClause += ', createdAt DESC'
    }

    // 查询数据
    const rows = queryAll(
      `SELECT * FROM bookmarks ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return {
      items: rows.map(row => this.mapToEntity(row)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }
  }

  /**
   * 按分类获取书签
   */
  getBookmarksByCategory(userId: string, category: string | null): Bookmark[] {
    if (category === null || category === 'uncategorized') {
      const rows = queryAll(
        `SELECT * FROM bookmarks
         WHERE userId = ? AND (category IS NULL OR category = "")
         ORDER BY isPinned DESC, orderIndex ASC, createdAt DESC`,
        [userId]
      )
      return rows.map(row => this.mapToEntity(row))
    }

    return this.queryWithOptions({
      conditions: [
        { field: 'userId', operator: 'eq', value: userId },
        { field: 'category', operator: 'eq', value: category }
      ],
      orderBy: [
        { field: 'isPinned', direction: 'desc' },
        { field: 'orderIndex', direction: 'asc' }
      ]
    })
  }

  /**
   * 获取用户的稍后阅读列表
   */
  getReadLaterBookmarks(userId: string): Bookmark[] {
    return this.queryWithOptions({
      conditions: [
        { field: 'userId', operator: 'eq', value: userId },
        { field: 'isReadLater', operator: 'eq', value: 1 }
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    })
  }

  /**
   * 获取置顶书签
   */
  getPinnedBookmarks(userId: string): Bookmark[] {
    return this.queryWithOptions({
      conditions: [
        { field: 'userId', operator: 'eq', value: userId },
        { field: 'isPinned', operator: 'eq', value: 1 }
      ],
      orderBy: [
        { field: 'orderIndex', direction: 'asc' }
      ]
    })
  }

  // ========== 业务操作 ==========

  /**
   * 增加点击次数
   */
  incrementClickCount(id: string): boolean {
    const result = run(
      'UPDATE bookmarks SET clickCount = clickCount + 1 WHERE id = ?',
      [id]
    )
    return result.changes > 0
  }

  /**
   * 切换置顶状态
   */
  togglePin(id: string, userId: string): Bookmark | null {
    const bookmark = this.findById(id)
    if (!bookmark) return null

    // 验证权限
    if (bookmark.userId !== userId) {
      throw new PermissionError('Cannot modify other user\'s bookmark')
    }

    const newPinStatus = !bookmark.isPinned
    let orderIndex = bookmark.orderIndex

    // 如果设为置顶，获取新的 orderIndex
    if (newPinStatus) {
      const maxPinned = queryOne(
        'SELECT MAX(orderIndex) as max FROM bookmarks WHERE userId = ? AND isPinned = 1',
        [userId]
      )
      orderIndex = ((maxPinned?.max as number) ?? -1) + 1
    }

    run(
      'UPDATE bookmarks SET isPinned = ?, orderIndex = ? WHERE id = ?',
      [newPinStatus ? 1 : 0, orderIndex, id]
    )

    return this.findById(id)
  }

  /**
   * 重新排序书签
   */
  reorderBookmarks(items: ReorderItem[], userId: string): boolean {
    for (const item of items) {
      // 验证书签属于该用户
      const bookmark = this.findById(item.id)
      if (bookmark && bookmark.userId === userId) {
        run(
          'UPDATE bookmarks SET orderIndex = ? WHERE id = ?',
          [item.orderIndex, item.id]
        )
      }
    }
    return true
  }

  /**
   * 移动书签到分类
   */
  moveToCategory(id: string, category: string | null, userId: string): Bookmark | null {
    const bookmark = this.findById(id)
    if (!bookmark) return null

    if (bookmark.userId !== userId) {
      throw new PermissionError('Cannot modify other user\'s bookmark')
    }

    run(
      'UPDATE bookmarks SET category = ? WHERE id = ?',
      [category, id]
    )

    return this.findById(id)
  }

  // ========== 私有书签密码管理 ==========

  /**
   * 设置私有书签密码
   */
  async setPrivatePassword(id: string, password: string, userId: string): Promise<boolean> {
    const bookmark = this.findById(id)
    if (!bookmark) {
      throw new NotFoundError('Bookmark', id)
    }

    if (bookmark.userId !== userId) {
      throw new PermissionError('Cannot modify other user\'s bookmark')
    }

    if (bookmark.visibility !== 'private') {
      throw new ValidationError('Only private bookmarks can have password')
    }

    await setPrivateBookmarkPassword(id, password)
    return true
  }

  /**
   * 验证私有书签密码
   */
  async verifyPrivatePassword(id: string, password: string): Promise<boolean> {
    return verifyPrivateBookmarkPassword(id, password)
  }

  /**
   * 移除私有书签密码
   */
  removePrivatePassword(id: string, userId: string): boolean {
    const bookmark = this.findById(id)
    if (!bookmark) {
      throw new NotFoundError('Bookmark', id)
    }

    if (bookmark.userId !== userId) {
      throw new PermissionError('Cannot modify other user\'s bookmark')
    }

    removePrivateBookmarkPassword(id)
    return true
  }

  // ========== 统计方法 ==========

  /**
   * 获取用户书签统计
   */
  getUserStats(userId: string): {
    total: number
    public: number
    personal: number
    private: number
    pinned: number
    readLater: number
  } {
    const total = queryOne(
      'SELECT COUNT(*) as count FROM bookmarks WHERE userId = ?',
      [userId]
    )
    const publicCount = queryOne(
      'SELECT COUNT(*) as count FROM bookmarks WHERE userId = ? AND visibility = ?',
      [userId, 'public']
    )
    const personalCount = queryOne(
      'SELECT COUNT(*) as count FROM bookmarks WHERE userId = ? AND visibility = ?',
      [userId, 'personal']
    )
    const privateCount = queryOne(
      'SELECT COUNT(*) as count FROM bookmarks WHERE userId = ? AND visibility = ?',
      [userId, 'private']
    )
    const pinnedCount = queryOne(
      'SELECT COUNT(*) as count FROM bookmarks WHERE userId = ? AND isPinned = 1',
      [userId]
    )
    const readLaterCount = queryOne(
      'SELECT COUNT(*) as count FROM bookmarks WHERE userId = ? AND isReadLater = 1',
      [userId]
    )

    return {
      total: (total?.count as number) || 0,
      public: (publicCount?.count as number) || 0,
      personal: (personalCount?.count as number) || 0,
      private: (privateCount?.count as number) || 0,
      pinned: (pinnedCount?.count as number) || 0,
      readLater: (readLaterCount?.count as number) || 0
    }
  }

  /**
   * 获取分类统计
   */
  getCategoryStats(userId: string): Array<{ category: string; count: number }> {
    const rows = queryAll(
      `SELECT category, COUNT(*) as count
       FROM bookmarks
       WHERE userId = ?
       GROUP BY category
       ORDER BY count DESC`,
      [userId]
    )

    return rows.map(row => ({
      category: (row.category as string) || 'uncategorized',
      count: (row.count as number) || 0
    }))
  }
}

// 导出单例实例
export const bookmarkService = new BookmarkService()
