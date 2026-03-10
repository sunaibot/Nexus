import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { getDatabase, saveDatabase, forceSaveDatabase } from '../db/index.js'
import { getSecurityConfig } from '../core/config/index.js'
import { getJwtSecret } from '../utils/keyGenerator.js'

// JWT 密钥配置（使用 keyGenerator 自动生成或从环境变量读取）
const JWT_SECRET: string = getJwtSecret()

// 检查密钥强度（如果密钥太短，发出警告但不退出）
if (JWT_SECRET.length < 32) {
  console.warn('⚠️  警告：JWT_SECRET 长度小于32字符，建议设置更强的密钥')
}

/**
 * 获取会话超时时间（毫秒）
 * 从配置系统动态读取
 */
export function getSessionTimeout(): { hours: number; ms: number } {
  const config = getSecurityConfig()
  const hours = config.sessionTimeoutHours
  return { hours, ms: hours * 60 * 60 * 1000 }
}

// ========== Token 管理函数 (持久化到数据库) ==========

export function getTokenFromDb(token: string): { userId: string; username: string; expiresAt: number } | null {
  const db = getDatabase()
  // 生产环境不记录敏感日志
  if (process.env.NODE_ENV !== 'production') {
    console.log('[TokenDB] Querying token:', token.substring(0, 10) + '...')
  }
  const stmt = db.prepare('SELECT userId, username, expiresAt FROM tokens WHERE token = ?')
  stmt.bind([token])
  if (stmt.step()) {
    const row = stmt.getAsObject() as any
    if (process.env.NODE_ENV !== 'production') {
      console.log('[TokenDB] Found token, row:', JSON.stringify(row))
    }
    stmt.free()
    return {
      userId: row.userId,
      username: row.username,
      expiresAt: row.expiresAt
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[TokenDB] Token not found')
  }
  stmt.free()
  return null
}

export function saveTokenToDb(token: string, userId: string, username: string, expiresAt: number): void {
  const db = getDatabase()
  db.run(
    'INSERT OR REPLACE INTO tokens (token, userId, username, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)',
    [token, userId, username, expiresAt, new Date().toISOString()]
  )
  forceSaveDatabase()
  // 生产环境不记录敏感日志
  if (process.env.NODE_ENV !== 'production') {
    console.log('[TokenDB] Token saved for user:', username)
  }
}

export function deleteTokenFromDb(token: string): void {
  const db = getDatabase()
  db.run('DELETE FROM tokens WHERE token = ?', [token])
  saveDatabase()
}

export function cleanExpiredTokens(): void {
  const db = getDatabase()
  db.run('DELETE FROM tokens WHERE expiresAt < ?', [Date.now()])
  saveDatabase()
}

// 生成新 Token（使用加密安全的随机数）
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// 验证新格式的 Token (格式: userId:timestamp:random.signature)
function verifyNewFormatToken(token: string): { userId: string; timestamp: number } | null {
  try {
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return null
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(payload)
      .digest('hex')
    
    if (signature !== expectedSignature) return null
    
    // 支持两种格式: userId:timestamp 或 userId:timestamp:random
    const parts = payload.split(':')
    if (parts.length < 2) return null
    
    const userId = parts[0]
    const timestamp = parseInt(parts[1])
    
    if (!userId || isNaN(timestamp)) return null
    
    return { userId, timestamp }
  } catch {
    return null
  }
}

// ========== 认证中间件 ==========

// Token 验证中间件（必须登录）- 同时支持 Token 和 Session 认证
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 首先检查 Session 认证（新的认证方式）
  if (req.session && req.session.userId) {
    (req as any).user = {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role
    }
    return next()
  }

  // 回退到 Token 认证（兼容旧的认证方式）
  const authHeader = req.headers.authorization
  
  // 生产环境不记录敏感日志
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth] Authorization header:', authHeader ? 'Present' : 'Missing')
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] Missing or invalid Authorization header')
    }
    return res.status(401).json({ error: '未授权访问' })
  }
  
  const token = authHeader.substring(7)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth] Token length:', token.length)
  }
  
  let tokenData = getTokenFromDb(token)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth] Token from DB:', tokenData ? 'Found' : 'Not found')
  }
  
  if (!tokenData) {
    const newFormatData = verifyNewFormatToken(token)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] New format token verification:', newFormatData ? 'Valid' : 'Invalid')
    }
    if (newFormatData) {
      const { ms: timeoutMs } = getSessionTimeout()
      const expiresAt = newFormatData.timestamp + timeoutMs
      if (Date.now() <= expiresAt) {
        tokenData = {
          userId: newFormatData.userId,
          username: 'user',
          expiresAt
        }
      }
    }
  }
  
  if (!tokenData) {
    return res.status(401).json({ error: '无效的 Token' })
  }
  
  if (Date.now() > tokenData.expiresAt) {
    deleteTokenFromDb(token)
    return res.status(401).json({ error: 'Token 已过期' })
  }
  
  const db = getDatabase()
  const userResult = db.exec('SELECT username, role FROM users WHERE id = ?', [tokenData.userId])
  let username = tokenData.username
  let role = 'user'
  if (userResult.length > 0 && userResult[0].values.length > 0) {
    username = userResult[0].values[0][0] as string
    role = userResult[0].values[0][1] as string || 'user'
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth] User role from DB:', role)
  }
  ;(req as any).user = { id: tokenData.userId, username, role }
  next()
}

// 可选的认证中间件（不强制要求登录）
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    let tokenData = getTokenFromDb(token)
    
    if (!tokenData) {
      const newFormatData = verifyNewFormatToken(token)
      if (newFormatData) {
        const { ms: timeoutMs } = getSessionTimeout()
        const expiresAt = newFormatData.timestamp + timeoutMs
        if (Date.now() <= expiresAt) {
          tokenData = {
            userId: newFormatData.userId,
            username: 'user',
            expiresAt
          }
        }
      }
    }
    
    if (tokenData && Date.now() <= tokenData.expiresAt) {
      const db = getDatabase()
      const userResult = db.exec('SELECT username, role FROM users WHERE id = ?', [tokenData.userId])
      let username = tokenData.username
      let role = 'user'
      if (userResult.length > 0 && userResult[0].values.length > 0) {
        username = userResult[0].values[0][0] as string
        role = userResult[0].values[0][1] as string || 'user'
      }
      ;(req as any).user = { id: tokenData.userId, username, role }
    }
  }
  
  next()
}

// 管理员认证中间件（必须是管理员）
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  console.log('[Admin] Checking admin permission, user:', JSON.stringify(user))
  if (!user) {
    console.log('[Admin] Rejected: No user')
    return res.status(403).json({ error: '需要管理员权限' })
  }
  if (user.role !== 'admin') {
    console.log('[Admin] Rejected: Role is', user.role)
    return res.status(403).json({ error: '需要管理员权限' })
  }
  console.log('[Admin] Approved: User is admin')
  next()
}



// 定期清理过期 Token (每小时)
setInterval(cleanExpiredTokens, 60 * 60 * 1000)

// 从rateLimiter导入并重新导出authLimiter
export { authLimiter } from './rateLimiter.js'
