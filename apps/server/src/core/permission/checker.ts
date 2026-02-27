/**
 * 权限检查器
 * 提供细粒度的权限验证功能
 */

import { Request, Response, NextFunction } from 'express'
import { 
  UserRole, 
  PermissionAction, 
  ResourceType, 
  PermissionContext,
  ROLE_HIERARCHY 
} from './types.js'
import { DEFAULT_POLICIES, DEFAULT_QUOTAS } from './policies.js'

/**
 * 权限检查器类
 * 封装权限检查逻辑，支持缓存和批量检查
 */
export class PermissionChecker {
  private static instance: PermissionChecker
  private cache: Map<string, boolean> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PermissionChecker {
    if (!PermissionChecker.instance) {
      PermissionChecker.instance = new PermissionChecker()
    }
    return PermissionChecker.instance
  }

  /**
   * 检查用户是否有权限
   * @param ctx 权限检查上下文
   * @returns 是否有权限
   */
  check(ctx: PermissionContext): boolean {
    const cacheKey = this.generateCacheKey(ctx)
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached !== null) return cached

    // 执行权限检查
    const result = this.performCheck(ctx)
    
    // 缓存结果
    this.setCache(cacheKey, result)
    
    return result
  }

  /**
   * 执行权限检查
   */
  private performCheck(ctx: PermissionContext): boolean {
    // 超级管理员拥有所有权限
    if (ctx.role === UserRole.SUPER_ADMIN) {
      return true
    }

    // 查找匹配的策略
    const policies = DEFAULT_POLICIES.filter(policy => 
      policy.role === ctx.role && 
      policy.resource === ctx.resourceType &&
      policy.actions.includes(ctx.action)
    )

    // 没有匹配策略 = 无权限
    if (policies.length === 0) {
      return false
    }

    // 检查策略条件
    return policies.every(policy => {
      if (policy.condition) {
        return policy.condition(ctx)
      }
      return true
    })
  }

  /**
   * 检查角色层级
   * @param userRole 当前用户角色
   * @param requiredRole 要求的最小角色
   * @returns 是否满足角色要求
   */
  checkRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
  }

  /**
   * 获取用户配额
   * @param role 用户角色
   * @returns 配额配置
   */
  getUserQuotas(role: UserRole) {
    return DEFAULT_QUOTAS[role] || DEFAULT_QUOTAS[UserRole.GUEST]
  }

  /**
   * 清除权限缓存
   * @param userId 用户ID，为空则清除所有缓存
   */
  clearCache(userId?: string): void {
    if (userId) {
      // 清除特定用户的缓存
      for (const key of this.cache.keys()) {
        if (key.includes(userId)) {
          this.cache.delete(key)
          this.cacheExpiry.delete(key)
        }
      }
    } else {
      // 清除所有缓存
      this.cache.clear()
      this.cacheExpiry.clear()
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(ctx: PermissionContext): string {
    return `${ctx.userId}:${ctx.role}:${ctx.resourceType}:${ctx.action}:${ctx.isOwner}`
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): boolean | null {
    const expiry = this.cacheExpiry.get(key)
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
      return null
    }
    return this.cache.get(key) ?? null
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, value: boolean): void {
    this.cache.set(key, value)
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL)
  }
}

/**
 * 快捷权限检查函数
 */
export const permissionChecker = PermissionChecker.getInstance()

/**
 * 权限检查中间件工厂
 * @param resource 资源类型
 * @param action 操作类型
 * @returns Express中间件
 */
export function requirePermission(resource: ResourceType, action: PermissionAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user
    
    if (!user) {
      return res.status(401).json({ error: '未登录' })
    }

    const ctx: PermissionContext = {
      userId: user.id,
      role: user.role || UserRole.USER,
      resourceType: resource,
      action: action,
      isOwner: req.params.userId === user.id || req.body.userId === user.id,
    }

    if (!permissionChecker.check(ctx)) {
      return res.status(403).json({ error: '权限不足' })
    }

    next()
  }
}

/**
 * 角色检查中间件工厂
 * @param minRole 最小要求角色
 * @returns Express中间件
 */
export function requireRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user
    
    if (!user) {
      return res.status(401).json({ error: '未登录' })
    }

    if (!permissionChecker.checkRoleHierarchy(user.role, minRole)) {
      return res.status(403).json({ error: '需要更高权限' })
    }

    next()
  }
}
