/**
 * 通知系统路由模块
 * 支持多通道通知
 */

import { Router } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { notificationService } from './service.js'
import { NotificationChannel, NotificationType, NotificationPriority } from './types.js'
import { queryAll, runQuery, generateId } from '../../utils/index.js'

const router = Router()

/**
 * 获取用户通知列表
 * GET /api/notifications
 */
router.get('/notifications', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    const unreadOnly = req.query.unreadOnly === 'true'
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const { notifications, total } = notificationService.getUserNotifications(user.id, {
      unreadOnly,
      limit,
      offset,
    })

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notifications.length < total,
      },
    })
  } catch (error) {
    console.error('获取通知列表失败:', error)
    res.status(500).json({ success: false, error: '获取通知列表失败' })
  }
})

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
router.get('/notifications/unread-count', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    const count = notificationService.getUnreadCount(user.id)

    res.json({
      success: true,
      data: { count },
    })
  } catch (error) {
    console.error('获取未读数量失败:', error)
    res.status(500).json({ success: false, error: '获取未读数量失败' })
  }
})

/**
 * 标记通知为已读
 * PUT /api/notifications/:id/read
 */
router.put('/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const success = notificationService.markAsRead(id, user.id)

    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ success: false, error: '通知不存在' })
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    res.status(500).json({ success: false, error: '标记已读失败' })
  }
})

/**
 * 标记所有通知为已读
 * PUT /api/notifications/read-all
 */
router.put('/notifications/read-all', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user

    const success = notificationService.markAllAsRead(user.id)

    res.json({ success: true })
  } catch (error) {
    console.error('标记全部已读失败:', error)
    res.status(500).json({ success: false, error: '标记全部已读失败' })
  }
})

/**
 * 删除通知
 * DELETE /api/notifications/:id
 */
router.delete('/notifications/:id', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const success = notificationService.deleteNotification(id, user.id)

    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ success: false, error: '通知不存在' })
    }
  } catch (error) {
    console.error('删除通知失败:', error)
    res.status(500).json({ success: false, error: '删除通知失败' })
  }
})

/**
 * 创建通知（管理员接口）
 * POST /api/notifications
 */
router.post('/notifications', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user
    const { type, title, content, priority, channels, data } = req.body

    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        error: '类型、标题和内容不能为空',
      })
    }

    const notification = await notificationService.createNotification({
      userId: user.id,
      type: type as NotificationType,
      title,
      content,
      priority: priority as NotificationPriority,
      channels: channels as NotificationChannel[],
      data,
    })

    res.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('创建通知失败:', error)
    res.status(500).json({ success: false, error: '创建通知失败' })
  }
})

/**
 * 获取通知配置
 * GET /api/notifications/configs
 */
router.get('/notifications/configs', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user

    const configs = queryAll(
      'SELECT id, channel, enabled, createdAt, updatedAt FROM notification_configs WHERE userId = ?',
      [user.id]
    )

    res.json({
      success: true,
      data: configs,
    })
  } catch (error) {
    console.error('获取通知配置失败:', error)
    res.status(500).json({ success: false, error: '获取通知配置失败' })
  }
})

/**
 * 保存通知配置
 * POST /api/notifications/configs
 */
router.post('/notifications/configs', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    const { channel, enabled, config } = req.body

    if (!channel || !Object.values(NotificationChannel).includes(channel)) {
      return res.status(400).json({
        success: false,
        error: '无效的通知渠道',
      })
    }

    // 检查是否已存在
    const existing = queryAll(
      'SELECT id FROM notification_configs WHERE userId = ? AND channel = ?',
      [user.id, channel]
    )

    const now = new Date().toISOString()

    if (existing.length > 0) {
      // 更新
      runQuery(
        'UPDATE notification_configs SET enabled = ?, config = ?, updatedAt = ? WHERE userId = ? AND channel = ?',
        [enabled ? 1 : 0, JSON.stringify(config || {}), now, user.id, channel]
      )
    } else {
      // 创建
      const id = generateId()
      runQuery(
        'INSERT INTO notification_configs (id, userId, channel, enabled, config, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, user.id, channel, enabled ? 1 : 0, JSON.stringify(config || {}), now, now]
      )
    }

    res.json({ success: true })
  } catch (error) {
    console.error('保存通知配置失败:', error)
    res.status(500).json({ success: false, error: '保存通知配置失败' })
  }
})

/**
 * 获取支持的渠道列表
 * GET /api/notifications/channels
 */
router.get('/notifications/channels', authMiddleware, (req, res) => {
  try {
    const channels = [
      { value: NotificationChannel.WEB, name: '站内通知', description: '在网站内显示通知' },
      { value: NotificationChannel.EMAIL, name: '邮件', description: '发送邮件通知' },
      { value: NotificationChannel.WEBHOOK, name: 'Webhook', description: '调用自定义Webhook' },
      { value: NotificationChannel.FEISHU, name: '飞书', description: '发送到飞书群' },
      { value: NotificationChannel.DINGTALK, name: '钉钉', description: '发送到钉钉群' },
      { value: NotificationChannel.WECHAT, name: '企业微信', description: '发送到企业微信群' },
    ]

    res.json({
      success: true,
      data: channels,
    })
  } catch (error) {
    console.error('获取渠道列表失败:', error)
    res.status(500).json({ success: false, error: '获取渠道列表失败' })
  }
})

export default router
