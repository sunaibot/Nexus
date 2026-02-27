/**
 * 私密书签模块入口
 * 统一导出模块功能
 */

// 类型定义
export * from './types.js'

// 配置
export * from './config.js'

// 业务服务层
export * from './service.js'

// 路由配置
export { default as privateBookmarkRoutes } from './routes.js'
