/**
 * 私密书签路由模块
 * 复用现有路由逻辑，增加分级私密功能
 */

import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import { privateBookmarkService } from './service.js'
import { PrivacyLevel, SceneMode, BatchOperationType } from './types.js'

const router = Router()

/**
 * 设置书签为私密
 * POST /api/private-bookmarks/:bookmarkId/set
 */
router.post('/:bookmarkId/set', authMiddleware, async (req, res) => {
  const bookmarkId = Array.isArray(req.params.bookmarkId) ? req.params.bookmarkId[0] : req.params.bookmarkId
  const { privacyLevel, sceneMode, password } = req.body
  const user = (req as any).user

  // 验证参数
  if (!privacyLevel || !Object.values(PrivacyLevel).includes(privacyLevel as PrivacyLevel)) {
    return res.status(400).json({ success: false, error: '无效的私密级别' })
  }

  const result = await privateBookmarkService.setPrivate(
    bookmarkId,
    privacyLevel as PrivacyLevel,
    (sceneMode as SceneMode) || SceneMode.PERSONAL,
    password
  )

  if (result.success) {
    res.json({ success: true })
  } else {
    res.status(400).json({ success: false, error: result.error })
  }
})

/**
 * 取消书签私密状态
 * POST /api/private-bookmarks/:bookmarkId/remove
 */>
router.post('/:bookmarkId/remove', authMiddleware, async (req, res) => {
  const bookmarkId = Array.isArray(req.params.bookmarkId) ? req.params.bookmarkId[0] : req.params.bookmarkId

  const result = await privateBookmarkService.removePrivate(bookmarkId)

  if (result.success) {
    res.json({ success: true })
  } else {
    res.status(400).json({ success: false, error: result.error })
  }
})

/**
 * 验证访问密码
 * POST /api/private-bookmarks/verify
 */
router.post('/verify', async (req, res) => {
  const { bookmarkId, password } = req.body

  if (!bookmarkId || !password) {
    return res.status(400).json({ success: false, error: '参数不完整' })
  }

  const result = await privateBookmarkService.verifyPassword({
    bookmarkId,
    password,
  })

  if (result.success) {
    res.json({
      success: true,
      data: {
        token: result.token,
        expiresAt: result.expiresAt,
      },
    })
  } else {
    res.status(401).json({ success: false, error: result.error })
  }
})

/**
 * 获取用户的私密书签列表
 * GET /api/private-bookmarks
 */
router.get('/', authMiddleware, async (req, res) => {
  const user = (req as any).user

  const bookmarks = await privateBookmarkService.getUserPrivateBookmarks(user.id)

  res.json({ success: true, data: bookmarks })
})

/**
 * 获取私密书签统计
 * GET /api/private-bookmarks/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  const user = (req as any).user

  const stats = await privateBookmarkService.getStats(user.id)

  res.json({ success: true, data: stats })
})

/**
 * 获取场景模式列表
 * GET /api/private-bookmarks/scene-modes
 */
router.get('/scene-modes', authMiddleware, async (req, res) => {
  const sceneModes = privateBookmarkService.getSceneModes()

  res.json({ success: true, data: sceneModes })
})

/**
 * 批量操作
 * POST /api/private-bookmarks/batch
 */
router.post('/batch', authMiddleware, async (req, res) => {
  const { bookmarkIds, operation, targetValue, password } = req.body

  if (!bookmarkIds || !Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
    return res.status(400).json({ success: false, error: '书签ID列表不能为空' })
  }

  if (!operation || !Object.values(BatchOperationType).includes(operation)) {
    return res.status(400).json({ success: false, error: '无效的操作类型' })
  }

  const result = await privateBookmarkService.batchOperation({
    bookmarkIds,
    operation: operation as BatchOperationType,
    targetValue,
    password,
  })

  res.json({
    success: result.success,
    data: result.results,
  })
})

export default router
