/**
 * UserService - 用户业务逻辑层
 * 封装所有用户相关的数据库操作和业务规则
 */

import { BaseService } from './BaseService.js'
import {
  PaginationParams,
  PaginationResult,
  NotFoundError,
  ValidationError,
  PermissionError
} from './types.js'
import { queryAll, queryOne, run, booleanize } from '../utils/index.js'
import {
  createUser,
  updateUser,
  getUserById,
  getUserByUsername,
  hashPassword,
  verifyPassword,
  generateId
} from '../db/index.js'
import { logAudit } from '../db/audit-enhanced.js'

// ========== 类型定义 ==========

export type UserRole = 'admin' | 'user' | 'guest'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  username: string
  password: string // 加密后的密码
  role: UserRole
  status: UserStatus
  email?: string
  avatar?: string
  nickname?: string
  bio?: string
  lastLoginAt?: string
  lastLoginIp?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface CreateUserDTO {
  username: string
  password: string // 明文密码，会被加密
  role?: UserRole
  email?: string
  avatar?: string
  nickname?: string
  bio?: string
}

export interface UpdateUserDTO {
  username?: string
  password?: string // 明文密码，会被加密
  role?: UserRole
  status?: UserStatus
  email?: string
  avatar?: string
  nickname?: string
  bio?: string
}

export interface UserFilters {
  role?: UserRole
  status?: UserStatus
  search?: string
}

export interface LoginResult {
  success: boolean
  user?: Omit<User, 'password'>
  error?: string
}

export interface ChangePasswordDTO {
  oldPassword: string
  newPassword: string
}

// ========== Service 实现 ==========

export class UserService extends BaseService<
  User,
  CreateUserDTO,
  UpdateUserDTO
> {
  protected tableName = 'users'
  protected defaultSortField = 'createdAt'
  protected sortableFields = ['createdAt', 'username', 'lastLoginAt']

  // ========== 实体映射 ==========

  protected mapToEntity(row: unknown): User {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      username: data.username as string,
      password: data.password as string,
      role: (data.role as UserRole) || 'user',
      status: (data.status as UserStatus) || 'active',
      email: data.email as string | undefined,
      avatar: data.avatar as string | undefined,
      nickname: data.nickname as string | undefined,
      bio: data.bio as string | undefined,
      lastLoginAt: data.lastLoginAt as string | undefined,
      lastLoginIp: data.lastLoginIp as string | undefined,
      createdAt: data.createdAt as string,
      updatedAt: data.updatedAt as string,
      isActive: booleanize({ isActive: data.isActive }).isActive as boolean
    }
  }

  protected mapCreateToFields(data: CreateUserDTO): Record<string, unknown> {
    // 注意：密码加密在 create 方法中异步处理
    return {
      username: data.username,
      password: data.password, // 临时存储明文，create 方法中会加密
      role: data.role || 'user',
      status: 'active',
      email: data.email || null,
      avatar: data.avatar || null,
      nickname: data.nickname || null,
      bio: data.bio || null,
      isActive: 1
    }
  }

  protected mapUpdateToFields(data: UpdateUserDTO): Record<string, unknown> {
    const fields: Record<string, unknown> = {}

    if (data.username !== undefined) fields.username = data.username
    // 注意：密码加密在 update 方法中异步处理
    if (data.password !== undefined) fields.password = data.password
    if (data.role !== undefined) fields.role = data.role
    if (data.status !== undefined) fields.status = data.status
    if (data.email !== undefined) fields.email = data.email || null
    if (data.avatar !== undefined) fields.avatar = data.avatar || null
    if (data.nickname !== undefined) fields.nickname = data.nickname || null
    if (data.bio !== undefined) fields.bio = data.bio || null

    return fields
  }

  // ========== 自定义查询方法 ==========

  /**
   * 根据用户名查找用户
   */
  findByUsername(username: string): User | null {
    const row = getUserByUsername(username)
    return row ? this.mapToEntity(row) : null
  }

  /**
   * 检查用户名是否已存在
   */
  isUsernameExists(username: string, excludeId?: string): boolean {
    const sql = excludeId
      ? 'SELECT COUNT(*) as count FROM users WHERE username = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM users WHERE username = ?'
    const params = excludeId ? [username, excludeId] : [username]
    const result = queryOne(sql, params)
    return (result?.count as number) > 0
  }

  /**
   * 检查邮箱是否已存在
   */
  isEmailExists(email: string, excludeId?: string): boolean {
    if (!email) return false

    const sql = excludeId
      ? 'SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM users WHERE email = ?'
    const params = excludeId ? [email, excludeId] : [email]
    const result = queryOne(sql, params)
    return (result?.count as number) > 0
  }

  /**
   * 搜索用户
   */
  searchUsers(search: string): User[] {
    const pattern = `%${search}%`
    const rows = queryAll(
      `SELECT * FROM users
       WHERE username LIKE ?
       OR email LIKE ?
       OR nickname LIKE ?
       ORDER BY createdAt DESC`,
      [pattern, pattern, pattern]
    )
    return rows.map(row => this.mapToEntity(row))
  }

  /**
   * 获取所有管理员
   */
  getAdmins(): User[] {
    return this.queryWithOptions({
      conditions: [{ field: 'role', operator: 'eq', value: 'admin' }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    })
  }

  /**
   * 获取活跃用户
   */
  getActiveUsers(): User[] {
    return this.queryWithOptions({
      conditions: [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'isActive', operator: 'eq', value: 1 }
      ],
      orderBy: [{ field: 'lastLoginAt', direction: 'desc' }]
    })
  }

  // ========== 认证相关 ==========

  /**
   * 用户登录
   */
  async login(username: string, password: string, ip?: string): Promise<LoginResult> {
    const user = this.findByUsername(username)

    if (!user) {
      return { success: false, error: '用户名或密码错误' }
    }

    if (user.status !== 'active') {
      return { success: false, error: '账号已被禁用' }
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return { success: false, error: '用户名或密码错误' }
    }

    // 更新最后登录信息
    this.updateLastLogin(user.id, ip)

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user
    return { success: true, user: userWithoutPassword }
  }

  /**
   * 验证用户密码
   */
  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const user = this.findById(userId)
    if (!user) return false

    return verifyPassword(password, user.password)
  }

  /**
   * 修改密码
   */
  changePassword(userId: string, dto: ChangePasswordDTO): boolean {
    const user = this.findById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }

    // 验证旧密码
    const isOldPasswordValid = verifyPassword(dto.oldPassword, user.password)
    if (!isOldPasswordValid) {
      throw new ValidationError('旧密码错误')
    }

    // 更新密码
    this.update(userId, { password: dto.newPassword })
    return true
  }

  /**
   * 管理员重置密码
   */
  resetPassword(adminId: string, targetUserId: string, newPassword: string): boolean {
    const admin = this.findById(adminId)
    if (!admin || admin.role !== 'admin') {
      throw new PermissionError('Only admin can reset password')
    }

    const targetUser = this.findById(targetUserId)
    if (!targetUser) {
      throw new NotFoundError('User', targetUserId)
    }

    this.update(targetUserId, { password: newPassword })
    return true
  }

  // ========== 状态管理 ==========

  /**
   * 更新最后登录信息
   */
  updateLastLogin(userId: string, ip?: string): void {
    run(
      'UPDATE users SET lastLoginAt = ?, lastLoginIp = ? WHERE id = ?',
      [new Date().toISOString(), ip || null, userId]
    )
  }

  /**
   * 激活用户
   */
  activateUser(userId: string): User | null {
    run(
      'UPDATE users SET status = ?, isActive = ? WHERE id = ?',
      ['active', 1, userId]
    )
    return this.findById(userId)
  }

  /**
   * 禁用用户
   */
  deactivateUser(userId: string): User | null {
    run(
      'UPDATE users SET status = ?, isActive = ? WHERE id = ?',
      ['inactive', 0, userId]
    )
    return this.findById(userId)
  }

  /**
   * 暂停用户
   */
  suspendUser(userId: string, reason?: string, adminId?: string, adminUsername?: string, ip?: string): User | null {
    const user = this.findById(userId)
    if (!user) return null
    
    run(
      'UPDATE users SET status = ? WHERE id = ?',
      ['suspended', userId]
    )
    
    // 记录暂停原因到审计日志
    logAudit({
      userId: adminId || 'system',
      username: adminUsername || 'system',
      action: 'USER_SUSPEND',
      resourceType: 'user',
      resourceId: userId,
      details: { 
        suspendedUsername: user.username,
        reason: reason || '未提供原因'
      },
      ip: ip || 'unknown',
      userAgent: '',
      riskLevel: 'medium'
    })
    
    return this.findById(userId)
  }

  // ========== 角色管理 ==========

  /**
   * 设置用户角色
   */
  setRole(userId: string, role: UserRole, adminId: string): User | null {
    const admin = this.findById(adminId)
    if (!admin || admin.role !== 'admin') {
      throw new PermissionError('Only admin can change user role')
    }

    this.update(userId, { role })
    return this.findById(userId)
  }

  /**
   * 检查用户是否为管理员
   */
  isAdmin(userId: string): boolean {
    const user = this.findById(userId)
    return user?.role === 'admin'
  }

  // ========== 重写父类方法 ==========

  /**
   * 创建用户（带验证）- 异步处理密码加密
   */
  async create(data: CreateUserDTO): Promise<User> {
    // 验证用户名唯一性
    if (this.isUsernameExists(data.username)) {
      throw new ValidationError('用户名已存在')
    }

    // 验证邮箱唯一性
    if (data.email && this.isEmailExists(data.email)) {
      throw new ValidationError('邮箱已被使用')
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
      throw new ValidationError('用户名必须是3-20位的字母、数字或下划线')
    }

    // 验证密码强度
    if (data.password.length < 6) {
      throw new ValidationError('密码长度至少为6位')
    }

    // 加密密码
    const hashedPassword = await hashPassword(data.password)

    const fields = {
      username: data.username,
      password: hashedPassword,
      role: data.role || 'user',
      status: 'active',
      email: data.email || null,
      avatar: data.avatar || null,
      nickname: data.nickname || null,
      bio: data.bio || null,
      isActive: 1
    }

    const id = generateId()
    const now = new Date().toISOString()

    const columns = Object.keys(fields)
    const placeholders = columns.map(() => '?').join(', ')
    const values = [...Object.values(fields), id, now, now]

    run(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}, id, createdAt, updatedAt) VALUES (${placeholders}, ?, ?, ?)`,
      values
    )

    return this.findByIdOrThrow(id)
  }

  /**
   * 更新用户（带验证）- 异步处理密码加密
   */
  async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    // 验证用户名唯一性
    if (data.username && this.isUsernameExists(data.username, id)) {
      throw new ValidationError('用户名已存在')
    }

    // 验证邮箱唯一性
    if (data.email && this.isEmailExists(data.email, id)) {
      throw new ValidationError('邮箱已被使用')
    }

    // 验证密码强度
    if (data.password && data.password.length < 6) {
      throw new ValidationError('密码长度至少为6位')
    }

    // 检查实体是否存在
    const existing = this.findById(id)
    if (!existing) {
      return null
    }

    // 构建更新字段
    const fields: Record<string, unknown> = {}

    if (data.username !== undefined) fields.username = data.username
    if (data.password !== undefined) {
      fields.password = await hashPassword(data.password)
    }
    if (data.role !== undefined) fields.role = data.role
    if (data.status !== undefined) fields.status = data.status
    if (data.email !== undefined) fields.email = data.email || null
    if (data.avatar !== undefined) fields.avatar = data.avatar || null
    if (data.nickname !== undefined) fields.nickname = data.nickname || null
    if (data.bio !== undefined) fields.bio = data.bio || null

    // 过滤掉 undefined 值
    const validFields = Object.entries(fields).filter(
      ([, value]) => value !== undefined
    )

    if (validFields.length === 0) {
      return existing
    }

    const setClause = validFields.map(([key]) => `${key} = ?`).join(', ')
    const now = new Date().toISOString()
    const values = [...validFields.map(([, value]) => value), now, id]

    run(
      `UPDATE ${this.tableName} SET ${setClause}, updatedAt = ? WHERE id = ?`,
      values
    )

    return this.findByIdOrThrow(id)
  }

  /**
   * 删除用户（检查权限）
   */
  delete(id: string, adminId?: string): boolean {
    const user = this.findById(id)
    if (!user) return false

    // 不能删除最后一个管理员
    if (user.role === 'admin') {
      const adminCount = queryOne(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['admin']
      )
      if ((adminCount?.count as number) <= 1) {
        throw new ValidationError('不能删除最后一个管理员')
      }
    }

    return super.delete(id)
  }

  // ========== 统计方法 ==========

  /**
   * 获取用户统计
   */
  getStats(): {
    total: number
    active: number
    inactive: number
    suspended: number
    admins: number
    regularUsers: number
  } {
    const total = queryOne('SELECT COUNT(*) as count FROM users', [])
    const active = queryOne(
      'SELECT COUNT(*) as count FROM users WHERE status = ?',
      ['active']
    )
    const inactive = queryOne(
      'SELECT COUNT(*) as count FROM users WHERE status = ?',
      ['inactive']
    )
    const suspended = queryOne(
      'SELECT COUNT(*) as count FROM users WHERE status = ?',
      ['suspended']
    )
    const admins = queryOne(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      ['admin']
    )
    const regularUsers = queryOne(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      ['user']
    )

    return {
      total: (total?.count as number) || 0,
      active: (active?.count as number) || 0,
      inactive: (inactive?.count as number) || 0,
      suspended: (suspended?.count as number) || 0,
      admins: (admins?.count as number) || 0,
      regularUsers: (regularUsers?.count as number) || 0
    }
  }

  /**
   * 获取最近登录的用户
   */
  getRecentLogins(limit: number = 10): User[] {
    const rows = queryAll(
      `SELECT * FROM users
       WHERE lastLoginAt IS NOT NULL
       ORDER BY lastLoginAt DESC
       LIMIT ?`,
      [limit]
    )
    return rows.map(row => this.mapToEntity(row))
  }
}

// 导出单例实例
export const userService = new UserService()
