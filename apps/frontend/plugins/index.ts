/**
 * 插件系统入口
 * 统一导出所有插件相关功能
 */

// 类型定义
export * from './types'

// 注册表
export * from './registry'

// API
export * from './api'

// Hooks
export { usePluginSlots } from './hooks/usePluginSlots'

// 组件
export { PluginSlot } from './components/PluginSlot'

// 内置插件 - 使用默认导出
export { default as FileTransferWidget } from './builtin/file-transfer'
export { default as WeatherWidget } from './builtin/weather'
export { default as ClockWidget } from './builtin/clock'
export { default as QuoteWidget } from './builtin/quote'

// 自定义插件渲染器
export { default as CustomPluginRenderer } from './components/CustomPluginRenderer'
export { default as CustomPluginList } from './components/CustomPluginList'
