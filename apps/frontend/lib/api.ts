/**
 * API 入口文件
 * 
 * @deprecated 此文件已弃用，请使用 lib/api-client 替代
 * 
 * 迁移指南：
 * - 旧：import { fetchBookmarks } from '@/lib/api'
 * - 新：import { fetchAllBookmarks } from '@/lib/api-client'
 */

// 重新导出兼容层（保持向后兼容）
export * from './api-legacy'

// 默认导出
export { default } from './api-client'
