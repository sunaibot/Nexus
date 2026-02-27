/**
 * 管理员认证路由 - V2版本
 * 提供管理员登录、密码修改等功能
 */

import { Router, Request, Response } from 'express'
import { hashPassword, verifyPassword, logAudit } from '../../db/index.js'
import { queryOne, queryAll, run } from '../../utils/index.js'
import { 
  authMiddleware, 
  authLimiter, 
  saveTokenToDb, 
  deleteTokenFromDb, 
  generateToken,
  getSessionTimeout
} from '../../middleware/index.js'
import { validateBody, loginSchema, changePasswordSchema } from '../../schemas.js'

const router = Router()

// 登录接口
router.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  const { username, password } = req.body
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
  const userAgent = (req.headers['user-agent'] || '') as string
  
  try {
    const user = queryOne('SELECT * FROM users WHERE username = ? AND isActive = 1', [username])
    
    if (!user) {
      logAudit({
        userId: null,
        username,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        details: { reason: 'user_not_found' },
        ip,
        userAgent
      })
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      logAudit({
        userId: user.id,
        username,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        details: { reason: 'wrong_password' },
        ip,
        userAgent
      })
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    // 生成 Token
    const token = generateToken()
    const { ms: sessionTimeoutMs } = getSessionTimeout()
    const expiresAt = Date.now() + sessionTimeoutMs
    
    // 存储 Token 到数据库
    saveTokenToDb(token, user.id, user.username, expiresAt)
    
    logAudit({
      userId: user.id,
      username,
      action: 'LOGIN_SUCCESS',
      resourceType: 'auth',
      ip,
      userAgent
    })
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      requirePasswordChange: user.isDefaultPassword === 1
    })
  } catch (error) {
    logAudit({
      userId: null,
      username,
      action: 'LOGIN_ERROR',
      resourceType: 'auth',
      details: { error: String(error) },
      ip,
      userAgent
    })
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

// 修改密码
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), async (req: Request, res: Response) => {
  const user = (req as any).user
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
  const userAgent = (req.headers['user-agent'] || '') as string
  
  try {
    const { currentPassword, newPassword } = req.body
    
    const dbUser = queryOne('SELECT * FROM users WHERE id = ?', [user.id])
    
    if (!dbUser) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'CHANGE_PASSWORD_FAILED',
        resourceType: 'auth',
        details: { reason: 'user_not_found' },
        ip,
        userAgent
      })
      return res.status(404).json({ error: '用户不存在' })
    }
    
    const isValidPassword = await verifyPassword(currentPassword, dbUser.password)
    if (!isValidPassword) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'CHANGE_PASSWORD_FAILED',
        resourceType: 'auth',
        details: { reason: 'wrong_current_password' },
        ip,
        userAgent
      })
      return res.status(401).json({ error: '当前密码错误' })
    }
    
    const newHash = await hashPassword(newPassword)
    const now = new Date().toISOString()
    
    // 修改密码同时清除默认密码标记
    run('UPDATE users SET password = ?, isDefaultPassword = 0, updatedAt = ? WHERE id = ?', [newHash, now, user.id])
    
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CHANGE_PASSWORD_SUCCESS',
      resourceType: 'auth',
      ip,
      userAgent
    })
    
    res.json({ success: true, message: '密码修改成功' })
  } catch (error) {
    logAudit({
      userId: user?.id || null,
      username: user?.username || null,
      action: 'CHANGE_PASSWORD_ERROR',
      resourceType: 'auth',
      details: { error: String(error) },
      ip,
      userAgent
    })
    console.error('修改密码失败:', error)
    res.status(500).json({ error: '修改密码失败' })
  }
})

// 验证 Token 有效性
router.get('/verify', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user
  res.json({ valid: true, user })
})

// 调试接口：检查当前用户角色
router.get('/debug-role', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user
  console.log('[Debug] Current user:', user)
  res.json({ 
    user,
    isAdmin: user?.role === 'admin',
    timestamp: Date.now()
  })
})

// 退出登录
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
  const userAgent = (req.headers['user-agent'] || '') as string
  
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    deleteTokenFromDb(token)
  }
  
  logAudit({
    userId: user?.id || null,
    username: user?.username || null,
    action: 'LOGOUT',
    resourceType: 'auth',
    ip,
    userAgent
  })
  
  res.json({ success: true })
})

// 获取密码提示（公开接口）
router.get('/password-hint', (req, res) => {
  try {
    const hint = queryOne('SELECT value FROM settings WHERE key = ?', ['password_hint'])
    res.json({ hint: hint?.value || '' })
  } catch (error) {
    console.error('获取密码提示失败:', error)
    res.json({ hint: '' })
  }
})

// 保存密码提示（需要认证）
router.post('/password-hint', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    const { hint } = req.body
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
    const userAgent = (req.headers['user-agent'] || '') as string

    const existing = queryOne('SELECT * FROM settings WHERE key = ?', ['password_hint'])
    
    if (existing) {
      run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [
        hint || '',
        new Date().toISOString(),
        'password_hint'
      ])
    } else {
      run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [
        'password_hint',
        hint || '',
        new Date().toISOString()
      ])
    }

    logAudit({
      userId: user.id,
      username: user.username,
      action: 'UPDATE_PASSWORD_HINT',
      resourceType: 'settings',
      ip,
      userAgent
    })

    res.json({ success: true })
  } catch (error) {
    console.error('保存密码提示失败:', error)
    res.status(500).json({ error: '保存密码提示失败' })
  }
})

export default router
