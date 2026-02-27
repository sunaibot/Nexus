/**
 * 错误监控与告警系统
 * 第三阶段 - 系统稳定性核心组件
 * 
 * 功能特性：
 * 1. 全局错误捕获 - 自动捕获未处理异常
 * 2. 错误分类统计 - 按类型和组件统计
 * 3. 实时告警 - 错误率超过阈值时告警
 * 4. 上下文信息 - 记录详细的错误上下文
 */

import { logger } from './logger.js'

// ========== 类型定义 ==========

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, any>
}

interface ErrorRecord {
  id: string
  timestamp: number
  error: Error
  context?: ErrorContext
  type: string
  message: string
  stack?: string
}

interface ErrorStats {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByComponent: Record<string, number>
  recentErrors: ErrorRecord[]
  errorRate: number  // 错误率（每分钟）
}

interface AlertConfig {
  errorRateThreshold: number      // 错误率阈值（每分钟）
  consecutiveErrorsThreshold: number  // 连续错误阈值
  alertCooldown: number           // 告警冷却时间（毫秒）
  onAlert?: (alert: AlertInfo) => void  // 告警回调
}

interface AlertInfo {
  type: 'ERROR_RATE' | 'CONSECUTIVE_ERRORS'
  message: string
  timestamp: number
  details: Record<string, any>
}

// ========== 错误监控器 ==========

class ErrorMonitor {
  private errors: ErrorRecord[] = []
  private maxErrors = 1000  // 最大保留错误数
  private stats: ErrorStats = {
    totalErrors: 0,
    errorsByType: {},
    errorsByComponent: {},
    recentErrors: [],
    errorRate: 0
  }
  private alertConfig: AlertConfig
  private lastAlertTime = 0
  private consecutiveErrors = 0
  private errorRateWindow: number[] = []  // 错误率计算窗口

  constructor(config: Partial<AlertConfig> = {}) {
    this.alertConfig = {
      errorRateThreshold: 10,      // 每分钟10个错误
      consecutiveErrorsThreshold: 5,  // 连续5个错误
      alertCooldown: 300000,       // 5分钟冷却
      ...config
    }

    // 启动错误率计算
    this.startErrorRateCalculation()
  }

  /**
   * 捕获异常
   */
  captureException(error: Error, context?: ErrorContext): void {
    const record: ErrorRecord = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      error,
      context,
      type: error.name || 'Error',
      message: error.message,
      stack: error.stack
    }

    // 添加到错误列表
    this.errors.push(record)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // 更新统计
    this.updateStats(record)

    // 检查告警
    this.checkAlerts(record)

    // 记录日志
    logger.error('[ErrorMonitor] 捕获到异常', error, {
      component: context?.component,
      action: context?.action,
      userId: context?.userId,
      ...context?.metadata
    })
  }

  /**
   * 捕获消息（非异常）
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (level === 'error') {
      const error = new Error(message)
      this.captureException(error, context)
      return
    }

    if (level === 'warning') {
      logger.warn(`[ErrorMonitor] ${message}`, {
        component: context?.component,
        action: context?.action,
        ...context?.metadata
      })
    } else {
      logger.info(`[ErrorMonitor] ${message}`, {
        component: context?.component,
        action: context?.action,
        ...context?.metadata
      })
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): ErrorStats {
    // 更新最近错误列表
    const oneHourAgo = Date.now() - 3600000
    this.stats.recentErrors = this.errors
      .filter(e => e.timestamp > oneHourAgo)
      .slice(-100)

    return { ...this.stats }
  }

  /**
   * 获取错误详情
   */
  getErrorDetails(errorId: string): ErrorRecord | undefined {
    return this.errors.find(e => e.id === errorId)
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(limit = 10): ErrorRecord[] {
    return this.errors.slice(-limit).reverse()
  }

  /**
   * 按类型获取错误
   */
  getErrorsByType(type: string): ErrorRecord[] {
    return this.errors.filter(e => e.type === type)
  }

  /**
   * 按组件获取错误
   */
  getErrorsByComponent(component: string): ErrorRecord[] {
    return this.errors.filter(e => e.context?.component === component)
  }

  /**
   * 清除所有错误
   */
  clearErrors(): void {
    this.errors = []
    this.stats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByComponent: {},
      recentErrors: [],
      errorRate: 0
    }
    this.consecutiveErrors = 0
    this.errorRateWindow = []
    logger.info('[ErrorMonitor] 错误记录已清除')
  }

  /**
   * 更新统计
   */
  private updateStats(record: ErrorRecord): void {
    this.stats.totalErrors++

    // 按类型统计
    this.stats.errorsByType[record.type] = (this.stats.errorsByType[record.type] || 0) + 1

    // 按组件统计
    if (record.context?.component) {
      const component = record.context.component
      this.stats.errorsByComponent[component] = (this.stats.errorsByComponent[component] || 0) + 1
    }

    // 添加到错误率窗口
    this.errorRateWindow.push(record.timestamp)
  }

  /**
   * 检查告警
   */
  private checkAlerts(record: ErrorRecord): void {
    const now = Date.now()

    // 检查冷却时间
    if (now - this.lastAlertTime < this.alertConfig.alertCooldown) {
      return
    }

    // 更新连续错误计数
    this.consecutiveErrors++

    // 检查连续错误阈值
    if (this.consecutiveErrors >= this.alertConfig.consecutiveErrorsThreshold) {
      this.triggerAlert({
        type: 'CONSECUTIVE_ERRORS',
        message: `检测到连续 ${this.consecutiveErrors} 个错误`,
        timestamp: now,
        details: {
          count: this.consecutiveErrors,
          lastError: record.message,
          component: record.context?.component
        }
      })
      return
    }

    // 检查错误率阈值
    if (this.stats.errorRate >= this.alertConfig.errorRateThreshold) {
      this.triggerAlert({
        type: 'ERROR_RATE',
        message: `错误率超过阈值: ${this.stats.errorRate.toFixed(2)} 错误/分钟`,
        timestamp: now,
        details: {
          rate: this.stats.errorRate,
          threshold: this.alertConfig.errorRateThreshold,
          recentErrors: this.stats.recentErrors.slice(-5).map(e => e.message)
        }
      })
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(alert: AlertInfo): void {
    this.lastAlertTime = Date.now()
    this.consecutiveErrors = 0

    logger.error('[ErrorMonitor] 触发告警', new Error(alert.message), {
      type: alert.type,
      ...alert.details
    })

    // 调用告警回调
    if (this.alertConfig.onAlert) {
      try {
        this.alertConfig.onAlert(alert)
      } catch (error) {
        logger.error('[ErrorMonitor] 告警回调执行失败', error as Error)
      }
    }
  }

  /**
   * 启动错误率计算
   */
  private startErrorRateCalculation(): void {
    // 每分钟计算一次错误率
    setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000
      
      // 清理窗口中的过期错误
      this.errorRateWindow = this.errorRateWindow.filter(t => t > oneMinuteAgo)
      
      // 计算错误率
      this.stats.errorRate = this.errorRateWindow.length

      // 如果没有错误，重置连续错误计数
      if (this.errorRateWindow.length === 0) {
        this.consecutiveErrors = 0
      }
    }, 60000)
  }
}

// ========== 错误报告器 ==========

class ErrorReporter {
  private reporters: Array<(error: ErrorRecord) => void> = []

  /**
   * 添加报告处理器
   */
  addReporter(reporter: (error: ErrorRecord) => void): void {
    this.reporters.push(reporter)
  }

  /**
   * 移除报告处理器
   */
  removeReporter(reporter: (error: ErrorRecord) => void): void {
    const index = this.reporters.indexOf(reporter)
    if (index > -1) {
      this.reporters.splice(index, 1)
    }
  }

  /**
   * 报告错误
   */
  report(error: ErrorRecord): void {
    for (const reporter of this.reporters) {
      try {
        reporter(error)
      } catch (e) {
        logger.error('[ErrorReporter] 报告处理器执行失败', e as Error)
      }
    }
  }

  /**
   * 创建控制台报告器
   */
  createConsoleReporter(): (error: ErrorRecord) => void {
    return (error: ErrorRecord) => {
      console.error('[ErrorReport]', {
        id: error.id,
        type: error.type,
        message: error.message,
        component: error.context?.component,
        timestamp: new Date(error.timestamp).toISOString()
      })
    }
  }

  /**
   * 创建文件报告器
   */
  createFileReporter(filePath: string): (error: ErrorRecord) => void {
    const fs = require('fs')
    const path = require('path')

    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    return (error: ErrorRecord) => {
      const line = JSON.stringify({
        id: error.id,
        timestamp: error.timestamp,
        type: error.type,
        message: error.message,
        component: error.context?.component,
        stack: error.stack
      }) + '\n'

      fs.appendFileSync(filePath, line)
    }
  }
}

// ========== 全局实例 ==========

export const errorMonitor = new ErrorMonitor()
export const errorReporter = new ErrorReporter()

// ========== 辅助函数 ==========

/**
 * 设置全局错误处理
 */
export function setupGlobalErrorHandling(): void {
  // 捕获未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    errorMonitor.captureException(error, {
      component: 'Process',
      action: 'unhandledRejection'
    })
    logger.error('[Process] 未处理的Promise拒绝', error)
  })

  // 捕获未捕获的异常
  process.on('uncaughtException', (error) => {
    errorMonitor.captureException(error, {
      component: 'Process',
      action: 'uncaughtException'
    })
    logger.error('[Process] 未捕获的异常', error)
    
    // 给监控一些时间记录错误，然后退出
    setTimeout(() => {
      process.exit(1)
    }, 1000)
  })

  // 添加控制台报告器
  errorReporter.addReporter(errorReporter.createConsoleReporter())

  logger.info('[ErrorMonitor] 全局错误处理已设置')
}

/**
 * 包装异步函数，自动捕获错误
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      errorMonitor.captureException(error as Error, context)
      throw error
    }
  }) as T
}

/**
 * 创建组件级别的错误边界
 */
export function createErrorBoundary(componentName: string) {
  return {
    capture: (error: Error, action?: string, metadata?: Record<string, any>) => {
      errorMonitor.captureException(error, {
        component: componentName,
        action,
        metadata
      })
    },
    captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info', metadata?: Record<string, any>) => {
      errorMonitor.captureMessage(message, level, {
        component: componentName,
        metadata
      })
    }
  }
}

/**
 * 获取健康状态
 */
export function getHealthStatus(): {
  healthy: boolean
  errorRate: number
  recentErrors: number
  recommendations: string[]
} {
  const stats = errorMonitor.getStats()
  const recommendations: string[] = []

  // 检查错误率
  if (stats.errorRate > 10) {
    recommendations.push('错误率过高，建议检查系统负载')
  }

  // 检查特定类型的错误
  for (const [type, count] of Object.entries(stats.errorsByType)) {
    if (count > 50) {
      recommendations.push(`${type} 类型错误较多 (${count}次)，建议重点关注`)
    }
  }

  // 检查特定组件的错误
  for (const [component, count] of Object.entries(stats.errorsByComponent)) {
    if (count > 30) {
      recommendations.push(`${component} 组件错误较多 (${count}次)，建议检查该组件`)
    }
  }

  return {
    healthy: stats.errorRate < 5 && recommendations.length === 0,
    errorRate: stats.errorRate,
    recentErrors: stats.recentErrors.length,
    recommendations
  }
}
