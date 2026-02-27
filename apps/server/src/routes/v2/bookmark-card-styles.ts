/**
 * 书签卡片样式配置路由 - V2版本
 * 支持全局、角色、用户级别的书签卡片样式配置
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 书签卡片样式接口
export interface BookmarkCardStyle {
  id: string
  // 基础样式
  backgroundColor: string
  backgroundGradient?: { from: string; to: string; angle: number }
  borderRadius: string
  borderWidth: string
  borderColor: string
  borderStyle: string
  // 阴影效果
  shadowColor: string
  shadowBlur: string
  shadowSpread: string
  shadowX: string
  shadowY: string
  // 间距
  padding: string
  margin: string
  gap: string
  // 字体样式
  titleFontSize: string
  titleFontWeight: string
  titleColor: string
  descriptionFontSize: string
  descriptionFontWeight: string
  descriptionColor: string
  // 效果
  opacity: number
  backdropBlur: string
  backdropSaturate: string
  // 悬停效果
  hoverBackgroundColor?: string
  hoverBorderColor?: string
  hoverShadowBlur?: string
  hoverScale: number
  hoverTransition: string
  // 图标样式
  iconSize: string
  iconColor?: string
  iconBackgroundColor?: string
  iconBorderRadius: string
  // 图片样式
  imageHeight: string
  imageBorderRadius: string
  imageObjectFit: string
  // 标签样式
  tagBackgroundColor: string
  tagTextColor?: string
  tagBorderRadius: string
  tagFontSize: string
  // 配置范围
  scope: 'global' | 'role' | 'user'
  userId?: string
  role?: string
  // 元数据
  priority: number
  isEnabled: boolean
  isDefault: boolean
  name?: string
  description?: string
  previewImage?: string
  createdAt: string
  updatedAt: string
}

// 解析JSON字段
function parseJsonField<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

// 解析样式配置
function parseStyleConfig(row: any): BookmarkCardStyle {
  return {
    id: row.id,
    backgroundColor: row.backgroundColor || 'rgba(255, 255, 255, 0.1)',
    backgroundGradient: parseJsonField(row.backgroundGradient, undefined),
    borderRadius: row.borderRadius || '12px',
    borderWidth: row.borderWidth || '1px',
    borderColor: row.borderColor || 'rgba(255, 255, 255, 0.1)',
    borderStyle: row.borderStyle || 'solid',
    shadowColor: row.shadowColor || 'rgba(0, 0, 0, 0.1)',
    shadowBlur: row.shadowBlur || '10px',
    shadowSpread: row.shadowSpread || '0px',
    shadowX: row.shadowX || '0px',
    shadowY: row.shadowY || '4px',
    padding: row.padding || '16px',
    margin: row.margin || '8px',
    gap: row.gap || '12px',
    titleFontSize: row.titleFontSize || '16px',
    titleFontWeight: row.titleFontWeight || '600',
    titleColor: row.titleColor || 'inherit',
    descriptionFontSize: row.descriptionFontSize || '14px',
    descriptionFontWeight: row.descriptionFontWeight || '400',
    descriptionColor: row.descriptionColor || 'inherit',
    opacity: row.opacity ?? 1.0,
    backdropBlur: row.backdropBlur || '10px',
    backdropSaturate: row.backdropSaturate || '180%',
    hoverBackgroundColor: row.hoverBackgroundColor,
    hoverBorderColor: row.hoverBorderColor,
    hoverShadowBlur: row.hoverShadowBlur,
    hoverScale: row.hoverScale ?? 1.02,
    hoverTransition: row.hoverTransition || 'all 0.3s ease',
    iconSize: row.iconSize || '24px',
    iconColor: row.iconColor,
    iconBackgroundColor: row.iconBackgroundColor,
    iconBorderRadius: row.iconBorderRadius || '8px',
    imageHeight: row.imageHeight || '120px',
    imageBorderRadius: row.imageBorderRadius || '8px',
    imageObjectFit: row.imageObjectFit || 'cover',
    tagBackgroundColor: row.tagBackgroundColor || 'rgba(0, 0, 0, 0.1)',
    tagTextColor: row.tagTextColor,
    tagBorderRadius: row.tagBorderRadius || '4px',
    tagFontSize: row.tagFontSize || '12px',
    scope: row.scope || 'global',
    userId: row.userId,
    role: row.role,
    priority: row.priority || 0,
    isEnabled: row.isEnabled === 1,
    isDefault: row.isDefault === 1,
    name: row.name,
    description: row.description,
    previewImage: row.previewImage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 获取当前用户的书签卡片样式（公开接口）
router.get('/current', (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    let style: BookmarkCardStyle | null = null

    if (user) {
      // 已登录用户：按优先级获取配置
      // 1. 用户专属配置
      const userStyle = queryOne(
        'SELECT * FROM bookmark_card_styles WHERE scope = ? AND userId = ? AND isEnabled = 1 ORDER BY priority DESC, updatedAt DESC LIMIT 1',
        ['user', user.id]
      )
      if (userStyle) {
        style = parseStyleConfig(userStyle)
      } else if (user.role) {
        // 2. 角色配置
        const roleStyle = queryOne(
          'SELECT * FROM bookmark_card_styles WHERE scope = ? AND role = ? AND isEnabled = 1 ORDER BY priority DESC, updatedAt DESC LIMIT 1',
          ['role', user.role]
        )
        if (roleStyle) {
          style = parseStyleConfig(roleStyle)
        }
      }
    }

    // 3. 全局默认配置
    if (!style) {
      const globalStyle = queryOne(
        'SELECT * FROM bookmark_card_styles WHERE scope = ? AND isEnabled = 1 AND isDefault = 1 ORDER BY priority DESC, updatedAt DESC LIMIT 1',
        ['global']
      )
      if (globalStyle) {
        style = parseStyleConfig(globalStyle)
      } else {
        // 返回默认配置
        style = parseStyleConfig({ id: 'default' })
      }
    }

    return successResponse(res, style)
  } catch (error) {
    console.error('获取书签卡片样式失败:', error)
    return errorResponse(res, '获取书签卡片样式失败')
  }
})

// 获取所有样式配置（管理员）
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { scope, userId, role } = req.query

    let sql = 'SELECT * FROM bookmark_card_styles WHERE 1=1'
    const params: any[] = []

    if (scope) {
      sql += ' AND scope = ?'
      params.push(scope)
    }
    if (userId) {
      sql += ' AND userId = ?'
      params.push(userId)
    }
    if (role) {
      sql += ' AND role = ?'
      params.push(role)
    }

    sql += ' ORDER BY scope ASC, priority DESC, updatedAt DESC'

    const styles = queryAll(sql, params)
    return successResponse(res, styles.map(parseStyleConfig))
  } catch (error) {
    console.error('获取样式配置列表失败:', error)
    return errorResponse(res, '获取样式配置列表失败')
  }
})

// 获取单个样式配置（管理员）
router.get('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const style = queryOne('SELECT * FROM bookmark_card_styles WHERE id = ?', [id])
    if (!style) {
      return errorResponse(res, '样式配置不存在', 404)
    }

    return successResponse(res, parseStyleConfig(style))
  } catch (error) {
    console.error('获取样式配置失败:', error)
    return errorResponse(res, '获取样式配置失败')
  }
})

// 创建样式配置（管理员）
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const {
      name,
      description,
      scope = 'global',
      userId,
      role,
      priority = 0,
      isDefault = false,
      // 样式属性
      backgroundColor,
      backgroundGradient,
      borderRadius,
      borderWidth,
      borderColor,
      borderStyle,
      shadowColor,
      shadowBlur,
      shadowSpread,
      shadowX,
      shadowY,
      padding,
      margin,
      gap,
      titleFontSize,
      titleFontWeight,
      titleColor,
      descriptionFontSize,
      descriptionFontWeight,
      descriptionColor,
      opacity,
      backdropBlur,
      backdropSaturate,
      hoverBackgroundColor,
      hoverBorderColor,
      hoverShadowBlur,
      hoverScale,
      hoverTransition,
      iconSize,
      iconColor,
      iconBackgroundColor,
      iconBorderRadius,
      imageHeight,
      imageBorderRadius,
      imageObjectFit,
      tagBackgroundColor,
      tagTextColor,
      tagBorderRadius,
      tagFontSize,
    } = req.body

    // 验证scope参数
    if (!['global', 'role', 'user'].includes(scope)) {
      return errorResponse(res, '无效的scope参数', 400)
    }

    // 验证role和userId
    if (scope === 'role' && !role) {
      return errorResponse(res, '角色配置需要提供role参数', 400)
    }
    if (scope === 'user' && !userId) {
      return errorResponse(res, '用户配置需要提供userId参数', 400)
    }

    const id = generateId()
    const now = new Date().toISOString()

    run(
      `INSERT INTO bookmark_card_styles (
        id, name, description, scope, userId, role, priority, isEnabled, isDefault,
        backgroundColor, backgroundGradient, borderRadius, borderWidth, borderColor, borderStyle,
        shadowColor, shadowBlur, shadowSpread, shadowX, shadowY,
        padding, margin, gap,
        titleFontSize, titleFontWeight, titleColor,
        descriptionFontSize, descriptionFontWeight, descriptionColor,
        opacity, backdropBlur, backdropSaturate,
        hoverBackgroundColor, hoverBorderColor, hoverShadowBlur, hoverScale, hoverTransition,
        iconSize, iconColor, iconBackgroundColor, iconBorderRadius,
        imageHeight, imageBorderRadius, imageObjectFit,
        tagBackgroundColor, tagTextColor, tagBorderRadius, tagFontSize,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description,
        scope,
        userId || null,
        role || null,
        priority,
        1,
        isDefault ? 1 : 0,
        backgroundColor,
        backgroundGradient ? JSON.stringify(backgroundGradient) : null,
        borderRadius,
        borderWidth,
        borderColor,
        borderStyle,
        shadowColor,
        shadowBlur,
        shadowSpread,
        shadowX,
        shadowY,
        padding,
        margin,
        gap,
        titleFontSize,
        titleFontWeight,
        titleColor,
        descriptionFontSize,
        descriptionFontWeight,
        descriptionColor,
        opacity,
        backdropBlur,
        backdropSaturate,
        hoverBackgroundColor,
        hoverBorderColor,
        hoverShadowBlur,
        hoverScale,
        hoverTransition,
        iconSize,
        iconColor,
        iconBackgroundColor,
        iconBorderRadius,
        imageHeight,
        imageBorderRadius,
        imageObjectFit,
        tagBackgroundColor,
        tagTextColor,
        tagBorderRadius,
        tagFontSize,
        now,
        now,
      ]
    )

    const newStyle = queryOne('SELECT * FROM bookmark_card_styles WHERE id = ?', [id])
    return successResponse(res, parseStyleConfig(newStyle), 201)
  } catch (error) {
    console.error('创建样式配置失败:', error)
    return errorResponse(res, '创建样式配置失败')
  }
})

// 更新样式配置（管理员）
router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      scope,
      userId,
      role,
      priority,
      isEnabled,
      isDefault,
      // 样式属性
      backgroundColor,
      backgroundGradient,
      borderRadius,
      borderWidth,
      borderColor,
      borderStyle,
      shadowColor,
      shadowBlur,
      shadowSpread,
      shadowX,
      shadowY,
      padding,
      margin,
      gap,
      titleFontSize,
      titleFontWeight,
      titleColor,
      descriptionFontSize,
      descriptionFontWeight,
      descriptionColor,
      opacity,
      backdropBlur,
      backdropSaturate,
      hoverBackgroundColor,
      hoverBorderColor,
      hoverShadowBlur,
      hoverScale,
      hoverTransition,
      iconSize,
      iconColor,
      iconBackgroundColor,
      iconBorderRadius,
      imageHeight,
      imageBorderRadius,
      imageObjectFit,
      tagBackgroundColor,
      tagTextColor,
      tagBorderRadius,
      tagFontSize,
    } = req.body

    const existing = queryOne('SELECT * FROM bookmark_card_styles WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '样式配置不存在', 404)
    }

    const now = new Date().toISOString()

    run(
      `UPDATE bookmark_card_styles SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        scope = COALESCE(?, scope),
        userId = COALESCE(?, userId),
        role = COALESCE(?, role),
        priority = COALESCE(?, priority),
        isEnabled = COALESCE(?, isEnabled),
        isDefault = COALESCE(?, isDefault),
        backgroundColor = COALESCE(?, backgroundColor),
        backgroundGradient = COALESCE(?, backgroundGradient),
        borderRadius = COALESCE(?, borderRadius),
        borderWidth = COALESCE(?, borderWidth),
        borderColor = COALESCE(?, borderColor),
        borderStyle = COALESCE(?, borderStyle),
        shadowColor = COALESCE(?, shadowColor),
        shadowBlur = COALESCE(?, shadowBlur),
        shadowSpread = COALESCE(?, shadowSpread),
        shadowX = COALESCE(?, shadowX),
        shadowY = COALESCE(?, shadowY),
        padding = COALESCE(?, padding),
        margin = COALESCE(?, margin),
        gap = COALESCE(?, gap),
        titleFontSize = COALESCE(?, titleFontSize),
        titleFontWeight = COALESCE(?, titleFontWeight),
        titleColor = COALESCE(?, titleColor),
        descriptionFontSize = COALESCE(?, descriptionFontSize),
        descriptionFontWeight = COALESCE(?, descriptionFontWeight),
        descriptionColor = COALESCE(?, descriptionColor),
        opacity = COALESCE(?, opacity),
        backdropBlur = COALESCE(?, backdropBlur),
        backdropSaturate = COALESCE(?, backdropSaturate),
        hoverBackgroundColor = COALESCE(?, hoverBackgroundColor),
        hoverBorderColor = COALESCE(?, hoverBorderColor),
        hoverShadowBlur = COALESCE(?, hoverShadowBlur),
        hoverScale = COALESCE(?, hoverScale),
        hoverTransition = COALESCE(?, hoverTransition),
        iconSize = COALESCE(?, iconSize),
        iconColor = COALESCE(?, iconColor),
        iconBackgroundColor = COALESCE(?, iconBackgroundColor),
        iconBorderRadius = COALESCE(?, iconBorderRadius),
        imageHeight = COALESCE(?, imageHeight),
        imageBorderRadius = COALESCE(?, imageBorderRadius),
        imageObjectFit = COALESCE(?, imageObjectFit),
        tagBackgroundColor = COALESCE(?, tagBackgroundColor),
        tagTextColor = COALESCE(?, tagTextColor),
        tagBorderRadius = COALESCE(?, tagBorderRadius),
        tagFontSize = COALESCE(?, tagFontSize),
        updatedAt = ?
      WHERE id = ?`,
      [
        name,
        description,
        scope,
        userId,
        role,
        priority,
        isEnabled !== undefined ? (isEnabled ? 1 : 0) : undefined,
        isDefault !== undefined ? (isDefault ? 1 : 0) : undefined,
        backgroundColor,
        backgroundGradient !== undefined ? JSON.stringify(backgroundGradient) : undefined,
        borderRadius,
        borderWidth,
        borderColor,
        borderStyle,
        shadowColor,
        shadowBlur,
        shadowSpread,
        shadowX,
        shadowY,
        padding,
        margin,
        gap,
        titleFontSize,
        titleFontWeight,
        titleColor,
        descriptionFontSize,
        descriptionFontWeight,
        descriptionColor,
        opacity,
        backdropBlur,
        backdropSaturate,
        hoverBackgroundColor,
        hoverBorderColor,
        hoverShadowBlur,
        hoverScale,
        hoverTransition,
        iconSize,
        iconColor,
        iconBackgroundColor,
        iconBorderRadius,
        imageHeight,
        imageBorderRadius,
        imageObjectFit,
        tagBackgroundColor,
        tagTextColor,
        tagBorderRadius,
        tagFontSize,
        now,
        id,
      ]
    )

    const updated = queryOne('SELECT * FROM bookmark_card_styles WHERE id = ?', [id])
    return successResponse(res, parseStyleConfig(updated))
  } catch (error) {
    console.error('更新样式配置失败:', error)
    return errorResponse(res, '更新样式配置失败')
  }
})

// 删除样式配置（管理员）
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existing = queryOne('SELECT * FROM bookmark_card_styles WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '样式配置不存在', 404)
    }

    run('DELETE FROM bookmark_card_styles WHERE id = ?', [id])
    return successResponse(res, { deleted: true, id })
  } catch (error) {
    console.error('删除样式配置失败:', error)
    return errorResponse(res, '删除样式配置失败')
  }
})

// 设置默认样式（管理员）
router.post('/:id/set-default', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { scope } = req.body

    const existing = queryOne('SELECT * FROM bookmark_card_styles WHERE id = ?', [id])
    if (!existing) {
      return errorResponse(res, '样式配置不存在', 404)
    }

    // 先取消该scope下的所有默认配置
    run('UPDATE bookmark_card_styles SET isDefault = 0 WHERE scope = ?', [scope || existing.scope])

    // 设置当前配置为默认
    run('UPDATE bookmark_card_styles SET isDefault = 1, updatedAt = ? WHERE id = ?', [
      new Date().toISOString(),
      id,
    ])

    return successResponse(res, { id, isDefault: true })
  } catch (error) {
    console.error('设置默认样式失败:', error)
    return errorResponse(res, '设置默认样式失败')
  }
})

export default router
