/**
 * 数据库模块统一入口
 * 高内聚：所有数据库相关功能集中管理
 * 低耦合：通过统一接口对外提供服务
 */

// ========== 核心功能 ==========
export {
  getDatabase,
  setDatabase,
  saveDatabase,
  requestSaveDatabase,
  forceSaveDatabase,
  generateId,
  hashPassword,
  verifyPassword,
  getDbPath,
  getFilesPath,
  setCache,
  getCache,
  clearCache
} from './core.js'

// ========== 用户管理 ==========
export {
  createUser,
  getUsers,
  updateUser,
  getUserById,
  getUserByUsername
} from './users.js'

// ========== 书签管理 ==========
export {
  getBookmarkById,
  getBookmarkNote,
  saveBookmarkNote,
  // 书签维度私密密码（兼容）
  setPrivateBookmarkPassword,
  verifyPrivateBookmarkPassword,
  removePrivateBookmarkPassword,
  getPrivateBookmarkPassword,
  // 用户维度私密密码（新）
  setUserPrivatePassword,
  verifyUserPrivatePassword,
  hasUserPrivatePassword,
  getUserPrivatePasswordInfo,
  updateUserPrivatePassword,
  disableUserPrivatePassword,
  enableUserPrivatePassword,
  removeUserPrivatePassword
} from './bookmarks.js'

// ========== 分类管理 ==========
export {
  getAllCategoryCollapseStates,
  setCategoryCollapseState
} from './settings.js'

// ========== 标签管理 ==========
export {
  createTag,
  getTags,
  addTagToBookmark,
  removeTagFromBookmark,
  getBookmarkTags
} from './tags.js'

// ========== 分享管理 ==========
export {
  createShare,
  getShareByToken,
  deactivateShare
} from './shares.js'

// ========== 审计日志 ==========
export {
  logAudit,
  logSystemError,
  queryAuditLogs,
  getAuditStats,
  getLoginStats,
  AUDIT_ACTIONS,
  SYSTEM_ERROR_ACTIONS
} from './audit-enhanced.js'

// ========== 设置管理 ==========
export {
  getUserSettings,
  setUserSettings
} from './settings.js'

// ========== 自定义小部件 ==========
export {
  createCustomWidget,
  getCustomWidgetsByUser,
  getCustomWidgetById,
  updateCustomWidget,
  deleteCustomWidget
} from './settings.js'

// ========== 私密模式 ==========
export {
  getPrivatePassword,
  setPrivatePassword,
  verifyPrivatePassword,
  hasPrivatePassword
} from './settings.js'

// ========== IP过滤 ==========
export {
  addIpFilter,
  removeIpFilter,
  getIpFilters,
  checkIpAccess
} from './settings.js'

// ========== RSS订阅 ==========
export {
  createRssFeed,
  getRssFeeds,
  getRssFeed,
  updateRssFeed,
  deleteRssFeed,
  getRssArticles,
  getUnreadCount,
  markArticleRead,
  markAllRead,
  starArticle,
  createRssArticle
} from './settings.js'

// ========== WebDAV配置 ==========
export {
  createWebdavConfig,
  getWebdavConfigs,
  getWebdavConfig,
  updateWebdavConfig,
  deleteWebdavConfig
} from './settings.js'

// ========== 通知配置 ==========
export {
  getNotificationConfig,
  saveNotificationConfig,
  getNotificationHistory,
  clearNotificationHistory,
  createNotificationHistory
} from './settings.js'

// ========== 文件快传 ==========
export {
  createFileTransfer,
  getFileTransferByExtractCode,
  getFileTransferByDeleteCode,
  getFileTransferByDownloadToken,
  incrementFileTransferDownload,
  deleteFileTransfer,
  deleteFileTransferById,
  getUserFileTransfers,
  getAllFileTransfers,
  cleanupExpiredFileTransfers,
  getFileTransferSettings,
  updateFileTransferSettings,
  getFileTransferStats
} from './settings.js'

// ========== 自定义指标 ==========
export {
  createCustomMetric,
  getCustomMetricsByUser,
  getCustomMetric,
  updateCustomMetric,
  deleteCustomMetric,
  addCustomMetricHistory,
  getCustomMetricHistory,
  clearCustomMetricHistory
} from './settings.js'

// ========== 服务监控 ==========
export {
  createServiceMonitor,
  getServiceMonitorsByUser,
  getServiceMonitorById,
  updateServiceMonitor,
  deleteServiceMonitor
} from './settings.js'

// ========== 便签管理 ==========
export {
  getNotepad,
  saveNotepad,
  getAllNotepads,
  deleteNotepad,
  createNotepad,
  updateNotepad,
  getNotepadById
} from './settings.js'

// ========== 插件管理 ==========
export {
  createPlugin,
  createCustomPlugin,
  updateCustomPlugin,
  getPlugins,
  getPluginsForUser,
  getPluginById,
  updatePlugin,
  deletePlugin,
  enablePlugin,
  disablePlugin,
  getUserPlugin,
  getRolePlugin
} from './plugins.js'

// ========== 数据库初始化 ==========
export { initDatabase } from './init.js'

// ========== 连接池管理 ==========
export {
  ConnectionPool,
  initConnectionPool,
  getConnectionPool,
  closeConnectionPool,
  poolQuery,
  poolRun,
  getPoolStats
} from './connection-pool.js'
