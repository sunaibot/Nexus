import React from 'react'

// ==================== 模块生命周期钩子 ====================

export interface ModuleLifecycle {
  /**
   * 模块初始化时调用
   * 在模块注册后立即执行
   */
  onInit?: () => void | Promise<void>
  
  /**
   * 模块启用时调用
   * 在模块从禁用状态变为启用状态时执行
   */
  onEnable?: () => void | Promise<void>
  
  /**
   * 模块禁用时调用
   * 在模块从启用状态变为禁用状态时执行
   */
  onDisable?: () => void | Promise<void>
  
  /**
   * 模块卸载时调用
   * 在模块被注销前执行
   */
  onDestroy?: () => void | Promise<void>
  
  /**
   * 应用启动时调用
   * 所有模块注册完成后执行
   */
  onAppStart?: () => void | Promise<void>
}

// ==================== 模块依赖 ====================

export interface ModuleDependency {
  /** 依赖模块 ID */
  id: string
  /** 是否必需 */
  required?: boolean
  /** 最低版本要求 */
  minVersion?: string
  /** 最高版本限制 */
  maxVersion?: string
}

// ==================== 模块配置 ====================

export interface ModuleConfig {
  /** 配置项键值对 */
  [key: string]: any
  /** 配置版本 */
  version?: string
  /** 最后更新时间 */
  updatedAt?: number
}

// ==================== 模块权限 ====================

export interface ModulePermission {
  /** 权限标识 */
  id: string
  /** 权限名称 */
  name: string
  /** 权限描述 */
  description?: string
  /** 默认是否启用 */
  defaultEnabled?: boolean
}

// ==================== 模块侧边栏项 ====================

export interface SidebarItem {
  /** 唯一标识 */
  id: string
  /** 显示标签 */
  label: string
  /** 图标组件 */
  icon: React.ComponentType<any>
  /** 排序权重 */
  order: number
  /** 分组名称 */
  group?: string
  /** 权限要求 */
  requiredPermission?: string
  /** 是否可见 */
  visible?: boolean | (() => boolean)
  /** 点击回调 */
  onClick?: () => void
  /** 子菜单 */
  children?: SidebarItem[]
}

// ==================== 模块路由 ====================

export interface ModuleRoute {
  /** 路由路径 */
  path: string
  /** 页面组件 */
  component: React.ComponentType<any>
  /** 是否精确匹配 */
  exact?: boolean
  /** 子路由 */
  children?: ModuleRoute[]
  /** 权限要求 */
  requiredPermission?: string
  /** 是否需要认证 */
  requireAuth?: boolean
  /** 路由元数据 */
  meta?: {
    title?: string
    description?: string
    [key: string]: any
  }
}

// ==================== 模块 API 端点 ====================

export interface ModuleApiEndpoint {
  /** 端点路径 */
  path: string
  /** HTTP 方法 */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** 处理函数 */
  handler: (...args: any[]) => any
  /** 权限要求 */
  requiredPermission?: string
  /** 是否需要认证 */
  requireAuth?: boolean
}

// ==================== 模块定义 ====================

export interface Module extends ModuleLifecycle {
  /** 模块唯一标识 */
  id: string
  /** 模块名称 */
  name: string
  /** 模块描述 */
  description?: string
  /** 模块版本 */
  version?: string
  /** 作者信息 */
  author?: string
  /** 模块图标 */
  icon?: React.ComponentType<any>
  /** 是否启用 */
  enabled: boolean
  /** 模块依赖 */
  dependencies?: ModuleDependency[]
  /** 模块配置 */
  config?: ModuleConfig
  /** 默认配置 */
  defaultConfig?: ModuleConfig
  /** 模块权限 */
  permissions?: ModulePermission[]
  /** 侧边栏配置 */
  sidebarItem?: SidebarItem
  /** 路由配置 */
  routes?: ModuleRoute[]
  /** API 端点 */
  apiEndpoints?: ModuleApiEndpoint[]
  /** 组件集合 */
  components?: Record<string, React.ComponentType<any>>
  /** 模块状态 */
  state?: 'uninitialized' | 'initializing' | 'initialized' | 'enabling' | 'enabled' | 'disabling' | 'disabled' | 'destroying' | 'destroyed'
  /** 注册时间 */
  registeredAt?: number
  /** 最后更新时间 */
  updatedAt?: number
}

// ==================== 模块管理器接口 ====================

export interface IModuleManager {
  /**
   * 注册模块
   */
  register(module: Module): void
  
  /**
   * 注销模块
   */
  unregister(moduleId: string): void
  
  /**
   * 获取模块
   */
  getModule(moduleId: string): Module | undefined
  
  /**
   * 获取所有模块
   */
  getAllModules(): Module[]
  
  /**
   * 获取已启用的模块
   */
  getEnabledModules(): Module[]
  
  /**
   * 启用模块
   */
  enableModule(moduleId: string): Promise<void>
  
  /**
   * 禁用模块
   */
  disableModule(moduleId: string): Promise<void>
  
  /**
   * 检查模块是否已注册
   */
  hasModule(moduleId: string): boolean
  
  /**
   * 检查模块是否启用
   */
  isModuleEnabled(moduleId: string): boolean
  
  /**
   * 获取模块依赖
   */
  getModuleDependencies(moduleId: string): ModuleDependency[]
  
  /**
   * 检查依赖是否满足
   */
  checkDependencies(moduleId: string): { satisfied: boolean; missing: string[] }
  
  /**
   * 获取侧边栏项
   */
  getSidebarItems(): SidebarItem[]
  
  /**
   * 获取路由配置
   */
  getRoutes(): ModuleRoute[]
  
  /**
   * 更新模块配置
   */
  updateModuleConfig(moduleId: string, config: Partial<ModuleConfig>): void
  
  /**
   * 获取模块配置
   */
  getModuleConfig(moduleId: string): ModuleConfig | undefined
  
  /**
   * 初始化所有模块
   */
  initializeAll(): Promise<void>
  
  /**
   * 销毁所有模块
   */
  destroyAll(): Promise<void>
}

// ==================== 模块事件 ====================

export enum ModuleEventType {
  REGISTERED = 'module:registered',
  UNREGISTERED = 'module:unregistered',
  ENABLED = 'module:enabled',
  DISABLED = 'module:disabled',
  CONFIG_UPDATED = 'module:config-updated',
  ERROR = 'module:error',
}

export interface ModuleEvent {
  type: ModuleEventType
  moduleId: string
  timestamp: number
  data?: any
}

export type ModuleEventListener = (event: ModuleEvent) => void

// ==================== 模块上下文 ====================

export interface ModuleContext {
  /** 模块 ID */
  moduleId: string
  /** 模块实例 */
  module: Module
  /** 配置管理 */
  config: {
    get: <T>(key: string, defaultValue?: T) => T
    set: <T>(key: string, value: T) => void
    getAll: () => ModuleConfig
    reset: () => void
  }
  /** 事件总线 */
  events: {
    emit: (event: string, data?: any) => void
    on: (event: string, listener: (data: any) => void) => void
    off: (event: string, listener: (data: any) => void) => void
  }
  /** 日志 */
  logger: {
    debug: (message: string, ...args: any[]) => void
    info: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
  }
}

// ==================== 模块工厂 ====================

export type ModuleFactory = (context: ModuleContext) => Module

// ==================== 模块元数据 ====================

export interface ModuleMetadata {
  id: string
  name: string
  description?: string
  version?: string
  author?: string
  license?: string
  homepage?: string
  repository?: string
  keywords?: string[]
}

export default {
  ModuleEventType,
}
