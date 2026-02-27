/**
 * 私密书签服务层
 * 业务逻辑封装，复用现有数据库表
 */

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {
  PrivacyLevel,
  SceneMode,
  PrivateBookmarkConfig,
  PrivateBookmarkMeta,
  VerifyPasswordRequest,
  VerifyPasswordResponse,
  PrivateBookmarkStats,
  BatchOperationRequest,
  BatchOperationType,
} from './types.js'
import {
  getPrivacyLevelConfig,
  validatePasswordStrength,
  ACCESS_TOKEN_EXPIRY,
  DEFAULT_SCENE_MODES,
} from './config.js'
import { getDatabase } from '../../db/core.js'

/**
 * 临时访问令牌存储（内存缓存）
 */
const accessTokens = new Map<string, { bookmarkId: string; expiresAt: number }>()

/**
 * 私密书签服务类
 */
export class PrivateBookmarkService {
  private static instance: PrivateBookmarkService

  private constructor() {
    // 启动定时清理过期令牌
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000) // 每5分钟清理一次
  }

  static getInstance(): PrivateBookmarkService {
    if (!PrivateBookmarkService.instance) {
      PrivateBookmarkService.instance = new PrivateBookmarkService()
    }
    return PrivateBookmarkService.instance
  }

  /**
   * 设置书签为私密
   * @param bookmarkId 书签ID
   * @param privacyLevel 私密级别
   * @param sceneMode 场景模式
   * @param password 密码（可选）
   * @returns 是否成功
   */
  async setPrivate(
    bookmarkId: string,
    privacyLevel: PrivacyLevel,
    sceneMode: SceneMode = SceneMode.PERSONAL,
    password?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const db = getDatabase()

      // 检查是否需要密码
      if (privacyLevel === PrivacyLevel.CONFIDENTIAL || privacyLevel === PrivacyLevel.SECRET) {
        if (!password) {
          return { success: false, error: '该私密级别需要设置密码' }
        }

        // 验证密码强度
        const validation = validatePasswordStrength(password, privacyLevel)
        if (!validation.valid) {
          return { success: false, error: validation.message }
        }

        // 保存密码
        const passwordHash = await bcrypt.hash(password, 10)
        const now = new Date().toISOString()

        // 更新或插入密码记录
        db.run(
          `INSERT OR REPLACE INTO private_bookmark_passwords 
           (id, bookmarkId, passwordHash, createdAt, updatedAt) 
           VALUES ((SELECT id FROM private_bookmark_passwords WHERE bookmarkId = ?), ?, ?, ?, ?)`,
          [bookmarkId, bookmarkId, passwordHash, now, now]
        )
      } else {
        // 删除密码记录（如果存在）
        db.run('DELETE FROM private_bookmark_passwords WHERE bookmarkId = ?', [bookmarkId])
      }

      // 更新书签表
      db.run(
        'UPDATE bookmarks SET isPrivate = 1, updatedAt = ? WHERE id = ?',
        [new Date().toISOString(), bookmarkId]
      )

      return { success: true }
    } catch (error) {
      console.error('设置私密书签失败:', error)
      return { success: false, error: '设置失败' }
    }
  }

  /**
   * 取消书签私密状态
   * @param bookmarkId 书签ID
   * @returns 是否成功
   */
  async removePrivate(bookmarkId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = getDatabase()

      // 删除密码记录
      db.run('DELETE FROM private_bookmark_passwords WHERE bookmarkId = ?', [bookmarkId])

      // 更新书签表
      db.run(
        'UPDATE bookmarks SET isPrivate = 0, updatedAt = ? WHERE id = ?',
        [new Date().toISOString(), bookmarkId]
      )

      // 清除访问令牌
      this.clearTokensForBookmark(bookmarkId)

      return { success: true }
    } catch (error) {
      console.error('取消私密书签失败:', error)
      return { success: false, error: '取消失败' }
    }
  }

  /**
   * 验证访问密码
   * @param request 验证请求
   * @returns 验证结果
   */
  async verifyPassword(request: VerifyPasswordRequest): Promise<VerifyPasswordResponse> {
    try {
      const db = getDatabase()

      // 获取密码哈希
      const result = db.exec(
        'SELECT passwordHash FROM private_bookmark_passwords WHERE bookmarkId = ?',
        [request.bookmarkId]
      )

      if (result.length === 0 || result[0].values.length === 0) {
        return { success: false, error: '该书签未设置密码' }
      }

      const passwordHash = result[0].values[0][0] as string

      // 验证密码
      const isValid = await bcrypt.compare(request.password, passwordHash)

      if (!isValid) {
        return { success: false, error: '密码错误' }
      }

      // 生成临时访问令牌
      const token = crypto.randomBytes(32).toString('hex')
      const privacyLevel = await this.getPrivacyLevel(request.bookmarkId)
      const tokenExpiry = ACCESS_TOKEN_EXPIRY[privacyLevel] || 30 * 60 * 1000
      const expiresAt = Date.now() + tokenExpiry

      accessTokens.set(token, {
        bookmarkId: request.bookmarkId,
        expiresAt,
      })

      return {
        success: true,
        token,
        expiresAt,
      }
    } catch (error) {
      console.error('验证密码失败:', error)
      return { success: false, error: '验证失败' }
    }
  }

  /**
   * 验证访问令牌
   * @param token 访问令牌
   * @param bookmarkId 书签ID
   * @returns 是否有效
   */
  verifyAccessToken(token: string, bookmarkId: string): boolean {
    const tokenData = accessTokens.get(token)

    if (!tokenData) {
      return false
    }

    if (tokenData.bookmarkId !== bookmarkId) {
      return false
    }

    if (Date.now() > tokenData.expiresAt) {
      accessTokens.delete(token)
      return false
    }

    return true
  }

  /**
   * 获取书签的私密级别
   * @param bookmarkId 书签ID
   * @returns 私密级别
   */
  async getPrivacyLevel(bookmarkId: string): Promise<PrivacyLevel> {
    try {
      const db = getDatabase()

      // 检查是否有密码
      const result = db.exec(
        'SELECT 1 FROM private_bookmark_passwords WHERE bookmarkId = ?',
        [bookmarkId]
      )

      if (result.length > 0 && result[0].values.length > 0) {
        // 有密码，返回机密级别（简化处理）
        return PrivacyLevel.CONFIDENTIAL
      }

      // 检查书签是否私密
      const bookmarkResult = db.exec(
        'SELECT isPrivate FROM bookmarks WHERE id = ?',
        [bookmarkId]
      )

      if (bookmarkResult.length > 0 && bookmarkResult[0].values.length > 0) {
        const isPrivate = bookmarkResult[0].values[0][0] as number
        return isPrivate ? PrivacyLevel.INTERNAL : PrivacyLevel.PUBLIC
      }

      return PrivacyLevel.PUBLIC
    } catch (error) {
      console.error('获取私密级别失败:', error)
      return PrivacyLevel.PUBLIC
    }
  }

  /**
   * 获取用户的私密书签列表
   * @param userId 用户ID
   * @returns 书签元数据列表
   */
  async getUserPrivateBookmarks(userId: string): Promise<PrivateBookmarkMeta[]> {
    try {
      const db = getDatabase()

      const result = db.exec(
        `SELECT 
          b.id, b.title, b.url, b.isPrivate, b.createdAt,
          CASE WHEN p.bookmarkId IS NOT NULL THEN 1 ELSE 0 END as hasPassword
         FROM bookmarks b
         LEFT JOIN private_bookmark_passwords p ON b.id = p.bookmarkId
         WHERE b.userId = ? AND b.isPrivate = 1
         ORDER BY b.createdAt DESC`,
        [userId]
      )

      if (result.length === 0) {
        return []
      }

      return result[0].values.map((row: any[]) => ({
        id: row[0],
        title: row[1],
        url: row[2],
        isPrivate: row[3] === 1,
        privacyLevel: row[5] === 1 ? PrivacyLevel.CONFIDENTIAL : PrivacyLevel.INTERNAL,
        sceneMode: SceneMode.PERSONAL, // 简化处理
        hasPassword: row[5] === 1,
        createdAt: row[4],
      }))
    } catch (error) {
      console.error('获取私密书签列表失败:', error)
      return []
    }
  }

  /**
   * 获取私密书签统计
   * @param userId 用户ID
   * @returns 统计数据
   */
  async getStats(userId: string): Promise<PrivateBookmarkStats> {
    try {
      const db = getDatabase()

      const result = db.exec(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN p.bookmarkId IS NOT NULL THEN 1 ELSE 0 END) as withPassword
         FROM bookmarks b
         LEFT JOIN private_bookmark_passwords p ON b.id = p.bookmarkId
         WHERE b.userId = ? AND b.isPrivate = 1`,
        [userId]
      )

      if (result.length === 0 || result[0].values.length === 0) {
        return {
          total: 0,
          byLevel: {
            [PrivacyLevel.PUBLIC]: 0,
            [PrivacyLevel.INTERNAL]: 0,
            [PrivacyLevel.CONFIDENTIAL]: 0,
            [PrivacyLevel.SECRET]: 0,
          },
          byScene: {
            [SceneMode.WORK]: 0,
            [SceneMode.PERSONAL]: 0,
            [SceneMode.FINANCE]: 0,
            [SceneMode.FAMILY]: 0,
            [SceneMode.CUSTOM]: 0,
          },
        }
      }

      const total = result[0].values[0][0] as number
      const withPassword = result[0].values[0][1] as number

      return {
        total,
        byLevel: {
          [PrivacyLevel.PUBLIC]: 0,
          [PrivacyLevel.INTERNAL]: total - withPassword,
          [PrivacyLevel.CONFIDENTIAL]: withPassword,
          [PrivacyLevel.SECRET]: 0,
        },
        byScene: {
          [SceneMode.WORK]: 0,
          [SceneMode.PERSONAL]: total,
          [SceneMode.FINANCE]: 0,
          [SceneMode.FAMILY]: 0,
          [SceneMode.CUSTOM]: 0,
        },
      }
    } catch (error) {
      console.error('获取私密书签统计失败:', error)
      return {
        total: 0,
        byLevel: {} as Record<PrivacyLevel, number>,
        byScene: {} as Record<SceneMode, number>,
      }
    }
  }

  /**
   * 批量操作
   * @param request 批量操作请求
   * @returns 操作结果
   */
  async batchOperation(request: BatchOperationRequest): Promise<{
    success: boolean
    results: { bookmarkId: string; success: boolean; error?: string }[]
  }> {
    const results: { bookmarkId: string; success: boolean; error?: string }[] = []

    for (const bookmarkId of request.bookmarkIds) {
      try {
        switch (request.operation) {
          case BatchOperationType.REMOVE_PRIVATE:
            const removeResult = await this.removePrivate(bookmarkId)
            results.push({ bookmarkId, success: removeResult.success, error: removeResult.error })
            break

          case BatchOperationType.CHANGE_LEVEL:
            if (request.targetValue) {
              const levelResult = await this.setPrivate(
                bookmarkId,
                request.targetValue as PrivacyLevel,
                SceneMode.PERSONAL,
                request.password
              )
              results.push({ bookmarkId, success: levelResult.success, error: levelResult.error })
            }
            break

          default:
            results.push({ bookmarkId, success: false, error: '不支持的操作类型' })
        }
      } catch (error) {
        results.push({ bookmarkId, success: false, error: '操作失败' })
      }
    }

    return {
      success: results.every(r => r.success),
      results,
    }
  }

  /**
   * 获取场景模式列表
   * @returns 场景模式配置列表
   */
  getSceneModes() {
    return DEFAULT_SCENE_MODES
  }

  /**
   * 清理过期令牌
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [token, data] of accessTokens.entries()) {
      if (now > data.expiresAt) {
        accessTokens.delete(token)
      }
    }
  }

  /**
   * 清除书签的所有令牌
   * @param bookmarkId 书签ID
   */
  private clearTokensForBookmark(bookmarkId: string): void {
    for (const [token, data] of accessTokens.entries()) {
      if (data.bookmarkId === bookmarkId) {
        accessTokens.delete(token)
      }
    }
  }
}

/**
 * 服务实例导出
 */
export const privateBookmarkService = PrivateBookmarkService.getInstance()
