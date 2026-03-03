/**
 * 自定义插件路由 - V2版本
 * 处理通过可视化构建器创建的插件
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { createCustomPlugin, updateCustomPlugin, getPlugins, getDatabase } from '../../db/index.js'
import { queryOne, queryAll, run } from '../../utils/index.js'

const router = Router()

// 解析插件数据
function parsePlugin(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    author: row.author,
    icon: row.icon,
    isEnabled: Boolean(row.isEnabled),
    isInstalled: Boolean(row.isInstalled),
    isCustom: Boolean(row.isCustom),
    builderData: row.builderData ? JSON.parse(row.builderData) : undefined,
    visibility: row.visibility || 'public',
    orderIndex: row.orderIndex || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 获取所有自定义插件
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const plugins = getPlugins(false, true) // 包含自定义插件
    const customPlugins = plugins.filter((p: { isCustom?: boolean }) => p.isCustom)
    return successResponse(res, customPlugins)
  } catch (error) {
    console.error('获取自定义插件列表失败:', error)
    return errorResponse(res, '获取自定义插件列表失败')
  }
})

// 获取单个自定义插件
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ? AND isCustom = 1', [id])
    
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    return successResponse(res, parsePlugin(plugin))
  } catch (error) {
    console.error('获取自定义插件失败:', error)
    return errorResponse(res, '获取自定义插件失败')
  }
})

// 创建自定义插件
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, description, icon, builderData, visibility = 'public' } = req.body
    
    if (!name || !builderData) {
      return errorResponse(res, '插件名称和构建数据不能为空', 400)
    }
    
    const id = createCustomPlugin(
      name,
      description || '',
      user.username || user.id,
      icon || '📦',
      builderData,
      visibility
    )
    
    if (!id) {
      return errorResponse(res, '创建插件失败', 500)
    }
    
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    if (!plugin) {
      return errorResponse(res, '创建插件后查询失败', 500)
    }
    return successResponse(res, { plugin: parsePlugin(plugin), message: '插件创建成功' })
  } catch (error) {
    console.error('创建自定义插件失败:', error)
    return errorResponse(res, '创建自定义插件失败')
  }
})

// 更新自定义插件
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, description, icon, builderData, isEnabled } = req.body
    
    // 检查插件是否存在
    const existing = queryOne('SELECT * FROM plugins WHERE id = ? AND isCustom = 1', [id])
    if (!existing) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    const success = updateCustomPlugin(id, {
      name,
      description,
      icon,
      builderData,
      isEnabled
    })
    
    if (!success) {
      return errorResponse(res, '更新插件失败', 500)
    }
    
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    if (!plugin) {
      return errorResponse(res, '更新插件后查询失败', 500)
    }
    return successResponse(res, { plugin: parsePlugin(plugin), message: '插件更新成功' })
  } catch (error) {
    console.error('更新自定义插件失败:', error)
    return errorResponse(res, '更新自定义插件失败')
  }
})

// 删除自定义插件
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    
    // 检查插件是否存在
    const existing = queryOne('SELECT * FROM plugins WHERE id = ? AND isCustom = 1', [id])
    if (!existing) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    run('DELETE FROM plugins WHERE id = ? AND isCustom = 1', [id])
    
    return successResponse(res, { message: '插件删除成功' })
  } catch (error) {
    console.error('删除自定义插件失败:', error)
    return errorResponse(res, '删除自定义插件失败')
  }
})

// 前台获取所有公开的自定义插件列表（公开接口）
router.get('/public', (req: Request, res: Response) => {
  try {
    const plugins = queryAll(
      "SELECT id, name, description, icon, builderData FROM plugins WHERE isEnabled = 1 AND isCustom = 1 AND visibility = 'public' ORDER BY orderIndex ASC, createdAt DESC"
    )
    
    return successResponse(res, plugins.map((plugin: any) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      icon: plugin.icon,
      builderData: plugin.builderData ? JSON.parse(plugin.builderData) : undefined
    })))
  } catch (error) {
    console.error('获取公开插件列表失败:', error)
    return errorResponse(res, '获取公开插件列表失败')
  }
})

// 前台获取自定义插件内容（公开接口）
router.get('/:id/content', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const plugin = queryOne(
      'SELECT id, name, description, icon, builderData, visibility FROM plugins WHERE id = ? AND isEnabled = 1 AND isCustom = 1',
      [id]
    )
    
    if (!plugin) {
      return errorResponse(res, '插件不存在或未启用', 404)
    }
    
    // 检查可见性
    if (plugin.visibility === 'private') {
      return errorResponse(res, '无权访问此插件', 403)
    }
    
    return successResponse(res, {
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      icon: plugin.icon,
      builderData: plugin.builderData ? JSON.parse(plugin.builderData) : undefined
    })
  } catch (error) {
    console.error('获取插件内容失败:', error)
    return errorResponse(res, '获取插件内容失败')
  }
})

export default router
