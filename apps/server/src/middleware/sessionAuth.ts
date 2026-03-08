/**
 * Session 认证中间件
 * 提供基于后端 Session 的认证机制
 */

import { Request, Response, NextFunction } from 'express'
import { queryOne } from '../utils/index.js'

// 扩展 Express Session 类型
declare module 'express-session' {
  interface SessionData {
    userId?: string
    username?: string
    role?: string
    email?: string
    loginTime?: number
  }
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      sessionUser?: {
        id: string
        username: string
        role: string
        email?: string
      }
    }
  }
}

/**
 * Session 认证中间件
 * 检查用户是否已登录（通过 Session）
 */
export function sessionAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 检查 Session 中是否有用户信息
  if (req.session && req.session.userId && req.session.username && req.session.role) {
    // 将用户信息附加到请求对象
    req.sessionUser = {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      email: req.session.email
    }
    next()
    return
  }

  // 未登录，返回 401
  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: '未登录，请先登录'
    }
  })
}

/**
 * 可选的 Session 认证中间件
 * 如果用户已登录，附加用户信息；否则继续执行
 */
export function optionalSessionAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.userId && req.session.username && req.session.role) {
    req.sessionUser = {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      email: req.session.email
    }
  }
  next()
}

/**
 * 管理员权限检查中间件
 * 检查用户是否为管理员
 */
export function adminSessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未登录，请先登录'
      }
    })
    return
  }

  if (req.sessionUser.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '无权访问，需要管理员权限'
      }
    })
    return
  }

  next()
}

/**
 * 登录用户（设置 Session）
 */
export function loginSession(req: Request, user: { id: string; username: string; role: string; email?: string }): void {
  req.session.userId = user.id
  req.session.username = user.username
  req.session.role = user.role
  req.session.email = user.email
  req.session.loginTime = Date.now()
}

/**
 * 登出用户（销毁 Session）
 */
export function logoutSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * 获取当前登录用户信息
 */
export function getSessionUser(req: Request): { id: string; username: string; role: string; email?: string } | null {
  if (req.session && req.session.userId && req.session.username && req.session.role) {
    return {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      email: req.session.email
    }
  }
  return null
}
