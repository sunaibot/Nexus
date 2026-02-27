/**
 * 标签路由 - V2版本
 * 提供标签管理功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'
import { validateBody, validateParams, createTagSchema, updateTagSchema, idParamSchema } from '../../schemas.js'

const router = Router()

// 获取所有标签
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const tags = queryAll(
      `SELECT t.*, COUNT(bt.bookmarkId) as bookmarkCount 
       FROM tags t
       LEFT JOIN bookmark_tags bt ON t.id = bt.tagId
       WHERE t.userId = ?
       GROUP BY t.id
       ORDER BY t.createdAt DESC`,
      [user.id]
    )
    return successResponse(res, tags)
  } catch (error) {
    console.error('获取标签列表失败:', error)
    return errorResponse(res, '获取标签列表失败')
  }
})

// 获取标签详情
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    const tag = queryOne(
      `SELECT t.*, COUNT(bt.bookmarkId) as bookmarkCount 
       FROM tags t
       LEFT JOIN bookmark_tags bt ON t.id = bt.tagId
       WHERE t.id = ? AND t.userId = ?
       GROUP BY t.id`,
      [id, user.id]
    )
    
    if (!tag) {
      return errorResponse(res, '标签不存在', 404)
    }
    
    // 获取使用该标签的书签
    const bookmarks = queryAll(
      `SELECT b.* FROM bookmarks b
       JOIN bookmark_tags bt ON b.id = bt.bookmarkId
       WHERE bt.tagId = ?`,
      [id]
    )
    
    return successResponse(res, { ...tag, bookmarks })
  } catch (error) {
    console.error('获取标签详情失败:', error)
    return errorResponse(res, '获取标签详情失败')
  }
})

// 创建标签
router.post('/', authMiddleware, validateBody(createTagSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, color, description } = req.body

    // 检查标签名是否已存在
    const existing = queryOne(
      'SELECT * FROM tags WHERE name = ? AND userId = ?',
      [name, user.id]
    )
    
    if (existing) {
      return errorResponse(res, '标签名称已存在', 409)
    }

    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      'INSERT INTO tags (id, userId, name, color, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, user.id, name, color || '#3b82f6', description || null, now, now]
    )
    
    return successResponse(res, { id, name, color, description })
  } catch (error) {
    console.error('创建标签失败:', error)
    return errorResponse(res, '创建标签失败')
  }
})

// 更新标签
router.put('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateTagSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    const { name, color, description } = req.body
    
    // 检查标签是否存在且属于当前用户
    const existing = queryOne(
      'SELECT * FROM tags WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '标签不存在', 404)
    }
    
    // 如果修改名称，检查新名称是否已存在
    if (name && name !== existing.name) {
      const nameExists = queryOne(
        'SELECT * FROM tags WHERE name = ? AND userId = ? AND id != ?',
        [name, user.id, id]
      )
      
      if (nameExists) {
        return errorResponse(res, '标签名称已存在', 409)
      }
    }
    
    const updates: string[] = []
    const params: any[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (color !== undefined) {
      updates.push('color = ?')
      params.push(color)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    
    if (updates.length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }
    
    updates.push('updatedAt = ?')
    params.push(new Date().toISOString())
    params.push(id)
    params.push(user.id)
    
    run(
      `UPDATE tags SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      params
    )
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('更新标签失败:', error)
    return errorResponse(res, '更新标签失败')
  }
})

// 删除标签
router.delete('/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    // 检查标签是否存在且属于当前用户
    const existing = queryOne(
      'SELECT * FROM tags WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '标签不存在', 404)
    }
    
    // 删除标签与书签的关联
    run('DELETE FROM bookmark_tags WHERE tagId = ?', [id])
    
    // 删除标签
    run('DELETE FROM tags WHERE id = ? AND userId = ?', [id, user.id])
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('删除标签失败:', error)
    return errorResponse(res, '删除标签失败')
  }
})

export default router
