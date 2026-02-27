/**
 * V2 主题配置管理路由
 * 提供主题配置的CRUD操作，支持用户和角色隔离
 */
import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { logAudit } from '../../db/index.js'
import { queryOne, queryAll, run } from '../../utils/index.js'
import { randomUUID } from 'crypto'

const router = Router()

// 主题接口定义
interface Theme {
  id: string
  name: string
  description?: string
  isDark: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    border: string
    muted: string
    card: string
    hover: string
    active: string
  }
  layout: {
    maxWidth: string
    padding: string
    gridColumns: number
    gridGap: string
    borderRadius: string
    shadow: string
  }
  font: {
    family: string
    headingFamily: string
    baseSize: string
    lineHeight: number
    smallSize?: string
    largeSize?: string
  }
  animation: {
    enabled: boolean
    duration: string
    easing: string
    hoverDuration: string
  }
  components: {
    button: {
      borderRadius: string
      padding: string
      fontSize: string
    }
    card: {
      borderRadius: string
      padding: string
      shadow: string
    }
    input: {
      borderRadius: string
      padding: string
      borderWidth: string
    }
  }
  customCSS?: string
  isSystem: boolean
  isActive: boolean
  createdBy?: string
  visibility: 'public' | 'role' | 'private'
  allowedRoles?: string[]
  createdAt: string
  updatedAt: string
}

// 解析主题数据
function parseTheme(row: any): Theme {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isDark: Boolean(row.isDark),
    colors: JSON.parse(row.colors || '{}'),
    layout: JSON.parse(row.layout || '{}'),
    font: JSON.parse(row.font || '{}'),
    animation: JSON.parse(row.animation || '{}'),
    components: JSON.parse(row.components || '{}'),
    customCSS: row.customCSS,
    isSystem: Boolean(row.isSystem),
    isActive: Boolean(row.isActive),
    createdBy: row.createdBy,
    visibility: row.visibility,
    allowedRoles: row.allowedRoles ? JSON.parse(row.allowedRoles) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 检查用户是否有权限访问主题
function canAccessTheme(theme: Theme, user: any): boolean {
  // 系统主题所有人可见
  if (theme.isSystem) return true
  
  // 公开主题所有人可见
  if (theme.visibility === 'public') return true
  
  // 私有主题仅创建者可见
  if (theme.visibility === 'private') {
    return theme.createdBy === user.id
  }
  
  // 角色可见性
  if (theme.visibility === 'role' && theme.allowedRoles) {
    return theme.allowedRoles.includes(user.role)
  }
  
  return false
}

/**
 * 获取当前用户的主题（公开接口，需要认证）
 * GET /api/v2/theme
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    // 1. 首先检查用户是否有主题偏好
    const userPref = queryOne(
      'SELECT * FROM user_theme_preferences WHERE userId = ?',
      [user.id]
    )
    
    if (userPref) {
      const theme = queryOne('SELECT * FROM themes WHERE id = ?', [userPref.themeId])
      if (theme && canAccessTheme(parseTheme(theme), user)) {
        return res.json({
          success: true,
          data: {
            ...parseTheme(theme),
            isAutoMode: Boolean(userPref.isAutoMode),
            customOverrides: userPref.customOverrides ? JSON.parse(userPref.customOverrides) : undefined,
          },
        })
      }
    }
    
    // 2. 检查角色默认主题
    const roleDefault = queryOne(
      'SELECT * FROM role_default_themes WHERE role = ?',
      [user.role]
    )
    
    if (roleDefault) {
      const theme = queryOne('SELECT * FROM themes WHERE id = ?', [roleDefault.themeId])
      if (theme) {
        return res.json({
          success: true,
          data: {
            ...parseTheme(theme),
            isAutoMode: false,
          },
        })
      }
    }
    
    // 3. 返回系统默认主题
    const defaultTheme = queryOne('SELECT * FROM themes WHERE isSystem = 1 AND isActive = 1 LIMIT 1')
    if (defaultTheme) {
      return res.json({
        success: true,
        data: {
          ...parseTheme(defaultTheme),
          isAutoMode: false,
        },
      })
    }
    
    // 4. 如果没有找到任何主题，返回错误
    return res.status(404).json({
      success: false,
      error: '未找到可用主题',
    })
  } catch (error) {
    console.error('获取主题失败:', error)
    res.status(500).json({
      success: false,
      error: '获取主题失败',
    })
  }
})

/**
 * 获取所有可访问的主题（需要认证）
 * GET /api/v2/theme/all
 */
router.get('/all', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    // 获取所有主题
    const allThemes = queryAll('SELECT * FROM themes ORDER BY isSystem DESC, name ASC')
    
    // 过滤用户有权限访问的主题
    const accessibleThemes = allThemes
      .map(parseTheme)
      .filter(theme => canAccessTheme(theme, user))
      .map(theme => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        isDark: theme.isDark,
        isSystem: theme.isSystem,
        visibility: theme.visibility,
        createdAt: theme.createdAt,
      }))
    
    res.json({
      success: true,
      data: accessibleThemes,
    })
  } catch (error) {
    console.error('获取主题列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取主题列表失败',
    })
  }
})

/**
 * 获取特定主题详情（需要认证）
 * GET /api/v2/theme/:id
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const id = String(req.params.id)
    
    const themeRow = queryOne('SELECT * FROM themes WHERE id = ?', [id])
    
    if (!themeRow) {
      return res.status(404).json({
        success: false,
        error: '主题不存在',
      })
    }
    
    const theme = parseTheme(themeRow)
    
    if (!canAccessTheme(theme, user)) {
      return res.status(403).json({
        success: false,
        error: '无权访问此主题',
      })
    }
    
    res.json({
      success: true,
      data: theme,
    })
  } catch (error) {
    console.error('获取主题详情失败:', error)
    res.status(500).json({
      success: false,
      error: '获取主题详情失败',
    })
  }
})

/**
 * 创建新主题（需要认证）
 * POST /api/v2/theme
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
    const userAgent = (req.headers['user-agent'] || '') as string
    
    const {
      name,
      description,
      isDark,
      colors,
      layout,
      font,
      animation,
      components,
      customCSS,
      visibility = 'private',
      allowedRoles,
    } = req.body
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '主题名称不能为空',
      })
    }
    
    const id = randomUUID()
    const now = new Date().toISOString()
    
    run(
      `INSERT INTO themes (id, name, description, isDark, colors, layout, font, animation, components, customCSS, isSystem, isActive, createdBy, visibility, allowedRoles, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description || '',
        isDark ? 1 : 0,
        JSON.stringify(colors || {}),
        JSON.stringify(layout || {}),
        JSON.stringify(font || {}),
        JSON.stringify(animation || {}),
        JSON.stringify(components || {}),
        customCSS || '',
        0, // isSystem
        0, // isActive
        user.id,
        visibility,
        allowedRoles ? JSON.stringify(allowedRoles) : null,
        now,
        now,
      ]
    )
    
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'CREATE_THEME',
      resourceType: 'theme',
      resourceId: id,
      details: { name, visibility },
      ip,
      userAgent,
    })
    
    res.json({
      success: true,
      data: { id, name },
      message: '主题创建成功',
    })
  } catch (error) {
    console.error('创建主题失败:', error)
    res.status(500).json({
      success: false,
      error: '创建主题失败',
    })
  }
})

/**
 * 更新主题（需要认证，仅创建者或管理员）
 * PUT /api/v2/theme/:id
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
    const userAgent = (req.headers['user-agent'] || '') as string
    const id = String(req.params.id)
    
    const themeRow = queryOne('SELECT * FROM themes WHERE id = ?', [id])
    
    if (!themeRow) {
      return res.status(404).json({
        success: false,
        error: '主题不存在',
      })
    }
    
    const theme = parseTheme(themeRow)
    
    // 只有创建者或管理员可以修改
    if (theme.createdBy !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权修改此主题',
      })
    }
    
    const updates = req.body
    const now = new Date().toISOString()
    
    // 构建更新字段
    const updateFields: string[] = []
    const values: any[] = []
    
    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.isDark !== undefined) {
      updateFields.push('isDark = ?')
      values.push(updates.isDark ? 1 : 0)
    }
    if (updates.colors !== undefined) {
      updateFields.push('colors = ?')
      values.push(JSON.stringify(updates.colors))
    }
    if (updates.layout !== undefined) {
      updateFields.push('layout = ?')
      values.push(JSON.stringify(updates.layout))
    }
    if (updates.font !== undefined) {
      updateFields.push('font = ?')
      values.push(JSON.stringify(updates.font))
    }
    if (updates.animation !== undefined) {
      updateFields.push('animation = ?')
      values.push(JSON.stringify(updates.animation))
    }
    if (updates.components !== undefined) {
      updateFields.push('components = ?')
      values.push(JSON.stringify(updates.components))
    }
    if (updates.customCSS !== undefined) {
      updateFields.push('customCSS = ?')
      values.push(updates.customCSS)
    }
    if (updates.visibility !== undefined) {
      updateFields.push('visibility = ?')
      values.push(updates.visibility)
    }
    if (updates.allowedRoles !== undefined) {
      updateFields.push('allowedRoles = ?')
      values.push(JSON.stringify(updates.allowedRoles))
    }
    
    updateFields.push('updatedAt = ?')
    values.push(now)
    values.push(id)
    
    run(
      `UPDATE themes SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    )
    
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'UPDATE_THEME',
      resourceType: 'theme',
      resourceId: id,
      details: { updatedFields: Object.keys(updates) },
      ip,
      userAgent,
    })
    
    res.json({
      success: true,
      message: '主题更新成功',
    })
  } catch (error) {
    console.error('更新主题失败:', error)
    res.status(500).json({
      success: false,
      error: '更新主题失败',
    })
  }
})

/**
 * 删除主题（需要认证，仅创建者或管理员）
 * DELETE /api/v2/theme/:id
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') as string
    const userAgent = (req.headers['user-agent'] || '') as string
    const id = String(req.params.id)
    
    const themeRow = queryOne('SELECT * FROM themes WHERE id = ?', [id])
    
    if (!themeRow) {
      return res.status(404).json({
        success: false,
        error: '主题不存在',
      })
    }
    
    const theme = parseTheme(themeRow)
    
    // 系统主题不能删除
    if (theme.isSystem) {
      return res.status(403).json({
        success: false,
        error: '系统主题不能删除',
      })
    }
    
    // 只有创建者或管理员可以删除
    if (theme.createdBy !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权删除此主题',
      })
    }
    
    run('DELETE FROM themes WHERE id = ?', [id])
    
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'DELETE_THEME',
      resourceType: 'theme',
      resourceId: id,
      details: { name: theme.name },
      ip,
      userAgent,
    })
    
    res.json({
      success: true,
      message: '主题删除成功',
    })
  } catch (error) {
    console.error('删除主题失败:', error)
    res.status(500).json({
      success: false,
      error: '删除主题失败',
    })
  }
})

/**
 * 设置用户主题偏好（需要认证）
 * POST /api/v2/theme/preference
 */
router.post('/preference', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { themeId, isAutoMode, customOverrides } = req.body
    
    // 验证主题是否存在且用户有权限访问
    const themeRow = queryOne('SELECT * FROM themes WHERE id = ?', [themeId])
    if (!themeRow) {
      return res.status(404).json({
        success: false,
        error: '主题不存在',
      })
    }
    
    const theme = parseTheme(themeRow)
    if (!canAccessTheme(theme, user)) {
      return res.status(403).json({
        success: false,
        error: '无权使用此主题',
      })
    }
    
    const now = new Date().toISOString()
    const existing = queryOne('SELECT * FROM user_theme_preferences WHERE userId = ?', [user.id])
    
    if (existing) {
      run(
        `UPDATE user_theme_preferences SET themeId = ?, isAutoMode = ?, customOverrides = ?, updatedAt = ? WHERE userId = ?`,
        [
          themeId,
          isAutoMode ? 1 : 0,
          customOverrides ? JSON.stringify(customOverrides) : null,
          now,
          user.id,
        ]
      )
    } else {
      run(
        `INSERT INTO user_theme_preferences (userId, themeId, isAutoMode, customOverrides, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          themeId,
          isAutoMode ? 1 : 0,
          customOverrides ? JSON.stringify(customOverrides) : null,
          now,
          now,
        ]
      )
    }
    
    res.json({
      success: true,
      message: '主题偏好设置成功',
    })
  } catch (error) {
    console.error('设置主题偏好失败:', error)
    res.status(500).json({
      success: false,
      error: '设置主题偏好失败',
    })
  }
})

/**
 * 设置角色默认主题（需要管理员权限）
 * POST /api/v2/theme/role-default
 */
router.post('/role-default', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { role, themeId } = req.body
    
    if (!role || !themeId) {
      return res.status(400).json({
        success: false,
        error: '角色和主题ID不能为空',
      })
    }
    
    // 验证主题是否存在
    const themeRow = queryOne('SELECT * FROM themes WHERE id = ?', [themeId])
    if (!themeRow) {
      return res.status(404).json({
        success: false,
        error: '主题不存在',
      })
    }
    
    const now = new Date().toISOString()
    const existing = queryOne('SELECT * FROM role_default_themes WHERE role = ?', [role])
    
    if (existing) {
      run(
        'UPDATE role_default_themes SET themeId = ?, updatedAt = ? WHERE role = ?',
        [themeId, now, role]
      )
    } else {
      run(
        'INSERT INTO role_default_themes (role, themeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        [role, themeId, now, now]
      )
    }
    
    logAudit({
      userId: user.id,
      username: user.username,
      action: 'SET_ROLE_DEFAULT_THEME',
      resourceType: 'theme',
      details: { role, themeId },
    })
    
    res.json({
      success: true,
      message: '角色默认主题设置成功',
    })
  } catch (error) {
    console.error('设置角色默认主题失败:', error)
    res.status(500).json({
      success: false,
      error: '设置角色默认主题失败',
    })
  }
})

export default router
