/**
 * 名言路由模块
 * 提供名言警句的完整CRUD管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import {
  getQuotes,
  getQuoteById,
  getRandomQuote,
  getDailyQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  toggleQuoteStatus,
  getQuoteCategories,
  getQuoteAuthors,
  type Quote
} from '../../../../db/index.js'
import { logAudit } from '../../../../db/audit-enhanced.js'

const router = Router()

// 获取随机名言（公开接口）
router.get('/random', (req: Request, res: Response) => {
  try {
    const quote = getRandomQuote()
    if (!quote) {
      return errorResponse(res, '获取随机名言失败', 500)
    }
    return successResponse(res, quote)
  } catch (error) {
    console.error('获取随机名言失败:', error)
    return errorResponse(res, '获取随机名言失败')
  }
})

// 获取每日名言（公开接口）
router.get('/daily', (req: Request, res: Response) => {
  try {
    const quote = getDailyQuote()
    if (!quote) {
      return errorResponse(res, '获取每日名言失败', 500)
    }
    return successResponse(res, quote)
  } catch (error) {
    console.error('获取每日名言失败:', error)
    return errorResponse(res, '获取每日名言失败')
  }
})

// 获取名言列表（支持搜索和筛选）
router.get('/', optionalAuthMiddleware, (req: Request, res: Response) => {
  try {
    const { search, category, author, isActive } = req.query

    const quotes = getQuotes({
      search: search as string | undefined,
      category: category as string | undefined,
      author: author as string | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    })

    return successResponse(res, quotes)
  } catch (error) {
    console.error('获取名言列表失败:', error)
    return errorResponse(res, '获取名言列表失败')
  }
})

// 获取单个名言
router.get('/:id', optionalAuthMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const quote = getQuoteById(id)

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
      return errorResponse(res, '名言内容不能为空', 400)
    }

    const quote = createQuote(content, author, source, category, tags)
    if (!quote) {
      return errorResponse(res, '创建名言失败', 500)
    }

    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CREATE_QUOTE',
      resourceType: 'quote',
      resourceId: quote.id,
      details: { content: content.substring(0, 50), author },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })

    return successResponse(res, { id: quote.id, message: '名言创建成功' })
  } catch (error) {
    console.error('创建名言失败:', error)
    return errorResponse(res, '创建名言失败')
  }
})

// 更新名言（需要登录）
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = req.params.id as string
    const { content, author, source, category, tags, isActive } = req.body

    const existing = getQuoteById(id)
    if (!existing) {
      return errorResponse(res, '名言不存在', 404)
    }

    const updates: Partial<Quote> = {}
    if (content !== undefined) updates.content = content
    if (author !== undefined) updates.author = author
    if (source !== undefined) updates.source = source
    if (category !== undefined) updates.category = category
    if (tags !== undefined) updates.tags = tags
    if (isActive !== undefined) updates.isActive = isActive

    const quote = updateQuote(id, updates)
    if (!quote) {
      return errorResponse(res, '更新名言失败', 500)
    }

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
    const id = req.params.id as string

    const existing = getQuoteById(id)
    if (!existing) {
      return errorResponse(res, '名言不存在', 404)
    }

    const success = deleteQuote(id)
    if (!success) {
      return errorResponse(res, '删除名言失败', 500)
    }

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
    const id = req.params.id as string

    const existing = getQuoteById(id)
    if (!existing) {
      return errorResponse(res, '名言不存在', 404)
    }

    const quote = toggleQuoteStatus(id)
    if (!quote) {
      return errorResponse(res, '切换名言状态失败', 500)
    }

    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: quote.isActive ? 'ENABLE_QUOTE' : 'DISABLE_QUOTE',
      resourceType: 'quote',
      resourceId: id,
      details: { content: existing.content?.substring(0, 50) },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })

    return successResponse(res, {
      id,
      isActive: quote.isActive,
      message: quote.isActive ? '名言已启用' : '名言已禁用'
    })
  } catch (error) {
    console.error('切换名言状态失败:', error)
    return errorResponse(res, '切换名言状态失败')
  }
})

// 获取名言分类列表（公开接口）
router.get('/categories/list', (req: Request, res: Response) => {
  try {
    const categories = getQuoteCategories()
    return successResponse(res, categories)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return errorResponse(res, '获取分类列表失败')
  }
})

// 获取作者列表（公开接口）
router.get('/authors/list', (req: Request, res: Response) => {
  try {
    const authors = getQuoteAuthors()
    return successResponse(res, authors)
  } catch (error) {
    console.error('获取作者列表失败:', error)
    return errorResponse(res, '获取作者列表失败')
  }
})

export default router
