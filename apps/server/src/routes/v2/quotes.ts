/**
 * 名言路由 - V2版本
 * 提供名言警句的完整CRUD管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'
import { logAudit } from '../../db/audit-enhanced.js'

const router = Router()

// 获取随机名言（公开接口）
router.get('/random', (req: Request, res: Response) => {
  try {
    const quotes = queryAll('SELECT * FROM quotes WHERE isActive = 1')
    if (quotes.length === 0) {
      // 默认名言
      const defaults = [
        { id: '1', content: '学而时习之，不亦说乎', author: '孔子', source: '论语' },
        { id: '2', content: '知识就是力量', author: '培根', source: '' },
        { id: '3', content: '千里之行，始于足下', author: '老子', source: '道德经' },
      ]
      const random = defaults[Math.floor(Math.random() * defaults.length)]
      return successResponse(res, random)
    }
    const random = quotes[Math.floor(Math.random() * quotes.length)]
    return successResponse(res, random)
  } catch (error) {
    console.error('获取随机名言失败:', error)
    return errorResponse(res, '获取随机名言失败')
  }
})

// 获取每日名言（公开接口）
router.get('/daily', (req: Request, res: Response) => {
  try {
    // 根据日期选择名言
    const today = new Date().toDateString()
    const quotes = queryAll('SELECT * FROM quotes WHERE isActive = 1')
    
    if (quotes.length === 0) {
      return successResponse(res, {
        id: 'daily',
        content: '学而时习之，不亦说乎',
        author: '孔子',
        source: '论语'
      })
    }
    
    // 使用日期作为种子选择名言
    const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const index = seed % quotes.length
    
    return successResponse(res, quotes[index])
  } catch (error) {
    console.error('获取每日名言失败:', error)
    return errorResponse(res, '获取每日名言失败')
  }
})

// 获取名言列表（支持搜索和筛选）
router.get('/', optionalAuthMiddleware, (req: Request, res: Response) => {
  try {
    const { search, category, author, isActive } = req.query
    
    let query = 'SELECT * FROM quotes WHERE 1=1'
    const params: any[] = []
    
    if (search) {
      query += ' AND (content LIKE ? OR author LIKE ? OR source LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    
    if (author) {
      query += ' AND author = ?'
      params.push(author)
    }
    
    if (isActive !== undefined) {
      query += ' AND isActive = ?'
      params.push(isActive === 'true' ? 1 : 0)
    }
    
    query += ' ORDER BY createdAt DESC'
    
    const quotes = queryAll(query, params)
    return successResponse(res, quotes)
  } catch (error) {
    console.error('获取名言列表失败:', error)
    return errorResponse(res, '获取名言列表失败')
  }
})

// 获取单个名言
router.get('/:id', optionalAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const quote = queryOne('SELECT * FROM quotes WHERE id = ?', [id])
    
    if (!quote) {
      return errorResponse(res, '名言不存在', 404)
    }
    
    return successResponse(res, quote)
  } catch (error) {
    console.error('获取名言失败:', error)
    return errorResponse(res, '获取名言失败')
  }
})

// 创建名言（需要登录）
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { content, author, source, category, tags } = req.body
    
    if (!content) {
      return errorResponse(res, '名言内容不能为空')
    }
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      `INSERT INTO quotes (id, content, author, source, category, tags, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, content, author || '', source || '', category || '', tags || '', 1, now, now]
    )
    
    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CREATE_QUOTE',
      resourceType: 'quote',
      resourceId: id,
      details: { content: content.substring(0, 50), author },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })
    
    return successResponse(res, { id, message: '名言创建成功' })
  } catch (error) {
    console.error('创建名言失败:', error)
    return errorResponse(res, '创建名言失败')
  }
})

// 更新名言（需要登录）
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const { content, author, source, category, tags, isActive } = req.body
    
    const existing = queryOne('SELECT * FROM quotes WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '名言不存在', 404)
    }
    
    const now = new Date().toISOString()
    
    run(
      `UPDATE quotes SET 
        content = ?, author = ?, source = ?, category = ?, tags = ?, isActive = ?, updatedAt = ?
       WHERE id = ?`,
      [
        content || existing.content,
        author !== undefined ? author : existing.author,
        source !== undefined ? source : existing.source,
        category !== undefined ? category : existing.category,
        tags !== undefined ? tags : existing.tags,
        isActive !== undefined ? (isActive ? 1 : 0) : existing.isActive,
        now,
        id
      ]
    )
    
    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'UPDATE_QUOTE',
      resourceType: 'quote',
      resourceId: id,
      details: { content: content?.substring(0, 50), author },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })
    
    return successResponse(res, { id, message: '名言更新成功' })
  } catch (error) {
    console.error('更新名言失败:', error)
    return errorResponse(res, '更新名言失败')
  }
})

// 删除名言（需要登录）
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    
    const existing = queryOne('SELECT * FROM quotes WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '名言不存在', 404)
    }
    
    run('DELETE FROM quotes WHERE id = ?', [id])
    
    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'DELETE_QUOTE',
      resourceType: 'quote',
      resourceId: id,
      details: { content: existing.content?.substring(0, 50), author: existing.author },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'medium'
    })
    
    return successResponse(res, { id, message: '名言删除成功' })
  } catch (error) {
    console.error('删除名言失败:', error)
    return errorResponse(res, '删除名言失败')
  }
})

// 切换名言启用状态（需要登录）
router.patch('/:id/toggle', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    
    const existing = queryOne('SELECT * FROM quotes WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '名言不存在', 404)
    }
    
    const newStatus = existing.isActive ? 0 : 1
    const now = new Date().toISOString()
    
    run('UPDATE quotes SET isActive = ?, updatedAt = ? WHERE id = ?', [newStatus, now, id])
    
    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: newStatus ? 'ENABLE_QUOTE' : 'DISABLE_QUOTE',
      resourceType: 'quote',
      resourceId: id,
      details: { content: existing.content?.substring(0, 50) },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })
    
    return successResponse(res, { id, isActive: newStatus, message: newStatus ? '名言已启用' : '名言已禁用' })
  } catch (error) {
    console.error('切换名言状态失败:', error)
    return errorResponse(res, '切换名言状态失败')
  }
})

// 获取名言分类列表（公开接口）
router.get('/categories/list', (req: Request, res: Response) => {
  try {
    const result = queryAll('SELECT DISTINCT category FROM quotes WHERE category IS NOT NULL AND category != ""')
    const categories = result.map((r: any) => r.category).filter(Boolean)
    return successResponse(res, categories)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return errorResponse(res, '获取分类列表失败')
  }
})

// 获取作者列表（公开接口）
router.get('/authors/list', (req: Request, res: Response) => {
  try {
    const result = queryAll('SELECT DISTINCT author FROM quotes WHERE author IS NOT NULL AND author != ""')
    const authors = result.map((r: any) => r.author).filter(Boolean)
    return successResponse(res, authors)
  } catch (error) {
    console.error('获取作者列表失败:', error)
    return errorResponse(res, '获取作者列表失败')
  }
})

export default router
