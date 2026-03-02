import { getNotificationConfig, createNotificationHistory } from '../db/index.js'
import { getNotificationConfig as getDynamicNotificationConfig } from '../core/config/index.js'

interface FeishuMessage {
  msg_type: 'text' | 'post' | 'card' | 'interactive'
  content?: any
  card?: any
}

interface SendNotificationOptions {
  title: string
  content?: string
  level?: 'info' | 'warning' | 'error' | 'success'
  type?: string
}

let lastNotificationTime: { [key: string]: number } = {}

function getNotificationCooldownMs(): number {
  const config = getDynamicNotificationConfig()
  return config.cooldownMinutes * 60 * 1000
}

export async function sendFeishuNotification(webhookUrl: string, message: FeishuMessage) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('❌ 发送飞书通知失败:', error)
    throw error
  }
}

export function createFeishuTextMessage(text: string): FeishuMessage {
  return {
    msg_type: 'text',
    content: {
      text: text,
    },
  }
}

export function createFeishuCardMessage(options: SendNotificationOptions): FeishuMessage {
  const { title, content, level = 'info' } = options

  const colors: Record<string, string> = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
    success: 'green',
  }

  const color = colors[level] || colors.info

  const card = {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        content: title,
        tag: 'plain_text',
      },
      template: color,
    },
    elements: content
      ? [
          {
            tag: 'div',
            text: {
              content: content,
              tag: 'lark_md',
            },
          },
        ]
      : [],
  }

  return {
    msg_type: 'interactive',
    card: card,
  }
}

export async function sendNotification(options: SendNotificationOptions): Promise<boolean> {
  try {
    const config = getNotificationConfig()
    if (!config || !config.isEnabled || !config.webhookUrl) {
      return false
    }

    const cooldownKey = `${options.type || 'general'}-${options.level || 'info'}`
    const now = Date.now()
    const cooldownMs = getNotificationCooldownMs()
    if (lastNotificationTime[cooldownKey] && now - lastNotificationTime[cooldownKey] < cooldownMs) {
      console.log(`⏳ 通知冷却中，跳过发送: ${options.title}`)
      return false
    }

    const message = createFeishuCardMessage(options)
    const result = await sendFeishuNotification(config.webhookUrl, message)

    lastNotificationTime[cooldownKey] = now

    createNotificationHistory({
      configId: config.id,
      type: options.type || 'general',
      title: options.title,
      content: options.content || '',
      level: options.level || 'info',
    })

    console.log(`✅ 通知发送成功: ${options.title}`)
    return true
  } catch (error) {
    console.error('❌ 发送通知失败:', error)
    createNotificationHistory({
      configId: null,
      type: options.type || 'general',
      title: options.title,
      content: options.content || '',
      level: options.level || 'info',
    })
    return false
  }
}

export function clearNotificationCooldown() {
  lastNotificationTime = {}
}
