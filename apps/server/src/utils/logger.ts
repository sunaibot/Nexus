/**
 * 统一日志系统
 * 提供结构化、可配置的日志输出
 */

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * 日志级别名称映射
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
}

/**
 * 日志颜色（用于终端输出）
 */
const LOG_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m',  // 青色
  [LogLevel.INFO]: '\x1b[32m',   // 绿色
  [LogLevel.WARN]: '\x1b[33m',   // 黄色
  [LogLevel.ERROR]: '\x1b[31m',  // 红色
  [LogLevel.FATAL]: '\x1b[35m'   // 紫色
}

const RESET_COLOR = '\x1b[0m'

/**
 * 日志配置
 */
interface LoggerConfig {
  level: LogLevel
  enableColors: boolean
  enableTimestamp: boolean
  enableLevel: boolean
  prefix?: string
}

/**
 * 默认配置
 */
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableColors: process.env.NODE_ENV !== 'production',
  enableTimestamp: true,
  enableLevel: true
}

/**
 * 日志条目
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  levelName: string
  message: string
  context?: Record<string, any>
  error?: Error
}

/**
 * 日志处理器
 */
type LogHandler = (entry: LogEntry) => void

/**
 * 日志处理器列表
 */
const handlers: LogHandler[] = []

/**
 * 添加日志处理器
 */
export function addLogHandler(handler: LogHandler): void {
  handlers.push(handler)
}

/**
 * 移除日志处理器
 */
export function removeLogHandler(handler: LogHandler): void {
  const index = handlers.indexOf(handler)
  if (index > -1) {
    handlers.splice(index, 1)
  }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(date: Date): string {
  return date.toISOString()
}

/**
 * 格式化日志条目为字符串
 */
function formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
  const parts: string[] = []

  // 时间戳
  if (config.enableTimestamp) {
    parts.push(`[${entry.timestamp}]`)
  }

  // 日志级别
  if (config.enableLevel) {
    const levelStr = `[${entry.levelName}]`
    if (config.enableColors) {
      parts.push(`${LOG_COLORS[entry.level]}${levelStr}${RESET_COLOR}`)
    } else {
      parts.push(levelStr)
    }
  }

  // 前缀
  if (config.prefix) {
    parts.push(`[${config.prefix}]`)
  }

  // 消息
  parts.push(entry.message)

  // 上下文
  if (entry.context && Object.keys(entry.context).length > 0) {
    try {
      parts.push(JSON.stringify(entry.context))
    } catch {
      parts.push('[Context serialization failed]')
    }
  }

  // 错误堆栈
  if (entry.error) {
    parts.push('\n' + entry.error.stack)
  }

  return parts.join(' ')
}

/**
 * 默认控制台处理器
 */
function consoleHandler(entry: LogEntry): void {
  const config = { ...defaultConfig }
  const formatted = formatLogEntry(entry, config)

  switch (entry.level) {
    case LogLevel.DEBUG:
      console.debug(formatted)
      break
    case LogLevel.INFO:
      console.info(formatted)
      break
    case LogLevel.WARN:
      console.warn(formatted)
      break
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(formatted)
      break
  }
}

// 添加默认处理器
addLogHandler(consoleHandler)

/**
 * 创建日志条目
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
): LogEntry {
  return {
    timestamp: formatTimestamp(new Date()),
    level,
    levelName: LOG_LEVEL_NAMES[level],
    message,
    context,
    error
  }
}

/**
 * 写入日志
 */
function writeLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
  if (level < defaultConfig.level) {
    return
  }

  const entry = createLogEntry(level, message, context, error)

  // 调用所有处理器
  handlers.forEach(handler => {
    try {
      handler(entry)
    } catch (e) {
      console.error('Log handler error:', e)
    }
  })
}

/**
 * 日志对象接口
 */
interface Logger {
  debug(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  error(message: string, error?: Error, context?: Record<string, any>): void
  fatal(message: string, error?: Error, context?: Record<string, any>): void
  setLevel(level: LogLevel): void
  getLevel(): LogLevel
  child(prefix: string): Logger
}

/**
 * 日志对象
 */
export const logger: Logger = {
  /**
   * 调试日志
   */
  debug(message: string, context?: Record<string, any>): void {
    writeLog(LogLevel.DEBUG, message, context)
  },

  /**
   * 信息日志
   */
  info(message: string, context?: Record<string, any>): void {
    writeLog(LogLevel.INFO, message, context)
  },

  /**
   * 警告日志
   */
  warn(message: string, context?: Record<string, any>): void {
    writeLog(LogLevel.WARN, message, context)
  },

  /**
   * 错误日志
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    writeLog(LogLevel.ERROR, message, context, error)
  },

  /**
   * 致命错误日志
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    writeLog(LogLevel.FATAL, message, context, error)
  },

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    defaultConfig.level = level
  },

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return defaultConfig.level
  },

  /**
   * 创建带前缀的子日志器
   */
  child(prefix: string): typeof logger {
    const childConfig = { ...defaultConfig, prefix }

    return {
      debug: (msg: string, ctx?: Record<string, any>) => {
        if (LogLevel.DEBUG >= childConfig.level) {
          const entry = createLogEntry(LogLevel.DEBUG, msg, ctx)
          handlers.forEach(h => h(entry))
        }
      },
      info: (msg: string, ctx?: Record<string, any>) => {
        if (LogLevel.INFO >= childConfig.level) {
          const entry = createLogEntry(LogLevel.INFO, msg, ctx)
          handlers.forEach(h => h(entry))
        }
      },
      warn: (msg: string, ctx?: Record<string, any>) => {
        if (LogLevel.WARN >= childConfig.level) {
          const entry = createLogEntry(LogLevel.WARN, msg, ctx)
          handlers.forEach(h => h(entry))
        }
      },
      error: (msg: string, err?: Error, ctx?: Record<string, any>) => {
        if (LogLevel.ERROR >= childConfig.level) {
          const entry = createLogEntry(LogLevel.ERROR, msg, ctx, err)
          handlers.forEach(h => h(entry))
        }
      },
      fatal: (msg: string, err?: Error, ctx?: Record<string, any>) => {
        if (LogLevel.FATAL >= childConfig.level) {
          const entry = createLogEntry(LogLevel.FATAL, msg, ctx, err)
          handlers.forEach(h => h(entry))
        }
      },
      setLevel: logger.setLevel,
      getLevel: logger.getLevel,
      child: logger.child
    }
  }
}

/**
 * 请求上下文日志
 * 用于记录请求相关的日志
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child(`req:${requestId}${userId ? `:${userId}` : ''}`)
}

/**
 * 性能日志
 * 用于记录性能指标
 */
export function logPerformance(operation: string, durationMs: number, context?: Record<string, any>): void {
  logger.info(`Performance: ${operation}`, {
    ...context,
    duration: durationMs,
    durationSec: (durationMs / 1000).toFixed(3)
  })
}

/**
 * 安全日志
 * 用于记录安全相关事件
 */
export function logSecurity(event: string, context: Record<string, any>): void {
  logger.warn(`Security: ${event}`, {
    ...context,
    type: 'security_event',
    timestamp: new Date().toISOString()
  })
}

/**
 * 业务日志
 * 用于记录业务操作
 */
export function logBusiness(operation: string, userId: string, context?: Record<string, any>): void {
  logger.info(`Business: ${operation}`, {
    ...context,
    userId,
    type: 'business_event'
  })
}

// 默认导出
export default logger
