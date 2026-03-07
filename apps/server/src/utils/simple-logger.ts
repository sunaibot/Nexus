/**
 * 简化版日志工具
 * 用于替代 console，支持环境变量控制
 * 
 * 环境变量:
 * - LOG_LEVEL: debug | info | warn | error (默认: info)
 * - LOG_ENABLED: true | false (默认: true)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
}

// 从环境变量获取配置
const getConfig = () => {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel
  const enabled = process.env.LOG_ENABLED !== 'false'
  
  return {
    level: LOG_LEVELS[envLevel] ?? LOG_LEVELS.info,
    enabled,
    isDev: process.env.NODE_ENV !== 'production'
  }
}

let config = getConfig()

/**
 * 更新日志配置
 */
export function setLogLevel(level: LogLevel): void {
  config.level = LOG_LEVELS[level] ?? LOG_LEVELS.info
}

export function setLogEnabled(enabled: boolean): void {
  config.enabled = enabled
}

/**
 * 格式化消息
 */
function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  
  if (args.length > 0) {
    return `${prefix} ${message} ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')}`
  }
  
  return `${prefix} ${message}`
}

/**
 * 检查是否应该记录该级别
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false
  return LOG_LEVELS[level] >= config.level
}

/**
 * 日志对象
 */
export const log = {
  /**
   * 调试日志 - 仅在开发环境显示
   */
  debug(message: string, ...args: any[]): void {
    if (!shouldLog('debug')) return
    if (config.isDev) {
      console.debug(formatMessage('debug', message, ...args))
    }
  },

  /**
   * 信息日志
   */
  info(message: string, ...args: any[]): void {
    if (!shouldLog('info')) return
    console.info(formatMessage('info', message, ...args))
  },

  /**
   * 警告日志
   */
  warn(message: string, ...args: any[]): void {
    if (!shouldLog('warn')) return
    console.warn(formatMessage('warn', message, ...args))
  },

  /**
   * 错误日志
   */
  error(message: string, ...args: any[]): void {
    if (!shouldLog('error')) return
    console.error(formatMessage('error', message, ...args))
  },

  /**
   * 致命错误日志
   */
  fatal(message: string, ...args: any[]): void {
    if (!config.enabled) return
    console.error(formatMessage('fatal', message, ...args))
  }
}

/**
 * 创建带前缀的日志器
 */
export function createLogger(prefix: string) {
  return {
    debug: (msg: string, ...args: any[]) => log.debug(`[${prefix}] ${msg}`, ...args),
    info: (msg: string, ...args: any[]) => log.info(`[${prefix}] ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => log.warn(`[${prefix}] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => log.error(`[${prefix}] ${msg}`, ...args),
    fatal: (msg: string, ...args: any[]) => log.fatal(`[${prefix}] ${msg}`, ...args)
  }
}

export default log
