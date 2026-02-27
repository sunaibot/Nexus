/**
 * 通用CRUD路由基类
 * 提供标准化的RESTful路由实现，减少重复代码
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { normalizeId, handleError, getUserId } from './routeHelpers.js'

export interface CrudService<T> {
  getAllByUser(userId: string, ...args: any[]): T[]
  getById(id: string): T | null
  create: (...args: any[]) => string | null
  update: (...args: any[]) => boolean
  delete: (...args: any[]) => boolean
  checkOwnership?(item: T, userId: string): boolean
}

export interface CrudRouterOptions<T> {
  service: CrudService<T>
  resourceName: string
  requiredFields?: string[]
  customRoutes?: (router: Router) => void
}

export function createCrudRouter<T>(options: CrudRouterOptions<T>): Router {
  const router = Router()
  const { service, resourceName, requiredFields = [], customRoutes } = options

  router.use(authMiddleware)

  // 获取所有资源
  router.get('/', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)
      const items = service.getAllByUser(userId)
      res.json({ success: true, data: items })
    } catch (error) {
      handleError(res, error, `获取${resourceName}列表失败`)
    }
  })

  // 获取单个资源
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)
      const id = normalizeId(req.params.id)

      if (!id) {
        return res.status(400).json({ success: false, error: `${resourceName} ID is required` })
      }

      const item = service.getById(id)
      if (!item) {
        return res.status(404).json({ success: false, error: `${resourceName} not found` })
      }

      // 检查权限
      if (service.checkOwnership && !service.checkOwnership(item, userId)) {
        return res.status(403).json({ success: false, error: `无权访问该${resourceName}` })
      }

      res.json({ success: true, data: item })
    } catch (error) {
      handleError(res, error, `获取${resourceName}失败`)
    }
  })

  // 创建资源
  router.post('/', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)

      // 验证必填字段
      for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
          return res.status(400).json({ success: false, error: `${field} is required` })
        }
      }

      const id = service.create(userId, req.body)
      if (!id) {
        return res.status(500).json({ success: false, error: `创建${resourceName}失败` })
      }

      const item = service.getById(id)
      res.json({ success: true, data: item })
    } catch (error) {
      handleError(res, error, `创建${resourceName}失败`)
    }
  })

  // 更新资源
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)
      const id = normalizeId(req.params.id)

      if (!id) {
        return res.status(400).json({ success: false, error: `${resourceName} ID is required` })
      }

      // 检查资源是否存在
      const existing = service.getById(id)
      if (!existing) {
        return res.status(404).json({ success: false, error: `${resourceName} not found` })
      }

      // 检查权限
      if (service.checkOwnership && !service.checkOwnership(existing, userId)) {
        return res.status(403).json({ success: false, error: `无权访问该${resourceName}` })
      }

      const success = service.update(id, req.body)
      if (!success) {
        return res.status(500).json({ success: false, error: `更新${resourceName}失败` })
      }

      const item = service.getById(id)
      res.json({ success: true, data: item })
    } catch (error) {
      handleError(res, error, `更新${resourceName}失败`)
    }
  })

  // 删除资源
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)
      const id = normalizeId(req.params.id)

      if (!id) {
        return res.status(400).json({ success: false, error: `${resourceName} ID is required` })
      }

      // 检查资源是否存在
      const existing = service.getById(id)
      if (!existing) {
        return res.status(404).json({ success: false, error: `${resourceName} not found` })
      }

      // 检查权限
      if (service.checkOwnership && !service.checkOwnership(existing, userId)) {
        return res.status(403).json({ success: false, error: `无权访问该${resourceName}` })
      }

      const success = service.delete(id)
      if (!success) {
        return res.status(500).json({ success: false, error: `删除${resourceName}失败` })
      }

      res.json({ success: true, data: null })
    } catch (error) {
      handleError(res, error, `删除${resourceName}失败`)
    }
  })

  // 添加自定义路由
  if (customRoutes) {
    customRoutes(router)
  }

  return router
}
