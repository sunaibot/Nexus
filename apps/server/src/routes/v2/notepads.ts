/**
 * 记事本路由 - V2版本
 * 提供记事本管理功能，支持多用户数据隔离
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { generateId } from '../../db/index.js'
import { queryAll, queryOne, run } from '../../utils/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { validateBody, validateParams, idParamSchema } from '../../schemas.js'
import { z } from 'zod'

const router = Router()

// 创建记事本验证schema
const createNotepadSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().max(10000, '内容不能超过10000字符').optional(),
})

// 更新记事本验证schema
const updateNotepadSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  content: z.string().max(10000, '内容不能超过10000字符').optional(),
})

// 获取记事本列表（带用户隔离）
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    const notepads = queryAll(
      'SELECT * FROM notepads WHERE userId = ? ORDER BY updatedAt DESC',
      [user.id]
    )
    
    return successResponse(res, notepads)
  } catch (error) {
    console.error('获取记事本列表失败:', error)
    return errorResponse(res, '获取记事本列表失败')
  }
})

// 创建记事本（带用户隔离）
router.post('/', authMiddleware, validateBody(createNotepadSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { title, content } = req.body
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      'INSERT INTO notepads (id, userId, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user.id, title, content || '', now, now]
    )
    
    return successResponse(res, { id, title, content, userId: user.id })
  } catch (error) {
    console.error('创建记事本失败:', error)
    return errorResponse(res, '创建记事本失败')
  }
})

// 获取单个记事本（带用户隔离验证）
router.get('/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    const notepad = queryOne(
      'SELECT * FROM notepads WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!notepad) {
      return errorResponse(res, '记事本不存在或无权限访问', 404)
    }
    
    return successResponse(res, notepad)
  } catch (error) {
    console.error('获取记事本失败:', error)
    return errorResponse(res, '获取记事本失败')
  }
})

// 更新记事本（带用户隔离验证）
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateNotepadSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    const { title, content } = req.body
    
    // 验证所有权
    const existing = queryOne(
      'SELECT * FROM notepads WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '记事本不存在或无权限访问', 404)
    }
    
    const updates: string[] = []
    const params: any[] = []
    
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    if (content !== undefined) {
      updates.push('content = ?')
      params.push(content)
    }
    
    if (updates.length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }
    
    updates.push('updatedAt = ?')
    params.push(new Date().toISOString())
    params.push(id)
    params.push(user.id)
    
    run(
      `UPDATE notepads SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      params
    )
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('更新记事本失败:', error)
    return errorResponse(res, '更新记事本失败')
  }
})

// 删除记事本（带用户隔离验证）
router.delete('/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    // 验证所有权
    const existing = queryOne(
      'SELECT * FROM notepads WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '记事本不存在或无权限访问', 404)
    }
    
    run('DELETE FROM notepads WHERE id = ? AND userId = ?', [id, user.id])
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('删除记事本失败:', error)
    return errorResponse(res, '删除记事本失败')
  }
})

export default router
