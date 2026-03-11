/**
 * iTab 书签导入工具
 * 支持解析 iTab 导出的 JSON 格式书签数据
 */

import { Bookmark, Category } from '../types/bookmark'

/**
 * iTab 格式定义
 */
export interface ItabConfig {
  baseConfig: {
    lang: string
    searchEngine: Array<{
      key: string
      title: string
      href: string
    }>
    useSearch: string
    search: {
      show: boolean
      history: boolean
      height: number
      radius: number
      bgColor: number
    }
    theme: {
      mode: string
      system: boolean
      color: string
    }
    sidebar: {
      placement: string
      autoHide: boolean
      width: number
    }
    wallpaper: {
      mask: number
      blur: number
      type: string
      src: string
      thumb: string
    }
    layout: {
      view: string
      yiyan: boolean
    }
    time: {
      show: boolean
      size: number
      color: string
      hour24: boolean
    }
    open: {
      searchBlank: boolean
      iconBlank: boolean
    }
    icon: {
      name: number
      nameSize: number
      nameColor: string
      iconRadius: number
      iconSize: number
    }
  }
  navConfig: ItabNavGroup[]
}

export interface ItabNavGroup {
  id?: string
  name: string
  icon?: string
  children: ItabNavItem[]
}

export interface ItabNavItem {
  id?: string
  name: string
  url?: string
  src?: string
  type: 'icon' | 'text' | 'component'
  iconText?: string
  backgroundColor?: string
  component?: string
  size?: string
  view?: number
  config?: Record<string, any>
}

/**
 * 检测是否为 iTab 格式
 */
export function isItabFormat(content: string): boolean {
  try {
    const data = JSON.parse(content)
    return data.baseConfig && 
           data.navConfig && 
           Array.isArray(data.navConfig)
  } catch {
    return false
  }
}

/**
 * 验证 iTab 配置文件
 */
export function validateItabFile(content: string): { 
  valid: boolean 
  config?: ItabConfig 
  error?: string 
} {
  try {
    const data = JSON.parse(content) as ItabConfig
    
    if (!data.baseConfig) {
      return { valid: false, error: '缺少 baseConfig 配置' }
    }
    
    if (!data.navConfig || !Array.isArray(data.navConfig)) {
      return { valid: false, error: '缺少 navConfig 或格式不正确' }
    }
    
    return { valid: true, config: data }
  } catch (err) {
    return { valid: false, error: 'JSON 解析失败：' + (err as Error).message }
  }
}

/**
 * 将 iTab 格式转换为 Nexus 格式
 */
export function convertItabToNowen(config: ItabConfig): {
  bookmarks: Bookmark[]
  categories: Category[]
  meta: {
    totalItems: number
    totalGroups: number
    version: string
  }
} {
  const bookmarks: Bookmark[] = []
  const categories: Category[] = []
  let totalItems = 0

  config.navConfig.forEach((group, groupIndex) => {
    // 创建分类
    const categoryId = `itab-${group.id || groupIndex}`
    categories.push({
      id: categoryId,
      name: group.name || '未命名分组',
      icon: group.icon || 'Folder',
      color: '#6366f1',
      orderIndex: groupIndex,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // 处理分组中的项目
    if (group.children && Array.isArray(group.children)) {
      group.children.forEach((item, itemIndex) => {
        // 只处理图标和文本类型的项目（书签）
        if (item.type === 'icon' || item.type === 'text') {
          bookmarks.push({
            id: `itab-${item.id || `${groupIndex}-${itemIndex}`}`,
            url: item.url || '',
            title: item.name || '未命名书签',
            description: '',
            favicon: item.src || '',
            icon: item.iconText || '',
            iconUrl: item.src || '',
            category: categoryId,
            categoryId: categoryId,
            tags: [],
            orderIndex: itemIndex,
            isPinned: false,
            isReadLater: false,
            isRead: false,
            visibility: 'public',
            visitCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
          totalItems++
        }
      })
    }
  })

  return {
    bookmarks,
    categories,
    meta: {
      totalItems,
      totalGroups: categories.length,
      version: '1.0',
    },
  }
}

/**
 * 格式化导出时间
 */
export function formatExportTime(): string {
  return new Date().toLocaleString('zh-CN')
}
