/**
 * 用户路由 - V2版本
 * 提供用户认证和管理功能
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware, generateToken } from '../../middleware/auth.js'
import { 
  getUsers, 
  updateUser, 
  hashPassword, 
  generateId, 
  verifyPassword
} from '../../db/index.js'
import { saveTokenToDb, getSessionTimeout } from '../../middleware/auth.js'
import { run, queryOne, queryAll } from '../../utils/index.js'
import { isLocked, recordFailedAttempt, clearLock } from '../../utils/securityLock.js'
import { logAudit } from '../../db/audit-enhanced.js'

const router = Router()

interface User {
  id: string
  username: string
  password: string
  email: string
  role: 'admin' | 'user'
  isActive: number
  createdAt: string
  updatedAt: string
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const clientIp = req.ip || 'unknown'
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    }
    
    // 检查是否被锁定（使用用户名作为锁定键）
    const lockStatus = isLocked(clientIp, username.toLowerCase(), 'extract')
    if (lockStatus.locked) {
      return res.status(423).json({ 
        success: false, 
        error: `登录失败次数过多，请${lockStatus.remainingTime}分钟后重试`,
        locked: true,
        remainingTime: lockStatus.remainingTime
      })
    }
    
    const user = queryOne('SELECT * FROM users WHERE username = ? AND isActive = 1', [username]) as User | null
    
    if (!user) {
      // 记录失败尝试
      const failResult = recordFailedAttempt(clientIp, username.toLowerCase(), 'extract')
      
      if (failResult.locked) {
        return res.status(423).json({ 
          success: false, 
          error: '登录失败次数过多，已锁定15分钟',
          locked: true,
          remainingTime: 15
        })
      }
      
      return res.status(401).json({ 
        success: false, 
        error: `用户名或密码错误，还剩${failResult.remainingAttempts}次机会`,
        remainingAttempts: failResult.remainingAttempts
      })
    }
    
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      // 记录失败尝试
      const failResult = recordFailedAttempt(clientIp, username.toLowerCase(), 'extract')
      
      if (failResult.locked) {
        return res.status(423).json({ 
          success: false, 
          error: '登录失败次数过多，已锁定15分钟',
          locked: true,
          remainingTime: 15
        })
      }
      
      return res.status(401).json({ 
        success: false, 
        error: `用户名或密码错误，还剩${failResult.remainingAttempts}次机会`,
        remainingAttempts: failResult.remainingAttempts
      })
    }
    
    // 登录成功，清除锁定记录
    clearLock(clientIp, username.toLowerCase(), 'extract')
    
    const token = generateToken()
    const { ms: timeoutMs } = getSessionTimeout()
    saveTokenToDb(token, user.id, user.username, Date.now() + timeoutMs)
    
    // 记录登录成功日志
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'user',
      resourceId: user.id,
      details: { role: user.role },
      ip: clientIp,
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive === 1,
        createdAt: new Date(user.createdAt).getTime(),
        updatedAt: new Date(user.updatedAt).getTime(),
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: '登录失败，请稍后重试' })
  }
})

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body
    
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: '用户名、邮箱和密码不能为空' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码长度至少为6位' })
    }
    
    const existingUser = queryOne('SELECT id FROM users WHERE username = ?', [username]) as User | null
    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名已存在' })
    }
    
    const existingEmail = queryOne('SELECT id FROM users WHERE email = ?', [email]) as User | null
    if (existingEmail) {
      return res.status(400).json({ success: false, error: '邮箱已被注册' })
    }
    
    const hashedPassword = await hashPassword(password)
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      'INSERT INTO users (id, username, password, email, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [id, username, hashedPassword, email, 'user', now, now]
    )
    
    const token = generateToken()
    const { ms: timeoutMs } = getSessionTimeout()
    saveTokenToDb(token, id, username, Date.now() + timeoutMs)
    
    // 记录用户注册日志
    logAudit({
      userId: id,
      username: username,
      action: 'USER_REGISTER',
      resourceType: 'user',
      resourceId: id,
      details: { email, role: 'user' },
      ip: String(req.ip || 'unknown'),
      userAgent: String(req.headers['user-agent'] || ''),
      riskLevel: 'low'
    })

    res.json({
      success: true,
      token,
      user: {
        id,
        username,
        email,
        role: 'user',
        isActive: true,
        createdAt: new Date(now).getTime(),
        updatedAt: new Date(now).getTime(),
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, error: '注册失败，请稍后重试' })
  }
})

router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user
  
  // 记录退出登录日志
  logAudit({
    userId: user?.id,
    username: user?.username,
    action: 'USER_LOGOUT',
    resourceType: 'user',
    resourceId: user?.id,
    details: {},
    ip: String(req.ip || 'unknown'),
    userAgent: String(req.headers['user-agent'] || ''),
    riskLevel: 'low'
  })

  res.json({ success: true })
})

router.get('/verify', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    
    if (!userId) {
      return res.status(401).json({ valid: false })
    }
    
    const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]) as User | null
    
    if (!user || user.isActive !== 1) {
      return res.status(401).json({ valid: false })
    }
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive === 1,
        createdAt: new Date(user.createdAt).getTime(),
        updatedAt: new Date(user.updatedAt).getTime(),
      }
    })
  } catch (error) {
    console.error('Verify error:', error)
    res.status(401).json({ valid: false })
  }
})

// 获取当前登录用户信息
router.get('/profile', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const user = queryOne('SELECT id, username, email, role, isActive, createdAt FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive === 1,
        createdAt: new Date(user.createdAt).getTime()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get profile' })
  }
})

// 用户管理路由需要管理员权限
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const users = getUsers()
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get users' })
  }
})

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { username, password, email, role } = req.body
    const hashedPassword = await hashPassword(password)
    const id = generateId()
    const now = new Date().toISOString()
    
    run(
      'INSERT INTO users (id, username, password, email, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [id, username, hashedPassword, email || null, role || 'user', now, now]
    )
    
    res.json({ success: true, data: { id, username, email, role } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create user' })
  }
})

router.put('/:userId', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  try {
    const userId = Array.isArray(_req.params.userId) ? _req.params.userId[0] : _req.params.userId
    const { username, email, role, isActive } = _req.body
    updateUser(userId, { username, email, role, isActive })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user' })
  }
})

router.delete('/:userId', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    run('DELETE FROM users WHERE id = ?', [userId])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' })
  }
})

// 获取用户统计信息
router.get('/:userId/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    const currentUser = (req as any).user
    
    // 检查权限：只能查看自己的统计，或者管理员可以查看所有
    if (currentUser.id !== userId && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: '无权查看此用户统计' })
    }
    
    // 书签数量
    const bookmarkResult = queryOne('SELECT COUNT(*) as count FROM bookmarks WHERE userId = ?', [userId])
    
    // 分类数量
    const categoryResult = queryOne('SELECT COUNT(*) as count FROM categories WHERE userId = ?', [userId])
    
    // 标签数量（从 bookmarks 表中解析 tags 字段）
    const bookmarks = queryAll('SELECT tags FROM bookmarks WHERE userId = ? AND tags IS NOT NULL', [userId])
    const tagSet = new Set<string>()
    bookmarks.forEach((b: any) => {
      if (b.tags) {
        b.tags.split(',').forEach((tag: string) => tagSet.add(tag.trim()))
      }
    })
    
    // 总访问量
    const visitResult = queryOne('SELECT COUNT(*) as count FROM visits WHERE userId = ?', [userId])
    
    // 最喜欢的分类
    const favoriteCategoryResult = queryOne(`
      SELECT category, COUNT(*) as count 
      FROM bookmarks 
      WHERE userId = ? AND category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 1
    `, [userId])
    
    res.json({
      success: true,
      data: {
        bookmarkCount: bookmarkResult?.count || 0,
        categoryCount: categoryResult?.count || 0,
        tagCount: tagSet.size,
        totalVisits: visitResult?.count || 0,
        favoriteCategory: favoriteCategoryResult?.category
      }
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to get user stats' })
  }
})

// 获取管理员统计（所有用户汇总）
router.get('/admin/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    // 总用户数
    const userResult = queryOne('SELECT COUNT(*) as count FROM users')
    
    // 活跃用户（最近30天有登录）
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const activeUserResult = queryOne(
      'SELECT COUNT(DISTINCT userId) as count FROM visits WHERE visitedAt >= ?',
      [thirtyDaysAgo]
    )
    
    // 总书签数
    const bookmarkResult = queryOne('SELECT COUNT(*) as count FROM bookmarks')
    
    // 总分类数
    const categoryResult = queryOne('SELECT COUNT(*) as count FROM categories')
    
    // 总访问量
    const visitResult = queryOne('SELECT COUNT(*) as count FROM visits')
    
    res.json({
      success: true,
      data: {
        totalUsers: userResult?.count || 0,
        activeUsers: activeUserResult?.count || 0,
        totalBookmarks: bookmarkResult?.count || 0,
        totalCategories: categoryResult?.count || 0,
        totalVisits: visitResult?.count || 0
      }
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to get admin stats' })
  }
})

// ========== 用户私密密码管理 ==========

import {
  setUserPrivatePassword,
  verifyUserPrivatePassword,
  hasUserPrivatePassword,
  getUserPrivatePasswordInfo,
  updateUserPrivatePassword,
  disableUserPrivatePassword,
  enableUserPrivatePassword,
  removeUserPrivatePassword
} from '../../db/index.js'

/**
 * 获取当前用户私密密码状态
 * GET /api/v2/users/me/private-password/status
 */
router.get('/me/private-password/status', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const hasPassword = hasUserPrivatePassword(userId)
    const info = getUserPrivatePasswordInfo(userId)
    
    res.json({
      success: true,
      data: {
        hasPassword,
        isEnabled: info?.isEnabled ?? false,
        createdAt: info?.createdAt,
        updatedAt: info?.updatedAt
      }
    })
  } catch (error) {
    console.error('Get private password status error:', error)
    res.status(500).json({ success: false, error: '获取私密密码状态失败' })
  }
})

/**
 * 设置用户私密密码
 * POST /api/v2/users/me/private-password
 */
router.post('/me/private-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { password } = req.body
    
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: '密码长度至少为4位' })
    }
    
    await setUserPrivatePassword(userId, password)
    
    res.json({
      success: true,
      message: '私密密码设置成功'
    })
  } catch (error) {
    console.error('Set private password error:', error)
    res.status(500).json({ success: false, error: '设置私密密码失败' })
  }
})

/**
 * 验证用户私密密码
 * POST /api/v2/users/me/private-password/verify
 */
router.post('/me/private-password/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { password } = req.body
    
    if (!password) {
      return res.status(400).json({ success: false, error: '请输入密码' })
    }
    
    const isValid = await verifyUserPrivatePassword(userId, password)
    
    res.json({
      success: true,
      data: { valid: isValid }
    })
  } catch (error) {
    console.error('Verify private password error:', error)
    res.status(500).json({ success: false, error: '验证密码失败' })
  }
})

/**
 * 更新用户私密密码
 * PUT /api/v2/users/me/private-password
 */
router.put('/me/private-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { oldPassword, newPassword } = req.body
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: '请提供旧密码和新密码' })
    }
    
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: '新密码长度至少为4位' })
    }
    
    // 验证旧密码
    const isValid = await verifyUserPrivatePassword(userId, oldPassword)
    if (!isValid) {
      return res.status(401).json({ success: false, error: '旧密码不正确' })
    }
    
    await updateUserPrivatePassword(userId, newPassword)
    
    res.json({
      success: true,
      message: '私密密码更新成功'
    })
  } catch (error) {
    console.error('Update private password error:', error)
    res.status(500).json({ success: false, error: '更新私密密码失败' })
  }
})

/**
 * 禁用用户私密密码
 * PATCH /api/v2/users/me/private-password/disable
 */
router.patch('/me/private-password/disable', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    disableUserPrivatePassword(userId)
    
    res.json({
      success: true,
      message: '私密密码已禁用'
    })
  } catch (error) {
    console.error('Disable private password error:', error)
    res.status(500).json({ success: false, error: '禁用私密密码失败' })
  }
})

/**
 * 启用用户私密密码
 * PATCH /api/v2/users/me/private-password/enable
 */
router.patch('/me/private-password/enable', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    enableUserPrivatePassword(userId)
    
    res.json({
      success: true,
      message: '私密密码已启用'
    })
  } catch (error) {
    console.error('Enable private password error:', error)
    res.status(500).json({ success: false, error: '启用私密密码失败' })
  }
})

/**
 * 删除用户私密密码
 * DELETE /api/v2/users/me/private-password
 */
router.delete('/me/private-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { password } = req.body
    
    // 验证密码
    const isValid = await verifyUserPrivatePassword(userId, password)
    if (!isValid) {
      return res.status(401).json({ success: false, error: '密码不正确' })
    }
    
    removeUserPrivatePassword(userId)
    
    res.json({
      success: true,
      message: '私密密码已删除'
    })
  } catch (error) {
    console.error('Remove private password error:', error)
    res.status(500).json({ success: false, error: '删除私密密码失败' })
  }
})

export default router
