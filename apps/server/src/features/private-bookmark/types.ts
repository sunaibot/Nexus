/**
 * 私密书签模块类型定义
 * 复用现有 bookmarks.isPrivate 和 private_bookmark_passwords 表
 */

/** 私密级别枚举 */
export enum PrivacyLevel {
  PUBLIC = 'public',           // 公开
  INTERNAL = 'internal',       // 内部（登录可见）
  CONFIDENTIAL = 'confidential', // 机密（需要密码）
  SECRET = 'secret',           // 绝密（需要高级密码）
}

/** 场景模式枚举 */
export enum SceneMode {
  WORK = 'work',               // 工作场景
  PERSONAL = 'personal',       // 个人场景
  FINANCE = 'finance',         // 财务场景
  FAMILY = 'family',           // 家庭场景
  CUSTOM = 'custom',           // 自定义场景
}

/** 私密书签配置 */
export interface PrivateBookmarkConfig {
  bookmarkId: string
  privacyLevel: PrivacyLevel
  sceneMode: SceneMode
  passwordHash?: string        // 密码哈希
  customSceneName?: string     // 自定义场景名称
  createdAt: string
  updatedAt: string
}

/** 私密书签元数据 */
export interface PrivateBookmarkMeta {
  id: string
  title: string
  url: string
  isPrivate: boolean
  privacyLevel: PrivacyLevel
  sceneMode: SceneMode
  hasPassword: boolean
  createdAt: string
}

/** 场景模式配置 */
export interface SceneModeConfig {
  mode: SceneMode
  name: string
  icon: string
  color: string
  description: string
  defaultPrivacyLevel: PrivacyLevel
}

/** 验证密码请求 */
export interface VerifyPasswordRequest {
  bookmarkId: string
  password: string
  sceneMode?: SceneMode
}

/** 验证密码响应 */
export interface VerifyPasswordResponse {
  success: boolean
  token?: string               // 临时访问令牌
  expiresAt?: number           // 令牌过期时间
  error?: string
}

/** 私密书签统计 */
export interface PrivateBookmarkStats {
  total: number
  byLevel: Record<PrivacyLevel, number>
  byScene: Record<SceneMode, number>
}

/** 批量操作类型 */
export enum BatchOperationType {
  CHANGE_LEVEL = 'change_level',
  CHANGE_SCENE = 'change_scene',
  REMOVE_PRIVATE = 'remove_private',
  SET_PASSWORD = 'set_password',
}

/** 批量操作请求 */
export interface BatchOperationRequest {
  bookmarkIds: string[]
  operation: BatchOperationType
  targetValue?: string
  password?: string
}
