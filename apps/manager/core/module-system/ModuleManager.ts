import { 
  Module, 
  IModuleManager, 
  ModuleEventType, 
  ModuleEvent, 
  ModuleEventListener,
  ModuleConfig,
  SidebarItem,
  ModuleRoute,
  ModuleDependency,
} from './types'

/**
 * 模块管理器（增强版）
 * 
 * 改进点：
 * 1. 完整的生命周期管理
 * 2. 依赖管理
 * 3. 配置持久化
 * 4. 事件系统
 * 5. 状态管理
 */

export class ModuleManager implements IModuleManager {
  private modules: Map<string, Module> = new Map()
  private eventListeners: Map<ModuleEventType, Set<ModuleEventListener>> = new Map()
  private storageKey = 'module-manager-configs'

  constructor() {
    this.loadConfigsFromStorage()
  }

  // ==================== 模块注册 ====================

  register(module: Module): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with id "${module.id}" already registered`)
    }

    // 检查依赖
    if (module.dependencies) {
      const { satisfied, missing } = this.checkDependencies(module.id, module.dependencies)
      if (!satisfied) {
        const required = module.dependencies.filter(d => d.required !== false)
        const missingRequired = required.filter(d => missing.includes(d.id))
        if (missingRequired.length > 0) {
          throw new Error(
            `Module "${module.id}" has unsatisfied required dependencies: ${missingRequired.map(d => d.id).join(', ')}`
          )
        }
      }
    }

    // 初始化模块状态
    const initializedModule: Module = {
      ...module,
      state: 'uninitialized',
      registeredAt: Date.now(),
      updatedAt: Date.now(),
      config: this.loadModuleConfig(module.id) || module.defaultConfig || {},
    }

    this.modules.set(module.id, initializedModule)

    // 触发注册事件
    this.emitEvent(ModuleEventType.REGISTERED, module.id)

    // 执行初始化钩子
    this.initializeModule(module.id)
  }

  unregister(moduleId: string): void {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new Error(`Module with id "${moduleId}" not found`)
    }

    // 检查是否有其他模块依赖此模块
    const dependents = this.getDependents(moduleId)
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister module "${moduleId}" because it is required by: ${dependents.join(', ')}`
      )
    }

    // 执行销毁钩子
    this.destroyModule(moduleId)

    // 移除模块
    this.modules.delete(moduleId)

    // 触发注销事件
    this.emitEvent(ModuleEventType.UNREGISTERED, moduleId)
  }

  // ==================== 模块生命周期 ====================

  private async initializeModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId)
    if (!module || module.state !== 'uninitialized') return

    module.state = 'initializing'

    try {
      if (module.onInit) {
        await module.onInit()
      }
      module.state = 'initialized'
    } catch (error) {
      module.state = 'uninitialized'
      this.emitEvent(ModuleEventType.ERROR, moduleId, { error, phase: 'init' })
      throw error
    }
  }

  async enableModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new Error(`Module with id "${moduleId}" not found`)
    }

    if (module.enabled) return

    // 检查依赖
    if (module.dependencies) {
      const { satisfied, missing } = this.checkDependencies(moduleId, module.dependencies)
      if (!satisfied) {
        throw new Error(
          `Cannot enable module "${moduleId}" due to missing dependencies: ${missing.join(', ')}`
        )
      }

      // 自动启用依赖
      for (const dep of module.dependencies) {
        if (dep.required !== false && !this.isModuleEnabled(dep.id)) {
          await this.enableModule(dep.id)
        }
      }
    }

    module.state = 'enabling'

    try {
      if (module.onEnable) {
        await module.onEnable()
      }
      module.enabled = true
      module.state = 'enabled'
      module.updatedAt = Date.now()

      // 保存配置
      this.saveModuleConfig(moduleId)

      // 触发启用事件
      this.emitEvent(ModuleEventType.ENABLED, moduleId)
    } catch (error) {
      module.state = 'initialized'
      this.emitEvent(ModuleEventType.ERROR, moduleId, { error, phase: 'enable' })
      throw error
    }
  }

  async disableModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new Error(`Module with id "${moduleId}" not found`)
    }

    if (!module.enabled) return

    // 检查是否有其他启用的模块依赖此模块
    const enabledDependents = this.getDependents(moduleId).filter(id => this.isModuleEnabled(id))
    if (enabledDependents.length > 0) {
      throw new Error(
        `Cannot disable module "${moduleId}" because it is required by enabled modules: ${enabledDependents.join(', ')}`
      )
    }

    module.state = 'disabling'

    try {
      if (module.onDisable) {
        await module.onDisable()
      }
      module.enabled = false
      module.state = 'disabled'
      module.updatedAt = Date.now()

      // 保存配置
      this.saveModuleConfig(moduleId)

      // 触发禁用事件
      this.emitEvent(ModuleEventType.DISABLED, moduleId)
    } catch (error) {
      module.state = 'enabled'
      this.emitEvent(ModuleEventType.ERROR, moduleId, { error, phase: 'disable' })
      throw error
    }
  }

  private async destroyModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId)
    if (!module) return

    // 如果模块已启用，先禁用
    if (module.enabled) {
      await this.disableModule(moduleId)
    }

    module.state = 'destroying'

    try {
      if (module.onDestroy) {
        await module.onDestroy()
      }
      module.state = 'destroyed'
    } catch (error) {
      this.emitEvent(ModuleEventType.ERROR, moduleId, { error, phase: 'destroy' })
      throw error
    }
  }

  async initializeAll(): Promise<void> {
    for (const module of this.modules.values()) {
      if (module.state === 'uninitialized') {
        await this.initializeModule(module.id)
      }
    }

    // 执行应用启动钩子
    for (const module of this.modules.values()) {
      if (module.enabled && module.onAppStart) {
        await module.onAppStart()
      }
    }
  }

  async destroyAll(): Promise<void> {
    // 按依赖顺序反向销毁
    const sortedModules = this.getSortedModulesByDependency()
    for (const module of sortedModules.reverse()) {
      await this.destroyModule(module.id)
    }
  }

  // ==================== 模块查询 ====================

  getModule(moduleId: string): Module | undefined {
    return this.modules.get(moduleId)
  }

  getAllModules(): Module[] {
    return Array.from(this.modules.values())
  }

  getEnabledModules(): Module[] {
    return this.getAllModules().filter(m => m.enabled)
  }

  hasModule(moduleId: string): boolean {
    return this.modules.has(moduleId)
  }

  isModuleEnabled(moduleId: string): boolean {
    const module = this.modules.get(moduleId)
    return module?.enabled ?? false
  }

  // ==================== 依赖管理 ====================

  getModuleDependencies(moduleId: string): ModuleDependency[] {
    const module = this.modules.get(moduleId)
    return module?.dependencies || []
  }

  checkDependencies(
    moduleId: string, 
    dependencies?: ModuleDependency[]
  ): { satisfied: boolean; missing: string[] } {
    const deps = dependencies || this.getModuleDependencies(moduleId)
    const missing: string[] = []

    for (const dep of deps) {
      if (!this.hasModule(dep.id)) {
        missing.push(dep.id)
      } else {
        const depModule = this.getModule(dep.id)
        if (depModule?.version && dep.minVersion) {
          // 简单的版本比较
          if (this.compareVersions(depModule.version, dep.minVersion) < 0) {
            missing.push(`${dep.id} (requires >= ${dep.minVersion}, found ${depModule.version})`)
          }
        }
      }
    }

    return { satisfied: missing.length === 0, missing }
  }

  private getDependents(moduleId: string): string[] {
    const dependents: string[] = []
    for (const module of this.modules.values()) {
      if (module.dependencies?.some(dep => dep.id === moduleId)) {
        dependents.push(module.id)
      }
    }
    return dependents
  }

  private getSortedModulesByDependency(): Module[] {
    const visited = new Set<string>()
    const sorted: Module[] = []

    const visit = (module: Module) => {
      if (visited.has(module.id)) return
      visited.add(module.id)

      if (module.dependencies) {
        for (const dep of module.dependencies) {
          const depModule = this.modules.get(dep.id)
          if (depModule) {
            visit(depModule)
          }
        }
      }

      sorted.push(module)
    }

    for (const module of this.modules.values()) {
      visit(module)
    }

    return sorted
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0
      if (p1 < p2) return -1
      if (p1 > p2) return 1
    }

    return 0
  }

  // ==================== 侧边栏和路由 ====================

  getSidebarItems(): SidebarItem[] {
    return this.getEnabledModules()
      .filter(m => m.sidebarItem)
      .map(m => ({
        ...m.sidebarItem!,
        id: m.id,
      }))
      .sort((a, b) => a.order - b.order)
  }

  getRoutes(): ModuleRoute[] {
    const routes: ModuleRoute[] = []
    for (const module of this.getEnabledModules()) {
      if (module.routes) {
        routes.push(...module.routes)
      }
    }
    return routes
  }

  // ==================== 配置管理 ====================

  updateModuleConfig(moduleId: string, config: Partial<ModuleConfig>): void {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new Error(`Module with id "${moduleId}" not found`)
    }

    module.config = {
      ...module.config,
      ...config,
      updatedAt: Date.now(),
    }
    module.updatedAt = Date.now()

    // 保存到存储
    this.saveModuleConfig(moduleId)

    // 触发配置更新事件
    this.emitEvent(ModuleEventType.CONFIG_UPDATED, moduleId, { config })
  }

  getModuleConfig(moduleId: string): ModuleConfig | undefined {
    const module = this.modules.get(moduleId)
    return module?.config
  }

  private saveModuleConfig(moduleId: string): void {
    const module = this.modules.get(moduleId)
    if (!module) return

    try {
      const configs = this.loadAllConfigs()
      configs[moduleId] = {
        enabled: module.enabled,
        config: module.config || {},
      }
      localStorage.setItem(this.storageKey, JSON.stringify(configs))
    } catch (error) {
      console.error('Failed to save module config:', error)
    }
  }

  private loadModuleConfig(moduleId: string): ModuleConfig | undefined {
    try {
      const configs = this.loadAllConfigs()
      return configs[moduleId]?.config
    } catch {
      return undefined
    }
  }

  private loadAllConfigs(): Record<string, { enabled: boolean; config: ModuleConfig }> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  private loadConfigsFromStorage(): void {
    // 在注册模块时自动加载配置
  }

  // ==================== 事件系统 ====================

  on(event: ModuleEventType, listener: ModuleEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)

    // 返回取消订阅函数
    return () => {
      this.eventListeners.get(event)?.delete(listener)
    }
  }

  off(event: ModuleEventType, listener: ModuleEventListener): void {
    this.eventListeners.get(event)?.delete(listener)
  }

  private emitEvent(type: ModuleEventType, moduleId: string, data?: any): void {
    const event: ModuleEvent = {
      type,
      moduleId,
      timestamp: Date.now(),
      data,
    }

    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }
}

// 导出单例实例
export const moduleManager = new ModuleManager()

export default ModuleManager
