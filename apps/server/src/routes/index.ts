/**
 * 路由统一导出
 * 所有路由都使用V2版本
 */

// ========== 核心功能路由 ==========
export { default as bookmarksRouter } from './v2/modules/bookmarks/index.js'
export { default as categoriesRouter } from './v2/modules/categories/index.js'
export { default as usersRouter } from './v2/users.js'
export { default as adminRouter } from './v2/admin.js'
export { default as authRouter } from './v2/auth.js'

// ========== 文件与数据路由 ==========
export { fileTransferRoutes } from '../features/file-transfer/index.js'
export { default as dataRouter } from './v2/data.js'

// ========== 系统与工具路由 ==========
export { default as healthCheckRouter } from './v2/health-check.js'
export { default as systemRouter } from './v2/system.js'
export { default as settingsRouter } from './v2/settings.js'
export { default as themeRouter } from './v2/theme.js'

// ========== 扩展功能路由 ==========
export { default as webdavRouter } from './v2/webdav.js'
export { default as notificationsRouter } from './v2/notifications.js'
export { default as rssRouter } from './v2/modules/rss/index.js'
export { default as notesRouter } from './v2/modules/notes/index.js'
export { default as notepadsRouter } from './v2/modules/notepads/index.js'
export { default as quotesRouter } from './v2/modules/quotes/index.js'
export { default as widgetsRouter } from './v2/modules/widgets/index.js'
export { default as serviceMonitorsRouter } from './v2/modules/service-monitors/index.js'
export { default as customMetricsRouter } from './v2/modules/metrics/index.js'
export { default as visitsRouter } from './v2/modules/visits/index.js'
export { default as metadataRouter } from './v2/metadata.js'
export { default as tagsRouter } from './v2/tags.js'
export { default as sharesRouter } from './v2/shares.js'
export { default as ipFiltersRouter } from './v2/ipFilters.js'
export { default as batchRouter } from './v2/batch.js'
export { default as privateModeRouter } from './v2/privateMode.js'
export { default as pluginsRouter } from './v2/plugins.js'
export { default as adminMenusRouter } from './v2/admin-menus.js'
export { default as securityRouter } from './v2/security.js'
export { default as categoriesEnhancedRouter } from './v2/categories-enhanced.js'
export { default as auditEnhancedRouter } from './v2/audit-enhanced.js'

// ========== V2 路由统一入口 ==========
export { default as v2Router } from './v2/index.js'

// ========== API 文档 ==========
export { default as apiDocsRouter } from './api-docs.js'

// ========== 新增功能路由 ==========
export { default as announcementsRouter } from './v2/announcements.js'
export { default as i18nRouter } from './v2/i18n.js'
export { default as permissionsRouter } from './v2/permissions.js'
