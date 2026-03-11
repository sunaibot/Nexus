/**
 * 密钥生成工具
 * 根据用户设置的简单密码自动生成安全的 JWT_SECRET 和 SESSION_SECRET
 * 这样普通用户只需设置一个简单密码即可
 */

import crypto from 'crypto'

/**
 * 根据用户密码生成安全密钥
 * @param password 用户设置的密码
 * @param salt 盐值（用于区分不同用途的密钥）
 * @returns 生成的安全密钥
 */
export function generateKeyFromPassword(password: string, salt: string): string {
  // 使用 PBKDF2 算法从密码派生密钥
  // 迭代次数：10000 次（足够安全且性能可接受）
  // 密钥长度：64 字节（512位，足够安全）
  const key = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512')
  return key.toString('base64')
}

/**
 * 获取 JWT_SECRET
 * 优先使用环境变量 JWT_SECRET，如果没有则根据 YOUR_PASSWORD 生成
 */
export function getJwtSecret(): string {
  // 如果设置了 JWT_SECRET 且不是默认值，直接使用
  const envJwtSecret = process.env.JWT_SECRET
  if (envJwtSecret && 
      envJwtSecret !== 'auto-generated-from-your-password' &&
      envJwtSecret !== 'change-this-to-a-random-string-min-32-chars') {
    return envJwtSecret
  }

  // 如果有 YOUR_PASSWORD，根据密码生成
  const userPassword = process.env.YOUR_PASSWORD
  if (userPassword && userPassword !== '填上你自己的密码') {
    const generatedKey = generateKeyFromPassword(userPassword, 'nexus-jwt-salt-v1')
    console.log('🔐 JWT_SECRET 已根据你的密码自动生成')
    return generatedKey
  }

  // 使用默认密码（生产环境和开发环境都使用，但生产环境会显示警告）
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    console.warn('⚠️  警告：生产环境未设置 YOUR_PASSWORD，使用默认密码')
    console.warn('   为了安全，请在 .env 文件中设置 YOUR_PASSWORD=你的密码')
    console.warn('   密码要求：至少8位字符')
  } else {
    console.warn('⚠️  警告：开发环境使用默认 JWT_SECRET')
  }
  // 使用默认密码生成密钥
  const defaultPassword = 'nexus-default-password-for-zero-config'
  const generatedKey = generateKeyFromPassword(defaultPassword, 'nexus-jwt-salt-v1')
  return generatedKey
}

/**
 * 获取 SESSION_SECRET
 * 优先使用环境变量 SESSION_SECRET，如果没有则根据 YOUR_PASSWORD 生成
 */
export function getSessionSecret(): string {
  // 如果设置了 SESSION_SECRET 且不是默认值，直接使用
  const envSessionSecret = process.env.SESSION_SECRET
  if (envSessionSecret && 
      envSessionSecret !== 'auto-generated-from-your-password' &&
      envSessionSecret !== 'change-this-to-a-different-random-string-min-32-chars') {
    return envSessionSecret
  }

  // 如果有 YOUR_PASSWORD，根据密码生成（使用不同的盐值，确保与 JWT_SECRET 不同）
  const userPassword = process.env.YOUR_PASSWORD
  if (userPassword && userPassword !== '填上你自己的密码') {
    const generatedKey = generateKeyFromPassword(userPassword, 'nexus-session-salt-v1-different-from-jwt')
    console.log('🔐 SESSION_SECRET 已根据你的密码自动生成')
    return generatedKey
  }

  // 使用默认密码（生产环境和开发环境都使用，但生产环境会显示警告）
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    console.warn('⚠️  警告：生产环境未设置 YOUR_PASSWORD，使用默认密码')
    console.warn('   为了安全，请在 .env 文件中设置 YOUR_PASSWORD=你的密码')
    console.warn('   密码要求：至少8位字符')
  } else {
    console.warn('⚠️  警告：开发环境使用默认 SESSION_SECRET')
  }
  // 使用默认密码生成密钥
  const defaultPassword = 'nexus-default-password-for-zero-config'
  const generatedKey = generateKeyFromPassword(defaultPassword, 'nexus-session-salt-v1-different-from-jwt')
  return generatedKey
}

/**
 * 验证用户密码强度
 * @param password 用户密码
 * @returns 验证结果
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: '密码长度至少8位' }
  }

  if (password === '填上你自己的密码' || password === 'your-password-here') {
    return { valid: false, message: '请修改默认密码' }
  }

  // 检查是否包含常见弱密码
  const weakPasswords = ['12345678', 'password', 'qwerty', 'abc123', '11111111']
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: '密码太简单，请使用更复杂的密码' }
  }

  return { valid: true }
}

/**
 * 初始化时检查密码配置
 */
export function checkPasswordConfig(): void {
  const userPassword = process.env.YOUR_PASSWORD

  // 如果用户设置了密码，验证强度
  if (userPassword && userPassword !== '填上你自己的密码') {
    const validation = validatePasswordStrength(userPassword)
    if (!validation.valid) {
      console.warn(`⚠️  密码强度不足：${validation.message}`)
      console.warn('   建议设置更强的密码（至少8位字符）')
      // 不再强制退出，只显示警告
    } else {
      console.log('✅ 密码验证通过')
    }
  }
}
