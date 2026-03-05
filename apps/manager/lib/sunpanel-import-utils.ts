/**
 * SunPanel 数据导入工具
 * 支持导入 SunPanel 导出的 JSON 配置文件
 */

import { Bookmark, Category } from '../types/bookmark'

// SunPanel 数据格式定义
export interface SunPanelConfig {
  appName: 'Sun-Panel-Config'
  version: string
  exportTime: string
  data: {
    groups: SunPanelGroup[]
    items: SunPanelItem[]
  }
}

export interface SunPanelGroup {
  id: number
  name: string
  sort: number
  createdAt: string
  updatedAt: string
}

export interface SunPanelItem {
  id: number
  groupId: number
  title: string
  url: string
  icon: string
  description?: string
  sort: number
  createdAt: string
  updatedAt: string
}

// 预定义的颜色列表（用于自动分配）
const CATEGORY_COLORS = [
  '#6366f1', // 靛蓝
  '#8b5cf6', // 紫罗兰
  '#ec4899', // 粉红
  '#f43f5e', // 玫瑰
  '#f97316', // 橙色
  '#eab308', // 黄色
  '#22c55e', // 绿色
  '#14b8a6', // 青色
  '#06b6d4', // 天蓝
  '#3b82f6', // 蓝色
  '#a855f7', // 紫色
  '#64748b', // 灰色
]

/**
 * 检测是否为 SunPanel 格式
 */
export function isSunPanelFormat(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    return parsed.appName === 'Sun-Panel-Config'
  } catch {
    return false
  }
}

/**
 * 解析 SunPanel 配置
 */
export function parseSunPanelConfig(content: string): SunPanelConfig {
  const parsed = JSON.parse(content)
  
  if (parsed.appName !== 'Sun-Panel-Config') {
    throw new Error('不是有效的 SunPanel 配置文件')
  }
  
  return parsed as SunPanelConfig
}

/**
 * 获取分类颜色（循环使用预定义颜色）
 */
function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

/**
 * 转换 SunPanel 数据为 NOWEN 格式
 */
export function convertSunPanelToNowen(config: SunPanelConfig): {
  bookmarks: Bookmark[]
  categories: Category[]
  meta: {
    version: string
    exportTime: string
    totalGroups: number
    totalItems: number
  }
} {
  const { groups, items } = config.data
  
  // 转换分类
  const categories: Category[] = groups
    .sort((a, b) => a.sort - b.sort)
    .map((group, index) => ({
      id: `sunpanel_cat_${group.id}_${Date.now()}`,
      name: group.name,
      icon: 'Folder',
      color: getCategoryColor(index),
      orderIndex: index,
      description: `从 SunPanel 导入的分类`,
      isVisible: true,
      createdAt: new Date(group.createdAt).getTime(),
      updatedAt: new Date(group.updatedAt).getTime(),
    }))
  
  // 创建 groupId 到 categoryId 的映射
  const groupIdMap = new Map<number, string>()
  categories.forEach((cat, index) => {
    groupIdMap.set(groups[index].id, cat.id)
  })
  
  // 转换书签
  const bookmarks: Bookmark[] = items
    .sort((a, b) => a.sort - b.sort)
    .map((item, index) => ({
      id: `sunpanel_bookmark_${item.id}_${Date.now()}`,
      title: item.title,
      url: item.url,
      description: item.description || '',
      favicon: item.icon || '',
      category: groupIdMap.get(item.groupId) || null,
      orderIndex: index,
      isPinned: false,
      isReadLater: false,
      visibility: 'public' as const,
      createdAt: new Date(item.createdAt).getTime(),
      updatedAt: new Date(item.updatedAt).getTime(),
    }))
  
  return {
    bookmarks,
    categories,
    meta: {
      version: config.version,
      exportTime: config.exportTime,
      totalGroups: groups.length,
      totalItems: items.length,
    },
  }
}

/**
 * 验证 SunPanel 文件
 */
export function validateSunPanelFile(content: string): {
  valid: boolean
  error?: string
  config?: SunPanelConfig
} {
  try {
    const config = parseSunPanelConfig(content)
    
    if (!config.data || !Array.isArray(config.data.groups) || !Array.isArray(config.data.items)) {
      return { valid: false, error: 'SunPanel 配置文件格式不正确，缺少 data.groups 或 data.items' }
    }
    
    return { valid: true, config }
  } catch (err: any) {
    return { valid: false, error: err.message || '文件解析失败' }
  }
}

/**
 * 格式化导出时间
 */
export function formatExportTime(exportTime: string): string {
  try {
    const date = new Date(exportTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return exportTime
  }
}
