/**
 * 文件快传模块入口
 * 统一导出模块功能
 */

// 类型定义
export * from './types.js'

// 数据访问层
export * from './repository.js'

// 业务服务层
export * from './service.js'

// 路由配置
export { default as fileTransferRoutes } from './routes.js'
