/**
 * 工具函数统一入口
 * 高内聚：所有工具函数集中管理
 * 低耦合：通过统一接口对外提供服务
 */

// ========== 数据库辅助函数 ==========
export {
  queryAll,
  queryOne,
  run,
  booleanize
} from './database.js'

// 兼容旧代码的别名导出
export { run as runQuery } from './database.js'

// ========== 缓存系统 ==========
export {
  CacheManager,
  globalCache,
  userCache,
  settingsCache
} from './cache.js'

// ========== 核心工具函数（从 db/core 重新导出） ==========
export {
  generateId,
  hashPassword,
  verifyPassword
} from '../db/core.js'

// ========== 环境变量验证 ==========
export {
  validateEnv,
  getEnv,
  getSystemSecurityConfig
} from './envValidator.js'

// ========== 通知工具 ==========
export {
  sendFeishuNotification,
  createFeishuTextMessage,
  createFeishuCardMessage,
  sendNotification,
  clearNotificationCooldown
} from './notifications.js'

// ========== 日志系统 ==========
export {
  logger,
  LogLevel,
  createRequestLogger,
  logPerformance,
  logSecurity,
  logBusiness,
  addLogHandler,
  removeLogHandler
} from './logger.js'

// ========== 错误监控 ==========
export {
  errorMonitor,
  errorReporter,
  setupGlobalErrorHandling,
  withErrorTracking,
  createErrorBoundary,
  getHealthStatus
} from './error-monitor.js'

// ========== 分片上传 ==========
export {
  ChunkUploadManager,
  initChunkUploadManager,
  getChunkUploadManager,
  destroyChunkUploadManager,
  createUploadSession,
  uploadChunk,
  mergeChunks,
  getUploadProgress,
  checkUploadChunks
} from './chunk-upload.js'
