/**
 * 路由工具统一入口
 * 提供路由辅助函数和通用CRUD路由创建器
 */

// ========== 路由辅助函数 ==========
export {
  successResponse,
  errorResponse,
  asyncHandler,
  getUserId,
  getUser,
  normalizeId,
  getClientInfo,
  createOwnershipMiddleware,
  createSimpleOwnershipMiddleware,
  handleError,
  getPaginationParams,
  getSortParams,
} from './routeHelpers.js'

// ========== CRUD路由创建器 ==========
export {
  createCrudRouter,
  type CrudService,
  type CrudRouterOptions
} from './CrudRouter.js'
