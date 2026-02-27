/**
 * 小部件路由 - V2版本
 * 提供用户小部件管理功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'
import { validateBody, validateParams, createWidgetSchema, updateWidgetSchema, idParamSchema } from '../../schemas.js'
import { logAudit } from '../../db/audit-enhanced.js'

const router = Router()

// 获取当前用户的所有小部件
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const widgets = queryAll(
      'SELECT * FROM widgets WHERE userId = ? ORDER BY orderIndex ASC, createdAt DESC',
      [user.id]
    )
    return successResponse(res, widgets)
  } catch (error) {
    console.error('获取小部件列表失败:', error)
    return errorResponse(res, '获取小部件列表失败')
  }
})

// 创建小部件
router.post('/', authMiddleware, validateBody(createWidgetSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, type, config, orderIndex } = req.body

    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      'INSERT INTO widgets (id, userId, name, type, config, orderIndex, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.id, name, type, JSON.stringify(config || {}), orderIndex || 0, now, now]
    )
    
    // 记录创建小部件日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CREATE_WIDGET',
      resourceType: 'widget',
      resourceId: String(id),
      details: { name, type },
      ip: req.ip ? String(req.ip) : 'unknown',
      userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : '',
      riskLevel: 'low'
    })

    return successResponse(res, { id, name, type, config, orderIndex })
  } catch (error) {
    console.error('创建小部件失败:', error)
    return errorResponse(res, '创建小部件失败')
  }
})

// 更新小部件
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateWidgetSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    const { name, type, config, orderIndex } = req.body
    
    // 检查小部件是否存在且属于当前用户
    const existing = queryOne('SELECT * FROM widgets WHERE id = ? AND userId = ?', [id, user.id])
    if (!existing) {
      return errorResponse(res, '小部件不存在', 404)
    }
    
    const updates: string[] = []
    const params: any[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (type !== undefined) {
      updates.push('type = ?')
      params.push(type)
    }
    if (config !== undefined) {
      updates.push('config = ?')
      params.push(JSON.stringify(config))
    }
    if (orderIndex !== undefined) {
      updates.push('orderIndex = ?')
      params.push(orderIndex)
    }
    
    if (updates.length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }
    
    updates.push('updatedAt = ?')
    params.push(new Date().toISOString())
    params.push(id)
    params.push(user.id)
    
    run(
      `UPDATE widgets SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      params
    )
    
    // 记录更新小部件日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'UPDATE_WIDGET',
      resourceType: 'widget',
      resourceId: String(id),
      details: { name, type },
      ip: req.ip ? String(req.ip) : 'unknown',
      userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : '',
      riskLevel: 'low'
    })

    return successResponse(res, { id })
  } catch (error) {
    console.error('更新小部件失败:', error)
    return errorResponse(res, '更新小部件失败')
  }
})

// 删除小部件
router.delete('/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    // 检查小部件是否存在且属于当前用户
    const existing = queryOne('SELECT * FROM widgets WHERE id = ? AND userId = ?', [id, user.id])
    if (!existing) {
      return errorResponse(res, '小部件不存在', 404)
    }
    
    run('DELETE FROM widgets WHERE id = ? AND userId = ?', [id, user.id])
    
    // 记录删除小部件日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'DELETE_WIDGET',
      resourceType: 'widget',
      resourceId: String(id),
      details: { name: existing.name, type: existing.type },
      ip: req.ip ? String(req.ip) : 'unknown',
      userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : '',
      riskLevel: 'low'
    })

    return successResponse(res, { id })
  } catch (error) {
    console.error('删除小部件失败:', error)
    return errorResponse(res, '删除小部件失败')
  }
})

export default router
