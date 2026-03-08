/**
 * 零件系统类型定义
 * 像我的世界一样，可以造各种零件
 */

// 基础样式属性
export interface PartStyles {
  // 尺寸
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  maxWidth?: string
  maxHeight?: string

  // 间距
  padding?: string
  margin?: string

  // 背景
  background?: string
  backgroundColor?: string
  backgroundImage?: string
  backgroundGradient?: {
    from: string
    to: string
    direction?: string
  }

  // 边框
  border?: string
  borderWidth?: string
  borderColor?: string
  borderStyle?: string
  borderRadius?: string

  // 阴影
  boxShadow?: string

  // 文字
  color?: string
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  lineHeight?: string
  letterSpacing?: string

  // 显示
  display?: string
  position?: string
  overflow?: string
  opacity?: number
  transform?: string
  transition?: string
  cursor?: string

  // Flex布局
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  gap?: string
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse'

  // 图片
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

// 动画配置
export interface AnimationConfig {
  type: 'fade' | 'slide' | 'scale' | 'bounce' | 'rotate' | 'pulse' | 'shake' | 'custom'
  duration: number // 毫秒
  easing: string
  delay?: number
  iterationCount?: number | 'infinite'
  customKeyframes?: string
}

// 零件属性定义
export interface PartProperty {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'icon' | 'json' | 'textarea'
  defaultValue: any
  options?: Array<{ label: string; value: any }>
  description?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  required?: boolean
}

// 事件动作
export interface PartAction {
  type: 'none' | 'link' | 'emit' | 'custom' | 'show' | 'hide' | 'toggle'
  config?: {
    url?: string
    target?: '_blank' | '_self'
    eventName?: string
    payload?: any
    customCode?: string
    selector?: string
  }
}

// 零件事件
export interface PartEvent {
  name: string
  label: string
  description?: string
  actions?: PartAction[]
}

// 数据绑定
export interface DataBinding {
  enabled: boolean
  source: 'static' | 'api' | 'props' | 'context'
  path?: string
  transform?: string
  fallback?: any
}

// 零件定义
export interface ComponentPart {
  id: string
  name: string
  description?: string
  version: string
  author: string
  authorId?: string
  icon: string
  category: 'basic' | 'layout' | 'data' | 'interactive' | 'media' | 'custom'
  tags: string[]

  // 视觉配置
  visual: {
    // 基础样式
    base: PartStyles

    // 状态样式
    states: {
      default: PartStyles
      hover?: PartStyles
      active?: PartStyles
      focus?: PartStyles
      disabled?: PartStyles
      loading?: PartStyles
      checked?: PartStyles
    }

    // 动画
    animations?: {
      entrance?: AnimationConfig
      hover?: AnimationConfig
      click?: AnimationConfig
      exit?: AnimationConfig
    }
  }

  // 行为配置
  behavior: {
    // 支持的事件
    events: PartEvent[]

    // 数据绑定配置
    dataBinding?: {
      supported: boolean
      properties: Array<{
        name: string
        type: string
        description?: string
      }>
    }
  }

  // 可配置属性
  properties: PartProperty[]

  // 内部结构（用于复杂零件）
  children?: ComponentPart[]

  // 代码（高级模式）
  code?: {
    html?: string
    css?: string
    js?: string
  }

  // 预览图
  preview?: string

  // 元数据
  stats: {
    downloads: number
    likes: number
    usage: number
  }

  isBuiltin: boolean
  isPublic: boolean

  createdAt: string
  updatedAt: string
}

// 零件分类
export const PART_CATEGORIES = [
  { id: 'basic', name: '基础组件', icon: 'Box', description: '按钮、文本、图片等基础元素' },
  { id: 'layout', name: '布局组件', icon: 'Layout', description: '容器、网格、行列等布局元素' },
  { id: 'data', name: '数据组件', icon: 'Database', description: '列表、表格、图表等数据展示' },
  { id: 'interactive', name: '交互组件', icon: 'MousePointer', description: '表单、菜单、弹窗等交互元素' },
  { id: 'media', name: '媒体组件', icon: 'Image', description: '图片、视频、音频等媒体元素' },
  { id: 'custom', name: '自定义', icon: 'Sparkles', description: '用户创建的自定义组件' }
] as const

// 预设动画
export const PRESET_ANIMATIONS: Record<string, AnimationConfig> = {
  fadeIn: {
    type: 'fade',
    duration: 300,
    easing: 'ease-out'
  },
  slideUp: {
    type: 'slide',
    duration: 300,
    easing: 'ease-out'
  },
  scaleIn: {
    type: 'scale',
    duration: 200,
    easing: 'ease-out'
  },
  bounce: {
    type: 'bounce',
    duration: 500,
    easing: 'ease-out'
  },
  pulse: {
    type: 'pulse',
    duration: 1000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },
  shake: {
    type: 'shake',
    duration: 500,
    easing: 'ease-in-out'
  }
}

// 预设样式模板
export const STYLE_TEMPLATES = {
  button: {
    primary: {
      background: '#3b82f6',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: '500',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    secondary: {
      background: '#e5e7eb',
      color: '#374151',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: '500'
    },
    ghost: {
      background: 'transparent',
      color: '#3b82f6',
      border: '1px solid #3b82f6',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: '500'
    }
  },
  card: {
    default: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    elevated: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    outlined: {
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px'
    }
  }
}

// 默认新零件
export const DEFAULT_NEW_PART: Omit<ComponentPart, 'id' | 'createdAt' | 'updatedAt' | 'stats'> = {
  name: '新零件',
  description: '这是一个新创建的零件',
  version: '1.0.0',
  author: '',
  icon: 'Box',
  category: 'custom',
  tags: [],
  visual: {
    base: {
      padding: '16px',
      background: '#ffffff',
      borderRadius: '8px'
    },
    states: {
      default: {},
      hover: {},
      active: {},
      focus: {},
      disabled: {}
    }
  },
  behavior: {
    events: []
  },
  properties: [],
  isBuiltin: false,
  isPublic: false
}
