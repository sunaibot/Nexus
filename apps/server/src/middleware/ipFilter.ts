import { Request, Response, NextFunction } from 'express'
import { checkIpAccess } from '../db/index.js'
import { getSystemSecurityConfig } from '../utils/envValidator.js'

export function ipFilterMiddleware(req: Request, res: Response, next: NextFunction) {
  const { enableIpFilter } = getSystemSecurityConfig()
  
  if (!enableIpFilter) {
    return next()
  }
  
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
  const { allowed, reason } = checkIpAccess(ip)
  
  if (!allowed) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      reason
    })
  }
  
  next()
}
