/**
 * 小部件路由模块
 * 提供用户小部件管理功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import {
  getUserWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  type Widget
} from '../../../../db/index.js'
import { validateBody, validateParams, createWidgetSchema, updateWidgetSchema, idParamSchema } from '../../../../schemas.js'
import { logAudit } from '../../../../db/audit-enhanced.js'

const router = Router()

// 获取当前用户的所有小部件
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const widgets = getUserWidgets(user.id)
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

    const widget = createWidget(user.id, name, type, config || {}, orderIndex || 0)
    if (!widget) {
      return errorResponse(res, '创建小部件失败', 500)
    }

    // 记录创建小部件日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CREATE_WIDGET',
      resourceType: 'widget',
      resourceId: String(widget.id),
      details: { name, type },
      ip: req.ip ? String(req.ip) : 'unknown',
      userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : '',
      riskLevel: 'low'
    })

    return successResponse(res, widget)
  } catch (error) {
    console.error('创建小部件失败:', error)
    return errorResponse(res, '创建小部件失败')
  }
})

// 更新小部件
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateWidgetSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = req.params.id as string
    const { name, type, config, orderIndex } = req.body

    // 检查小部件是否存在且属于当前用户
    const existing = getUserWidgets(user.id).find((w: Widget) => w.id === id)
    if (!existing) {
      return errorResponse(res, '小部件不存在', 404)
    }

    const updates: Partial<Widget> = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) updates.type = type
    if (config !== undefined) updates.config = config
    if (orderIndex !== undefined) updates.orderIndex = orderIndex

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }

    const success = updateWidget(id, user.id, updates)
    if (!success) {
      return errorResponse(res, '更新小部件失败', 500)
    }

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
    const id = req.params.id as string

    // 检查小部件是否存在且属于当前用户
    const existing = getUserWidgets(user.id).find((w: Widget) => w.id === id)
    if (!existing) {
      return errorResponse(res, '小部件不存在', 404)
    }

    const success = deleteWidget(id, user.id)
    if (!success) {
      return errorResponse(res, '删除小部件失败', 500)
    }

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
