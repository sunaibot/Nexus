/**
 * Service 层统一入口
 * 高内聚：所有业务逻辑集中管理
 * 低耦合：通过 Service 接口与路由层解耦
 */

// ========== 类型定义 ==========
export {
  // 接口
  IBaseService,
  PaginationParams,
  PaginationResult,
  SortParams,
  FilterParams,
  QueryCondition,
  QueryOptions,
  // 错误类
  ServiceError,
  NotFoundError,
  ValidationError,
  PermissionError
} from './types.js'

// ========== 基础类 ==========
export { BaseService } from './BaseService.js'

// ========== 业务 Service ==========
export { BookmarkService, bookmarkService } from './BookmarkService.js'
export { UserService, userService } from './UserService.js'
