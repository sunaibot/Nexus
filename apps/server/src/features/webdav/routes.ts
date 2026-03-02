/**
 * WebDAV路由模块 - V2 API
 * 支持多协议书签同步
 * 路径前缀: /api/v2/webdav
 */

import { Router } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { webDAVService } from './service.js'
import { WebDAVProtocol, SyncDirection } from './types.js'
import { queryAll, queryOne, runQuery, generateId } from '../../utils/index.js'

const router = Router()

/**
 * 获取WebDAV配置
 * GET /api/v2/webdav/config
 */
router.get('/config', authMiddleware, (req, res) => {
  try {
    const config = queryOne('SELECT * FROM webdav_configs WHERE enabled = 1 ORDER BY createdAt DESC LIMIT 1')
    if (!config) {
      return res.json({ success: true, data: null })
    }
    res.json({
      success: true,
      data: {
        ...config,
        password: undefined, // 不返回密码
      },
    })
  } catch (error) {
    console.error('获取WebDAV配置失败:', error)
    res.status(500).json({ success: false, error: '获取配置失败' })
  }
})

/**
 * 保存WebDAV配置
 * POST /api/v2/webdav/config
 */
router.post('/config', authMiddleware, (req, res) => {
  try {
    const {
      name,
      protocol = WebDAVProtocol.WEBDAV,
      serverUrl,
      username,
      password,
      remotePath,
      syncDirection = SyncDirection.BIDIRECTIONAL,
      autoSync = false,
      syncInterval = 60,
    } = req.body

    if (!serverUrl || !username) {
      return res.status(400).json({
        success: false,
        error: '服务器地址和用户名不能为空',
      })
    }

    const now = new Date().toISOString()
    const existing = queryOne('SELECT id FROM webdav_configs WHERE enabled = 1 LIMIT 1')

    if (existing) {
      // 更新现有配置
      const fields: string[] = []
      const values: any[] = []

      if (name !== undefined) { fields.push('name = ?'); values.push(name) }
      if (protocol !== undefined) { fields.push('protocol = ?'); values.push(protocol) }
      if (serverUrl !== undefined) { fields.push('serverUrl = ?'); values.push(serverUrl) }
      if (username !== undefined) { fields.push('username = ?'); values.push(username) }
      if (password !== undefined) { fields.push('password = ?'); values.push(password) }
      if (remotePath !== undefined) { fields.push('remotePath = ?'); values.push(remotePath) }
      if (syncDirection !== undefined) { fields.push('syncDirection = ?'); values.push(syncDirection) }
      if (autoSync !== undefined) { fields.push('autoSync = ?'); values.push(autoSync ? 1 : 0) }
      if (syncInterval !== undefined) { fields.push('syncInterval = ?'); values.push(syncInterval) }

      fields.push('updatedAt = ?')
      values.push(now)
      values.push(existing.id)

      runQuery(`UPDATE webdav_configs SET ${fields.join(', ')} WHERE id = ?`, values)
      webDAVService.clearClientCache(existing.id)
      
      res.json({ success: true, data: { id: existing.id } })
    } else {
      // 创建新配置
      const id = generateId()
      runQuery(
        `INSERT INTO webdav_configs (id, name, protocol, serverUrl, username, password, remotePath, syncDirection, autoSync, syncInterval, enabled, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name || 'WebDAV',
          protocol,
          serverUrl,
          username,
          password || '',
          remotePath || '/bookmarks',
          syncDirection,
          autoSync ? 1 : 0,
          syncInterval,
          1,
          now,
          now,
        ]
      )
      res.json({ success: true, data: { id } })
    }
  } catch (error) {
    console.error('保存WebDAV配置失败:', error)
    res.status(500).json({ success: false, error: '保存配置失败' })
  }
})

/**
 * 测试WebDAV连接
 * POST /api/v2/webdav/test
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const result = await webDAVService.testConnection(req.body)
    res.json({
      success: result.success,
      data: result,
    })
  } catch (error) {
    console.error('测试WebDAV连接失败:', error)
    res.status(500).json({ success: false, error: '测试连接失败' })
  }
})

/**
 * 执行同步
 * POST /api/v2/webdav/sync
 */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const config = queryOne('SELECT * FROM webdav_configs WHERE enabled = 1 ORDER BY createdAt DESC LIMIT 1')
    if (!config) {
      return res.status(404).json({ success: false, error: '未配置WebDAV' })
    }

    const result = await webDAVService.syncBookmarks(config)
    res.json({
      success: result.success,
      data: result,
    })
  } catch (error) {
    console.error('同步失败:', error)
    res.status(500).json({ success: false, error: '同步失败' })
  }
})

/**
 * 获取同步日志
 * GET /api/v2/webdav/logs
 */
router.get('/logs', authMiddleware, (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const logs = queryAll(
      'SELECT * FROM webdav_sync_history ORDER BY startedAt DESC LIMIT ?',
      [limit]
    )
    res.json({
      success: true,
      data: logs.map((h: any) => ({
        ...h,
        errors: h.errors ? JSON.parse(h.errors) : [],
      })),
    })
  } catch (error) {
    console.error('获取同步日志失败:', error)
    res.status(500).json({ success: false, error: '获取日志失败' })
  }
})

/**
 * 获取所有WebDAV配置（管理员）
 * GET /api/v2/webdav/configs
 */
router.get('/configs', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '无权限' })
    }

    const configs = queryAll('SELECT * FROM webdav_configs ORDER BY createdAt DESC')
    res.json({
      success: true,
      data: configs.map((c: any) => ({
        ...c,
        password: undefined,
      })),
    })
  } catch (error) {
    console.error('获取WebDAV配置列表失败:', error)
    res.status(500).json({ success: false, error: '获取配置失败' })
  }
})

/**
 * 删除WebDAV配置
 * DELETE /api/v2/webdav/configs/:id
 */
router.delete('/configs/:id', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: '无权限' })
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    runQuery('DELETE FROM webdav_configs WHERE id = ?', [id])
    webDAVService.clearClientCache(id)
    res.json({ success: true })
  } catch (error) {
    console.error('删除WebDAV配置失败:', error)
    res.status(500).json({ success: false, error: '删除配置失败' })
  }
})

export default router
