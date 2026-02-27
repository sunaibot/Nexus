/**
 * 插件路由 - V2版本
 * 提供插件管理功能，支持数据隔离和权限控制
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

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
    visibility: row.visibility || 'public',
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    orderIndex: row.orderIndex || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 检查用户是否有权限访问插件
function canAccessPlugin(plugin: any, user: any): boolean {
  // 系统插件所有人可见
  if (plugin.isSystem) return true
  
  // 公开插件所有人可见
  if (plugin.visibility === 'public') return true
  
  // 私有插件仅创建者可见
  if (plugin.visibility === 'private') {
    return plugin.createdBy === user.id
  }
  
  // 角色可见性
  if (plugin.visibility === 'role' && plugin.allowedRoles) {
    return plugin.allowedRoles.includes(user.role)
  }
  
  return false
}

// 获取插件列表
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    // 查询所有已启用的插件
    const plugins = queryAll(
      'SELECT * FROM plugins WHERE isEnabled = 1 ORDER BY orderIndex ASC, createdAt DESC'
    )
    
    // 根据用户权限过滤插件
    const accessiblePlugins = plugins
      .map(parsePlugin)
      .filter(plugin => canAccessPlugin(plugin, user))
    
    return successResponse(res, accessiblePlugins)
  } catch (error) {
    console.error('获取插件列表失败:', error)
    return errorResponse(res, '获取插件列表失败')
  }
})

// 获取单个插件详情
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { id } = req.params
    
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    const parsedPlugin = parsePlugin(plugin)
    
    // 检查权限
    if (!canAccessPlugin(parsedPlugin, user)) {
      return errorResponse(res, '无权访问此插件', 403)
    }
    
    return successResponse(res, parsedPlugin)
  } catch (error) {
    console.error('获取插件详情失败:', error)
    return errorResponse(res, '获取插件详情失败')
  }
})

// 创建插件（管理员）
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { name, description, version, author, icon, visibility, allowedRoles } = req.body
    
    if (!name) {
      return errorResponse(res, '插件名称不能为空', 400)
    }
    
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      `INSERT INTO plugins (id, name, description, version, author, icon, isEnabled, isInstalled, visibility, allowedRoles, createdBy, orderIndex, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description || '',
        version || '1.0.0',
        author || '',
        icon || '',
        1,
        1,
        visibility || 'public',
        allowedRoles ? JSON.stringify(allowedRoles) : null,
        user.id,
        0,
        now,
        now,
      ]
    )
    
    const newPlugin = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    return successResponse(res, parsePlugin(newPlugin), 201)
  } catch (error) {
    console.error('创建插件失败:', error)
    return errorResponse(res, '创建插件失败')
  }
})

// 更新插件（管理员）
router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, version, author, icon, isEnabled, visibility, allowedRoles, orderIndex } = req.body
    
    const existing = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    const now = new Date().toISOString()
    
    run(
      `UPDATE plugins SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        version = COALESCE(?, version),
        author = COALESCE(?, author),
        icon = COALESCE(?, icon),
        isEnabled = COALESCE(?, isEnabled),
        visibility = COALESCE(?, visibility),
        allowedRoles = COALESCE(?, allowedRoles),
        orderIndex = COALESCE(?, orderIndex),
        updatedAt = ?
       WHERE id = ?`,
      [
        name,
        description,
        version,
        author,
        icon,
        isEnabled !== undefined ? (isEnabled ? 1 : 0) : undefined,
        visibility,
        allowedRoles ? JSON.stringify(allowedRoles) : undefined,
        orderIndex,
        now,
        id,
      ]
    )
    
    const updated = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    return successResponse(res, parsePlugin(updated))
  } catch (error) {
    console.error('更新插件失败:', error)
    return errorResponse(res, '更新插件失败')
  }
})

// 删除插件（管理员）
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const existing = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    run('DELETE FROM plugins WHERE id = ?', [id])
    
    return successResponse(res, { deleted: true, id })
  } catch (error) {
    console.error('删除插件失败:', error)
    return errorResponse(res, '删除插件失败')
  }
})

// 安装插件
router.post('/:id/install', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    run('UPDATE plugins SET isInstalled = 1, updatedAt = ? WHERE id = ?', [
      new Date().toISOString(),
      id,
    ])
    
    return successResponse(res, { id, installed: true })
  } catch (error) {
    console.error('安装插件失败:', error)
    return errorResponse(res, '安装插件失败')
  }
})

// 卸载插件
router.post('/:id/uninstall', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    run('UPDATE plugins SET isInstalled = 0, updatedAt = ? WHERE id = ?', [
      new Date().toISOString(),
      id,
    ])
    
    return successResponse(res, { id, uninstalled: true })
  } catch (error) {
    console.error('卸载插件失败:', error)
    return errorResponse(res, '卸载插件失败')
  }
})

// 启用/禁用插件
router.patch('/:id/enable', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [id])
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }
    
    run('UPDATE plugins SET isEnabled = ?, updatedAt = ? WHERE id = ?', [
      enabled ? 1 : 0,
      new Date().toISOString(),
      id,
    ])
    
    return successResponse(res, { id, enabled })
  } catch (error) {
    console.error('更新插件状态失败:', error)
    return errorResponse(res, '更新插件状态失败')
  }
})

export default router
