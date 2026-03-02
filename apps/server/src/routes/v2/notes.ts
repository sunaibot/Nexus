/**
 * 笔记路由 - V2版本
 * 提供富文本笔记管理功能，支持多用户数据隔离
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { generateId } from '../../db/index.js'
import { queryAll, queryOne, run } from '../../utils/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { validateBody, validateParams, idParamSchema } from '../../schemas.js'
import { z } from 'zod'
import { logAudit } from '../../db/audit-enhanced.js'

const router = Router()

// 创建笔记验证schema
const createNoteSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().max(50000, '内容不能超过50000字符').optional(),
  isMarkdown: z.boolean().optional(),
  tags: z.string().max(500, '标签不能超过500字符').optional(),
  folderId: z.string().optional(),
})

// 更新笔记验证schema
const updateNoteSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符').optional(),
  content: z.string().max(50000, '内容不能超过50000字符').optional(),
  isMarkdown: z.boolean().optional(),
  tags: z.string().max(500, '标签不能超过500字符').optional(),
  folderId: z.string().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
})

// 获取笔记列表（带用户隔离）
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { folderId, isArchived, search } = req.query
    
    let query = 'SELECT * FROM notes WHERE userId = ?'
    const params: any[] = [user.id]
    
    if (folderId) {
      query += ' AND folderId = ?'
      params.push(folderId as string)
    }
    
    if (isArchived === 'true') {
      query += ' AND isArchived = 1'
    } else if (isArchived === 'false') {
      query += ' AND isArchived = 0'
    }
    
    if (search) {
      query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    query += ' ORDER BY isPinned DESC, updatedAt DESC'
    
    const notes = queryAll(query, params)
    return successResponse(res, notes)
  } catch (error) {
    console.error('获取笔记列表失败:', error)
    return errorResponse(res, '获取笔记列表失败')
  }
})

// 创建笔记（带用户隔离）
router.post('/', authMiddleware, validateBody(createNoteSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { title, content, isMarkdown, tags, folderId } = req.body
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      `INSERT INTO notes (id, userId, title, content, isMarkdown, tags, folderId, isPinned, isArchived, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [id, user.id, title, content || '', isMarkdown ? 1 : 0, tags || null, folderId || null, now, now]
    )
    
    // 记录创建笔记日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CREATE_NOTE',
      resourceType: 'note',
      resourceId: id,
      details: { title, isMarkdown },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })
    
    return successResponse(res, { 
      id, 
      title, 
      content, 
      isMarkdown: isMarkdown ?? true,
      tags,
      folderId,
      userId: user.id 
    })
  } catch (error) {
    console.error('创建笔记失败:', error)
    return errorResponse(res, '创建笔记失败')
  }
})

// 获取单个笔记（带用户隔离验证）
router.get('/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    const note = queryOne(
      'SELECT * FROM notes WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!note) {
      return errorResponse(res, '笔记不存在或无权限访问', 404)
    }
    
    return successResponse(res, note)
  } catch (error) {
    console.error('获取笔记失败:', error)
    return errorResponse(res, '获取笔记失败')
  }
})

// 更新笔记（带用户隔离验证）
router.patch('/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateNoteSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    const { title, content, isMarkdown, tags, folderId, isPinned, isArchived } = req.body
    
    // 验证所有权
    const existing = queryOne(
      'SELECT * FROM notes WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '笔记不存在或无权限访问', 404)
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
    if (isMarkdown !== undefined) {
      updates.push('isMarkdown = ?')
      params.push(isMarkdown ? 1 : 0)
    }
    if (tags !== undefined) {
      updates.push('tags = ?')
      params.push(tags)
    }
    if (folderId !== undefined) {
      updates.push('folderId = ?')
      params.push(folderId)
    }
    if (isPinned !== undefined) {
      updates.push('isPinned = ?')
      params.push(isPinned ? 1 : 0)
    }
    if (isArchived !== undefined) {
      updates.push('isArchived = ?')
      params.push(isArchived ? 1 : 0)
    }
    
    if (updates.length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }
    
    updates.push('updatedAt = ?')
    params.push(new Date().toISOString())
    params.push(id)
    params.push(user.id)
    
    run(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      params
    )
    
    // 记录更新笔记日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'UPDATE_NOTE',
      resourceType: 'note',
      resourceId: String(id),
      details: { title: title || existing.title },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('更新笔记失败:', error)
    return errorResponse(res, '更新笔记失败')
  }
})

// 删除笔记（带用户隔离验证）
router.delete('/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    // 验证所有权
    const existing = queryOne(
      'SELECT * FROM notes WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '笔记不存在或无权限访问', 404)
    }
    
    run('DELETE FROM notes WHERE id = ? AND userId = ?', [id, user.id])
    
    // 记录删除笔记日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'DELETE_NOTE',
      resourceType: 'note',
      resourceId: String(id),
      details: { title: existing.title },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })

    return successResponse(res, { id })
  } catch (error) {
    console.error('删除笔记失败:', error)
    return errorResponse(res, '删除笔记失败')
  }
})

// ========== 笔记文件夹管理 ==========

// 获取文件夹列表
router.get('/folders/list', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    const folders = queryAll(
      'SELECT * FROM note_folders WHERE userId = ? ORDER BY orderIndex ASC, createdAt DESC',
      [user.id]
    )
    
    return successResponse(res, folders)
  } catch (error) {
    console.error('获取文件夹列表失败:', error)
    return errorResponse(res, '获取文件夹列表失败')
  }
})

// 创建文件夹
const createFolderSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过100字符'),
  parentId: z.string().optional(),
})

router.post('/folders', authMiddleware, validateBody(createFolderSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, parentId } = req.body
    
    const id = generateId()
    const now = new Date().toISOString()
    
    // 获取最大orderIndex
    const maxResult = queryOne(
      'SELECT MAX(orderIndex) as maxOrder FROM note_folders WHERE userId = ?',
      [user.id]
    )
    const orderIndex = (maxResult?.maxOrder || 0) + 1
    
    run(
      'INSERT INTO note_folders (id, userId, name, parentId, orderIndex, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, user.id, name, parentId || null, orderIndex, now, now]
    )
    
    return successResponse(res, { id, name, parentId, orderIndex })
  } catch (error) {
    console.error('创建文件夹失败:', error)
    return errorResponse(res, '创建文件夹失败')
  }
})

// 更新文件夹
const updateFolderSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过100字符').optional(),
  parentId: z.string().optional(),
})

router.patch('/folders/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateFolderSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    const { name, parentId } = req.body
    
    // 验证所有权
    const existing = queryOne(
      'SELECT * FROM note_folders WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '文件夹不存在或无权限访问', 404)
    }
    
    const updates: string[] = []
    const params: any[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (parentId !== undefined) {
      updates.push('parentId = ?')
      params.push(parentId)
    }
    
    if (updates.length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }
    
    updates.push('updatedAt = ?')
    params.push(new Date().toISOString())
    params.push(id)
    params.push(user.id)
    
    run(
      `UPDATE note_folders SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      params
    )
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('更新文件夹失败:', error)
    return errorResponse(res, '更新文件夹失败')
  }
})

// 删除文件夹
router.delete('/folders/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    // 验证所有权
    const existing = queryOne(
      'SELECT * FROM note_folders WHERE id = ? AND userId = ?',
      [id, user.id]
    )
    
    if (!existing) {
      return errorResponse(res, '文件夹不存在或无权限访问', 404)
    }
    
    // 将该文件夹下的笔记移动到根目录
    run('UPDATE notes SET folderId = NULL WHERE folderId = ? AND userId = ?', [id, user.id])
    
    // 删除文件夹
    run('DELETE FROM note_folders WHERE id = ? AND userId = ?', [id, user.id])
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('删除文件夹失败:', error)
    return errorResponse(res, '删除文件夹失败')
  }
})

// ========== 管理员接口 ==========

// 获取所有笔记（管理员）
router.get('/all', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    // 检查是否是管理员
    if (user.role !== 'admin') {
      return errorResponse(res, '无权限访问', 403)
    }
    
    const notes = queryAll('SELECT * FROM notes ORDER BY updatedAt DESC')
    return successResponse(res, notes)
  } catch (error) {
    console.error('获取所有笔记失败:', error)
    return errorResponse(res, '获取所有笔记失败')
  }
})

// 获取所有文件夹（管理员）
router.get('/folders/all', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    // 检查是否是管理员
    if (user.role !== 'admin') {
      return errorResponse(res, '无权限访问', 403)
    }
    
    const folders = queryAll('SELECT * FROM note_folders ORDER BY orderIndex ASC, createdAt DESC')
    return successResponse(res, folders)
  } catch (error) {
    console.error('获取所有文件夹失败:', error)
    return errorResponse(res, '获取所有文件夹失败')
  }
})

// 管理员删除任意笔记
router.delete('/admin/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    // 检查是否是管理员
    if (user.role !== 'admin') {
      return errorResponse(res, '无权限访问', 403)
    }
    
    // 获取笔记信息用于日志
    const existing = queryOne('SELECT * FROM notes WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '笔记不存在', 404)
    }
    
    run('DELETE FROM notes WHERE id = ?', [id])
    
    // 记录删除笔记日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'DELETE_NOTE_ADMIN',
      resourceType: 'note',
      resourceId: String(id),
      details: { title: existing.title, ownerId: existing.userId },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'medium'
    })
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('删除笔记失败:', error)
    return errorResponse(res, '删除笔记失败')
  }
})

// 管理员删除任意文件夹
router.delete('/folders/admin/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    // 检查是否是管理员
    if (user.role !== 'admin') {
      return errorResponse(res, '无权限访问', 403)
    }
    
    // 获取文件夹信息用于日志
    const existing = queryOne('SELECT * FROM note_folders WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '文件夹不存在', 404)
    }
    
    // 将该文件夹下的笔记移动到根目录
    run('UPDATE notes SET folderId = NULL WHERE folderId = ?', [id])
    
    // 删除文件夹
    run('DELETE FROM note_folders WHERE id = ?', [id])
    
    // 记录删除文件夹日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'DELETE_NOTE_FOLDER_ADMIN',
      resourceType: 'note_folder',
      resourceId: String(id),
      details: { name: existing.name, ownerId: existing.userId },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'medium'
    })
    
    return successResponse(res, { id })
  } catch (error) {
    console.error('删除文件夹失败:', error)
    return errorResponse(res, '删除文件夹失败')
  }
})

export default router
