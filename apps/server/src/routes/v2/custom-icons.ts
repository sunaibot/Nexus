/**
 * 自定义图标路由 - V2版本
 * 管理用户自定义图标
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 自定义图标接口
export interface CustomIcon {
  id: string
  name: string
  url: string
  userId?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// 获取所有自定义图标（公开 + 用户自己的）
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    let sql = 'SELECT * FROM custom_icons WHERE isPublic = 1'
    const params: any[] = []
    
    if (user) {
      // 登录用户可以看到公开图标 + 自己的图标
      sql = 'SELECT * FROM custom_icons WHERE isPublic = 1 OR userId = ?'
      params.push(user.id)
    }
    
    sql += ' ORDER BY createdAt DESC'
    
    const icons = queryAll(sql, params)
    return successResponse(res, icons.map((row: any) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      userId: row.userId,
      isPublic: row.isPublic === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })))
  } catch (error) {
    console.error('获取自定义图标失败:', error)
    return errorResponse(res, '获取自定义图标失败')
  }
})

// 创建自定义图标
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, url, isPublic = false } = req.body
    
    if (!name || !url) {
      return errorResponse(res, '名称和URL不能为空', 400)
    }
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      `INSERT INTO custom_icons (id, name, url, userId, isPublic, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, url, user?.id || null, isPublic ? 1 : 0, now, now]
    )
    
    const newIcon = queryOne('SELECT * FROM custom_icons WHERE id = ?', [id])
    return successResponse(res, {
      id: newIcon.id,
      name: newIcon.name,
      url: newIcon.url,
      userId: newIcon.userId,
      isPublic: newIcon.isPublic === 1,
      createdAt: newIcon.createdAt,
      updatedAt: newIcon.updatedAt,
    }, 201)
  } catch (error) {
    console.error('创建自定义图标失败:', error)
    return errorResponse(res, '创建自定义图标失败')
  }
})

// 更新自定义图标
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    const { name, url, isPublic } = req.body
    
    const existing = queryOne('SELECT * FROM custom_icons WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '图标不存在', 404)
    }
    
    // 检查权限（只能修改自己的图标，管理员可以修改所有）
    if (existing.userId && existing.userId !== user?.id && user?.role !== 'admin') {
      return errorResponse(res, '无权修改此图标', 403)
    }
    
    const now = new Date().toISOString()
    const updates: string[] = []
    const params: any[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (url !== undefined) {
      updates.push('url = ?')
      params.push(url)
    }
    if (isPublic !== undefined) {
      updates.push('isPublic = ?')
      params.push(isPublic ? 1 : 0)
    }
    
    if (updates.length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }
    
    updates.push('updatedAt = ?')
    params.push(now)
    params.push(id)
    
    run(
      `UPDATE custom_icons SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
    
    const updated = queryOne('SELECT * FROM custom_icons WHERE id = ?', [id])
    return successResponse(res, {
      id: updated.id,
      name: updated.name,
      url: updated.url,
      userId: updated.userId,
      isPublic: updated.isPublic === 1,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    console.error('更新自定义图标失败:', error)
    return errorResponse(res, '更新自定义图标失败')
  }
})

// 删除自定义图标
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    const existing = queryOne('SELECT * FROM custom_icons WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '图标不存在', 404)
    }
    
    // 检查权限（只能删除自己的图标，管理员可以删除所有）
    if (existing.userId && existing.userId !== user?.id && user?.role !== 'admin') {
      return errorResponse(res, '无权删除此图标', 403)
    }
    
    run('DELETE FROM custom_icons WHERE id = ?', [id])
    return successResponse(res, { message: '图标已删除' })
  } catch (error) {
    console.error('删除自定义图标失败:', error)
    return errorResponse(res, '删除自定义图标失败')
  }
})

export default router
