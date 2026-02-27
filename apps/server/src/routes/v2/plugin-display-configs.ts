/**
 * 插件前台显示配置路由 - V2版本
 * 提供插件在前台的显示位置、层级、样式等配置管理
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'
import { queryAll, queryOne, run, generateId } from '../../utils/index.js'

const router = Router()

// 层级类型
export type PluginLayer = 'background' | 'base' | 'content' | 'overlay' | 'modal'

// 网格位置类型
export interface GridPosition {
  colStart: number  // 1-13
  colEnd: number    // 1-13
  rowStart: number  // 1-100
  rowEnd: number    // 1-100
}

// 响应式配置
export interface ResponsiveConfig {
  mobile?: Partial<GridPosition>
  tablet?: Partial<GridPosition>
  desktop?: Partial<GridPosition>
}

// 显示配置
export interface DisplayConfig {
  visible: boolean
  responsive?: ResponsiveConfig
}

// 样式配置
export interface StyleConfig {
  colors?: {
    background?: string
    text?: string
    border?: string
  }
  typography?: {
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
  }
  spacing?: {
    padding?: string
    margin?: string
  }
  effects?: {
    opacity?: number
    blur?: number
    shadow?: string
    animation?: string
  }
}

// 交互配置
export interface InteractionConfig {
  draggable?: boolean
  resizable?: boolean
  clickable?: boolean
}

// 插件显示配置完整类型
export interface PluginDisplayConfig {
  id: string
  pluginId: string
  gridPosition: GridPosition
  layer: PluginLayer
  zIndex: number
  displayConfig: DisplayConfig
  styleConfig: StyleConfig
  interactionConfig: InteractionConfig
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

// 解析插件显示配置
function parseDisplayConfig(row: any): PluginDisplayConfig {
  return {
    id: row.id,
    pluginId: row.pluginId,
    gridPosition: parseJsonField(row.gridPosition, { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 2 }),
    layer: (row.layer as PluginLayer) || 'content',
    zIndex: row.zIndex || 0,
    displayConfig: parseJsonField(row.displayConfig, { visible: true }),
    styleConfig: parseJsonField(row.styleConfig, {}),
    interactionConfig: parseJsonField(row.interactionConfig, { draggable: false, resizable: false, clickable: true }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 获取所有插件显示配置（公开）
router.get('/', (req: Request, res: Response) => {
  try {
    const configs = queryAll(`
      SELECT pdc.*, p.name as pluginName, p.isEnabled as pluginIsEnabled
      FROM plugin_display_configs pdc
      JOIN plugins p ON pdc.pluginId = p.id
      WHERE p.isEnabled = 1
      ORDER BY pdc.zIndex ASC, pdc.layer ASC
    `)

    const parsedConfigs = configs.map(parseDisplayConfig)
    return successResponse(res, parsedConfigs)
  } catch (error) {
    console.error('获取插件显示配置失败:', error)
    return errorResponse(res, '获取插件显示配置失败')
  }
})

// 获取单个插件显示配置（公开）
router.get('/:pluginId', (req: Request, res: Response) => {
  try {
    const pluginId = req.params.pluginId as string

    const config = queryOne(`
      SELECT pdc.*, p.name as pluginName, p.isEnabled as pluginIsEnabled
      FROM plugin_display_configs pdc
      JOIN plugins p ON pdc.pluginId = p.id
      WHERE pdc.pluginId = ?
    `, [pluginId])

    if (!config) {
      // 如果没有配置，返回默认配置
      const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [pluginId])
      if (!plugin) {
        return errorResponse(res, '插件不存在', 404)
      }

      const defaultConfig: PluginDisplayConfig = {
        id: generateId(),
        pluginId,
        gridPosition: { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 2 },
        layer: 'content',
        zIndex: 0,
        displayConfig: { visible: true },
        styleConfig: {},
        interactionConfig: { draggable: false, resizable: false, clickable: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return successResponse(res, defaultConfig)
    }

    return successResponse(res, parseDisplayConfig(config))
  } catch (error) {
    console.error('获取插件显示配置失败:', error)
    return errorResponse(res, '获取插件显示配置失败')
  }
})

// 创建或更新插件显示配置（需要管理员权限）
router.put('/:pluginId', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params
    const {
      gridPosition,
      layer,
      zIndex,
      displayConfig,
      styleConfig,
      interactionConfig,
    } = req.body

    // 检查插件是否存在
    const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [pluginId])
    if (!plugin) {
      return errorResponse(res, '插件不存在', 404)
    }

    // 检查是否已有配置
    const existingConfig = queryOne('SELECT * FROM plugin_display_configs WHERE pluginId = ?', [pluginId])

    const now = new Date().toISOString()

    if (existingConfig) {
      // 更新配置
      run(`
        UPDATE plugin_display_configs SET
          gridPosition = ?,
          layer = ?,
          zIndex = ?,
          displayConfig = ?,
          styleConfig = ?,
          interactionConfig = ?,
          updatedAt = ?
        WHERE pluginId = ?
      `, [
        JSON.stringify(gridPosition || existingConfig.gridPosition),
        layer || existingConfig.layer,
        zIndex !== undefined ? zIndex : existingConfig.zIndex,
        JSON.stringify(displayConfig || existingConfig.displayConfig),
        JSON.stringify(styleConfig || existingConfig.styleConfig),
        JSON.stringify(interactionConfig || existingConfig.interactionConfig),
        now,
        pluginId,
      ])
    } else {
      // 创建新配置
      const id = generateId()
      run(`
        INSERT INTO plugin_display_configs (
          id, pluginId, gridPosition, layer, zIndex,
          displayConfig, styleConfig, interactionConfig, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        pluginId,
        JSON.stringify(gridPosition || { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 2 }),
        layer || 'content',
        zIndex || 0,
        JSON.stringify(displayConfig || { visible: true }),
        JSON.stringify(styleConfig || {}),
        JSON.stringify(interactionConfig || { draggable: false, resizable: false, clickable: true }),
        now,
        now,
      ])
    }

    // 返回更新后的配置
    const updatedConfig = queryOne('SELECT * FROM plugin_display_configs WHERE pluginId = ?', [pluginId])
    return successResponse(res, parseDisplayConfig(updatedConfig))
  } catch (error) {
    console.error('更新插件显示配置失败:', error)
    return errorResponse(res, '更新插件显示配置失败')
  }
})

// 批量更新插件显示配置（需要管理员权限）
router.put('/batch/update', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { configs } = req.body as { configs: Array<{ pluginId: string } & Partial<PluginDisplayConfig>> }

    if (!Array.isArray(configs)) {
      return errorResponse(res, '配置列表格式错误', 400)
    }

    const results: PluginDisplayConfig[] = []
    const now = new Date().toISOString()

    for (const config of configs) {
      const { pluginId, ...configData } = config

      // 检查插件是否存在
      const plugin = queryOne('SELECT * FROM plugins WHERE id = ?', [pluginId])
      if (!plugin) continue

      const existingConfig = queryOne('SELECT * FROM plugin_display_configs WHERE pluginId = ?', [pluginId])

      if (existingConfig) {
        run(`
          UPDATE plugin_display_configs SET
            gridPosition = COALESCE(?, gridPosition),
            layer = COALESCE(?, layer),
            zIndex = COALESCE(?, zIndex),
            displayConfig = COALESCE(?, displayConfig),
            styleConfig = COALESCE(?, styleConfig),
            interactionConfig = COALESCE(?, interactionConfig),
            updatedAt = ?
          WHERE pluginId = ?
        `, [
          configData.gridPosition ? JSON.stringify(configData.gridPosition) : null,
          configData.layer || null,
          configData.zIndex !== undefined ? configData.zIndex : null,
          configData.displayConfig ? JSON.stringify(configData.displayConfig) : null,
          configData.styleConfig ? JSON.stringify(configData.styleConfig) : null,
          configData.interactionConfig ? JSON.stringify(configData.interactionConfig) : null,
          now,
          pluginId,
        ])
      } else {
        const id = generateId()
        run(`
          INSERT INTO plugin_display_configs (
            id, pluginId, gridPosition, layer, zIndex,
            displayConfig, styleConfig, interactionConfig, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          pluginId,
          JSON.stringify(configData.gridPosition || { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 2 }),
          configData.layer || 'content',
          configData.zIndex || 0,
          JSON.stringify(configData.displayConfig || { visible: true }),
          JSON.stringify(configData.styleConfig || {}),
          JSON.stringify(configData.interactionConfig || { draggable: false, resizable: false, clickable: true }),
          now,
          now,
        ])
      }

      const updatedConfig = queryOne('SELECT * FROM plugin_display_configs WHERE pluginId = ?', [pluginId])
      if (updatedConfig) {
        results.push(parseDisplayConfig(updatedConfig))
      }
    }

    return successResponse(res, results)
  } catch (error) {
    console.error('批量更新插件显示配置失败:', error)
    return errorResponse(res, '批量更新插件显示配置失败')
  }
})

// 删除插件显示配置（需要管理员权限）
router.delete('/:pluginId', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params

    const existingConfig = queryOne('SELECT * FROM plugin_display_configs WHERE pluginId = ?', [pluginId])
    if (!existingConfig) {
      return errorResponse(res, '配置不存在', 404)
    }

    run('DELETE FROM plugin_display_configs WHERE pluginId = ?', [pluginId])

    return successResponse(res, { message: '配置已删除' })
  } catch (error) {
    console.error('删除插件显示配置失败:', error)
    return errorResponse(res, '删除插件显示配置失败')
  }
})

// 重置插件显示配置为默认值（需要管理员权限）
router.post('/:pluginId/reset', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params

    const existingConfig = queryOne('SELECT * FROM plugin_display_configs WHERE pluginId = ?', [pluginId])
    const now = new Date().toISOString()

    const defaultConfig = {
      gridPosition: JSON.stringify({ colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 2 }),
      layer: 'content',
      zIndex: 0,
      displayConfig: JSON.stringify({ visible: true }),
      styleConfig: JSON.stringify({}),
      interactionConfig: JSON.stringify({ draggable: false, resizable: false, clickable: true }),
      updatedAt: now,
    }

    if (existingConfig) {
      run(`
        UPDATE plugin_display_configs SET
          gridPosition = ?,
          layer = ?,
          zIndex = ?,
          displayConfig = ?,
          styleConfig = ?,
          interactionConfig = ?,
          updatedAt = ?
        WHERE pluginId = ?
      `, [
        defaultConfig.gridPosition,
        defaultConfig.layer,
        defaultConfig.zIndex,
        defaultConfig.displayConfig,
        defaultConfig.styleConfig,
        defaultConfig.interactionConfig,
        defaultConfig.updatedAt,
        pluginId,
      ])
    } else {
      const id = generateId()
      run(`
        INSERT INTO plugin_display_configs (
          id, pluginId, gridPosition, layer, zIndex,
          displayConfig, styleConfig, interactionConfig, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        pluginId,
        defaultConfig.gridPosition,
        defaultConfig.layer,
        defaultConfig.zIndex,
        defaultConfig.displayConfig,
        defaultConfig.styleConfig,
        defaultConfig.interactionConfig,
        now,
        now,
      ])
    }

    const updatedConfig = queryOne('SELECT * FROM plugin_display_configs WHERE pluginId = ?', [pluginId])
    return successResponse(res, parseDisplayConfig(updatedConfig))
  } catch (error) {
    console.error('重置插件显示配置失败:', error)
    return errorResponse(res, '重置插件显示配置失败')
  }
})

export default router
