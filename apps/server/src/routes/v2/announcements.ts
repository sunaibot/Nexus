/**
 * 系统公告管理路由
 * 提供公告的CRUD和发布功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'
import { NotificationType, NotificationPriority } from '../../features/notification/types.js'
import { notificationService } from '../../features/notification/service.js'

const router = Router()

// 公告接口
interface Announcement {
  id: string
  title: string
  content: string
  type: NotificationType
  priority: NotificationPriority
  targetRoles: string[]  // 目标角色 ['all', 'admin', 'user']
  targetUsers?: string[] // 特定用户ID
  startAt: string        // 开始时间
  endAt?: string         // 结束时间
  isPublished: boolean
  publishedAt?: string
  publishedBy?: string
  readCount: number
  createdAt: string
  updatedAt: string
}

// 解析公告数据
function parseAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    type: row.type as NotificationType,
    priority: row.priority as NotificationPriority,
    targetRoles: JSON.parse(row.targetRoles || '["all"]'),
    targetUsers: row.targetUsers ? JSON.parse(row.targetUsers) : undefined,
    startAt: row.startAt,
    endAt: row.endAt,
    isPublished: Boolean(row.isPublished),
    publishedAt: row.publishedAt,
    publishedBy: row.publishedBy,
    readCount: row.readCount || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * 获取公告列表（公开接口）
 * GET /api/v2/announcements
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, limit = 10, includeExpired = 'false' } = req.query
    const now = new Date().toISOString()
    
    let sql = `SELECT * FROM announcements 
               WHERE isPublished = 1 
               AND startAt <= ?`
    const params: any[] = [now]
    
    // 默认不包含过期的
    if (includeExpired !== 'true') {
      sql += ` AND (endAt IS NULL OR endAt > ?)`
      params.push(now)
    }
    
    if (type) {
      sql += ` AND type = ?`
      params.push(type)
    }
    
    sql += ` ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'normal' THEN 3 
        WHEN 'low' THEN 4 
      END,
      createdAt DESC
      LIMIT ?`
    params.push(parseInt(limit as string) || 10)
    
    const announcements = queryAll(sql, params).map(parseAnnouncement)
    
    return successResponse(res, announcements)
  } catch (error) {
    console.error('获取公告列表失败:', error)
    return errorResponse(res, '获取公告列表失败')
  }
})

/**
 * 获取公告详情（公开接口）
 * GET /api/v2/announcements/:id
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    
    const row = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    if (!row) {
      return errorResponse(res, '公告不存在', 404)
    }
    
    const announcement = parseAnnouncement(row)
    
    // 增加阅读计数
    run('UPDATE announcements SET readCount = readCount + 1 WHERE id = ?', [id])
    
    return successResponse(res, announcement)
  } catch (error) {
    console.error('获取公告详情失败:', error)
    return errorResponse(res, '获取公告详情失败')
  }
})

/**
 * 创建公告（需要管理员权限）
 * POST /api/v2/announcements
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const {
      title,
      content,
      type = NotificationType.ANNOUNCEMENT,
      priority = NotificationPriority.NORMAL,
      targetRoles = ['all'],
      targetUsers,
      startAt,
      endAt,
      isPublished = false,
    } = req.body
    
    if (!title || !content) {
      return errorResponse(res, '标题和内容不能为空', 400)
    }
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      `INSERT INTO announcements (
        id, title, content, type, priority, 
        targetRoles, targetUsers, startAt, endAt,
        isPublished, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        content,
        type,
        priority,
        JSON.stringify(targetRoles),
        targetUsers ? JSON.stringify(targetUsers) : null,
        startAt || now,
        endAt || null,
        isPublished ? 1 : 0,
        now,
        now,
      ]
    )
    
    // 如果直接发布，发送通知
    if (isPublished) {
      publishAnnouncement(id, user.id)
    }
    
    const announcement = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    return successResponse(res, parseAnnouncement(announcement))
  } catch (error) {
    console.error('创建公告失败:', error)
    return errorResponse(res, '创建公告失败')
  }
})

/**
 * 更新公告（需要管理员权限）
 * PATCH /api/v2/announcements/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const user = (req as any).user
    const updates = req.body
    
    const existing = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '公告不存在', 404)
    }
    
    const updateFields: string[] = []
    const params: any[] = []
    
    if (updates.title !== undefined) {
      updateFields.push('title = ?')
      params.push(updates.title)
    }
    if (updates.content !== undefined) {
      updateFields.push('content = ?')
      params.push(updates.content)
    }
    if (updates.type !== undefined) {
      updateFields.push('type = ?')
      params.push(updates.type)
    }
    if (updates.priority !== undefined) {
      updateFields.push('priority = ?')
      params.push(updates.priority)
    }
    if (updates.targetRoles !== undefined) {
      updateFields.push('targetRoles = ?')
      params.push(JSON.stringify(updates.targetRoles))
    }
    if (updates.targetUsers !== undefined) {
      updateFields.push('targetUsers = ?')
      params.push(JSON.stringify(updates.targetUsers))
    }
    if (updates.startAt !== undefined) {
      updateFields.push('startAt = ?')
      params.push(updates.startAt)
    }
    if (updates.endAt !== undefined) {
      updateFields.push('endAt = ?')
      params.push(updates.endAt)
    }
    
    // 处理发布状态变更
    if (updates.isPublished !== undefined && updates.isPublished !== Boolean(existing.isPublished)) {
      updateFields.push('isPublished = ?')
      params.push(updates.isPublished ? 1 : 0)
      
      if (updates.isPublished) {
        updateFields.push('publishedAt = ?')
        params.push(new Date().toISOString())
        updateFields.push('publishedBy = ?')
        params.push(user.id)
      }
    }
    
    updateFields.push('updatedAt = ?')
    params.push(new Date().toISOString())
    params.push(id)
    
    run(
      `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    )
    
    // 如果变为已发布，发送通知
    if (updates.isPublished && !existing.isPublished) {
      publishAnnouncement(id, user.id)
    }
    
    const announcement = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    return successResponse(res, parseAnnouncement(announcement))
  } catch (error) {
    console.error('更新公告失败:', error)
    return errorResponse(res, '更新公告失败')
  }
})

/**
 * 删除公告（需要管理员权限）
 * DELETE /api/v2/announcements/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    
    const existing = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '公告不存在', 404)
    }
    
    run('DELETE FROM announcements WHERE id = ?', [id])
    
    return successResponse(res, { deleted: true })
  } catch (error) {
    console.error('删除公告失败:', error)
    return errorResponse(res, '删除公告失败')
  }
})

/**
 * 发布公告（需要管理员权限）
 * POST /api/v2/announcements/:id/publish
 */
router.post('/:id/publish', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const user = (req as any).user
    
    const existing = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '公告不存在', 404)
    }
    
    if (existing.isPublished) {
      return errorResponse(res, '公告已发布', 400)
    }
    
    const now = new Date().toISOString()
    run(
      'UPDATE announcements SET isPublished = 1, publishedAt = ?, publishedBy = ?, updatedAt = ? WHERE id = ?',
      [now, user.id, now, id]
    )
    
    // 发送通知
    publishAnnouncement(id, user.id)
    
    const announcement = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    return successResponse(res, parseAnnouncement(announcement))
  } catch (error) {
    console.error('发布公告失败:', error)
    return errorResponse(res, '发布公告失败')
  }
})

/**
 * 获取未读公告数量（需要认证）
 * GET /api/v2/announcements/unread/count
 */
router.get('/unread/count', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const now = new Date().toISOString()
    
    // 获取用户已读的公告ID
    const readAnnouncements = queryAll(
      'SELECT announcementId FROM announcement_reads WHERE userId = ?',
      [user.id]
    ).map((r: any) => r.announcementId)
    
    let sql = `SELECT COUNT(*) as count FROM announcements 
               WHERE isPublished = 1 
               AND startAt <= ?
               AND (endAt IS NULL OR endAt > ?)`
    const params: any[] = [now, now]
    
    if (readAnnouncements.length > 0) {
      sql += ` AND id NOT IN (${readAnnouncements.map(() => '?').join(',')})`
      params.push(...readAnnouncements)
    }
    
    const result = queryOne(sql, params) as { count: number }
    
    return successResponse(res, { count: result.count })
  } catch (error) {
    console.error('获取未读公告数量失败:', error)
    return errorResponse(res, '获取未读公告数量失败')
  }
})

/**
 * 标记公告为已读（需要认证）
 * POST /api/v2/announcements/:id/read
 */
router.post('/:id/read', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const user = (req as any).user
    
    const existing = queryOne('SELECT * FROM announcements WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '公告不存在', 404)
    }
    
    // 检查是否已读
    const alreadyRead = queryOne(
      'SELECT * FROM announcement_reads WHERE announcementId = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!alreadyRead) {
      run(
        'INSERT INTO announcement_reads (announcementId, userId, readAt) VALUES (?, ?, ?)',
        [id, user.id, new Date().toISOString()]
      )
    }
    
    return successResponse(res, { read: true })
  } catch (error) {
    console.error('标记已读失败:', error)
    return errorResponse(res, '标记已读失败')
  }
})

// 发布公告通知
function publishAnnouncement(announcementId: string, publisherId: string) {
  try {
    const announcement = queryOne('SELECT * FROM announcements WHERE id = ?', [announcementId])
    if (!announcement) return
    
    const parsed = parseAnnouncement(announcement)
    
    // 获取目标用户
    let targetUserIds: string[] = []
    
    if (parsed.targetUsers && parsed.targetUsers.length > 0) {
      targetUserIds = parsed.targetUsers
    } else if (parsed.targetRoles.includes('all')) {
      const allUsers = queryAll('SELECT id FROM users WHERE isActive = 1')
      targetUserIds = allUsers.map((u: any) => u.id)
    } else {
      const users = queryAll(
        'SELECT id FROM users WHERE role IN (?) AND isActive = 1',
        [parsed.targetRoles.join(',')]
      )
      targetUserIds = users.map((u: any) => u.id)
    }
    
    // 发送通知给每个目标用户
    for (const userId of targetUserIds) {
      notificationService.createNotification({
        userId,
        type: parsed.type as any,
        title: parsed.title,
        content: parsed.content,
        priority: parsed.priority as any,
        channels: ['web'] as any,
        data: {
          announcementId: parsed.id,
          publisherId,
        },
      })
    }
  } catch (error) {
    console.error('发布公告通知失败:', error)
  }
}

export default router
