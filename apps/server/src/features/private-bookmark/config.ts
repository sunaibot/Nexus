/**
 * 私密书签配置
 * 定义场景模式和默认设置
 */

import { SceneModeConfig, PrivacyLevel, SceneMode } from './types.js'

/**
 * 默认场景模式配置
 */
export const DEFAULT_SCENE_MODES: SceneModeConfig[] = [
  {
    mode: SceneMode.WORK,
    name: '工作',
    icon: 'briefcase',
    color: '#3b82f6',
    description: '工作相关的书签',
    defaultPrivacyLevel: PrivacyLevel.INTERNAL,
  },
  {
    mode: SceneMode.PERSONAL,
    name: '个人',
    icon: 'user',
    color: '#10b981',
    description: '个人使用的书签',
    defaultPrivacyLevel: PrivacyLevel.PUBLIC,
  },
  {
    mode: SceneMode.FINANCE,
    name: '财务',
    icon: 'credit-card',
    color: '#f59e0b',
    description: '银行、支付等财务相关',
    defaultPrivacyLevel: PrivacyLevel.CONFIDENTIAL,
  },
  {
    mode: SceneMode.FAMILY,
    name: '家庭',
    icon: 'home',
    color: '#ec4899',
    description: '家庭共享的书签',
    defaultPrivacyLevel: PrivacyLevel.INTERNAL,
  },
  {
    mode: SceneMode.CUSTOM,
    name: '自定义',
    icon: 'settings',
    color: '#6b7280',
    description: '自定义场景',
    defaultPrivacyLevel: PrivacyLevel.CONFIDENTIAL,
  },
]

/**
 * 私密级别配置
 */
export const PRIVACY_LEVEL_CONFIG: Record<PrivacyLevel, { name: string; color: string; description: string }> = {
  [PrivacyLevel.PUBLIC]: {
    name: '公开',
    color: '#10b981',
    description: '所有人可见',
  },
  [PrivacyLevel.INTERNAL]: {
    name: '内部',
    color: '#3b82f6',
    description: '登录用户可见',
  },
  [PrivacyLevel.CONFIDENTIAL]: {
    name: '机密',
    color: '#f59e0b',
    description: '需要密码访问',
  },
  [PrivacyLevel.SECRET]: {
    name: '绝密',
    color: '#ef4444',
    description: '需要高级密码访问',
  },
}

/**
 * 访问令牌有效期（毫秒）
 */
export const ACCESS_TOKEN_EXPIRY: Partial<Record<PrivacyLevel, number>> = {
  [PrivacyLevel.CONFIDENTIAL]: 30 * 60 * 1000,  // 30分钟
  [PrivacyLevel.SECRET]: 15 * 60 * 1000,        // 15分钟
}

/**
 * 密码强度要求
 */
export const PASSWORD_REQUIREMENTS: Partial<Record<PrivacyLevel, { minLength: number; requireComplex: boolean }>> = {
  [PrivacyLevel.CONFIDENTIAL]: {
    minLength: 4,
    requireComplex: false,
  },
  [PrivacyLevel.SECRET]: {
    minLength: 8,
    requireComplex: true,
  },
}

/**
 * 获取场景模式配置
 * @param mode 场景模式
 * @returns 配置信息
 */
export function getSceneModeConfig(mode: SceneMode): SceneModeConfig | undefined {
  return DEFAULT_SCENE_MODES.find(config => config.mode === mode)
}

/**
 * 获取私密级别配置
 * @param level 私密级别
 * @returns 配置信息
 */
export function getPrivacyLevelConfig(level: PrivacyLevel) {
  return PRIVACY_LEVEL_CONFIG[level]
}

/**
 * 验证密码强度
 * @param password 密码
 * @param level 私密级别
 * @returns 验证结果
 */
export function validatePasswordStrength(password: string, level: PrivacyLevel): {
  valid: boolean
  message?: string
} {
  const requirements = PASSWORD_REQUIREMENTS[level]

  // 不需要密码的级别直接返回成功
  if (!requirements) {
    return { valid: true }
  }

  if (password.length < requirements.minLength) {
    return {
      valid: false,
      message: `密码长度至少为 ${requirements.minLength} 位`,
    }
  }

  if (requirements.requireComplex) {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length

    if (strength < 3) {
      return {
        valid: false,
        message: '密码需要包含大写字母、小写字母、数字和特殊字符中的至少3种',
      }
    }
  }

  return { valid: true }
}
