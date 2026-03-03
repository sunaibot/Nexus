/**
 * 插件构建器类型定义
 * 拖拽零件搭建完整插件
 */

import type { ComponentPart, PartStyles } from './parts'

// 画布中的组件实例
export interface CanvasComponent {
  id: string
  partId: string
  part: ComponentPart
  
  // 位置信息
  position: {
    x: number
    y: number
  }
  
  // 尺寸
  size: {
    width: string
    height: string
  }
  
  // 自定义属性值
  props: Record<string, any>
  
  // 样式覆盖
  customStyles?: PartStyles
  
  // 数据绑定
  dataBinding?: {
    source: string
    path: string
    transform?: string
  }
  
  // 子组件（用于容器类零件）
  children?: string[] // 子组件ID列表
  
  // 父组件ID
  parentId?: string
  
  // 层级
  zIndex: number
  
  // 可见性
  visible: boolean
  
  // 锁定
  locked: boolean
}

// 画布配置
export interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string
  gridSize: number
  showGrid: boolean
  snapToGrid: boolean
}

// 正在构建的插件
export interface BuildingPlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  
  // 画布配置
  canvas: CanvasConfig
  
  // 组件列表
  components: CanvasComponent[]
  
  // 选中状态
  selectedComponentIds: string[]
  
  // 历史记录（用于撤销/重做）
  history: {
    past: CanvasComponent[][]
    future: CanvasComponent[][]
  }
  
  // 数据流
  dataFlow: DataFlow[]
  
  // 事件连接
  eventBindings: EventBinding[]
  
  createdAt: string
  updatedAt: string
}

// 数据流
export interface DataFlow {
  id: string
  source: {
    componentId: string
    property: string
  }
  target: {
    componentId: string
    property: string
  }
  transform?: string
}

// 事件绑定
export interface EventBinding {
  id: string
  source: {
    componentId: string
    event: string
  }
  action: {
    type: 'navigate' | 'show' | 'hide' | 'toggle' | 'setProp' | 'callApi' | 'custom'
    target?: string
    config?: Record<string, any>
  }
}

// 拖拽状态
export interface DragState {
  isDragging: boolean
  dragType: 'part' | 'component' | null
  dragId: string | null
  dragOffset: { x: number; y: number }
  dragPosition: { x: number; y: number }
}

// 默认画布配置
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 1200,
  height: 800,
  backgroundColor: '#f5f5f5',
  gridSize: 20,
  showGrid: true,
  snapToGrid: true
}

// 默认新插件
export const DEFAULT_NEW_PLUGIN: Omit<BuildingPlugin, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '新插件',
  description: '使用零件搭建的插件',
  version: '1.0.0',
  author: '',
  icon: '📦',
  canvas: DEFAULT_CANVAS_CONFIG,
  components: [],
  selectedComponentIds: [],
  history: { past: [], future: [] },
  dataFlow: [],
  eventBindings: []
}

// 对齐方式
export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

// 分布方式
export type DistributeType = 'horizontal' | 'vertical'

// 快捷键
export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: string
  description: string
}

// 预设快捷键
export const BUILDER_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'z', ctrl: true, action: 'undo', description: '撤销' },
  { key: 'y', ctrl: true, action: 'redo', description: '重做' },
  { key: 'c', ctrl: true, action: 'copy', description: '复制' },
  { key: 'v', ctrl: true, action: 'paste', description: '粘贴' },
  { key: 'x', ctrl: true, action: 'cut', description: '剪切' },
  { key: 'a', ctrl: true, action: 'selectAll', description: '全选' },
  { key: 'Delete', action: 'delete', description: '删除' },
  { key: 'ArrowUp', action: 'moveUp', description: '上移' },
  { key: 'ArrowDown', action: 'moveDown', description: '下移' },
  { key: 'ArrowLeft', action: 'moveLeft', description: '左移' },
  { key: 'ArrowRight', action: 'moveRight', description: '右移' },
  { key: ']', ctrl: true, action: 'bringForward', description: '前移' },
  { key: '[', ctrl: true, action: 'sendBackward', description: '后移' },
  { key: 'g', ctrl: true, action: 'group', description: '组合' },
  { key: 'g', ctrl: true, shift: true, action: 'ungroup', description: '取消组合' },
  { key: 'l', ctrl: true, action: 'lock', description: '锁定' },
  { key: 'h', ctrl: true, action: 'hide', description: '隐藏' },
  { key: 'p', ctrl: true, action: 'preview', description: '预览' },
  { key: 's', ctrl: true, action: 'save', description: '保存' }
]
