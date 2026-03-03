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

// ========== 设置核心 ==========
export {
  getUserSettings,
  setUserSettings,
  getGlobalSetting,
  setGlobalSetting,
  getAllCategoryCollapseStates,
  setCategoryCollapseState
} from './modules/settings-core/index.js'

// ========== 自定义小部件 (custom_widgets 表) ==========
export {
  createCustomWidget,
  getCustomWidgetsByUser,
  getCustomWidgetById,
  updateCustomWidget,
  deleteCustomWidget,
  type CustomWidget
} from './modules/widgets/index.js'

// ========== 用户小部件 (widgets 表) ==========
export {
  getUserWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  getWidgetById,
  type Widget
} from './modules/widgets/user-widgets.js'

// ========== 私密模式 ==========
export {
  getPrivatePassword,
  setPrivatePassword,
  verifyPrivatePassword,
  hasPrivatePassword
} from './modules/private-mode/index.js'

// ========== IP过滤 ==========
export {
  addIpFilter,
  removeIpFilter,
  getIpFilters,
  checkIpAccess,
  type IpFilter
} from './modules/ip-filter/index.js'

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
  createRssArticle,
  type RssFeed,
  type RssArticle
} from './modules/rss/index.js'

// ========== WebDAV配置 ==========
export {
  createWebdavConfig,
  getWebdavConfigs,
  getWebdavConfig,
  updateWebdavConfig,
  deleteWebdavConfig,
  type WebdavConfig
} from './modules/webdav/index.js'

// ========== 通知配置 ==========
export {
  getNotificationConfig,
  saveNotificationConfig,
  getNotificationHistory,
  clearNotificationHistory,
  createNotificationHistory,
  type NotificationHistory
} from './modules/notifications/index.js'

// ========== 文件快传 ==========
export {
  createFileTransfer,
  getFileTransferByExtractCode,
  getFileTransferByDownloadToken,
  incrementDownloadCount,
  incrementFileTransferDownload,
  deleteFileTransfer,
  deleteFileTransferById,
  getFileTransferByDeleteCode,
  getUserFileTransfers,
  getAllFileTransfers,
  cleanupExpiredFileTransfers,
  getFileTransferSettings,
  updateFileTransferSettings,
  getFileTransferStats,
  type FileTransfer
} from './modules/file-transfer/index.js'

// ========== 自定义指标 ==========
export {
  createCustomMetric,
  getCustomMetricsByUser,
  getCustomMetric,
  updateCustomMetric,
  deleteCustomMetric,
  addCustomMetricHistory,
  getCustomMetricHistory,
  clearCustomMetricHistory,
  type CustomMetric,
  type MetricHistory
} from './modules/metrics/index.js'

// ========== 服务监控 ==========
export {
  createServiceMonitor,
  getServiceMonitorsByUser,
  getServiceMonitorById,
  updateServiceMonitor,
  deleteServiceMonitor,
  type ServiceMonitor
} from './modules/service-monitors/index.js'

// ========== 便签管理 ==========
export {
  getNotepad,
  saveNotepad,
  getAllNotepads,
  deleteNotepad,
  createNotepad,
  updateNotepad,
  getNotepadById,
  type Notepad
} from './modules/notepads/index.js'

// ========== 笔记管理 ==========
export {
  getUserNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getAllNotes,
  getUserNoteFolders,
  getAllNoteFolders,
  getNoteFolderById,
  createNoteFolder,
  updateNoteFolder,
  deleteNoteFolder,
  type Note,
  type NoteFolder
} from './modules/notes/index.js'

// ========== 访问统计 ==========
export {
  recordVisit,
  getTopBookmarks,
  getVisitTrend,
  getRecentVisits,
  getBookmarkStats,
  getCategoryStats,
  getCategoryTrend,
  getVisitRecords,
  getPopularBookmarks,
  getVisitTimeline,
  getVisitStatsSummary,
  clearAllVisits,
  type Visit,
  type VisitStats
} from './modules/visits/index.js'

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
  getRolePlugin,
  type Plugin,
  type UserPlugin,
  type RolePlugin
} from './plugins.js'

// ========== 名言管理 ==========
export {
  getQuotes,
  getActiveQuotes,
  getQuoteById,
  getRandomQuote,
  getDailyQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  toggleQuoteStatus,
  getQuoteCategories,
  getQuoteAuthors,
  type Quote
} from './modules/quotes/index.js'

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
