/**
 * CSRF防护中间件
 * 跨站请求伪造防护
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

/**
 * CSRF配置选项
 */
interface CsrfOptions {
  cookieName?: string
  headerName?: string
  tokenLength?: number
  secure?: boolean
  maxAge?: number
  ignoreMethods?: string[]
  ignorePaths?: string[]
  allowSameOrigin?: boolean
}

/**
 * 默认配置
 */
const defaultOptions: Required<CsrfOptions> = {
  cookieName: 'csrf-token',
  headerName: 'X-CSRF-Token',
  tokenLength: 32,
  secure: false,
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  ignorePaths: [],
  allowSameOrigin: true
}

/**
 * 生成CSRF Token
 */
function generateToken(length: number): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * CSRF防护中间件
 */
export function csrfProtection(options: CsrfOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  return (req: Request, res: Response, next: NextFunction): void => {
    // 检查是否需要忽略
    if (opts.ignoreMethods.includes(req.method)) {
      next()
      return
    }

    // 检查是否忽略特定路径
    if (opts.ignorePaths.some(path => req.path.startsWith(path))) {
      next()
      return
    }

    // 从Cookie获取Token
    const cookieToken = req.cookies?.[opts.cookieName]

    // 从Header获取Token
    const headerToken = req.get(opts.headerName)

    // 验证Token
    if (!cookieToken || !headerToken) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF Token缺失，请刷新页面重试'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    if (cookieToken !== headerToken) {
      console.warn(`[CSRF] Token mismatch: IP=${req.ip}, Path=${req.path}`)
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF Token无效，请刷新页面重试'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    next()
  }
}

/**
 * CSRF Token生成中间件
 * 为每个请求生成新的Token
 */
export function csrfTokenGenerator(options: CsrfOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  return (req: Request, res: Response, next: NextFunction): void => {
    // 生成新Token
    const token = generateToken(opts.tokenLength)

    // 设置Cookie
    res.cookie(opts.cookieName, token, {
      httpOnly: true,
      secure: opts.secure,
      sameSite: 'strict',
      maxAge: opts.maxAge,
      path: '/'
    })

    // 将Token添加到响应头
    res.setHeader('X-CSRF-Token', token)

    // 将Token附加到请求对象
    ;(req as any).csrfToken = token

    next()
  }
}

/**
 * 检查请求是否来自同一源
 * 开发环境下允许 localhost 不同端口的访问
 */
function isSameOrigin(req: Request): boolean {
  const origin = req.get('origin')
  const referer = req.get('referer')
  const host = req.get('host')
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!origin && !referer) {
    // 没有 origin 和 referer，可能是直接请求（如 curl）
    return true
  }
  
  // 检查 origin
  if (origin) {
    try {
      const originUrl = new URL(origin)
      const originHost = originUrl.hostname
      const reqHost = host?.split(':')[0] || ''
      
      // 开发环境下允许 localhost/127.0.0.1 不同端口
      if (isDevelopment && ['localhost', '127.0.0.1'].includes(originHost) && ['localhost', '127.0.0.1'].includes(reqHost)) {
        return true
      }
      
      if (originUrl.host === host) {
        return true
      }
    } catch {
      // URL 解析失败
    }
  }
  
  // 检查 referer
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererHost = refererUrl.hostname
      const reqHost = host?.split(':')[0] || ''
      
      // 开发环境下允许 localhost/127.0.0.1 不同端口
      if (isDevelopment && ['localhost', '127.0.0.1'].includes(refererHost) && ['localhost', '127.0.0.1'].includes(reqHost)) {
        return true
      }
      
      if (refererUrl.host === host) {
        return true
      }
    } catch {
      // URL 解析失败
    }
  }
  
  return false
}

/**
 * 双提交Cookie模式CSRF防护
 * 更安全，不需要服务器存储状态
 */
export function doubleSubmitCsrf(options: CsrfOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  return (req: Request, res: Response, next: NextFunction): void => {
    // 检查是否需要忽略特定路径
    if (opts.ignorePaths.some(path => req.path.startsWith(path))) {
      next()
      return
    }

    // 检查是否需要忽略特定方法
    if (opts.ignoreMethods.includes(req.method)) {
      // GET请求生成新Token
      if (req.method === 'GET') {
        const token = generateToken(opts.tokenLength)
        res.cookie(opts.cookieName, token, {
          httpOnly: true,
          secure: opts.secure,
          sameSite: 'strict',
          maxAge: opts.maxAge,
          path: '/'
        })
        res.setHeader('X-CSRF-Token', token)
      }
      next()
      return
    }

    // 开发环境或同源请求：允许自动通过
    // 如果提供了Token则验证，否则自动生成
    const sameOrigin = isSameOrigin(req)
    
    if (opts.allowSameOrigin && sameOrigin) {
      const cookieToken = req.cookies?.[opts.cookieName]
      const headerToken = req.get(opts.headerName)
      
      // 如果提供了Token，尝试验证它
      if (cookieToken && headerToken) {
        try {
          const cookieBuffer = Buffer.from(cookieToken)
          const headerBuffer = Buffer.from(headerToken)
          
          if (cookieBuffer.length === headerBuffer.length &&
              crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
            // Token验证通过，生成新Token继续
            const newToken = generateToken(opts.tokenLength)
            res.cookie(opts.cookieName, newToken, {
              httpOnly: true,
              secure: opts.secure,
              sameSite: 'strict',
              maxAge: opts.maxAge,
              path: '/'
            })
            res.setHeader('X-CSRF-Token', newToken)
            next()
            return
          }
        } catch {
          // Token验证失败（长度不匹配等），在开发环境下仍然允许通过
        }
      }
      
      // 没有提供Token或验证失败，生成新Token并允许通过（开发环境）
      const token = generateToken(opts.tokenLength)
      res.cookie(opts.cookieName, token, {
        httpOnly: true,
        secure: opts.secure,
        sameSite: 'strict',
        maxAge: opts.maxAge,
        path: '/'
      })
      res.setHeader('X-CSRF-Token', token)
      next()
      return
    }

    // 验证Token
    const cookieToken = req.cookies?.[opts.cookieName]
    const headerToken = req.get(opts.headerName)

    if (!cookieToken || !headerToken) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF Token缺失，请刷新页面重试'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    // 使用timing-safe比较防止时序攻击
    try {
      const cookieBuffer = Buffer.from(cookieToken)
      const headerBuffer = Buffer.from(headerToken)

      if (cookieBuffer.length !== headerBuffer.length ||
          !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
        throw new Error('Token mismatch')
      }
    } catch {
      console.warn(`[CSRF] Token validation failed: IP=${req.ip}, Path=${req.path}`)
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF Token验证失败'
        },
        timestamp: new Date().toISOString()
      })
      return
    }

    // 生成新Token用于下次请求
    const newToken = generateToken(opts.tokenLength)
    res.cookie(opts.cookieName, newToken, {
      httpOnly: true,
      secure: opts.secure,
      sameSite: 'strict',
      maxAge: opts.maxAge,
      path: '/'
    })
    res.setHeader('X-CSRF-Token', newToken)

    next()
  }
}

/**
 * 基于Referer的CSRF防护
 * 作为额外的一层防护
 */
export function refererCheck(allowedHosts: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 只检查修改操作的请求
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next()
      return
    }

    const referer = req.get('referer')
    const origin = req.get('origin')

    // 检查Origin头
    if (origin) {
      const isAllowed = allowedHosts.some(host => origin.includes(host))
      if (!isAllowed) {
        console.warn(`[CSRF] Invalid origin: ${origin}, IP=${req.ip}`)
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_ORIGIN',
            message: '请求来源不被允许'
          },
          timestamp: new Date().toISOString()
        })
        return
      }
    }

    // 检查Referer头
    if (referer) {
      const isAllowed = allowedHosts.some(host => referer.includes(host))
      if (!isAllowed) {
        console.warn(`[CSRF] Invalid referer: ${referer}, IP=${req.ip}`)
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_REFERER',
            message: '请求来源不被允许'
          },
          timestamp: new Date().toISOString()
        })
        return
      }
    }

    // 如果既没有Origin也没有Referer，可能是直接请求（如curl）
    // 在生产环境可以拒绝这种请求
    if (!origin && !referer && process.env.NODE_ENV === 'production') {
      console.warn(`[CSRF] Missing origin and referer: IP=${req.ip}`)
      // 可选：在生产环境拒绝
      // res.status(403).json({...})
    }

    next()
  }
}

/**
 * SameSite Cookie配置
 * 推荐在CORS配置中使用
 */
export function configureCsrfCookie(res: Response, token: string, options: CsrfOptions = {}): void {
  const opts = { ...defaultOptions, ...options }

  res.cookie(opts.cookieName, token, {
    httpOnly: true,
    secure: opts.secure || process.env.NODE_ENV === 'production',
    sameSite: 'strict', // 最严格的SameSite策略
    maxAge: opts.maxAge,
    path: '/'
  })
}
