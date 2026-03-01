/**
 * 插件插槽系统类型定义
 * 用于管理插件在前台的显示位置
 */

// 插槽位置类型
export type SlotPosition = 
  | 'header-left'      // Header 左侧
  | 'header-center'    // Header 中间
  | 'header-right'     // Header 右侧
  | 'hero-before'      // Hero 区域前
  | 'hero-after'       // Hero 区域后
  | 'content-sidebar'  // 内容侧边栏
  | 'sidebar-right'    // 右侧边栏
  | 'content-before'   // 内容区前
  | 'content-after'    // 内容区后
  | 'footer-left'      // 页脚左侧
  | 'floating'         // 浮动按钮
  | 'modal'            // 弹窗层

// 插槽配置
export interface SlotConfig {
  id: SlotPosition
  name: string          // 显示名称
  description: string   // 描述
  maxPlugins?: number   // 最大插件数量（undefined 表示不限制）
  allowedTypes?: PluginType[] // 允许的插件类型
}

// 插件类型
export type PluginType = 
  | 'widget'      // 小组件（天气、时钟）
  | 'tool'        // 工具（文件快传、备忘录）
  | 'content'     // 内容型（RSS、笔记）
  | 'integration' // 集成（待办同步）
  | 'theme'       // 主题相关

// 插件显示配置
export interface PluginDisplayConfig {
  id: string
  pluginId: string
  pluginName: string
  slot: SlotPosition    // 显示在哪个插槽
  order: number         // 排序优先级
  config?: Record<string, any> // 插件特定配置
  isEnabled: boolean
}

// 插件定义
export interface Plugin {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  type: PluginType
  icon?: string
  component: string     // 组件名称
  defaultSlot?: SlotPosition // 默认插槽位置
  defaultConfig?: Record<string, any>
}

// 插件组件 Props
export interface PluginComponentProps {
  config?: Record<string, any>
  slot?: SlotPosition
}

// 插槽渲染数据
export interface SlotRenderData {
  slot: SlotPosition
  plugins: PluginDisplayConfig[]
}

// 所有预定义的插槽
export const PREDEFINED_SLOTS: SlotConfig[] = [
  {
    id: 'header-left',
    name: 'Header 左侧',
    description: '显示在页面 Header 的左侧，Logo 旁边',
    maxPlugins: 2,
    allowedTypes: ['widget', 'tool']
  },
  {
    id: 'header-center',
    name: 'Header 中间',
    description: '显示在页面 Header 的中间',
    maxPlugins: 1,
    allowedTypes: ['widget']
  },
  {
    id: 'header-right',
    name: 'Header 右侧',
    description: '显示在页面 Header 的右侧，主题切换按钮旁边',
    maxPlugins: 3,
    allowedTypes: ['widget', 'tool']
  },
  {
    id: 'hero-before',
    name: 'Hero 区域前',
    description: '显示在 Hero 区域（时间、搜索）之前',
    maxPlugins: 2,
    allowedTypes: ['widget', 'integration']
  },
  {
    id: 'hero-after',
    name: 'Hero 区域后',
    description: '显示在 Hero 区域（时间、搜索）之后',
    maxPlugins: 3,
    allowedTypes: ['widget', 'tool', 'integration']
  },
  {
    id: 'content-sidebar',
    name: '内容侧边栏',
    description: '显示在内容区域的侧边',
    allowedTypes: ['widget', 'tool', 'integration']
  },
  {
    id: 'content-before',
    name: '内容区前',
    description: '显示在主要内容之前',
    maxPlugins: 2,
    allowedTypes: ['widget', 'integration']
  },
  {
    id: 'content-after',
    name: '内容区后',
    description: '显示在主要内容之后',
    maxPlugins: 2,
    allowedTypes: ['widget', 'tool']
  },
  {
    id: 'floating',
    name: '浮动按钮',
    description: '显示为浮动按钮，固定在页面角落',
    maxPlugins: 4,
    allowedTypes: ['tool']
  },
  {
    id: 'modal',
    name: '弹窗层',
    description: '以弹窗形式显示，需要用户触发',
    allowedTypes: ['tool', 'integration']
  }
]

// 获取插槽配置
export function getSlotConfig(slotId: SlotPosition): SlotConfig | undefined {
  return PREDEFINED_SLOTS.find(s => s.id === slotId)
}

// 获取插槽显示名称
export function getSlotName(slotId: SlotPosition): string {
  return getSlotConfig(slotId)?.name || slotId
}
