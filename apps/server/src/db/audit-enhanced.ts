/**
 * 增强版审计日志系统
 * 阶段1优化：补全审计维度，修复痛点
 */

import { getDatabase, generateId, saveDatabase } from './core.js'
import { run } from '../utils/index.js'

// ========== 审计动作类型定义 ==========

/** 用户认证相关动作 */
export const AUTH_ACTIONS = {
  LOGIN: 'LOGIN',                    // 登录
  LOGIN_FAILED: 'LOGIN_FAILED',      // 登录失败
  LOGOUT: 'LOGOUT',                  // 登出
  PASSWORD_CHANGE: 'PASSWORD_CHANGE', // 修改密码
  TOKEN_REFRESH: 'TOKEN_REFRESH',    // 刷新令牌
} as const

/** 书签操作相关动作 - 只记录重要操作，不记录高频点击 */
export const BOOKMARK_ACTIONS = {
  CREATE: 'BOOKMARK_CREATE',         // 创建书签
  UPDATE: 'BOOKMARK_UPDATE',         // 更新书签
  DELETE: 'BOOKMARK_DELETE',         // 删除书签
  PIN: 'BOOKMARK_PIN',               // 置顶书签
  UNPIN: 'BOOKMARK_UNPIN',           // 取消置顶
  EXPORT: 'BOOKMARK_EXPORT',         // 导出书签
  IMPORT: 'BOOKMARK_IMPORT',         // 导入书签
  // 注意：VIEW 和 CLICK 不记录到审计日志，避免数据膨胀
  // 点击统计使用单独的轻量级表或Redis
} as const

/** 快传操作相关动作 */
export const FILE_TRANSFER_ACTIONS = {
  UPLOAD: 'FILE_UPLOAD',             // 上传文件
  DOWNLOAD: 'FILE_DOWNLOAD',         // 下载文件
  DELETE: 'FILE_DELETE',             // 删除文件
  SHARE: 'FILE_SHARE',               // 分享文件
} as const

/** 设置变更相关动作 */
export const SETTINGS_ACTIONS = {
  UPDATE: 'SETTINGS_UPDATE',         // 更新设置
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',    // 系统设置更新
} as const

/** 安全告警相关动作 */
export const SECURITY_ACTIONS = {
  ABNORMAL_LOGIN: 'ABNORMAL_LOGIN',           // 异常登录
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT', // 暴力破解尝试
  MASS_DELETE: 'MASS_DELETE',                 // 批量删除
  DATA_EXPORT: 'DATA_EXPORT',                 // 数据导出
  SENSITIVE_ACCESS: 'SENSITIVE_ACCESS',       // 敏感操作
} as const

/** 系统错误相关动作 */
export const SYSTEM_ERROR_ACTIONS = {
  API_ERROR: 'API_ERROR',                     // API 错误
  DATABASE_ERROR: 'DATABASE_ERROR',           // 数据库错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',           // 内部错误
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR', // 外部服务错误
} as const

// 合并所有动作类型
export const AUDIT_ACTIONS = {
  ...AUTH_ACTIONS,
  ...BOOKMARK_ACTIONS,
  ...FILE_TRANSFER_ACTIONS,
  ...SETTINGS_ACTIONS,
  ...SECURITY_ACTIONS,
  ...SYSTEM_ERROR_ACTIONS,
} as const

// ========== 类型定义 ==========

/** 审计日志选项 */
export interface LogAuditOptions {
  userId: string | null
  username: string | null
  action: string
  resourceType?: string
  resourceId?: string
  details?: any
  ip?: string
  userAgent?: string
  sessionId?: string          // 会话ID
  deviceInfo?: {              // 设备信息
    browser?: string
    os?: string
    device?: string
  }
  riskLevel?: 'low' | 'medium' | 'high'  // 风险等级
}

/** 审计日志记录 */
export interface AuditLog {
  id: string
  userId: string | null
  username: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  details: any
  ip: string | null
  userAgent: string | null
  sessionId: string | null
  deviceInfo: any
  riskLevel: string
  createdAt: string
}

/** 查询选项 */
export interface QueryAuditOptions {
  limit?: number
  offset?: number
  userId?: string
  username?: string
  action?: string
  actionType?: 'auth' | 'bookmark' | 'file' | 'settings' | 'security'
  startDate?: string
  endDate?: string
  riskLevel?: 'low' | 'medium' | 'high'
  ip?: string
}

/** 统计选项 */
export interface StatsOptions {
  startDate?: string
  endDate?: string
  userId?: string
}

// ========== 核心函数 ==========

/**
 * 记录审计日志（增强版）- 优化版
 * 性能优先：异步写入、批量处理、自动清理
 * @param options 审计选项
 */
export function logAudit(options: LogAuditOptions) {
  // 异步写入，不阻塞主流程
  const executeLog = () => {
    try {
      // 在回调内部重新获取数据库连接
      const db = getDatabase()
      if (!db) {
        console.error('[Audit] Database not available')
        return
      }

      const id = generateId()
      const detailsStr = options.details ? JSON.stringify(options.details) : null
      const deviceInfoStr = options.deviceInfo ? JSON.stringify(options.deviceInfo) : null
      const now = new Date().toISOString()

      // 检查是否需要添加风险标记
      const riskLevel = options.riskLevel || assessRiskLevel(options)

      db.run(
        `INSERT INTO audit_logs (
          id, userId, username, action, resourceType, resourceId, 
          details, ip, userAgent, sessionId, deviceInfo, riskLevel, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          options.userId ?? null,
          options.username ?? null,
          options.action,
          options.resourceType ?? null,
          options.resourceId ?? null,
          detailsStr,
          options.ip ?? null,
          options.userAgent ?? null,
          options.sessionId ?? null,
          deviceInfoStr,
          riskLevel,
          now
        ]
      )

      // 保存数据库
      saveDatabase()
      console.log(`[Audit] Logged: ${options.action} by ${options.username || 'anonymous'}`)

      // 如果是高风险操作，触发告警（也异步）
      if (riskLevel === 'high') {
        setImmediate(() => triggerSecurityAlert(options))
      }

      // 每100条记录检查一次是否需要清理（概率触发）
      if (Math.random() < 0.01) {
        setImmediate(() => cleanupOldAuditLogs())
      }
    } catch (e) {
      // 审计日志写入失败不应影响主流程
      console.error('审计日志写入失败:', e)
    }
  }

  // 使用 setImmediate 或 setTimeout 异步执行
  if (typeof setImmediate !== 'undefined') {
    setImmediate(executeLog)
  } else {
    setTimeout(executeLog, 0)
  }
}

/**
 * 清理过期审计日志（保留7天热数据）
 * 性能优化：只删除，不立即VACUUM
 */
function cleanupOldAuditLogs() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // 只保留7天内的详细日志
    const result = run(
      'DELETE FROM audit_logs WHERE createdAt < ? AND riskLevel = ?',
      [sevenDaysAgo, 'low']
    )

    if (result.changes > 0) {
      console.log(`[审计清理] 已删除 ${result.changes} 条过期日志`)
    }
  } catch (e) {
    console.error('审计日志清理失败:', e)
  }
}

/**
 * 评估风险等级
 * @param options 审计选项
 * @returns 风险等级
 */
function assessRiskLevel(options: LogAuditOptions): 'low' | 'medium' | 'high' {
  // 登录失败次数过多
  if (options.action === AUTH_ACTIONS.LOGIN_FAILED) {
    const recentFailures = getRecentLoginFailures(options.ip || '', 10)
    if (recentFailures >= 5) return 'high'
    if (recentFailures >= 3) return 'medium'
  }

  // 异常IP登录
  if (options.action === AUTH_ACTIONS.LOGIN) {
    if (isAbnormalIp(options.ip || '', options.userId || '')) {
      return 'medium'
    }
  }

  // 批量删除
  if (options.action === BOOKMARK_ACTIONS.DELETE && options.details?.count > 10) {
    return 'high'
  }

  // 数据导出
  if (options.action === BOOKMARK_ACTIONS.EXPORT) {
    return 'medium'
  }

  // 敏感操作
  if (Object.values(SECURITY_ACTIONS).includes(options.action as any)) {
    return 'high'
  }

  // 系统错误默认为高风险
  if (Object.values(SYSTEM_ERROR_ACTIONS).includes(options.action as any)) {
    return 'high'
  }

  return 'low'
}

/**
 * 记录系统错误日志
 * 用于记录 API 500 错误、数据库错误等系统级错误
 * @param error 错误对象
 * @param context 错误上下文信息
 */
export function logSystemError(
  error: Error,
  context: {
    action: string
    path?: string
    method?: string
    userId?: string | null
    username?: string | null
    ip?: string
    userAgent?: string
    details?: any
  }
) {
  logAudit({
    userId: context.userId || null,
    username: context.username || null,
    action: context.action,
    resourceType: 'system',
    resourceId: context.path,
    details: {
      ...context.details,
      errorMessage: error.message,
      errorStack: error.stack,
      method: context.method,
      path: context.path,
    },
    ip: context.ip,
    userAgent: context.userAgent,
    riskLevel: 'high',
  })
}

/**
 * 获取最近的登录失败次数
 * @param ip IP地址
 * @param minutes 时间范围（分钟）
 * @returns 失败次数
 */
function getRecentLoginFailures(ip: string, minutes: number): number {
  const db = getDatabase()
  if (!db) return 0

  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString()

  const result = db.exec(
    `SELECT COUNT(*) as count FROM audit_logs 
     WHERE action = ? AND ip = ? AND createdAt > ?`,
    [AUTH_ACTIONS.LOGIN_FAILED, ip, since]
  )

  return result[0]?.values[0]?.[0] as number || 0
}

/**
 * 检查是否为异常IP
 * @param ip IP地址
 * @param userId 用户ID
 * @returns 是否异常
 */
function isAbnormalIp(ip: string, userId: string): boolean {
  const db = getDatabase()
  if (!db) return false

  // 获取用户最近使用的IP列表
  const result = db.exec(
    `SELECT DISTINCT ip FROM audit_logs 
     WHERE userId = ? AND action = ? AND createdAt > datetime('now', '-7 days')
     ORDER BY createdAt DESC LIMIT 10`,
    [userId, AUTH_ACTIONS.LOGIN]
  )

  if (result.length === 0 || result[0].values.length === 0) {
    return false // 新用户，不算异常
  }

  const knownIps = result[0].values.map((row: any[]) => row[0] as string)
  return !knownIps.includes(ip)
}

/**
 * 触发安全告警
 * @param options 审计选项
 */
async function triggerSecurityAlert(options: LogAuditOptions) {
  console.warn(`[安全告警] ${options.action} - 用户: ${options.username}, IP: ${options.ip}, 时间: ${new Date().toISOString()}`)
  
  // 发送通知给管理员
  try {
    const { NotificationService } = await import('../features/notification/service.js')
    const notificationService = NotificationService.getInstance()
    
    // 获取管理员列表
    const { getDatabase } = await import('./core.js')
    const db = getDatabase()
    if (!db) return
    
    const result = db.exec("SELECT id FROM users WHERE role = 'admin'")
    if (result.length === 0 || result[0].values.length === 0) return
    
    const adminIds = result[0].values.map((row: any[]) => row[0] as string)
    
    // 给每个管理员发送通知
    for (const adminId of adminIds) {
      await notificationService.createNotification({
        userId: adminId,
        type: 'SECURITY' as any,
        title: '安全告警',
        content: `检测到安全事件: ${options.action}\n用户: ${options.username}\nIP: ${options.ip}\n时间: ${new Date().toLocaleString()}`,
        priority: 'HIGH' as any,
        data: {
          action: options.action,
          username: options.username,
          ip: options.ip,
          userAgent: options.userAgent,
          details: options.details
        }
      })
    }
  } catch (error) {
    console.error('发送安全告警通知失败:', error)
  }
}

/**
 * 查询审计日志（增强版）
 * @param options 查询选项
 * @returns 审计日志列表
 */
export function queryAuditLogs(options: QueryAuditOptions = {}): {
  logs: AuditLog[]
  total: number
} {
  const db = getDatabase()
  if (!db) return { logs: [], total: 0 }

  const {
    limit = 100,
    offset = 0,
    userId,
    username,
    action,
    actionType,
    startDate,
    endDate,
    riskLevel,
    ip
  } = options

  let query = 'SELECT * FROM audit_logs WHERE 1=1'
  let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1'
  const params: any[] = []

  // 构建查询条件
  if (userId) {
    query += ' AND userId = ?'
    countQuery += ' AND userId = ?'
    params.push(userId)
  }

  if (username) {
    query += ' AND username = ?'
    countQuery += ' AND username = ?'
    params.push(username)
  }

  if (action) {
    query += ' AND action = ?'
    countQuery += ' AND action = ?'
    params.push(action)
  }

  if (actionType) {
    const actions = getActionsByType(actionType)
    query += ` AND action IN (${actions.map(() => '?').join(',')})`
    countQuery += ` AND action IN (${actions.map(() => '?').join(',')})`
    params.push(...actions)
  }

  if (startDate) {
    query += ' AND createdAt >= ?'
    countQuery += ' AND createdAt >= ?'
    params.push(startDate)
  }

  if (endDate) {
    query += ' AND createdAt <= ?'
    countQuery += ' AND createdAt <= ?'
    params.push(endDate)
  }

  if (riskLevel) {
    query += ' AND riskLevel = ?'
    countQuery += ' AND riskLevel = ?'
    params.push(riskLevel)
  }

  if (ip) {
    query += ' AND ip = ?'
    countQuery += ' AND ip = ?'
    params.push(ip)
  }

  // 执行计数查询
  const countResult = db.exec(countQuery, params)
  const total = countResult[0]?.values[0]?.[0] as number || 0

  // 执行数据查询
  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?'
  const queryParams = [...params, limit, offset]

  const result = db.exec(query, queryParams)

  if (result.length === 0) {
    return { logs: [], total }
  }

  const logs: AuditLog[] = result[0].values.map((row: any[]) => ({
    id: row[0],
    userId: row[1],
    username: row[2],
    action: row[3],
    resourceType: row[4],
    resourceId: row[5],
    details: row[6] ? JSON.parse(row[6]) : null,
    ip: row[7],
    userAgent: row[8],
    sessionId: row[9],
    deviceInfo: row[10] ? JSON.parse(row[10]) : null,
    riskLevel: row[11] || 'low',
    createdAt: row[12]
  }))

  return { logs, total }
}

/**
 * 根据类型获取动作列表
 * @param type 动作类型
 * @returns 动作列表
 */
function getActionsByType(type: string): string[] {
  switch (type) {
    case 'auth':
      return Object.values(AUTH_ACTIONS)
    case 'bookmark':
      return Object.values(BOOKMARK_ACTIONS)
    case 'file':
      return Object.values(FILE_TRANSFER_ACTIONS)
    case 'settings':
      return Object.values(SETTINGS_ACTIONS)
    case 'security':
      return Object.values(SECURITY_ACTIONS)
    default:
      return []
  }
}

/**
 * 获取审计统计（用于管理员看板）
 * @param options 统计选项
 * @returns 统计数据
 */
export function getAuditStats(options: StatsOptions = {}) {
  const db = getDatabase()
  if (!db) return null

  const { startDate, endDate, userId } = options

  // 构建时间范围条件
  let timeCondition = ''
  const params: any[] = []

  if (startDate && endDate) {
    timeCondition = 'AND createdAt BETWEEN ? AND ?'
    params.push(startDate, endDate)
  } else if (startDate) {
    timeCondition = 'AND createdAt >= ?'
    params.push(startDate)
  } else if (endDate) {
    timeCondition = 'AND createdAt <= ?'
    params.push(endDate)
  }

  if (userId) {
    timeCondition += ' AND userId = ?'
    params.push(userId)
  }

  // 活跃用户排行（本周）- 使用CREATE/UPDATE/DELETE等操作统计，不统计高频点击
  const activeUsersQuery = `
    SELECT username, COUNT(*) as actionCount
    FROM audit_logs
    WHERE action IN (?, ?, ?, ?) ${timeCondition}
    GROUP BY userId, username
    ORDER BY actionCount DESC
    LIMIT 10
  `
  const activeUsersResult = db.exec(activeUsersQuery, [
    BOOKMARK_ACTIONS.CREATE,
    BOOKMARK_ACTIONS.UPDATE,
    BOOKMARK_ACTIONS.DELETE,
    FILE_TRANSFER_ACTIONS.UPLOAD,
    ...params
  ])

  // 热门应用排行 - 不再从审计日志统计点击（已移除CLICK记录）
  // 如需统计，请使用专门的点击统计表
  const hotBookmarksResult = { 0: { values: [] as any[] } }

  // 访问时段分布
  const hourlyDistributionQuery = `
    SELECT 
      strftime('%H', createdAt) as hour,
      COUNT(*) as count
    FROM audit_logs
    WHERE 1=1 ${timeCondition}
    GROUP BY hour
    ORDER BY hour
  `
  const hourlyDistributionResult = db.exec(hourlyDistributionQuery, params)

  // 操作类型分布
  const actionDistributionQuery = `
    SELECT 
      CASE 
        WHEN action IN (${Object.values(AUTH_ACTIONS).map(() => '?').join(',')}) THEN '认证'
        WHEN action IN (${Object.values(BOOKMARK_ACTIONS).map(() => '?').join(',')}) THEN '书签'
        WHEN action IN (${Object.values(FILE_TRANSFER_ACTIONS).map(() => '?').join(',')}) THEN '快传'
        WHEN action IN (${Object.values(SETTINGS_ACTIONS).map(() => '?').join(',')}) THEN '设置'
        ELSE '其他'
      END as category,
      COUNT(*) as count
    FROM audit_logs
    WHERE 1=1 ${timeCondition}
    GROUP BY category
  `
  const actionDistributionResult = db.exec(
    actionDistributionQuery,
    [
      ...Object.values(AUTH_ACTIONS),
      ...Object.values(BOOKMARK_ACTIONS),
      ...Object.values(FILE_TRANSFER_ACTIONS),
      ...Object.values(SETTINGS_ACTIONS),
      ...params
    ]
  )

  // 风险事件统计
  const riskStatsQuery = `
    SELECT riskLevel, COUNT(*) as count
    FROM audit_logs
    WHERE riskLevel != 'low' ${timeCondition}
    GROUP BY riskLevel
  `
  const riskStatsResult = db.exec(riskStatsQuery, params)

  // 基础统计 - 总日志数
  const totalQuery = `
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE 1=1 ${timeCondition}
  `
  const totalResult = db.exec(totalQuery, params)

  // 今日日志数
  const today = new Date().toISOString().split('T')[0]
  const todayQuery = `
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE date(createdAt) = date(?)
  `
  const todayResult = db.exec(todayQuery, [today])

  // 成功/失败操作统计
  const successQuery = `
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE riskLevel = 'low' ${timeCondition}
  `
  const successResult = db.exec(successQuery, params)

  const failureQuery = `
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE riskLevel IN ('medium', 'high') ${timeCondition}
  `
  const failureResult = db.exec(failureQuery, params)

  return {
    // 基础统计数据（前端卡片展示）
    total: totalResult[0]?.values[0]?.[0] || 0,
    today: todayResult[0]?.values[0]?.[0] || 0,
    success: successResult[0]?.values[0]?.[0] || 0,
    failure: failureResult[0]?.values[0]?.[0] || 0,
    // 详细统计数据
    activeUsers: activeUsersResult[0]?.values.map((row: any[]) => ({
      username: row[0],
      actionCount: row[1]
    })) || [],
    hotBookmarks: hotBookmarksResult[0]?.values.map((row: any[]) => ({
      bookmarkId: row[0],
      title: row[1],
      clickCount: row[2]
    })) || [],
    hourlyDistribution: hourlyDistributionResult[0]?.values.map((row: any[]) => ({
      hour: row[0],
      count: row[1]
    })) || [],
    actionDistribution: actionDistributionResult[0]?.values.map((row: any[]) => ({
      category: row[0],
      count: row[1]
    })) || [],
    riskStats: riskStatsResult[0]?.values.map((row: any[]) => ({
      riskLevel: row[0],
      count: row[1]
    })) || []
  }
}

/**
 * 获取登录统计
 * @param days 天数
 * @returns 登录统计数据
 */
export function getLoginStats(days: number = 7) {
  const db = getDatabase()
  if (!db) return null

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // 每日登录统计
  const dailyQuery = `
    SELECT 
      date(createdAt) as date,
      COUNT(DISTINCT userId) as uniqueUsers,
      COUNT(*) as totalLogins,
      SUM(CASE WHEN action = ? THEN 1 ELSE 0 END) as failedLogins
    FROM audit_logs
    WHERE action IN (?, ?) AND createdAt > ?
    GROUP BY date(createdAt)
    ORDER BY date DESC
  `
  const dailyResult = db.exec(dailyQuery, [
    AUTH_ACTIONS.LOGIN_FAILED,
    AUTH_ACTIONS.LOGIN,
    AUTH_ACTIONS.LOGIN_FAILED,
    since
  ])

  // IP分布统计
  const ipQuery = `
    SELECT ip, COUNT(*) as count
    FROM audit_logs
    WHERE action = ? AND createdAt > ?
    GROUP BY ip
    ORDER BY count DESC
    LIMIT 20
  `
  const ipResult = db.exec(ipQuery, [AUTH_ACTIONS.LOGIN, since])

  return {
    daily: dailyResult[0]?.values.map((row: any[]) => ({
      date: row[0],
      uniqueUsers: row[1],
      totalLogins: row[2],
      failedLogins: row[3]
    })) || [],
    ipDistribution: ipResult[0]?.values.map((row: any[]) => ({
      ip: row[0],
      count: row[1]
    })) || []
  }
}
