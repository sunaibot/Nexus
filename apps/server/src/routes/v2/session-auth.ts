/**
 * Session 认证路由 - V2版本
 * 提供基于后端 Session 的认证接口
 */

import { Router, Request, Response } from 'express'
import { sessionAuthMiddleware, adminSessionMiddleware, loginSession, logoutSession, getSessionUser } from '../../middleware/sessionAuth.js'
import { hashPassword, verifyPassword, logAudit, generateId } from '../../db/index.js'
import { queryOne, run } from '../../utils/index.js'
import { isLocked, recordFailedAttempt, clearLock } from '../../utils/securityLock.js'
import { authLimiter } from '../../middleware/index.js'

const router = Router()

interface User {
  id: string
  username: string
  password: string
  email: string
  role: string
  isDefaultPassword: number
}

// 管理员登录 - 使用 Session
router.post('/admin/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const clientIp = req.ip || 'unknown'

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      })
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

    // 查询用户
    const user = queryOne(
      'SELECT * FROM users WHERE username = ? AND role = ?',
      [username.toLowerCase(), 'admin']
    ) as User | null

    if (!user) {
      const failResult = recordFailedAttempt(clientIp, username.toLowerCase(), 'extract')
      return res.status(401).json({
        success: false,
        error: `用户名或密码错误，还剩${failResult.remainingAttempts}次机会`,
        remainingAttempts: failResult.remainingAttempts
      })
    }

    // 验证密码
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

    // 清除失败记录
    clearLock(clientIp, username.toLowerCase(), 'extract')

    // 设置 Session
    loginSession(req, {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    })

    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'LOGIN',
      resourceType: 'session',
      resourceId: user.id,
      details: JSON.stringify({ method: 'password', type: 'admin' }),
      ip: clientIp,
      userAgent: req.headers['user-agent'] || 'unknown'
    })

    res.json({
      success: true,
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

// 管理员验证 - 检查 Session 是否有效
router.get('/admin/verify', sessionAuthMiddleware, (req: Request, res: Response) => {
  try {
    const user = getSessionUser(req)
    res.json({
      valid: true,
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      } : null
    })
  } catch (error) {
    console.error('Admin verify error:', error)
    res.status(500).json({ valid: false, error: '验证失败' })
  }
})

// 管理员登出 - 销毁 Session
router.post('/admin/logout', sessionAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.sessionUser

    // 销毁 Session
    await logoutSession(req)

    // 记录审计日志
    if (user) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: 'LOGOUT',
        resourceType: 'session',
        resourceId: user.id,
        details: JSON.stringify({ type: 'admin' }),
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Admin logout error:', error)
    res.status(500).json({ success: false, error: '登出失败' })
  }
})

// 获取当前登录用户信息
router.get('/me', sessionAuthMiddleware, (req: Request, res: Response) => {
  const user = getSessionUser(req)
  res.json({
    success: true,
    user: user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    } : null
  })
})

export default router
