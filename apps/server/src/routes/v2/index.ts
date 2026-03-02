/**
 * V2 API 路由统一入口
 * 所有V2路由都在这里注册，保持API版本一致性
 */

import { Router } from 'express'
import { apiCacheMiddleware, invalidateCache, cacheConfigs, cacheStatsHandler, clearCacheHandler, adminMiddleware, publicApiLimiter } from '../../middleware/index.js'

// ========== 核心功能路由 ==========
import bookmarksRouter from './bookmarks.js'
import categoriesRouter from './categories.js'
import tabsRouter from './tabs.js'
import usersRouter from './users.js'
import adminRouter from './admin.js'
import authRouter from './auth.js'

// ========== 文件与数据路由 ==========
import { fileTransferRoutes } from '../../features/file-transfer/index.js'
import { privateBookmarkRoutes } from '../../features/private-bookmark/index.js'
import dataRouter from './data.js'

// ========== 系统与工具路由 ==========
import healthCheckRoutes from '../../features/health-check/routes.js'
import systemRouter from './system.js'
import settingsRouter from './settings.js'
import themeRouter from './theme.js'

// ========== 扩展功能路由 ==========
import webDAVRoutes from '../../features/webdav/routes.js'
import notificationRoutes from '../../features/notification/routes.js'
import rssRouter from './rss.js'
import notesRouter from './notes.js'
import notepadsRouter from './notepads.js'
import quotesRouter from './quotes.js'
import widgetsRouter from './widgets.js'
import serviceMonitorsRouter from './service-monitors.js'
import customMetricsRouter from './custom-metrics.js'
import visitsRouter from './visits.js'
import metadataRouter from './metadata.js'
import tagsRouter from './tags.js'
import sharesRouter from './shares.js'
import ipFiltersRouter from './ipFilters.js'
import batchRouter from './batch.js'
import privateModeRouter from './privateMode.js'
import pluginsRouter from './plugins.js'
import pluginDisplayConfigsRouter from './plugin-display-configs.js'
import pluginSlotsRouter from './plugin-slots.js'
import bookmarkCardStylesRouter from './bookmark-card-styles.js'
import adminMenusRouter from './admin-menus.js'
import securityRouter from './security.js'
import categoriesEnhancedRouter from './categories-enhanced.js'
import auditEnhancedRouter from './audit-enhanced.js'
import dockConfigsRouter from './dock-configs.js'
import settingsTabsRouter from './settings-tabs.js'
import frontendNavRouter from './frontend-nav.js'
import announcementsRouter from './announcements.js'
import i18nRouter from './i18n.js'
import permissionsRouter from './permissions.js'
import statsRouter from './stats.js'
import customIconsRouter from './custom-icons.js'
import weatherRouter from './weather.js'
import apiDocsRouter from '../api-docs.js'
import sessionAuthRouter from './session-auth.js'
import pluginsUnifiedRouter from './plugins-unified.js'
import systemConfigsRouter from './system-configs.js'

const router = Router()

// ========== 认证路由（兼容前端调用） ==========
router.use('/auth', authRouter)

// ========== Session 认证路由（新的基于 Session 的认证） ==========
router.use('/session-auth', sessionAuthRouter)

// ========== 公开API（使用宽松限流） ==========
router.use('/bookmarks/public', publicApiLimiter, bookmarksRouter)
router.use('/categories/public', publicApiLimiter, categoriesRouter)
router.use('/quotes', publicApiLimiter, quotesRouter)

// ========== 核心功能 ==========
router.use('/bookmarks', bookmarksRouter)
router.use('/categories', categoriesRouter)
router.use('/tabs', tabsRouter)
router.use('/users', usersRouter)
router.use('/admin', adminRouter)

// ========== 文件与数据 ==========
router.use('/file-transfers', fileTransferRoutes)
router.use('/private-bookmarks', privateBookmarkRoutes)
router.use('/data', dataRouter)

// ========== 系统与工具 ==========
router.use('/health-check', healthCheckRoutes)
router.use('/system', systemRouter)
router.use('/settings', settingsRouter)
router.use('/theme', themeRouter)

// ========== 扩展功能 ==========
router.use('/webdav', webDAVRoutes)
router.use('/notifications', notificationRoutes)
router.use('/rss', rssRouter)
router.use('/notes', notesRouter)
router.use('/notepads', notepadsRouter)
router.use('/quotes', quotesRouter)
router.use('/widgets', widgetsRouter)
router.use('/service-monitors', serviceMonitorsRouter)
router.use('/custom-metrics', customMetricsRouter)
router.use('/visits', visitsRouter)
router.use('/metadata', metadataRouter)
router.use('/tags', tagsRouter)
router.use('/shares', sharesRouter)
router.use('/ip-filters', ipFiltersRouter)
router.use('/batch', batchRouter)
router.use('/private-mode', privateModeRouter)
router.use('/plugins', pluginsRouter)
router.use('/plugins-unified', pluginsUnifiedRouter)
router.use('/plugin-display-configs', pluginDisplayConfigsRouter)
router.use('/plugin-slots', pluginSlotsRouter)
router.use('/bookmark-card-styles', bookmarkCardStylesRouter)
router.use('/admin-menus', adminMenusRouter)
router.use('/security', securityRouter)
router.use('/categories-enhanced', categoriesEnhancedRouter)
router.use('/audit-enhanced', auditEnhancedRouter)

// ========== 配置管理路由 ==========
router.use('/dock-configs', dockConfigsRouter)
router.use('/settings-tabs', settingsTabsRouter)
router.use('/frontend-nav', frontendNavRouter)
router.use('/announcements', announcementsRouter)
router.use('/i18n', i18nRouter)
router.use('/permissions', permissionsRouter)
router.use('/custom-icons', customIconsRouter)
router.use('/weather', weatherRouter)

// ========== 系统配置管理 ==========
router.use('/system-configs', systemConfigsRouter)

// ========== 数据统计分析 ==========
router.use('/stats', statsRouter)

// ========== API 文档 ==========
router.use('/docs', apiDocsRouter)

// ========== 缓存管理端点 ==========
router.get('/cache/stats', adminMiddleware, cacheStatsHandler)
router.post('/cache/clear', adminMiddleware, clearCacheHandler)

// ========== 服务状态检查端点（无限制流） ==========
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  })
})

// ========== API 根路径欢迎信息 ==========
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nexus API Server',
    version: 'v2',
    documentation: {
      html: '/api/v2/docs',
      json: '/api/v2/docs/json',
    },
    endpoints: [
      '/api/v2/auth/admin/login',
      '/api/v2/auth/login',
      '/api/v2/auth/register',
      '/api/v2/bookmarks',
      '/api/v2/categories',
      '/api/v2/users',
      '/api/v2/settings',
      '/api/v2/plugins',
      '/api/v2/admin-menus',
      '/api/v2/system',
      '/api/v2/visits',
      '/api/v2/quotes',
      '/api/v2/rss',
      '/api/v2/notes',
      '/api/v2/widgets',
      '/api/v2/security',
      '/api/v2/dock-configs',
      '/api/v2/settings-tabs',
      '/api/v2/frontend-nav',
      '/api/v2/stats',
    ],
    timestamp: new Date().toISOString()
  })
})

export default router
