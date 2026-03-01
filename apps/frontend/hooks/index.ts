/**
 * Hooks 库导出
 * 包含所有可复用的自定义 Hooks
 */

// 认证相关
export { useAuth, type PageType } from './useAuth'

// 异步操作
export { useAsync } from './useAsync'

// 书签管理
export { useBookmarkStore } from './useBookmarkStore'
export { useBookmarkCardStyle } from './useBookmarkCardStyle'

// 配置管理
export { useDockConfigs } from './useDockConfigs'
export { useSiteSettings } from './useSiteSettings'
export { useSettingsSync } from './useSettingsSync'

// 拖拽
export { useDragAndDrop } from './useDragAndDrop'

// 错误处理
export { useErrorHandler } from './useErrorHandler'
export { useGlobalErrorHandler } from './useGlobalErrorHandler'

// 表单
export { useForm } from './useForm'

// 网络环境
export { useNetworkEnv } from './useNetworkEnv'

// 分页
export { usePagination } from './usePagination'

// 私密密码
export { usePrivatePassword } from './usePrivatePassword'

// 服务状态
export { useServiceStatus } from './useServiceStatus'

// 系统监控
export { useSystemVital } from './useSystemVital'

// 主题
export { useTheme, useThemeContext } from './useTheme'

// 时间
export { useTime } from './useTime'

// 天气
export { useWeather } from './useWeather'

// 性能优化
export {
  useDebounce,
  useThrottle,
  useInfiniteScroll,
  useVirtualList,
  usePerformanceMonitor,
  useMemoryMonitor,
  useRafThrottle,
  useVisibilityChange,
  useNetworkStatus,
  useRenderCount,
} from './usePerformance'

// 领域 Hooks（新业务逻辑）
export * from './domain'

// 记忆化选择器
export {
  useBookmarkSelectors,
  useCategorySelectors,
  useFilteredBookmarks,
} from './useMemoizedSelectors'
