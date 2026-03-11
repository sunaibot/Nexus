/**
 * 数据路由 - V2版本
 * 提供数据备份、恢复和导入导出功能
 * 支持数据隔离和权限控制
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { logAudit } from '../../db/index.js'
import { queryOne, queryAll, run } from '../../utils/index.js'
import { getDatabase } from '../../db/core.js'
import { randomUUID } from 'crypto'
import { globalCache, userCache, settingsCache } from '../../utils/cache.js'
import { initialCategories, initialBookmarks, initialQuotes, initialSettings } from '../../db/initial-data.js'

const router = Router()

// 导出数据接口
interface ExportData {
  version: string
  exportedAt: string
  exportedBy: string
  bookmarks: any[]
  categories: any[]
  settings: Record<string, any>
  themes: any[]
  quotes: any[]
  tags: any[]
  widgets: any[]
  customMetrics: any[]
  serviceMonitors: any[]
}

/**
 * 导出所有数据（需要管理员权限）
 * GET /api/v2/data/export
 */
router.get('/export', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const db = getDatabase()
    
    // 导出书签
    const bookmarksResult = db.exec('SELECT * FROM bookmarks')
    const bookmarks = bookmarksResult[0]?.values.map((row: any[]) => ({
      id: row[0], url: row[1], title: row[2], description: row[3], favicon: row[4],
      ogImage: row[5], icon: row[6], iconUrl: row[7], category: row[8], tags: row[9],
      orderIndex: row[10], isPinned: row[11], isReadLater: row[12], isRead: row[13],
      createdAt: row[14], updatedAt: row[15], userId: row[16], internalUrl: row[17],
      notes: row[18], visibility: row[19], visitCount: row[20]
    })) || []
    
    // 导出分类
    const categoriesResult = db.exec('SELECT * FROM categories')
    const categories = categoriesResult[0]?.values.map((row: any[]) => ({
      id: row[0], name: row[1], icon: row[2], color: row[3], orderIndex: row[4],
      userId: row[5], parentId: row[6], createdAt: row[7], updatedAt: row[8]
    })) || []
    
    // 导出设置
    const settingsResult = db.exec('SELECT * FROM settings')
    const settings: Record<string, any> = {}
    settingsResult[0]?.values.forEach((row: any[]) => {
      settings[row[0]] = row[1]
    })
    
    // 导出主题
    const themesResult = db.exec('SELECT * FROM themes WHERE isSystem = 0')
    const themes = themesResult[0]?.values.map((row: any[]) => ({
      id: row[0], name: row[1], description: row[2], isDark: row[3], colors: row[4],
      layout: row[5], font: row[6], animation: row[7], components: row[8],
      customCSS: row[9], visibility: row[13], allowedRoles: row[14],
      createdAt: row[15], updatedAt: row[16]
    })) || []
    
    // 导出名言
    const quotesResult = db.exec('SELECT * FROM quotes')
    const quotes = quotesResult[0]?.values.map((row: any[]) => ({
      id: row[0], content: row[1], source: row[2], orderIndex: row[3], createdAt: row[4]
    })) || []
    
    // 导出标签
    const tagsResult = db.exec('SELECT * FROM tags')
    const tags = tagsResult[0]?.values.map((row: any[]) => ({
      id: row[0], name: row[1], color: row[2], userId: row[3], createdAt: row[4]
    })) || []
    
    // 导出小部件
    const widgetsResult = db.exec('SELECT * FROM widgets')
    const widgets = widgetsResult[0]?.values.map((row: any[]) => ({
      id: row[0], userId: row[1], name: row[2], type: row[3], config: row[4],
      orderIndex: row[5], isVisible: row[6], createdAt: row[7], updatedAt: row[8]
    })) || []
    
    // 导出自定义指标
    const metricsResult = db.exec('SELECT * FROM custom_metrics')
    const customMetrics = metricsResult[0]?.values.map((row: any[]) => ({
      id: row[0], userId: row[1], name: row[2], type: row[3], script: row[4],
      unit: row[5], active: row[6], createdAt: row[7], updatedAt: row[8]
    })) || []
    
    // 导出服务监控
    const monitorsResult = db.exec('SELECT * FROM service_monitors')
    const serviceMonitors = monitorsResult[0]?.values.map((row: any[]) => ({
      id: row[0], userId: row[1], name: row[2], url: row[3], type: row[4],
      active: row[5], createdAt: row[6], updatedAt: row[7]
    })) || []
    
    const exportData: ExportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.username,
      bookmarks,
      categories,
      settings,
      themes,
      quotes,
      tags,
      widgets,
      customMetrics,
      serviceMonitors,
    }
    
    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'EXPORT_DATA',
      resourceType: 'data',
      details: {
        bookmarksCount: bookmarks.length,
        categoriesCount: categories.length,
        themesCount: themes.length,
      },
    })
    
    res.json({
      success: true,
      data: exportData,
      message: '数据导出成功',
    })
  } catch (error) {
    console.error('导出数据失败:', error)
    res.status(500).json({ success: false, error: '导出数据失败' })
  }
})

/**
 * 检测数据格式类型
 */
function detectImportFormat(data: any): 'nexus' | 'itab' | 'unknown' {
  if (data.version && data.exportedAt && Array.isArray(data.bookmarks)) {
    return 'nexus'
  }
  if (data.baseConfig && data.navConfig && Array.isArray(data.navConfig)) {
    return 'itab'
  }
  return 'unknown'
}

/**
 * 解析 iTab 格式的书签数据
 */
function parseItabData(data: any): { bookmarks: any[], categories: any[] } {
  const bookmarks: any[] = []
  const categories: any[] = []
  
  if (!data.navConfig || !Array.isArray(data.navConfig)) {
    return { bookmarks, categories }
  }
  
  // 遍历 iTab 的分组
  data.navConfig.forEach((group: any, groupIndex: number) => {
    if (!group.children || !Array.isArray(group.children)) return
    
    // 创建分类
    const categoryId = `itab-${group.id || groupIndex}`
    categories.push({
      id: categoryId,
      name: group.name || '未命名分组',
      icon: group.icon || 'Folder',
      color: '#6366f1',
      orderIndex: groupIndex,
    })
    
    // 遍历分组中的项目
    group.children.forEach((item: any, itemIndex: number) => {
      // 只处理图标类型的项目（书签）
      if (item.type === 'icon' || item.type === 'text') {
        bookmarks.push({
          id: `itab-${item.id || `${groupIndex}-${itemIndex}`}`,
          url: item.url || '',
          title: item.name || '未命名书签',
          description: '',
          favicon: item.src || '',
          icon: item.iconText || '',
          category: categoryId,
          orderIndex: itemIndex,
          isPinned: false,
          isReadLater: false,
          visibility: 'public',
        })
      }
    })
  })
  
  return { bookmarks, categories }
}

/**
 * 导入数据（需要管理员权限）
 * POST /api/v2/data/import
 */
router.post('/import', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    let { data, mode = 'merge' } = req.body
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: '无效的数据格式',
      })
    }
    
    // 检测导入格式
    const format = detectImportFormat(data)
    
    if (format === 'unknown') {
      return res.status(400).json({
        success: false,
        error: '不支持的数据格式',
      })
    }
    
    // 如果是 iTab 格式，转换为 Nexus 格式
    if (format === 'itab') {
      const parsed = parseItabData(data)
      data = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        exportedBy: user.username,
        bookmarks: parsed.bookmarks,
        categories: parsed.categories,
        settings: {},
        themes: [],
        quotes: [],
        tags: [],
        widgets: [],
        customMetrics: [],
        serviceMonitors: [],
      }
    }
    
    const db = getDatabase()
    const now = new Date().toISOString()
    const results = {
      bookmarks: { imported: 0, skipped: 0 },
      categories: { imported: 0, skipped: 0 },
      themes: { imported: 0, skipped: 0 },
      quotes: { imported: 0, skipped: 0 },
      tags: { imported: 0, skipped: 0 },
      widgets: { imported: 0, skipped: 0 },
      customMetrics: { imported: 0, skipped: 0 },
      serviceMonitors: { imported: 0, skipped: 0 },
    }
    
    // 如果是覆盖模式，先清空现有数据
    if (mode === 'overwrite') {
      db.run('DELETE FROM bookmarks')
      db.run('DELETE FROM categories')
      db.run('DELETE FROM themes WHERE isSystem = 0')
      db.run('DELETE FROM quotes')
      db.run('DELETE FROM tags')
      db.run('DELETE FROM widgets')
      db.run('DELETE FROM custom_metrics')
      db.run('DELETE FROM service_monitors')
    }
    
    // 导入分类
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        try {
          const existing = queryOne('SELECT id FROM categories WHERE id = ?', [cat.id])
          if (existing && mode === 'skip') {
            results.categories.skipped++
            continue
          }
          
          // 为缺失字段提供默认值
          const name = cat.name || '未命名分类'
          const icon = cat.icon || 'Folder'
          const color = cat.color || '#6366f1'
          const orderIndex = cat.orderIndex ?? 0
          // 安全修复：强制使用当前用户ID，不使用导入数据中的userId（防止权限提升）
          const userId = user?.id || null
          const parentId = cat.parentId || null
          
          if (existing) {
            // 更新
            run(
              `UPDATE categories SET name = ?, icon = ?, color = ?, orderIndex = ?, userId = ?, parentId = ?, updatedAt = ? WHERE id = ?`,
              [name, icon, color, orderIndex, userId, parentId, now, cat.id]
            )
          } else {
            // 插入
            run(
              `INSERT INTO categories (id, name, icon, color, orderIndex, userId, parentId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [cat.id || randomUUID(), name, icon, color, orderIndex, userId, parentId, cat.createdAt || now, now]
            )
          }
          results.categories.imported++
        } catch (e) {
          console.error('导入分类失败:', e)
        }
      }
    }
    
    // 导入书签
    if (Array.isArray(data.bookmarks)) {
      for (const bm of data.bookmarks) {
        try {
          const existing = queryOne('SELECT id FROM bookmarks WHERE id = ?', [bm.id])
          if (existing && mode === 'skip') {
            results.bookmarks.skipped++
            continue
          }
          
          // 为缺失字段提供默认值
          const url = bm.url || ''
          const title = bm.title || url || '未命名书签'
          const description = bm.description || ''
          const favicon = bm.favicon || ''
          const ogImage = bm.ogImage || ''
          const icon = bm.icon || ''
          const iconUrl = bm.iconUrl || ''
          const category = bm.category || 'default'
          const tags = bm.tags || ''
          const orderIndex = bm.orderIndex ?? 0
          const isPinned = bm.isPinned ? 1 : 0
          const isReadLater = bm.isReadLater ? 1 : 0
          const isRead = bm.isRead ? 1 : 0
          // 安全修复：强制使用当前用户ID，不使用导入数据中的userId（防止权限提升）
          const userId = user?.id || null
          const internalUrl = bm.internalUrl || ''
          const notes = bm.notes || ''
          const visibility = bm.visibility || 'public'
          const visitCount = bm.visitCount ?? 0
          
          if (existing) {
            // 更新
            run(
              `UPDATE bookmarks SET url = ?, title = ?, description = ?, favicon = ?, ogImage = ?, icon = ?, iconUrl = ?, category = ?, tags = ?, orderIndex = ?, isPinned = ?, isReadLater = ?, isRead = ?, updatedAt = ?, userId = ?, internalUrl = ?, notes = ?, visibility = ?, visitCount = ? WHERE id = ?`,
              [url, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isPinned, isReadLater, isRead, now, userId, internalUrl, notes, visibility, visitCount, bm.id]
            )
          } else {
            // 插入
            run(
              `INSERT INTO bookmarks (id, url, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isPinned, isReadLater, isRead, createdAt, updatedAt, userId, internalUrl, notes, visibility, visitCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [bm.id || randomUUID(), url, title, description, favicon, ogImage, icon, iconUrl, category, tags, orderIndex, isPinned, isReadLater, isRead, bm.createdAt || now, now, userId, internalUrl, notes, visibility, visitCount]
            )
          }
          results.bookmarks.imported++
        } catch (e) {
          console.error('导入书签失败:', e)
        }
      }
    }
    
    // 导入主题
    if (Array.isArray(data.themes)) {
      for (const theme of data.themes) {
        try {
          const existing = queryOne('SELECT id FROM themes WHERE id = ?', [theme.id])
          if (existing && mode === 'skip') {
            results.themes.skipped++
            continue
          }
          
          if (existing) {
            // 更新
            run(
              `UPDATE themes SET name = ?, description = ?, isDark = ?, colors = ?, layout = ?, font = ?, animation = ?, components = ?, customCSS = ?, visibility = ?, allowedRoles = ?, updatedAt = ? WHERE id = ?`,
              [theme.name, theme.description, theme.isDark ? 1 : 0, theme.colors, theme.layout, theme.font, theme.animation, theme.components, theme.customCSS, theme.visibility, theme.allowedRoles, now, theme.id]
            )
          } else {
            // 插入
            run(
              `INSERT INTO themes (id, name, description, isDark, colors, layout, font, animation, components, customCSS, isSystem, isActive, visibility, allowedRoles, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [theme.id || randomUUID(), theme.name, theme.description, theme.isDark ? 1 : 0, theme.colors, theme.layout, theme.font, theme.animation, theme.components, theme.customCSS, 0, 0, theme.visibility || 'private', theme.allowedRoles, theme.createdAt || now, now]
            )
          }
          results.themes.imported++
        } catch (e) {
          console.error('导入主题失败:', e)
        }
      }
    }
    
    // 导入名言
    if (Array.isArray(data.quotes)) {
      for (const quote of data.quotes) {
        try {
          const existing = queryOne('SELECT id FROM quotes WHERE id = ?', [quote.id])
          if (existing && mode === 'skip') {
            results.quotes.skipped++
            continue
          }
          
          if (existing) {
            run(
              `UPDATE quotes SET content = ?, source = ?, orderIndex = ? WHERE id = ?`,
              [quote.content, quote.source, quote.orderIndex, quote.id]
            )
          } else {
            run(
              `INSERT INTO quotes (id, content, source, orderIndex, createdAt) VALUES (?, ?, ?, ?, ?)`,
              [quote.id || randomUUID(), quote.content, quote.source, quote.orderIndex, quote.createdAt || now]
            )
          }
          results.quotes.imported++
        } catch (e) {
          console.error('导入名言失败:', e)
        }
      }
    }
    
    // 导入设置
    if (data.settings && typeof data.settings === 'object') {
      for (const [key, value] of Object.entries(data.settings)) {
        try {
          const existing = queryOne('SELECT key FROM settings WHERE key = ?', [key])
          if (existing) {
            run('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?', [String(value), now, key])
          } else {
            run('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', [key, String(value), now])
          }
        } catch (e) {
          console.error('导入设置失败:', e)
        }
      }
    }
    
    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'IMPORT_DATA',
      resourceType: 'data',
      details: { mode, results },
    })
    
    res.json({
      success: true,
      data: results,
      message: '数据导入成功',
    })
  } catch (error) {
    console.error('导入数据失败:', error)
    res.status(500).json({ success: false, error: '导入数据失败' })
  }
})

/**
 * 工厂重置（需要管理员权限）
 * POST /api/v2/data/factory-reset
 * 
 * 支持三种模式：
 * - mode: 'full' - 完全重置，清空所有数据
 * - mode: 'keepUsers' - 保留用户数据，清空其他（默认）
 * - mode: 'initial' - 恢复初始状态，保留示例数据
 */
router.post('/factory-reset', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { mode = 'keepUsers' } = req.body
    
    const db = getDatabase()
    const now = new Date().toISOString()
    
    // 记录重置前的数据量
    const beforeStats = {
      bookmarks: queryOne('SELECT COUNT(*) as count FROM bookmarks')?.count || 0,
      categories: queryOne('SELECT COUNT(*) as count FROM categories')?.count || 0,
      themes: queryOne('SELECT COUNT(*) as count FROM themes WHERE isSystem = 0')?.count || 0,
    }
    
    // 清空数据表
    db.run('DELETE FROM bookmarks')
    db.run('DELETE FROM categories')
    db.run('DELETE FROM themes WHERE isSystem = 0')
    db.run('DELETE FROM quotes')
    db.run('DELETE FROM tags')
    db.run('DELETE FROM widgets')
    db.run('DELETE FROM custom_metrics')
    db.run('DELETE FROM service_monitors')
    db.run('DELETE FROM file_transfers')
    db.run('DELETE FROM rss_feeds')
    db.run('DELETE FROM rss_articles')
    db.run('DELETE FROM shares')
    db.run('DELETE FROM visits')
    db.run('DELETE FROM audit_logs')
    db.run('DELETE FROM notepads')
    db.run('DELETE FROM notes')
    db.run('DELETE FROM note_folders')
    db.run('DELETE FROM bookmark_notes')
    db.run('DELETE FROM bookmark_tags')
    
    // 重置设置
    db.run("DELETE FROM settings WHERE key != 'siteTitle'")
    db.run("UPDATE settings SET value = 'Nexus' WHERE key = 'siteTitle'")
    
    // 如果是恢复初始状态，插入示例数据
    if (mode === 'initial') {
      // 插入示例分类
      for (const cat of initialCategories) {
        run(
          `INSERT INTO categories (id, name, icon, color, orderIndex, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cat.id, cat.name, cat.icon, cat.color, cat.orderIndex, cat.description, now, now]
        )
      }
      
      // 插入示例书签
      for (const bm of initialBookmarks) {
        run(
          `INSERT INTO bookmarks (id, url, title, description, category, tags, orderIndex, isPinned, visibility, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [bm.id, bm.url, bm.title, bm.description, bm.category, bm.tags, bm.orderIndex, bm.isPinned ? 1 : 0, bm.visibility, now, now]
        )
      }
      
      // 插入示例名言
      for (const quote of initialQuotes) {
        run(
          `INSERT INTO quotes (id, content, source, orderIndex, createdAt) VALUES (?, ?, ?, ?, ?)`,
          [quote.id, quote.content, quote.source, quote.orderIndex, now]
        )
      }
      
      // 插入初始设置（使用 INSERT OR REPLACE 避免唯一约束冲突）
      for (const [key, value] of Object.entries(initialSettings)) {
        run(
          `INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`,
          [key, String(value), now]
        )
      }
      
      console.log('[Factory Reset] Initial data inserted')
    }
    
    // 清除所有缓存
    globalCache.clear()
    userCache.clear()
    settingsCache.clear()
    console.log('[Factory Reset] All caches cleared')
    
    if (mode === 'full') {
      // 完全重置，删除所有非管理员用户
      db.run("DELETE FROM users WHERE role != 'admin'")
      db.run('DELETE FROM tokens')
      db.run('DELETE FROM user_theme_preferences')
    }
    
    // 记录审计日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'FACTORY_RESET',
      resourceType: 'system',
      details: { mode, beforeStats },
    })
    
    // 构建返回消息
    let message = ''
    switch (mode) {
      case 'full':
        message = '系统已完全重置'
        break
      case 'initial':
        message = `系统已恢复初始状态（${initialCategories.length}个分类，${initialBookmarks.length}个书签）`
        break
      default:
        message = '系统已重置（保留用户数据）'
    }
    
    res.json({
      success: true,
      message,
      data: { beforeStats, mode },
    })
  } catch (error: any) {
    console.error('工厂重置失败:', error)
    console.error('错误堆栈:', error?.stack)
    res.status(500).json({ success: false, error: '工厂重置失败: ' + (error?.message || '未知错误') })
  }
})

/**
 * 获取数据概览（需要管理员权限）
 * GET /api/v2/data/overview
 */
router.get('/overview', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const stats = {
      bookmarks: queryOne('SELECT COUNT(*) as count FROM bookmarks')?.count || 0,
      categories: queryOne('SELECT COUNT(*) as count FROM categories')?.count || 0,
      users: queryOne('SELECT COUNT(*) as count FROM users')?.count || 0,
      themes: queryOne('SELECT COUNT(*) as count FROM themes')?.count || 0,
      customThemes: queryOne('SELECT COUNT(*) as count FROM themes WHERE isSystem = 0')?.count || 0,
      quotes: queryOne('SELECT COUNT(*) as count FROM quotes')?.count || 0,
      tags: queryOne('SELECT COUNT(*) as count FROM tags')?.count || 0,
      widgets: queryOne('SELECT COUNT(*) as count FROM widgets')?.count || 0,
      customMetrics: queryOne('SELECT COUNT(*) as count FROM custom_metrics')?.count || 0,
      serviceMonitors: queryOne('SELECT COUNT(*) as count FROM service_monitors')?.count || 0,
      visits: queryOne('SELECT COUNT(*) as count FROM visits')?.count || 0,
      auditLogs: queryOne('SELECT COUNT(*) as count FROM audit_logs')?.count || 0,
      fileTransfers: queryOne('SELECT COUNT(*) as count FROM file_transfers')?.count || 0,
    }
    
    // 数据库文件大小
    const dbSize = 'N/A' // sql.js 是内存数据库，无法直接获取文件大小
    
    res.json({
      success: true,
      data: {
        stats,
        dbSize,
        lastBackup: null, // 可以后续实现备份功能
      },
    })
  } catch (error) {
    console.error('获取数据概览失败:', error)
    res.status(500).json({ success: false, error: '获取数据概览失败' })
  }
})

export default router
