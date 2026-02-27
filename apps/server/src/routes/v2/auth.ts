/**
 * 认证路由 - V2版本
 * 提供统一的认证接口，兼容前端调用
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware, generateToken } from '../../middleware/auth.js'
import { hashPassword, verifyPassword, logAudit, generateId } from '../../db/index.js'
import { queryOne, run } from '../../utils/index.js'
import { saveTokenToDb, deleteTokenFromDb, getSessionTimeout } from '../../middleware/auth.js'
import { isLocked, recordFailedAttempt, clearLock } from '../../utils/securityLock.js'

const router = Router()

interface User {
  id: string
  username: string
  password: string
  email: string
  role: 'admin' | 'user'
  isActive: number
  isDefaultPassword?: number
  createdAt: string
  updatedAt: string
}

// ========== 管理员认证 ==========

// 管理员登录 - 兼容 /auth/admin/login
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const clientIp = req.ip || 'unknown'
    const userAgent = req.headers['user-agent'] || ''

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    }

    // 检查是否被锁定
    const lockStatus = isLocked(clientIp, username.toLowerCase(), 'extract')
    if (lockStatus.locked) {
      return res.status(423).json({
        success: false,
        error: `登录失败次数过多，请${lockStatus.remainingTime}分钟后重试`,
        locked: true,
        remainingTime: lockStatus.remainingTime
      })
    }

    const user = queryOne('SELECT * FROM users WHERE username = ? AND isActive = 1', [username]) as User | null

    if (!user) {
      const failResult = recordFailedAttempt(clientIp, username.toLowerCase(), 'extract')
      return res.status(401).json({
        success: false,
        error: `用户名或密码错误，还剩${failResult.remainingAttempts}次机会`,
        remainingAttempts: failResult.remainingAttempts
      })
    }

    // 检查是否是管理员
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '无权访问管理员接口' })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      const failResult = recordFailedAttempt(clientIp, username.toLowerCase(), 'extract')
      if (failResult.locked) {
        return res.status(423).json({
          success: false,
          error: '登录失败次数过多，已锁定15分钟',
          locked: true,
          remainingTime: 15
        })
      }
      return res.status(401).json({
        success: false,
        error: `用户名或密码错误，还剩${failResult.remainingAttempts}次机会`,
        remainingAttempts: failResult.remainingAttempts
      })
    }

    // 登录成功
    clearLock(clientIp, username.toLowerCase(), 'extract')

    const token = generateToken()
    const { ms: timeoutMs } = getSessionTimeout()
    saveTokenToDb(token, user.id, user.username, Date.now() + timeoutMs)

    logAudit({
      userId: user.id,
      username: user.username,
      action: 'ADMIN_LOGIN_SUCCESS',
      resourceType: 'auth',
      ip: clientIp,
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
    console.error('Admin login error:', error)
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

// 管理员验证 - 兼容 /auth/admin/verify
router.get('/admin/verify', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    })
  } catch (error) {
    console.error('Admin verify error:', error)
    res.status(500).json({ valid: false, error: '验证失败' })
  }
})

// 管理员登出 - 兼容 /auth/admin/logout
router.post('/admin/logout', authMiddleware, (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      deleteTokenFromDb(token)
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Admin logout error:', error)
    res.status(500).json({ success: false, error: '登出失败' })
  }
})

// ========== 用户认证 ==========

// 用户登录 - 兼容 /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const clientIp = req.ip || 'unknown'
    const userAgent = req.headers['user-agent'] || ''

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    }

    // 检查是否被锁定
    const lockStatus = isLocked(clientIp, username.toLowerCase(), 'extract')
    if (lockStatus.locked) {
      return res.status(423).json({
        success: false,
        error: `登录失败次数过多，请${lockStatus.remainingTime}分钟后重试`,
        locked: true,
        remainingTime: lockStatus.remainingTime
      })
    }

    const user = queryOne('SELECT * FROM users WHERE username = ? AND isActive = 1', [username]) as User | null

    if (!user) {
      const failResult = recordFailedAttempt(clientIp, username.toLowerCase(), 'extract')
      return res.status(401).json({
        success: false,
        error: `用户名或密码错误，还剩${failResult.remainingAttempts}次机会`,
        remainingAttempts: failResult.remainingAttempts
      })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      const failResult = recordFailedAttempt(clientIp, username.toLowerCase(), 'extract')
      if (failResult.locked) {
        return res.status(423).json({
          success: false,
          error: '登录失败次数过多，已锁定15分钟',
          locked: true,
          remainingTime: 15
        })
      }
      return res.status(401).json({
        success: false,
        error: `用户名或密码错误，还剩${failResult.remainingAttempts}次机会`,
        remainingAttempts: failResult.remainingAttempts
      })
    }

    // 登录成功
    clearLock(clientIp, username.toLowerCase(), 'extract')

    const token = generateToken()
    const { ms: timeoutMs } = getSessionTimeout()
    saveTokenToDb(token, user.id, user.username, Date.now() + timeoutMs)

    logAudit({
      userId: user.id,
      username: user.username,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'auth',
      ip: clientIp,
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
      }
    })
  } catch (error) {
    console.error('User login error:', error)
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

// 用户注册 - 兼容 /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body
    const clientIp = req.ip || 'unknown'
    const userAgent = req.headers['user-agent'] || ''

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    }

    // 检查用户名是否已存在
    const existingUser = queryOne('SELECT * FROM users WHERE username = ?', [username])
    if (existingUser) {
      return res.status(409).json({ success: false, error: '用户名已存在' })
    }

    const id = generateId()
    const hashedPassword = await hashPassword(password)
    const now = new Date().toISOString()

    run(
      'INSERT INTO users (id, username, password, email, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, hashedPassword, email || null, 'user', 1, now, now]
    )

    logAudit({
      userId: id,
      username,
      action: 'USER_REGISTER',
      resourceType: 'auth',
      ip: clientIp,
      userAgent
    })

    // 注册成功后自动登录
    const token = generateToken()
    const { ms: timeoutMs } = getSessionTimeout()
    saveTokenToDb(token, id, username, Date.now() + timeoutMs)

    res.json({
      success: true,
      token,
      user: {
        id,
        username,
        email: email || null,
        role: 'user',
      }
    })
  } catch (error) {
    console.error('User register error:', error)
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

// 用户验证 - 兼容 /auth/verify
router.get('/verify', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    })
  } catch (error) {
    console.error('User verify error:', error)
    res.status(500).json({ valid: false, error: '验证失败' })
  }
})

// 用户登出 - 兼容 /auth/logout
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      deleteTokenFromDb(token)
    }
    res.json({ success: true })
  } catch (error) {
    console.error('User logout error:', error)
    res.status(500).json({ success: false, error: '登出失败' })
  }
})

export default router
