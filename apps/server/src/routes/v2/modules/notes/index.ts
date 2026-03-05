/**
 * 笔记路由模块
 * 提供富文本笔记管理功能，支持多用户数据隔离
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import {
  getUserNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getAllNotes,
  getUserNoteFolders,
  getAllNoteFolders,
  getNoteFolderById,
  createNoteFolder,
  updateNoteFolder,
  deleteNoteFolder,
  type Note,
  type NoteFolder
} from '../../../../db/index.js'
import { validateBody, validateParams, idParamSchema } from '../../../../schemas.js'
import { z } from 'zod'
import { logAudit } from '../../../../db/audit-enhanced.js'

const router = Router()

// 创建笔记验证schema
const createNoteSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().max(50000, '内容不能超过50000字符').optional(),
  isMarkdown: z.boolean().optional(),
  tags: z.string().max(500, '标签不能超过500字符').optional(),
  folderId: z.string().optional(),
  // 待办事项字段
  isTodo: z.boolean().optional(),
  priority: z.number().min(0).max(3).optional(),
  dueDate: z.string().optional(),
  tagColors: z.string().optional(),
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
  // 待办事项字段
  isTodo: z.boolean().optional(),
  priority: z.number().min(0).max(3).optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  tagColors: z.string().optional(),
})

// ========== 管理员接口（必须在动态路由之前定义）==========

// 获取所有笔记（管理员）
router.get('/all', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    // 检查是否是管理员
    if (user.role !== 'admin') {
      return errorResponse(res, '无权限访问', 403)
    }

    const notes = getAllNotes()
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

    const folders = getAllNoteFolders()
    return successResponse(res, folders)
  } catch (error) {
    console.error('获取所有文件夹失败:', error)
    return errorResponse(res, '获取所有文件夹失败')
  }
})

// 获取笔记列表（带用户隔离）
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { folderId, isArchived, search } = req.query

    const notes = getUserNotes(user.id, {
      folderId: folderId as string | undefined,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
      search: search as string | undefined
    })

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
    const { title, content, isMarkdown, tags, folderId, isTodo, priority, dueDate, tagColors } = req.body

    const note = createNote(user.id, title, content || '', {
      isMarkdown,
      tags,
      folderId,
      isTodo,
      priority,
      dueDate,
      tagColors
    })

    if (!note) {
      return errorResponse(res, '创建笔记失败', 500)
    }

    // 记录创建笔记日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CREATE_NOTE',
      resourceType: 'note',
      resourceId: note.id,
      details: { title, isMarkdown, isTodo },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })

    return successResponse(res, note)
  } catch (error) {
    console.error('创建笔记失败:', error)
    return errorResponse(res, '创建笔记失败')
  }
})

// 获取单个笔记（带用户隔离验证）
router.get('/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = req.params.id as string

    const note = getNoteById(id, user.id)
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
    const id = req.params.id as string
    const { title, content, isMarkdown, tags, folderId, isPinned, isArchived, isTodo, priority, dueDate, completedAt, tagColors } = req.body

    // 验证所有权
    const existing = getNoteById(id, user.id)
    if (!existing) {
      return errorResponse(res, '笔记不存在或无权限访问', 404)
    }

    const updates: Partial<Note> = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (isMarkdown !== undefined) updates.isMarkdown = isMarkdown
    if (tags !== undefined) updates.tags = tags
    if (folderId !== undefined) updates.folderId = folderId
    if (isPinned !== undefined) updates.isPinned = isPinned
    if (isArchived !== undefined) updates.isArchived = isArchived
    // 待办事项字段
    if (isTodo !== undefined) updates.isTodo = isTodo
    if (priority !== undefined) updates.priority = priority
    if (dueDate !== undefined) updates.dueDate = dueDate
    if (completedAt !== undefined) updates.completedAt = completedAt
    if (tagColors !== undefined) updates.tagColors = tagColors

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }

    const success = updateNote(id, user.id, updates)
    if (!success) {
      return errorResponse(res, '更新笔记失败', 500)
    }

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
    const id = req.params.id as string

    // 验证所有权
    const existing = getNoteById(id, user.id)
    if (!existing) {
      return errorResponse(res, '笔记不存在或无权限访问', 404)
    }

    const success = deleteNote(id, user.id)
    if (!success) {
      return errorResponse(res, '删除笔记失败', 500)
    }

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
    const folders = getUserNoteFolders(user.id)
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
  color: z.string().optional(),
})

router.post('/folders', authMiddleware, validateBody(createFolderSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, parentId, color } = req.body

    // 获取最大orderIndex
    const folders = getUserNoteFolders(user.id)
    const maxOrder = folders.length > 0 ? Math.max(...folders.map(f => f.orderIndex)) : 0
    const orderIndex = maxOrder + 1

    const folder = createNoteFolder(user.id, name, parentId, orderIndex, color)
    if (!folder) {
      return errorResponse(res, '创建文件夹失败', 500)
    }

    return successResponse(res, folder)
  } catch (error) {
    console.error('创建文件夹失败:', error)
    return errorResponse(res, '创建文件夹失败')
  }
})

// 更新文件夹
const updateFolderSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过100字符').optional(),
  parentId: z.string().optional(),
  color: z.string().optional(),
})

router.patch('/folders/:id', authMiddleware, validateParams(idParamSchema), validateBody(updateFolderSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = req.params.id as string
    const { name, parentId, color } = req.body

    // 验证所有权
    const existing = getNoteFolderById(id, user.id)
    if (!existing) {
      return errorResponse(res, '文件夹不存在或无权限访问', 404)
    }

    const updates: Partial<NoteFolder> = {}
    if (name !== undefined) updates.name = name
    if (parentId !== undefined) updates.parentId = parentId
    if (color !== undefined) updates.color = color

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, '没有要更新的字段', 400)
    }

    const success = updateNoteFolder(id, user.id, updates)
    if (!success) {
      return errorResponse(res, '更新文件夹失败', 500)
    }

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
    const id = req.params.id as string

    // 验证所有权
    const existing = getNoteFolderById(id, user.id)
    if (!existing) {
      return errorResponse(res, '文件夹不存在或无权限访问', 404)
    }

    // 将该文件夹下的笔记移动到根目录
    const notes = getUserNotes(user.id).filter(n => n.folderId === id)
    for (const note of notes) {
      updateNote(note.id, user.id, { folderId: null })
    }

    // 删除文件夹
    const success = deleteNoteFolder(id, user.id)
    if (!success) {
      return errorResponse(res, '删除文件夹失败', 500)
    }

    return successResponse(res, { id })
  } catch (error) {
    console.error('删除文件夹失败:', error)
    return errorResponse(res, '删除文件夹失败')
  }
})

// ========== 管理员接口 ==========

// 管理员删除任意笔记
router.delete('/admin/:id', authMiddleware, validateParams(idParamSchema), (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = req.params.id as string

    // 检查是否是管理员
    if (user.role !== 'admin') {
      return errorResponse(res, '无权限访问', 403)
    }

    // 获取笔记信息用于日志
    const existing = getAllNotes().find(n => n.id === id)
    if (!existing) {
      return errorResponse(res, '笔记不存在', 404)
    }

    const success = deleteNote(id, existing.userId)
    if (!success) {
      return errorResponse(res, '删除笔记失败', 500)
    }

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
    const id = req.params.id as string

    // 检查是否是管理员
    if (user.role !== 'admin') {
      return errorResponse(res, '无权限访问', 403)
    }

    // 获取文件夹信息用于日志
    const existing = getAllNoteFolders().find(f => f.id === id)
    if (!existing) {
      return errorResponse(res, '文件夹不存在', 404)
    }

    // 将该文件夹下的笔记移动到根目录
    const notes = getAllNotes().filter(n => n.folderId === id)
    for (const note of notes) {
      updateNote(note.id, note.userId, { folderId: null })
    }

    // 删除文件夹
    const success = deleteNoteFolder(id, existing.userId)
    if (!success) {
      return errorResponse(res, '删除文件夹失败', 500)
    }

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
