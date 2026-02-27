/**
 * 管理菜单路由 - V2版本
 * 提供后台管理菜单配置
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { getAdminMenus, createAdminMenu, updateAdminMenu, deleteAdminMenu } from '../../db/admin-menus.js'

const router = Router()

// 获取管理菜单
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    console.log('Fetching admin menus from database...')
    const menus = getAdminMenus(true, true)
    console.log(`Found ${menus.length} menus in database:`, menus)
    
    // 如果数据库中没有菜单，返回默认菜单
    if (menus.length === 0) {
      console.log('No menus found in database, returning default menus')
      const defaultMenus = [
        { id: 'bookmarks', name: '书签管理', icon: 'BookMarked', path: 'bookmarks', isEnabled: true, isVisible: true, orderIndex: 1, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'categories', name: '分类管理', icon: 'Folder', path: 'categories', isEnabled: true, isVisible: true, orderIndex: 2, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'analytics', name: '数据分析', icon: 'BarChart3', path: 'analytics', isEnabled: true, isVisible: true, orderIndex: 3, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'theme', name: '主题管理', icon: 'Palette', path: 'theme', isEnabled: true, isVisible: true, orderIndex: 4, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'wallpaper', name: '壁纸设置', icon: 'Image', path: 'wallpaper', isEnabled: true, isVisible: true, orderIndex: 5, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'bookmark-card-styles', name: '书签样式', icon: 'LayoutGrid', path: 'bookmark-card-styles', isEnabled: true, isVisible: true, orderIndex: 6, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'plugins', name: '插件中心', icon: 'Puzzle', path: 'plugins', isEnabled: true, isVisible: true, orderIndex: 7, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'menus', name: '菜单管理', icon: 'Layout', path: 'menus', isEnabled: true, isVisible: true, orderIndex: 8, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'users', name: '用户管理', icon: 'Users', path: 'users', isEnabled: true, isVisible: true, orderIndex: 9, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'settings', name: '系统设置', icon: 'Settings', path: 'settings', isEnabled: true, isVisible: true, orderIndex: 10, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'audit', name: '审计中心', icon: 'ClipboardList', path: 'audit', isEnabled: true, isVisible: true, orderIndex: 11, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'security', name: '安全管理', icon: 'Shield', path: 'security', isEnabled: true, isVisible: true, orderIndex: 12, visibility: 'public' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]
      return successResponse(res, defaultMenus)
    }
    
    return successResponse(res, menus)
  } catch (error) {
    console.error('获取管理菜单失败:', error)
    return errorResponse(res, '获取管理菜单失败')
  }
})

// 获取菜单统计信息 - 必须在 /:id 之前定义
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  console.log('[AdminMenus] Received request for /stats')
  try {
    const { queryOne } = await import('../../utils/database.js')
    
    // 获取各项统计数据
    const stats: Record<string, number> = {}
    
    // 书签数量
    const bookmarkResult = queryOne('SELECT COUNT(*) as count FROM bookmarks')
    stats.bookmarks = bookmarkResult?.count || 0
    console.log('[AdminMenus] Bookmarks count:', stats.bookmarks)
    
    // 分类数量
    const categoryResult = queryOne('SELECT COUNT(*) as count FROM categories')
    stats.categories = categoryResult?.count || 0
    console.log('[AdminMenus] Categories count:', stats.categories)
    
    // 插件数量
    const pluginResult = queryOne('SELECT COUNT(*) as count FROM plugins WHERE isEnabled = 1')
    stats.plugins = pluginResult?.count || 0
    console.log('[AdminMenus] Plugins count:', stats.plugins)
    
    // 菜单数量
    const menuResult = queryOne('SELECT COUNT(*) as count FROM admin_menus WHERE isEnabled = 1')
    stats.menus = menuResult?.count || 0
    console.log('[AdminMenus] Menus count:', stats.menus)
    
    // 用户数量
    const userResult = queryOne('SELECT COUNT(*) as count FROM users')
    stats.users = userResult?.count || 0
    console.log('[AdminMenus] Users count:', stats.users)
    
    // 主题数量
    const themeResult = queryOne('SELECT COUNT(*) as count FROM themes WHERE isActive = 1')
    stats.theme = themeResult?.count || 0
    console.log('[AdminMenus] Themes count:', stats.theme)
    
    // 壁纸设置数量 - 从用户主题偏好表中统计
    try {
      const wallpaperResult = queryOne("SELECT COUNT(*) as count FROM user_theme_preferences WHERE customOverrides IS NOT NULL AND customOverrides != ''")
      stats.wallpaper = wallpaperResult?.count || 0
    } catch {
      // 如果表不存在，返回0
      stats.wallpaper = 0
    }
    console.log('[AdminMenus] Wallpaper count:', stats.wallpaper)
    
    console.log('[AdminMenus] Returning stats:', stats)
    return successResponse(res, stats)
  } catch (error) {
    console.error('[AdminMenus] 获取菜单统计信息失败:', error)
    return errorResponse(res, '获取菜单统计信息失败')
  }
})

// 批量更新菜单排序 - 必须在 /:id 之前定义
router.patch('/reorder', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body
    
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, '排序数据不能为空', 400)
    }
    
    // 验证每个项目
    for (const item of items) {
      if (!item.id || typeof item.orderIndex !== 'number') {
        return errorResponse(res, '排序数据格式错误：需要id和orderIndex', 400)
      }
    }
    
    // 批量更新排序
    const { run } = await import('../../utils/database.js')
    let updatedCount = 0
    
    for (const item of items) {
      try {
        run('UPDATE admin_menus SET orderIndex = ?, updatedAt = ? WHERE id = ?', 
          [item.orderIndex, new Date().toISOString(), item.id])
        updatedCount++
      } catch (err) {
        console.error(`更新菜单 ${item.id} 排序失败:`, err)
      }
    }
    
    return successResponse(res, { 
      message: '菜单排序更新成功', 
      updatedCount,
      totalCount: items.length 
    })
  } catch (error) {
    console.error('批量更新菜单排序失败:', error)
    return errorResponse(res, '批量更新菜单排序失败')
  }
})

// 创建菜单
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { name, labelKey, icon, path, parentId, pluginId, visibility, allowedRoles } = req.body
    
    if (!name) {
      return errorResponse(res, '菜单名称不能为空', 400)
    }
    
    const id = createAdminMenu(name, labelKey, icon, path, parentId, pluginId, visibility || 'public', allowedRoles)
    
    if (id) {
      return successResponse(res, { id, message: '菜单创建成功' }, 201)
    } else {
      return errorResponse(res, '菜单创建失败', 500)
    }
  } catch (error) {
    console.error('创建菜单失败:', error)
    return errorResponse(res, '创建菜单失败')
  }
})

// 更新菜单
router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const updates = req.body
    
    const success = updateAdminMenu(id, updates)
    
    if (success) {
      return successResponse(res, { message: '菜单更新成功' })
    } else {
      return errorResponse(res, '菜单更新失败或菜单不存在', 404)
    }
  } catch (error) {
    console.error('更新菜单失败:', error)
    return errorResponse(res, '更新菜单失败')
  }
})

// 删除菜单
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    
    const success = deleteAdminMenu(id)
    
    if (success) {
      return successResponse(res, { message: '菜单删除成功' })
    } else {
      return errorResponse(res, '菜单删除失败或菜单不存在', 404)
    }
  } catch (error) {
    console.error('删除菜单失败:', error)
    return errorResponse(res, '菜单删除失败')
  }
})

export default router
