/**
 * 通知系统模块类型定义
 * 支持多通道通知
 */

/** 通知渠道 */
export enum NotificationChannel {
  WEB = 'web',                    // 站内通知
  EMAIL = 'email',                // 邮件
  WEBHOOK = 'webhook',            // Webhook
  FEISHU = 'feishu',              // 飞书
  DINGTALK = 'dingtalk',          // 钉钉
  WECHAT = 'wechat',              // 企业微信
  PUSH = 'push',                  // 推送通知
}

/** 通知类型 */
export enum NotificationType {
  // 系统通知
  SYSTEM = 'system',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  
  // 系统公告
  ANNOUNCEMENT = 'announcement',      // 普通公告
  FEATURE_UPDATE = 'feature_update',  // 功能更新
  IMPORTANT_NOTICE = 'important_notice', // 重要通知
  SCHEDULED_MAINTENANCE = 'scheduled_maintenance', // 计划维护

  // 书签相关
  BOOKMARK_SHARED = 'bookmark_shared',
  BOOKMARK_IMPORT_COMPLETE = 'bookmark_import_complete',
  BOOKMARK_EXPORT_COMPLETE = 'bookmark_export_complete',

  // 文件快传
  FILE_TRANSFER_COMPLETE = 'file_transfer_complete',
  FILE_DOWNLOAD_COMPLETE = 'file_download_complete',
  FILE_EXPIRING = 'file_expiring',

  // WebDAV同步
  SYNC_SUCCESS = 'sync_success',
  SYNC_FAILED = 'sync_failed',
  SYNC_CONFLICT = 'sync_conflict',

  // 安全告警
  LOGIN_ALERT = 'login_alert',
  PASSWORD_CHANGE = 'password_change',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',

  // 健康检查
  LINK_BROKEN = 'link_broken',
  LINK_HEALED = 'link_healed',
}

/** 通知优先级 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/** 通知消息 */
export interface NotificationMessage {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  priority: NotificationPriority
  channels: NotificationChannel[]
  data?: Record<string, any>
  read: boolean
  readAt?: string
  createdAt: string
}

/** 通知配置 */
export interface NotificationConfig {
  id: string
  userId: string
  channel: NotificationChannel
  enabled: boolean
  config: Record<string, any>
  createdAt: string
  updatedAt: string
}

/** 邮件配置 */
export interface EmailConfig {
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  fromName: string
  fromEmail: string
}

/** Webhook配置 */
export interface WebhookConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT'
  headers: Record<string, string>
  timeout: number
}

/** 飞书配置 */
export interface FeishuConfig {
  webhookUrl: string
  secret?: string
  appId?: string
  appSecret?: string
}

/** 钉钉配置 */
export interface DingTalkConfig {
  webhookUrl: string
  secret?: string
}

/** 企业微信配置 */
export interface WeChatConfig {
  webhookUrl: string
}

/** 推送配置 */
export interface PushConfig {
  endpoint: string
  p256dh: string
  auth: string
}

/** 通知模板 */
export interface NotificationTemplate {
  id: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  content: string
  variables: string[]
  createdAt: string
  updatedAt: string
}

/** 发送结果 */
export interface SendResult {
  success: boolean
  channel: NotificationChannel
  messageId?: string
  error?: string
  sentAt: string
}

/** 通知统计 */
export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
}

/** 订阅设置 */
export interface SubscriptionSettings {
  userId: string
  subscriptions: {
    type: NotificationType
    channels: NotificationChannel[]
    enabled: boolean
  }[]
}
