import { Request, Response, NextFunction } from 'express'
import { logAudit } from '../db/index.js'

export interface AuditLogOptions {
  action: string
  resourceType?: string
  getResourceId?: (req: Request) => string | undefined
  getDetails?: (req: Request, res: Response) => any
}

export function auditLog(options: AuditLogOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send.bind(res)

    res.send = function (data: any) {
      let resourceId: string | undefined
      if (options.getResourceId) {
        resourceId = options.getResourceId(req)
      }

      let details: any
      if (options.getDetails) {
        details = options.getDetails(req, res)
      }

      const userId = (req as any).user?.id || null
      const username = (req as any).user?.username || null
      const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
      const userAgent = (req.headers['user-agent'] || '') as string

      logAudit({
        userId,
        username,
        action: options.action,
        resourceType: options.resourceType,
        resourceId,
        details,
        ip,
        userAgent
      })

      return originalSend(data)
    }

    next()
  }
}

export function logAuditDirect(
  req: Request,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
) {
  const userId = (req as any).user?.id || null
  const username = (req as any).user?.username || null
  const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
  const userAgent = (req.headers['user-agent'] || '') as string

  logAudit({
    userId,
    username,
    action,
    resourceType,
    resourceId,
    details,
    ip,
    userAgent
  })
}
