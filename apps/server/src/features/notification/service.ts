/**
 * 通知系统服务层
 * 支持多通道通知
 */

import {
  NotificationMessage,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  SendResult,
  NotificationConfig,
  NotificationTemplate,
  EmailConfig,
  WebhookConfig,
  FeishuConfig,
  DingTalkConfig,
  WeChatConfig,
} from './types.js'
import { queryAll, runQuery, generateId } from '../../utils/index.js'
import { logAudit } from '../../db/audit-enhanced.js'

/**
 * 通知服务类
 */
export class NotificationService {
  private static instance: NotificationService
  private templates: Map<string, NotificationTemplate> = new Map()

  private constructor() {
    this.loadTemplates()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * 加载通知模板
   */
  private loadTemplates(): void {
    // 默认模板
    const defaultTemplates: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.WEB,
        title: '系统通知',
        content: '{{message}}',
        variables: ['message'],
      },
      {
        type: NotificationType.LOGIN_ALERT,
        channel: NotificationChannel.WEB,
        title: '登录提醒',
        content: '您的账号于 {{time}} 在 {{location}} 登录',
        variables: ['time', 'location'],
      },
      {
        type: NotificationType.SYNC_SUCCESS,
        channel: NotificationChannel.WEB,
        title: '同步成功',
        content: '书签同步成功，共同步 {{count}} 个书签',
        variables: ['count'],
      },
      {
        type: NotificationType.SYNC_FAILED,
        channel: NotificationChannel.WEB,
        title: '同步失败',
        content: '书签同步失败：{{error}}',
        variables: ['error'],
      },
      {
        type: NotificationType.LINK_BROKEN,
        channel: NotificationChannel.WEB,
        title: '链接失效',
        content: '检测到 {{count}} 个书签链接失效',
        variables: ['count'],
      },
      {
        type: NotificationType.FILE_EXPIRING,
        channel: NotificationChannel.WEB,
        title: '文件即将过期',
        content: '您分享的文件 {{fileName}} 将在 {{days}} 天后过期',
        variables: ['fileName', 'days'],
      },
    ]

    for (const template of defaultTemplates) {
      const id = generateId()
      const now = new Date().toISOString()
      this.templates.set(`${template.type}_${template.channel}`, {
        ...template,
        id,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  /**
   * 创建通知
   */
  async createNotification(options: {
    userId: string
    type: NotificationType
    title: string
    content: string
    priority?: NotificationPriority
    channels?: NotificationChannel[]
    data?: Record<string, any>
  }): Promise<NotificationMessage> {
    const id = generateId()
    const now = new Date().toISOString()

    const notification: NotificationMessage = {
      id,
      userId: options.userId,
      type: options.type,
      title: options.title,
      content: options.content,
      priority: options.priority || NotificationPriority.NORMAL,
      channels: options.channels || [NotificationChannel.WEB],
      data: options.data,
      read: false,
      createdAt: now,
    }

    // 保存到数据库
    runQuery(
      `INSERT INTO notifications (id, userId, type, title, content, priority, channels, data, read, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.id,
        notification.userId,
        notification.type,
        notification.title,
        notification.content,
        notification.priority,
        JSON.stringify(notification.channels),
        notification.data ? JSON.stringify(notification.data) : null,
        notification.read ? 1 : 0,
        notification.createdAt,
      ]
    )

    // 发送通知
    await this.sendNotification(notification)

    // 记录审计日志
    logAudit({
      userId: options.userId || null,
      username: null,
      action: 'NOTIFICATION_CREATE',
      resourceType: 'notification',
      resourceId: id,
      details: { type: options.type, priority: options.priority },
    })

    return notification
  }

  /**
   * 发送通知到多个渠道
   */
  private async sendNotification(notification: NotificationMessage): Promise<SendResult[]> {
    const results: SendResult[] = []

    for (const channel of notification.channels) {
      try {
        const result = await this.sendToChannel(channel, notification)
        results.push(result)
      } catch (error: any) {
        results.push({
          success: false,
          channel,
          error: error.message,
          sentAt: new Date().toISOString(),
        })
      }
    }

    return results
  }

  /**
   * 发送到指定渠道
   */
  private async sendToChannel(channel: NotificationChannel, notification: NotificationMessage): Promise<SendResult> {
    switch (channel) {
      case NotificationChannel.WEB:
        return this.sendWeb(notification)
      case NotificationChannel.EMAIL:
        return this.sendEmail(notification)
      case NotificationChannel.WEBHOOK:
        return this.sendWebhook(notification)
      case NotificationChannel.FEISHU:
        return this.sendFeishu(notification)
      case NotificationChannel.DINGTALK:
        return this.sendDingTalk(notification)
      case NotificationChannel.WECHAT:
        return this.sendWeChat(notification)
      default:
        return {
          success: false,
          channel,
          error: '不支持的渠道',
          sentAt: new Date().toISOString(),
        }
    }
  }

  /**
   * 站内通知（仅保存到数据库，前端轮询获取）
   */
  private async sendWeb(notification: NotificationMessage): Promise<SendResult> {
    // 站内通知已通过createNotification保存到数据库
    return {
      success: true,
      channel: NotificationChannel.WEB,
      messageId: notification.id,
      sentAt: new Date().toISOString(),
    }
  }

  /**
   * 发送邮件
   */
  private async sendEmail(notification: NotificationMessage): Promise<SendResult> {
    // 获取邮件配置
    const config = this.getChannelConfig(notification.userId, NotificationChannel.EMAIL) as EmailConfig | null

    if (!config) {
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        error: '邮件配置未设置',
        sentAt: new Date().toISOString(),
      }
    }

    try {
      // 使用 SMTP 发送邮件
      const transporter = await this.createEmailTransporter(config)
      
      await transporter.sendMail({
        from: config.fromEmail || config.smtpUser,
        to: notification.data?.email || config.smtpUser,
        subject: notification.title,
        text: notification.content,
        html: this.formatEmailHtml(notification),
      })

      return {
        success: true,
        channel: NotificationChannel.EMAIL,
        sentAt: new Date().toISOString(),
      }
    } catch (error: any) {
      console.error('发送邮件失败:', error)
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        error: error.message || '发送邮件失败',
        sentAt: new Date().toISOString(),
      }
    }
  }

  /**
   * 创建邮件传输器
   */
  private async createEmailTransporter(config: EmailConfig) {
    // 动态导入 nodemailer
    const nodemailer = await import('nodemailer')
    
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  }

  /**
   * 格式化邮件 HTML
   */
  private formatEmailHtml(notification: NotificationMessage): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notification.title}</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p style="white-space: pre-line;">${notification.content}</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          发送时间: ${new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    `
  }

  /**
   * 发送Webhook
   */
  private async sendWebhook(notification: NotificationMessage): Promise<SendResult> {
    const config = this.getChannelConfig(notification.userId, NotificationChannel.WEBHOOK) as WebhookConfig | null

    if (!config) {
      return {
        success: false,
        channel: NotificationChannel.WEBHOOK,
        error: 'Webhook配置未设置',
        sentAt: new Date().toISOString(),
      }
    }

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({
          type: notification.type,
          title: notification.title,
          content: notification.content,
          priority: notification.priority,
          data: notification.data,
          timestamp: notification.createdAt,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return {
        success: true,
        channel: NotificationChannel.WEBHOOK,
        sentAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        success: false,
        channel: NotificationChannel.WEBHOOK,
        error: error.message,
        sentAt: new Date().toISOString(),
      }
    }
  }

  /**
   * 发送飞书通知
   */
  private async sendFeishu(notification: NotificationMessage): Promise<SendResult> {
    const config = this.getChannelConfig(notification.userId, NotificationChannel.FEISHU) as FeishuConfig | null

    if (!config) {
      return {
        success: false,
        channel: NotificationChannel.FEISHU,
        error: '飞书配置未设置',
        sentAt: new Date().toISOString(),
      }
    }

    try {
      const payload: any = {
        msg_type: 'text',
        content: {
          text: `${notification.title}\n${notification.content}`,
        },
      }

      // 如果有secret，计算签名
      if (config.secret) {
        const timestamp = Math.floor(Date.now() / 1000)
        const sign = await this.generateFeishuSign(timestamp, config.secret)
        payload.timestamp = timestamp
        payload.sign = sign
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return {
        success: true,
        channel: NotificationChannel.FEISHU,
        sentAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        success: false,
        channel: NotificationChannel.FEISHU,
        error: error.message,
        sentAt: new Date().toISOString(),
      }
    }
  }

  /**
   * 生成飞书签名
   */
  private async generateFeishuSign(timestamp: number, secret: string): Promise<string> {
    const crypto = await import('crypto')
    const stringToSign = `${timestamp}\n${secret}`
    const hmac = crypto.createHmac('sha256', stringToSign)
    return hmac.digest('base64')
  }

  /**
   * 发送钉钉通知
   */
  private async sendDingTalk(notification: NotificationMessage): Promise<SendResult> {
    const config = this.getChannelConfig(notification.userId, NotificationChannel.DINGTALK) as DingTalkConfig | null

    if (!config) {
      return {
        success: false,
        channel: NotificationChannel.DINGTALK,
        error: '钉钉配置未设置',
        sentAt: new Date().toISOString(),
      }
    }

    try {
      const payload: any = {
        msgtype: 'text',
        text: {
          content: `${notification.title}\n${notification.content}`,
        },
      }

      // 如果有secret，计算签名
      if (config.secret) {
        const timestamp = Date.now()
        const sign = await this.generateDingTalkSign(timestamp, config.secret)
        payload.timestamp = timestamp
        payload.sign = sign
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return {
        success: true,
        channel: NotificationChannel.DINGTALK,
        sentAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        success: false,
        channel: NotificationChannel.DINGTALK,
        error: error.message,
        sentAt: new Date().toISOString(),
      }
    }
  }

  /**
   * 生成钉钉签名
   */
  private async generateDingTalkSign(timestamp: number, secret: string): Promise<string> {
    const crypto = await import('crypto')
    const stringToSign = `${timestamp}\n${secret}`
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(stringToSign)
    return encodeURIComponent(hmac.digest('base64'))
  }

  /**
   * 发送企业微信通知
   */
  private async sendWeChat(notification: NotificationMessage): Promise<SendResult> {
    const config = this.getChannelConfig(notification.userId, NotificationChannel.WECHAT) as WeChatConfig | null

    if (!config) {
      return {
        success: false,
        channel: NotificationChannel.WECHAT,
        error: '企业微信配置未设置',
        sentAt: new Date().toISOString(),
      }
    }

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'text',
          text: {
            content: `${notification.title}\n${notification.content}`,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return {
        success: true,
        channel: NotificationChannel.WECHAT,
        sentAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        success: false,
        channel: NotificationChannel.WECHAT,
        error: error.message,
        sentAt: new Date().toISOString(),
      }
    }
  }

  /**
   * 获取渠道配置
   */
  private getChannelConfig(userId: string, channel: NotificationChannel): Record<string, any> | null {
    const config = queryAll(
      'SELECT config FROM notification_configs WHERE userId = ? AND channel = ? AND enabled = 1',
      [userId, channel]
    )[0]

    if (config && config.config) {
      try {
        return JSON.parse(config.config)
      } catch (e) {
        return null
      }
    }

    return null
  }

  /**
   * 获取用户通知列表
   */
  getUserNotifications(userId: string, options: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  } = {}): { notifications: NotificationMessage[]; total: number } {
    const { unreadOnly = false, limit = 20, offset = 0 } = options

    let query = 'SELECT * FROM notifications WHERE userId = ?'
    const params: any[] = [userId]

    if (unreadOnly) {
      query += ' AND read = 0'
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const notifications = queryAll(query, params).map((n: any) => ({
      ...n,
      channels: JSON.parse(n.channels),
      data: n.data ? JSON.parse(n.data) : undefined,
      read: n.read === 1,
    }))

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as count FROM notifications WHERE userId = ?'
    const countParams: any[] = [userId]
    if (unreadOnly) {
      countQuery += ' AND read = 0'
    }
    const total = queryAll(countQuery, countParams)[0]?.count || 0

    return { notifications, total }
  }

  /**
   * 标记通知为已读
   */
  markAsRead(notificationId: string, userId: string): boolean {
    const now = new Date().toISOString()
    const result = runQuery(
      'UPDATE notifications SET read = 1, readAt = ? WHERE id = ? AND userId = ?',
      [now, notificationId, userId]
    )
    return result.changes > 0
  }

  /**
   * 标记所有通知为已读
   */
  markAllAsRead(userId: string): boolean {
    const now = new Date().toISOString()
    const result = runQuery(
      'UPDATE notifications SET read = 1, readAt = ? WHERE userId = ? AND read = 0',
      [now, userId]
    )
    return result.changes > 0
  }

  /**
   * 删除通知
   */
  deleteNotification(notificationId: string, userId: string): boolean {
    const result = runQuery(
      'DELETE FROM notifications WHERE id = ? AND userId = ?',
      [notificationId, userId]
    )
    return result.changes > 0
  }

  /**
   * 获取未读通知数量
   */
  getUnreadCount(userId: string): number {
    const result = queryAll(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0',
      [userId]
    )
    return result[0]?.count || 0
  }
}

/**
 * 服务实例导出
 */
export const notificationService = NotificationService.getInstance()
