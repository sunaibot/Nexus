export {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  getTokenFromDb,
  saveTokenToDb,
  deleteTokenFromDb,
  generateToken,
  getSessionTimeout
} from './auth.js'
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestLogger,
  AppError,
  ValidationError,
  AuthError,
  PermissionError,
  NotFoundError,
  RateLimitError
} from './errorHandler.js'
export {
  apiCacheMiddleware,
  invalidateCache,
  cacheStatsHandler,
  clearCacheHandler,
  cacheConfigs,
  apiCache
} from './apiCache.js'
export {
  validateBodyEnhanced,
  validateQueryEnhanced,
  validateParamsEnhanced,
  sqlInjectionDetector,
  createSizeLimiter,
  contentTypeValidator,
  idParamSchema,
  paginationSchema,
  searchSchema
} from './securityValidator.js'
export {
  csrfProtection,
  csrfTokenGenerator,
  doubleSubmitCsrf,
  refererCheck,
  configureCsrfCookie
} from './csrf.js'
export {
  autoAuditMiddleware,
  audit,
  auditBatch
} from './auditAuto.js'
export {
  errorLogMiddleware,
  asyncHandler as asyncErrorHandler,
  logAPIError
} from './errorLog.js'

// ========== 统一的限流与熔断模块 ==========
// 合并了 rateLimiter.ts, rate-limit.ts, rateLimit.ts 三个重复文件的功能
export {
  // 基础限流
  createRateLimiter,
  createRateLimit,
  default as rateLimit,
  // 预设限流器
  generalLimiter,
  publicApiLimiter,
  authLimiter,
  metadataLimiter,
  systemMonitorLimiter,
  staticInfoLimiter,
  // 新版预设
  strictRateLimit,
  standardRateLimit,
  relaxedRateLimit,
  apiRateLimit,
  uploadRateLimit,
  loginRateLimit,
  adminRateLimit,
  rateLimitPresets,
  // 中间件
  rateLimitMiddleware,
  createApiRateLimiter,
  // 熔断器
  CircuitBreaker,
  circuitBreakerMiddleware,
  // 限流器类
  RateLimiter,
  // 工具函数
  getRateLimitStats,
  resetAllRateLimiters
} from './rateLimiter.js'

// ========== 权限控制 ==========
export {
  Permission,
  PagePermission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAllPermissions,
  requirePagePermission,
  API_PERMISSIONS,
  getApiPermissions
} from './permission.js'
