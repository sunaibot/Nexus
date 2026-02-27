/**
 * WebDAV路由模块
 * 支持多协议书签同步
 */

import { Router } from 'express'
import { authMiddleware } from '../../middleware/index.js'
import { webDAVService } from './service.js'
import { WebDAVProtocol, SyncDirection } from './types.js'
import { queryAll, runQuery, generateId } from '../../utils/index.js'

const router = Router()

/**
 * 获取所有WebDAV配置
 * GET /api/webdav/configs
 */
router.get('/webdav/configs', authMiddleware, (req, res) => {
  try {
    const configs = queryAll('SELECT * FROM webdav_configs ORDER BY createdAt DESC', [])
    res.json({
      success: true,
      data: configs.map((c: any) => ({
        ...c,
        password: undefined, // 不返回密码
      })),
    })
  } catch (error) {
    console.error('获取WebDAV配置失败:', error)
    res.status(500).json({ success: false, error: '获取配置失败' })
  }
})

/**
 * 创建WebDAV配置
 * POST /api/webdav/configs
 */
router.post('/webdav/configs', authMiddleware, (req, res) => {
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

    if (!name || !serverUrl || !username || !password) {
      return res.status(400).json({
        success: false,
        error: '名称、服务器地址、用户名和密码不能为空',
      })
    }

    const id = generateId()
    const now = new Date().toISOString()

    runQuery(
      `INSERT INTO webdav_configs (id, name, protocol, serverUrl, username, password, remotePath, syncDirection, autoSync, syncInterval, enabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        protocol,
        serverUrl,
        username,
        password,
        remotePath || '/bookmarks',
        syncDirection,
        autoSync ? 1 : 0,
        syncInterval,
        1,
        now,
        now,
      ]
    )

    res.json({
      success: true,
      data: { id },
    })
  } catch (error) {
    console.error('创建WebDAV配置失败:', error)
    res.status(500).json({ success: false, error: '创建配置失败' })
  }
})

/**
 * 更新WebDAV配置
 * PUT /api/webdav/configs/:id
 */
router.put('/webdav/configs/:id', authMiddleware, (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const updates = req.body

    const allowedFields = [
      'name', 'protocol', 'serverUrl', 'username', 'password',
      'remotePath', 'syncDirection', 'autoSync', 'syncInterval', 'enabled'
    ]

    const fields: string[] = []
    const values: any[] = []

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`)
        values.push(field === 'autoSync' || field === 'enabled' ? (updates[field] ? 1 : 0) : updates[field])
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: '没有要更新的字段' })
    }

    fields.push('updatedAt = ?')
    values.push(new Date().toISOString())
    values.push(id)

    runQuery(
      `UPDATE webdav_configs SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    // 清除客户端缓存
    webDAVService.clearClientCache(id)

    res.json({ success: true })
  } catch (error) {
    console.error('更新WebDAV配置失败:', error)
    res.status(500).json({ success: false, error: '更新配置失败' })
  }
})

/**
 * 删除WebDAV配置
 * DELETE /api/webdav/configs/:id
 */
router.delete('/webdav/configs/:id', authMiddleware, (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    runQuery('DELETE FROM webdav_configs WHERE id = ?', [id])

    // 清除客户端缓存
    webDAVService.clearClientCache(id)

    res.json({ success: true })
  } catch (error) {
    console.error('删除WebDAV配置失败:', error)
    res.status(500).json({ success: false, error: '删除配置失败' })
  }
})

/**
 * 测试WebDAV连接
 * POST /api/webdav/test
 */
router.post('/webdav/test', authMiddleware, async (req, res) => {
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
 * POST /api/webdav/sync/:id
 */
router.post('/webdav/sync/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const config = queryAll('SELECT * FROM webdav_configs WHERE id = ?', [id])[0]

    if (!config) {
      return res.status(404).json({ success: false, error: '配置不存在' })
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
 * 获取同步历史
 * GET /api/webdav/history/:configId
 */
router.get('/webdav/history/:configId', authMiddleware, (req, res) => {
  try {
    const { configId } = req.params
    const limit = parseInt(req.query.limit as string) || 20

    const history = queryAll(
      'SELECT * FROM webdav_sync_history WHERE configId = ? ORDER BY startedAt DESC LIMIT ?',
      [configId, limit]
    )

    res.json({
      success: true,
      data: history.map((h: any) => ({
        ...h,
        errors: h.errors ? JSON.parse(h.errors) : [],
      })),
    })
  } catch (error) {
    console.error('获取同步历史失败:', error)
    res.status(500).json({ success: false, error: '获取历史失败' })
  }
})

export default router
