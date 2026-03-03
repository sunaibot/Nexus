/**
 * 插件构建器类型定义
 * 前台使用的类型定义（与 manager 模块同步）
 */

// 组件零件
export interface ComponentPart {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  category: 'basic' | 'layout' | 'interactive' | 'media' | 'data' | 'navigation' | 'feedback'
  tags: string[]
  visual: {
    base: Record<string, any>
    states: {
      default?: Record<string, any>
      hover?: Record<string, any>
      active?: Record<string, any>
      focus?: Record<string, any>
      disabled?: Record<string, any>
    }
  }
  behavior: {
    events: Array<{
      name: string
      label: string
      description: string
      actions?: any[]
    }>
    dataBinding: {
      supported: boolean
      properties: Array<{
        name: string
        type: string
        description: string
      }>
    }
  }
  properties: Array<{
    name: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'icon'
    defaultValue?: any
    options?: Array<{ label: string; value: any }>
    placeholder?: string
  }>
  stats?: {
    downloads: number
    likes: number
    usage: number
  }
  isBuiltin?: boolean
  isPublic?: boolean
  createdAt: string
  updatedAt: string
}

// 画布组件
export interface CanvasComponent {
  id: string
  partId: string
  part: ComponentPart
  position: {
    x: number
    y: number
  }
  size: {
    width: string
    height: string
  }
  props: Record<string, any>
  customStyles?: any
  dataBinding?: {
    source: string
    path: string
    transform?: string
  }
  children?: string[]
  parentId?: string
  zIndex: number
  visible: boolean
  locked: boolean
}

// 画布配置
export interface CanvasConfig {
  width: number
  height: number
  gridSize: number
  snapToGrid: boolean
  showGrid: boolean
  backgroundColor: string
}

// 正在构建的插件
export interface BuildingPlugin {
  id?: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  canvas: CanvasConfig
  components: CanvasComponent[]
  selectedComponentIds: string[]
  dataSources: Array<{
    id: string
    name: string
    type: 'api' | 'static' | 'user' | 'system'
    config: Record<string, any>
  }>
  variables: Array<{
    name: string
    defaultValue: any
    type: string
  }>
  actions: Array<{
    id: string
    name: string
    trigger: string
    handler: string
  }>
  createdAt?: string
  updatedAt?: string
}

// 拖拽状态
export interface DragState {
  isDragging: boolean
  dragType: 'part' | 'component' | null
  dragId: string | null
  dragOffset: { x: number; y: number }
  dragPosition: { x: number; y: number }
}

// 默认新插件
export const DEFAULT_NEW_PLUGIN: Omit<BuildingPlugin, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '未命名插件',
  description: '',
  version: '1.0.0',
  author: '',
  icon: '📦',
  canvas: {
    width: 800,
    height: 600,
    gridSize: 8,
    snapToGrid: true,
    showGrid: true,
    backgroundColor: '#ffffff'
  },
  components: [],
  selectedComponentIds: [],
  dataSources: [],
  variables: [],
  actions: []
}
