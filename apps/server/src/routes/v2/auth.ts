/**
 * 认证路由 - V2版本
 * 提供统一的认证接口，兼容前端调用
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware, generateToken, authLimiter } from '../../middleware/auth.js'
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
router.post('/admin/login', authLimiter, async (req: Request, res: Response) => {
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

// ========== 密码重置 ==========

import { userService } from '../../services/UserService.js'
import { publicApiLimiter } from '../../middleware/index.js'

// 请求密码重置 - 发送重置邮件
router.post('/forgot-password', publicApiLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    const clientIp = req.ip || 'unknown'

    if (!email) {
      return res.status(400).json({ success: false, error: '邮箱不能为空' })
    }

    // 创建密码重置令牌
    const result = await userService.createPasswordResetToken(email)

    if (!result.success) {
      // 为了安全，即使邮箱不存在也返回成功，但这里返回错误信息用于调试
      return res.status(404).json({ success: false, error: result.error })
    }

    // 记录审计日志
    logAudit({
      userId: 'unknown',
      username: email,
      action: 'PASSWORD_RESET_REQUEST',
      resourceType: 'auth',
      details: { token: result.token },
      ip: clientIp,
      userAgent: req.headers['user-agent'] || ''
    })

    // TODO: 发送邮件（需要配置邮件服务）
    // 暂时返回令牌用于测试，生产环境应该发送邮件
    res.json({
      success: true,
      message: '密码重置请求已提交，请检查您的邮箱',
      token: process.env.NODE_ENV === 'development' ? result.token : undefined
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ success: false, error: '请求失败' })
  }
})

// 验证密码重置令牌
router.get('/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: '令牌不能为空' })
    }

    const result = await userService.verifyResetToken(token)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({
      success: true,
      user: result.user
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    res.status(500).json({ success: false, error: '验证失败' })
  }
})

// 重置密码
router.post('/reset-password', publicApiLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body
    const clientIp = req.ip || 'unknown'

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: '令牌和新密码不能为空' })
    }

    const result = await userService.resetPasswordByToken(token, newPassword)

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error })
    }

    // 记录审计日志
    logAudit({
      userId: 'unknown',
      username: 'unknown',
      action: 'PASSWORD_RESET_SUCCESS',
      resourceType: 'auth',
      details: { method: 'token' },
      ip: clientIp,
      userAgent: req.headers['user-agent'] || ''
    })

    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ success: false, error: '重置失败' })
  }
})

export default router
