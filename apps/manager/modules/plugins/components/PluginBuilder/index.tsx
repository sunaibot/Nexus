'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Layers,
  Settings,
  Undo,
  Redo,
  Save,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Group,
  X,
  Box,
  Code,
  Rocket,
  Play,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/admin/Toast'
import type { ComponentPart } from '../../types/parts'
import type {
  BuildingPlugin,
  CanvasComponent,
  DragState
} from '../../types/builder'
import { DEFAULT_NEW_PLUGIN } from '../../types/builder'
import { saveBuildingPlugin } from '@/lib/api-client/custom-plugins'
import { generatePluginCode, deployPlugin, previewPlugin } from '../../api-unified'

// 示例零件库
const SAMPLE_PARTS: ComponentPart[] = [
  {
    id: 'part_button_1',
    name: '主按钮',
    description: '主要操作按钮',
    version: '1.0.0',
    author: 'System',
    icon: '🔘',
    category: 'basic',
    tags: ['button', 'primary', 'action'],
    visual: {
      base: {
        padding: '12px 24px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '500',
        textAlign: 'center',
        cursor: 'pointer',
        border: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      states: {
        default: {},
        hover: {
          backgroundColor: '#2563eb',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
        },
        active: {
          backgroundColor: '#1d4ed8',
          transform: 'translateY(0)'
        }
      }
    },
    behavior: {
      events: [
        { name: 'click', label: '点击', description: '点击按钮时触发' },
        { name: 'hover', label: '悬停', description: '鼠标悬停时触发' }
      ],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'text', type: 'string', description: '按钮文字' },
          { name: 'disabled', type: 'boolean', description: '是否禁用' }
        ]
      }
    },
    properties: [
      { name: 'text', label: '文字', type: 'string', defaultValue: '按钮', placeholder: '输入按钮文字' },
      { name: 'size', label: '尺寸', type: 'select', defaultValue: 'medium', options: [
        { label: '小', value: 'small' },
        { label: '中', value: 'medium' },
        { label: '大', value: 'large' }
      ]}
    ],
    stats: { downloads: 1200, likes: 89, usage: 450 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_card_1',
    name: '卡片容器',
    description: '带阴影的卡片容器',
    version: '1.0.0',
    author: 'System',
    icon: '🃏',
    category: 'layout',
    tags: ['card', 'container', 'layout'],
    visual: {
      base: {
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      },
      states: {
        default: {},
        hover: {
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }
    },
    behavior: {
      events: [{ name: 'click', label: '点击', description: '点击卡片时触发' }],
      dataBinding: { supported: true, properties: [] }
    },
    properties: [
      { name: 'padding', label: '内边距', type: 'select', defaultValue: '24px', options: [
        { label: '小', value: '16px' },
        { label: '中', value: '24px' },
        { label: '大', value: '32px' }
      ]}
    ],
    stats: { downloads: 980, likes: 76, usage: 320 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_text_1',
    name: '标题文本',
    description: '大标题文本组件',
    version: '1.0.0',
    author: 'System',
    icon: '📝',
    category: 'basic',
    tags: ['text', 'title', 'heading'],
    visual: {
      base: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: '1.4'
      },
      states: { default: {} }
    },
    behavior: {
      events: [],
      dataBinding: {
        supported: true,
        properties: [{ name: 'content', type: 'string', description: '文本内容' }]
      }
    },
    properties: [
      { name: 'content', label: '内容', type: 'string', defaultValue: '标题文字', placeholder: '输入标题' },
      { name: 'align', label: '对齐', type: 'select', defaultValue: 'left', options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' }
      ]}
    ],
    stats: { downloads: 850, likes: 65, usage: 280 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_input_1',
    name: '输入框',
    description: '表单输入框',
    version: '1.0.0',
    author: 'System',
    icon: '📥',
    category: 'interactive',
    tags: ['input', 'form', 'text'],
    visual: {
      base: {
        padding: '10px 14px',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#374151',
        width: '100%'
      },
      states: {
        default: {},
        focus: {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 3px rgba(59,130,246,0.1)'
        }
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '变化', description: '内容变化时触发' },
        { name: 'focus', label: '聚焦', description: '获得焦点时触发' },
        { name: 'blur', label: '失焦', description: '失去焦点时触发' }
      ],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'value', type: 'string', description: '输入值' },
          { name: 'placeholder', type: 'string', description: '占位符' }
        ]
      }
    },
    properties: [
      { name: 'placeholder', label: '占位符', type: 'string', defaultValue: '请输入...', placeholder: '占位提示文字' },
      { name: 'type', label: '类型', type: 'select', defaultValue: 'text', options: [
        { label: '文本', value: 'text' },
        { label: '密码', value: 'password' },
        { label: '数字', value: 'number' },
        { label: '邮箱', value: 'email' }
      ]}
    ],
    stats: { downloads: 720, likes: 54, usage: 210 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_switch_1',
    name: '开关',
    description: '开关切换组件',
    version: '1.0.0',
    author: 'System',
    icon: '🔘',
    category: 'interactive',
    tags: ['switch', 'toggle', 'boolean'],
    visual: {
      base: {
        width: '50px',
        height: '26px',
        backgroundColor: '#d1d5db',
        borderRadius: '13px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      states: {
        default: {},
        checked: {
          backgroundColor: '#3b82f6'
        }
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '切换', description: '开关状态变化时触发' }
      ],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'checked', type: 'boolean', description: '是否选中' }
        ]
      }
    },
    properties: [
      { name: 'checked', label: '默认开启', type: 'boolean', defaultValue: false },
      { name: 'label', label: '标签文字', type: 'string', defaultValue: '开关', placeholder: '开关标签' }
    ],
    stats: { downloads: 680, likes: 52, usage: 195 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_select_1',
    name: '下拉选择',
    description: '下拉选择框',
    version: '1.0.0',
    author: 'System',
    icon: '📋',
    category: 'interactive',
    tags: ['select', 'dropdown', 'options'],
    visual: {
      base: {
        padding: '10px 14px',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#374151',
        width: '100%',
        cursor: 'pointer'
      },
      states: {
        default: {},
        focus: {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 3px rgba(59,130,246,0.1)'
        }
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '选择', description: '选项变化时触发' }
      ],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'value', type: 'string', description: '选中值' },
          { name: 'options', type: 'array', description: '选项列表' }
        ]
      }
    },
    properties: [
      { name: 'placeholder', label: '占位符', type: 'string', defaultValue: '请选择...', placeholder: '提示文字' },
      { name: 'options', label: '选项', type: 'string', defaultValue: '选项1,选项2,选项3', placeholder: '用逗号分隔选项' }
    ],
    stats: { downloads: 620, likes: 48, usage: 175 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_checkbox_1',
    name: '复选框',
    description: '多选复选框',
    version: '1.0.0',
    author: 'System',
    icon: '☑️',
    category: 'interactive',
    tags: ['checkbox', 'check', 'multi'],
    visual: {
      base: {
        width: '18px',
        height: '18px',
        backgroundColor: '#ffffff',
        border: '2px solid #d1d5db',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      states: {
        default: {},
        checked: {
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6'
        }
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '变化', description: '选中状态变化时触发' }
      ],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'checked', type: 'boolean', description: '是否选中' }
        ]
      }
    },
    properties: [
      { name: 'label', label: '标签', type: 'string', defaultValue: '选项', placeholder: '复选框标签' },
      { name: 'checked', label: '默认选中', type: 'boolean', defaultValue: false }
    ],
    stats: { downloads: 580, likes: 45, usage: 160 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_data_card_1',
    name: '数据卡片',
    description: '展示数据的卡片',
    version: '1.0.0',
    author: 'System',
    icon: '📊',
    category: 'data',
    tags: ['data', 'card', 'stats', 'metric'],
    visual: {
      base: {
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        minWidth: '200px'
      },
      states: {
        default: {}
      }
    },
    behavior: {
      events: [{ name: 'click', label: '点击', description: '点击卡片时触发' }],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'title', type: 'string', description: '标题' },
          { name: 'value', type: 'string', description: '数值' },
          { name: 'trend', type: 'string', description: '趋势' }
        ]
      }
    },
    properties: [
      { name: 'title', label: '标题', type: 'string', defaultValue: '总访问量', placeholder: '数据标题' },
      { name: 'value', label: '数值', type: 'string', defaultValue: '12,345', placeholder: '显示数值' },
      { name: 'trend', label: '趋势', type: 'string', defaultValue: '+12%', placeholder: '如: +12%' },
      { name: 'color', label: '主题色', type: 'select', defaultValue: 'blue', options: [
        { label: '蓝色', value: 'blue' },
        { label: '绿色', value: 'green' },
        { label: '橙色', value: 'orange' },
        { label: '紫色', value: 'purple' }
      ]}
    ],
    stats: { downloads: 890, likes: 72, usage: 310 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_list_1',
    name: '列表',
    description: '数据列表展示',
    version: '1.0.0',
    author: 'System',
    icon: '📃',
    category: 'data',
    tags: ['list', 'data', 'items'],
    visual: {
      base: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      },
      states: {
        default: {}
      }
    },
    behavior: {
      events: [
        { name: 'itemClick', label: '点击项', description: '点击列表项时触发' }
      ],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'items', type: 'array', description: '列表数据' }
        ]
      }
    },
    properties: [
      { name: 'items', label: '列表项', type: 'string', defaultValue: '项目1,项目2,项目3', placeholder: '用逗号分隔' },
      { name: 'showIcon', label: '显示图标', type: 'boolean', defaultValue: true },
      { name: 'striped', label: '斑马纹', type: 'boolean', defaultValue: false }
    ],
    stats: { downloads: 540, likes: 42, usage: 145 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_tabs_1',
    name: '标签页',
    description: '标签切换组件',
    version: '1.0.0',
    author: 'System',
    icon: '📑',
    category: 'layout',
    tags: ['tabs', 'navigation', 'switch'],
    visual: {
      base: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      },
      states: {
        default: {}
      }
    },
    behavior: {
      events: [
        { name: 'tabChange', label: '切换标签', description: '切换标签时触发' }
      ],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'activeTab', type: 'string', description: '当前标签' }
        ]
      }
    },
    properties: [
      { name: 'tabs', label: '标签', type: 'string', defaultValue: '标签1,标签2,标签3', placeholder: '用逗号分隔标签' },
      { name: 'activeTab', label: '默认标签', type: 'string', defaultValue: '0', placeholder: '默认激活的标签索引' }
    ],
    stats: { downloads: 480, likes: 38, usage: 125 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_progress_1',
    name: '进度条',
    description: '进度展示组件',
    version: '1.0.0',
    author: 'System',
    icon: '📈',
    category: 'data',
    tags: ['progress', 'bar', 'percent'],
    visual: {
      base: {
        width: '100%',
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
      },
      states: {
        default: {}
      }
    },
    behavior: {
      events: [],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'percent', type: 'number', description: '进度百分比' }
        ]
      }
    },
    properties: [
      { name: 'percent', label: '进度(%)', type: 'number', defaultValue: 50 },
      { name: 'showText', label: '显示文字', type: 'boolean', defaultValue: true },
      { name: 'color', label: '颜色', type: 'select', defaultValue: 'blue', options: [
        { label: '蓝色', value: 'blue' },
        { label: '绿色', value: 'green' },
        { label: '橙色', value: 'orange' },
        { label: '红色', value: 'red' }
      ]}
    ],
    stats: { downloads: 420, likes: 35, usage: 110 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_badge_1',
    name: '徽标',
    description: '数字徽标标记',
    version: '1.0.0',
    author: 'System',
    icon: '🏷️',
    category: 'basic',
    tags: ['badge', 'tag', 'label'],
    visual: {
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 8px',
        backgroundColor: '#ef4444',
        color: '#ffffff',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: '600',
        minWidth: '20px',
        height: '20px'
      },
      states: {
        default: {}
      }
    },
    behavior: {
      events: [],
      dataBinding: {
        supported: true,
        properties: [
          { name: 'count', type: 'number', description: '徽标数字' }
        ]
      }
    },
    properties: [
      { name: 'count', label: '数字', type: 'number', defaultValue: 5 },
      { name: 'max', label: '最大值', type: 'number', defaultValue: 99 },
      { name: 'color', label: '颜色', type: 'select', defaultValue: 'red', options: [
        { label: '红色', value: 'red' },
        { label: '蓝色', value: 'blue' },
        { label: '绿色', value: 'green' },
        { label: '橙色', value: 'orange' }
      ]}
    ],
    stats: { downloads: 380, likes: 32, usage: 95 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_divider_1',
    name: '分割线',
    description: '内容分隔线',
    version: '1.0.0',
    author: 'System',
    icon: '➖',
    category: 'layout',
    tags: ['divider', 'line', 'separator'],
    visual: {
      base: {
        width: '100%',
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '16px 0'
      },
      states: {
        default: {}
      }
    },
    behavior: {
      events: [],
      dataBinding: { supported: false, properties: [] }
    },
    properties: [
      { name: 'text', label: '文字', type: 'string', defaultValue: '', placeholder: '分割线文字(可选)' },
      { name: 'type', label: '类型', type: 'select', defaultValue: 'horizontal', options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' }
      ]}
    ],
    stats: { downloads: 320, likes: 28, usage: 80 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part_image_1',
    name: '图片',
    description: '图片展示组件',
    version: '1.0.0',
    author: 'System',
    icon: '🖼️',
    category: 'media',
    tags: ['image', 'media', 'photo'],
    visual: {
      base: {
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        objectFit: 'cover'
      },
      states: { default: {} }
    },
    behavior: {
      events: [{ name: 'click', label: '点击', description: '点击图片时触发' }],
      dataBinding: {
        supported: true,
        properties: [{ name: 'src', type: 'image', description: '图片地址' }]
      }
    },
    properties: [
      { name: 'src', label: '图片地址', type: 'image', defaultValue: '', placeholder: 'https://...' },
      { name: 'alt', label: '替代文字', type: 'string', defaultValue: '图片', placeholder: '图片描述' }
    ],
    stats: { downloads: 650, likes: 48, usage: 180 },
    isBuiltin: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

interface PluginBuilderProps {
  initialPlugin?: BuildingPlugin
  onSave?: (plugin: BuildingPlugin) => void
  onCancel?: () => void
  onSaved?: () => void // 保存成功后的回调
}

export default function PluginBuilder({ initialPlugin, onSave, onCancel, onSaved }: PluginBuilderProps) {
  const { showToast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  
  // 插件状态
  const [plugin, setPlugin] = useState<BuildingPlugin>(() => {
    if (initialPlugin) {
      // 确保所有必需字段都存在
      return {
        ...DEFAULT_NEW_PLUGIN,
        ...initialPlugin,
        // 确保嵌套对象也有默认值
        canvas: {
          ...DEFAULT_NEW_PLUGIN.canvas,
          ...initialPlugin.canvas
        },
        components: initialPlugin.components || [],
        selectedComponentIds: initialPlugin.selectedComponentIds || [],
        history: initialPlugin.history || { past: [], future: [] },
        dataFlow: initialPlugin.dataFlow || [],
        eventBindings: initialPlugin.eventBindings || []
      } as BuildingPlugin
    }
    return {
      ...DEFAULT_NEW_PLUGIN,
      id: `plugin_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as BuildingPlugin
  })
  
  // 视图状态
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [activePanel, setActivePanel] = useState<'parts' | 'layers' | 'props'>('parts')
  
  // 新手引导状态
  const [showGuide, setShowGuide] = useState(() => {
    // 检查本地存储，是否首次使用
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('plugin-builder-guide-shown')
    }
    return false
  })
  const [guideStep, setGuideStep] = useState(0)
  
  // 引导步骤配置
  const guideSteps = [
    {
      title: '欢迎使用零件工坊！',
      description: '像搭积木一样，拖拽零件就能创建插件。让我们用 5 步学会使用！',
      target: null,
      position: 'center'
    },
    {
      title: '第一步：零件库',
      description: '这里是零件库，有各种可用的组件。点击分类可以筛选不同类型的零件。',
      target: 'parts-panel',
      position: 'right'
    },
    {
      title: '第二步：拖拽零件',
      description: '按住零件拖拽到右侧画布中，就像搭积木一样简单！',
      target: 'parts-list',
      position: 'right'
    },
    {
      title: '第三步：画布区域',
      description: '这是你的工作区，可以放置和排列零件。点击选中，拖拽移动。',
      target: 'canvas-area',
      position: 'center'
    },
    {
      title: '第四步：属性面板',
      description: '选中零件后，在这里可以修改颜色、大小、文字等属性。',
      target: 'props-panel',
      position: 'left'
    },
    {
      title: '第五步：保存和生成',
      description: '完成插件后，点击保存，然后生成代码就能使用了！',
      target: 'toolbar-save',
      position: 'bottom'
    },
    {
      title: '开始创造吧！',
      description: '现在你已经学会了基本操作。试着创建一个简单的插件吧！🎉',
      target: null,
      position: 'center'
    }
  ]
  
  // 完成引导
  const completeGuide = () => {
    setShowGuide(false)
    localStorage.setItem('plugin-builder-guide-shown', 'true')
  }
  
  // 下一步引导
  const nextGuideStep = () => {
    if (guideStep < guideSteps.length - 1) {
      setGuideStep(guideStep + 1)
    } else {
      completeGuide()
    }
  }
  
  // 上一步引导
  const prevGuideStep = () => {
    if (guideStep > 0) {
      setGuideStep(guideStep - 1)
    }
  }
  
  // 拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    dragId: null,
    dragOffset: { x: 0, y: 0 },
    dragPosition: { x: 0, y: 0 }
  })
  
  // 选中的零件库分类
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // 历史记录
  const [history, setHistory] = useState<CanvasComponent[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // 保存历史
  const saveHistory = useCallback((components: CanvasComponent[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push([...components])
      return newHistory.slice(-20) // 最多保留20步
    })
    setHistoryIndex(prev => Math.min(prev + 1, 19))
  }, [historyIndex])

  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setPlugin(prev => ({
        ...prev,
        components: [...history[historyIndex - 1]]
      }))
      showToast('success', '已撤销')
    }
  }, [history, historyIndex, showToast])

  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setPlugin(prev => ({
        ...prev,
        components: [...history[historyIndex + 1]]
      }))
      showToast('success', '已重做')
    }
  }, [history, historyIndex, showToast])

  // 添加组件到画布
  const addComponent = useCallback((part: ComponentPart, position: { x: number; y: number }) => {
    const newComponent: CanvasComponent = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      partId: part.id,
      part,
      position,
      size: { width: 'auto', height: 'auto' },
      props: part.properties.reduce((acc, prop) => ({
        ...acc,
        [prop.name]: prop.defaultValue
      }), {}),
      zIndex: (plugin.components || []).length,
      visible: true,
      locked: false
    }
    
    const newComponents = [...(plugin.components || []), newComponent]
    setPlugin(prev => ({
      ...prev,
      components: newComponents,
      selectedComponentIds: [newComponent.id]
    }))
    saveHistory(newComponents)
    showToast('success', `已添加 ${part.name}`)
  }, [plugin.components, saveHistory, showToast])

  // 更新组件
  const updateComponent = useCallback((id: string, updates: Partial<CanvasComponent>) => {
    const newComponents = (plugin.components || []).map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    )
    setPlugin(prev => ({ ...prev, components: newComponents }))
  }, [plugin.components])

  // 删除组件
  const deleteComponent = useCallback((id: string) => {
    const newComponents = (plugin.components || []).filter(comp => comp.id !== id)
    setPlugin(prev => ({
      ...prev,
      components: newComponents,
      selectedComponentIds: (prev.selectedComponentIds || []).filter(i => i !== id)
    }))
    saveHistory(newComponents)
    showToast('success', '已删除组件')
  }, [plugin.components, plugin.selectedComponentIds, saveHistory, showToast])

  // 选中组件
  const selectComponent = useCallback((id: string, multi: boolean = false) => {
    if (multi) {
      setPlugin(prev => ({
        ...prev,
        selectedComponentIds: (prev.selectedComponentIds || []).includes(id)
          ? (prev.selectedComponentIds || []).filter(i => i !== id)
          : [...(prev.selectedComponentIds || []), id]
      }))
    } else {
      setPlugin(prev => ({ ...prev, selectedComponentIds: [id] }))
    }
  }, [])

  // 处理零件拖拽开始
  const handlePartDragStart = useCallback((e: React.DragEvent, part: ComponentPart) => {
    e.dataTransfer.setData('partId', part.id)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  // 处理画布拖拽放置
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const partId = e.dataTransfer.getData('partId')
    const part = SAMPLE_PARTS.find(p => p.id === partId)
    
    if (part && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom
      addComponent(part, { x, y })
    }
  }, [zoom, addComponent])

  // 处理画布拖拽悬停
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // 保存插件到服务器
  const handleSave = useCallback(async () => {
    if (!plugin.name.trim()) {
      showToast('error', '请输入插件名称')
      return
    }
    
    if ((plugin.components || []).length === 0) {
      showToast('error', '插件至少需要包含一个组件')
      return
    }
    
    setIsSaving(true)
    try {
      const pluginToSave = {
        ...plugin,
        updatedAt: new Date().toISOString(),
      }
      
      const savedPlugin = await saveBuildingPlugin(pluginToSave)
      
      // 更新本地ID（如果是新创建的插件）
      if (!plugin.id && savedPlugin.id) {
        setPlugin(prev => ({ ...prev, id: savedPlugin.id }))
      }
      
      showToast('success', '插件保存成功')
      onSave?.(pluginToSave)
      onSaved?.()
    } catch (error) {
      console.error('保存插件失败:', error)
      showToast('error', '保存插件失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }, [plugin, onSave, onSaved, showToast])

  // 生成代码
  const handleGenerate = useCallback(async () => {
    if (!plugin.id) {
      showToast('error', '请先保存插件')
      return
    }
    
    setIsGenerating(true)
    try {
      const result = await generatePluginCode(plugin.id)
      showToast('success', `代码生成成功！${result.hasBackend ? '包含后端代码' : '纯前端插件'}`)
    } catch (error) {
      console.error('生成代码失败:', error)
      showToast('error', '生成代码失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }, [plugin.id, showToast])

  // 部署插件
  const handleDeploy = useCallback(async () => {
    if (!plugin.id) {
      showToast('error', '请先保存插件')
      return
    }
    
    setIsDeploying(true)
    try {
      const result = await deployPlugin(plugin.id, 'content-sidebar')
      showToast('success', `插件部署成功！已添加到 ${result.slot} 插槽`)
      onSaved?.()
    } catch (error) {
      console.error('部署失败:', error)
      showToast('error', '部署失败，请先生成代码')
    } finally {
      setIsDeploying(false)
    }
  }, [plugin.id, onSaved, showToast])

  // 预览代码
  const handlePreviewCode = useCallback(async () => {
    try {
      const result = await previewPlugin(plugin)
      setGeneratedCode(result.code)
      setShowCodeModal(true)
    } catch (error) {
      console.error('预览代码失败:', error)
      showToast('error', '预览代码失败')
    }
  }, [plugin, showToast])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            undo()
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 's':
            e.preventDefault()
            handleSave()
            break
        }
      }
      if (e.key === 'Delete' && (plugin.selectedComponentIds || []).length > 0) {
        (plugin.selectedComponentIds || []).forEach(id => deleteComponent(id))
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, handleSave, plugin, deleteComponent])

  // 过滤零件
  const filteredParts = SAMPLE_PARTS?.filter(part =>
    selectedCategory === 'all' || part.category === selectedCategory
  ) || []

  // 选中的组件
  const selectedComponents = (plugin.components || []).filter(comp =>
    (plugin.selectedComponentIds || []).includes(comp.id)
  )

  // 调整大小状态
  const [resizing, setResizing] = useState<{
    compId: string
    position: string
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startLeft: number
    startTop: number
  } | null>(null)

  // 处理调整大小开始
  const handleResizeStart = useCallback((e: React.MouseEvent, comp: CanvasComponent, position: string) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (comp.locked || previewMode) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    // 获取组件当前尺寸
    const currentWidth = parseInt(comp.part.visual.base.width as string) || 200
    const currentHeight = parseInt(comp.part.visual.base.height as string) || 100
    
    setResizing({
      compId: comp.id,
      position,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentWidth,
      startHeight: currentHeight,
      startLeft: comp.position.x,
      startTop: comp.position.y
    })
  }, [previewMode])

  // 处理调整大小中
  useEffect(() => {
    if (!resizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - resizing.startX) / zoom
      const deltaY = (e.clientY - resizing.startY) / zoom
      const gridSize = plugin.canvas?.gridSize || 20
      
      let newWidth = resizing.startWidth
      let newHeight = resizing.startHeight
      let newLeft = resizing.startLeft
      let newTop = resizing.startTop
      
      // 根据手柄位置计算新尺寸和位置
      switch (resizing.position) {
        case 'se': // 右下角
          newWidth = Math.max(50, resizing.startWidth + deltaX)
          newHeight = Math.max(30, resizing.startHeight + deltaY)
          break
        case 'sw': // 左下角
          newWidth = Math.max(50, resizing.startWidth - deltaX)
          newHeight = Math.max(30, resizing.startHeight + deltaY)
          newLeft = resizing.startLeft + (resizing.startWidth - newWidth)
          break
        case 'ne': // 右上角
          newWidth = Math.max(50, resizing.startWidth + deltaX)
          newHeight = Math.max(30, resizing.startHeight - deltaY)
          newTop = resizing.startTop + (resizing.startHeight - newHeight)
          break
        case 'nw': // 左上角
          newWidth = Math.max(50, resizing.startWidth - deltaX)
          newHeight = Math.max(30, resizing.startHeight - deltaY)
          newLeft = resizing.startLeft + (resizing.startWidth - newWidth)
          newTop = resizing.startTop + (resizing.startHeight - newHeight)
          break
        case 'e': // 右边
          newWidth = Math.max(50, resizing.startWidth + deltaX)
          break
        case 'w': // 左边
          newWidth = Math.max(50, resizing.startWidth - deltaX)
          newLeft = resizing.startLeft + (resizing.startWidth - newWidth)
          break
        case 's': // 下边
          newHeight = Math.max(30, resizing.startHeight + deltaY)
          break
        case 'n': // 上边
          newHeight = Math.max(30, resizing.startHeight - deltaY)
          newTop = resizing.startTop + (resizing.startHeight - newHeight)
          break
      }
      
      // 吸附到网格
      newWidth = Math.round(newWidth / gridSize) * gridSize
      newHeight = Math.round(newHeight / gridSize) * gridSize
      newLeft = Math.round(newLeft / gridSize) * gridSize
      newTop = Math.round(newTop / gridSize) * gridSize
      
      // 更新组件
      const comp = (plugin.components || []).find(c => c.id === resizing.compId)
      if (comp) {
        updateComponent(resizing.compId, {
          position: { x: newLeft, y: newTop },
          part: {
            ...comp.part,
            visual: {
              ...comp.part.visual,
              base: {
                ...comp.part.visual.base,
                width: `${newWidth}px`,
                height: `${newHeight}px`
              }
            }
          }
        })
      }
    }
    
    const handleMouseUp = () => {
      if (resizing) {
        saveHistory(plugin.components || [])
      }
      setResizing(null)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing, zoom, plugin.canvas?.gridSize, plugin.components, updateComponent, saveHistory])

  // 调整大小手柄组件
  const ResizeHandle = ({ comp, position }: { comp: CanvasComponent; position: string }) => {
    const getHandleStyle = () => {
      const base = {
        position: 'absolute' as const,
        width: '10px',
        height: '10px',
        backgroundColor: '#3b82f6',
        border: '2px solid white',
        borderRadius: '50%',
        zIndex: 10
      }
      
      switch (position) {
        case 'nw': return { ...base, top: '-5px', left: '-5px', cursor: 'nw-resize' }
        case 'ne': return { ...base, top: '-5px', right: '-5px', cursor: 'ne-resize' }
        case 'sw': return { ...base, bottom: '-5px', left: '-5px', cursor: 'sw-resize' }
        case 'se': return { ...base, bottom: '-5px', right: '-5px', cursor: 'se-resize' }
        case 'n': return { ...base, top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' }
        case 's': return { ...base, bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' }
        case 'w': return { ...base, left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' }
        case 'e': return { ...base, right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' }
        default: return base
      }
    }
    
    return (
      <div
        style={getHandleStyle()}
        onMouseDown={(e) => handleResizeStart(e, comp, position)}
      />
    )
  }

  // 处理组件拖拽移动
  const handleComponentDragEnd = useCallback((comp: CanvasComponent, info: any) => {
    if (comp.locked || previewMode) return
    
    const newX = comp.position.x + info.offset.x / zoom
    const newY = comp.position.y + info.offset.y / zoom
    
    // 吸附到网格
    const gridSize = plugin.canvas?.gridSize || 20
    const snappedX = Math.round(newX / gridSize) * gridSize
    const snappedY = Math.round(newY / gridSize) * gridSize
    
    updateComponent(comp.id, {
      position: { x: snappedX, y: snappedY }
    })
    saveHistory((plugin.components || []).map(c => 
      c.id === comp.id ? { ...c, position: { x: snappedX, y: snappedY } } : c
    ))
  }, [zoom, plugin.canvas?.gridSize, plugin.components, updateComponent, saveHistory, previewMode])

  // 对齐组件
  const alignComponents = useCallback((align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedComponents.length < 2) return
    
    const gridSize = plugin.canvas?.gridSize || 20
    let newComponents = [...(plugin.components || [])]
    
    // 计算边界框
    const bounds = selectedComponents.reduce((acc, comp) => {
      const width = parseInt(comp.part.visual.base.width as string) || 200
      const height = parseInt(comp.part.visual.base.height as string) || 100
      return {
        left: Math.min(acc.left, comp.position.x),
        right: Math.max(acc.right, comp.position.x + width),
        top: Math.min(acc.top, comp.position.y),
        bottom: Math.max(acc.bottom, comp.position.y + height)
      }
    }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity })
    
    const centerX = (bounds.left + bounds.right) / 2
    const centerY = (bounds.top + bounds.bottom) / 2
    
    newComponents = newComponents.map(comp => {
      if (!(plugin.selectedComponentIds || []).includes(comp.id)) return comp
      
      const width = parseInt(comp.part.visual.base.width as string) || 200
      const height = parseInt(comp.part.visual.base.height as string) || 100
      let newX = comp.position.x
      let newY = comp.position.y
      
      switch (align) {
        case 'left':
          newX = bounds.left
          break
        case 'center':
          newX = centerX - width / 2
          break
        case 'right':
          newX = bounds.right - width
          break
        case 'top':
          newY = bounds.top
          break
        case 'middle':
          newY = centerY - height / 2
          break
        case 'bottom':
          newY = bounds.bottom - height
          break
      }
      
      // 吸附到网格
      newX = Math.round(newX / gridSize) * gridSize
      newY = Math.round(newY / gridSize) * gridSize
      
      return { ...comp, position: { x: newX, y: newY } }
    })
    
    setPlugin(prev => ({ ...prev, components: newComponents }))
    saveHistory(newComponents)
    showToast('success', `已${align === 'left' ? '左' : align === 'center' ? '水平居中' : align === 'right' ? '右' : align === 'top' ? '顶部' : align === 'middle' ? '垂直居中' : '底部'}对齐`)
  }, [selectedComponents, plugin.components, plugin.selectedComponentIds, plugin.canvas?.gridSize, saveHistory, showToast])

  // 分布组件
  const distributeComponents = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedComponents.length < 3) {
      showToast('error', '至少需要3个组件才能分布')
      return
    }
    
    const gridSize = plugin.canvas?.gridSize || 20
    const sorted = [...selectedComponents].sort((a, b) => 
      direction === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y
    )
    
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const firstSize = direction === 'horizontal' 
      ? parseInt(first.part.visual.base.width as string) || 200
      : parseInt(first.part.visual.base.height as string) || 100
    const lastSize = direction === 'horizontal'
      ? parseInt(last.part.visual.base.width as string) || 200
      : parseInt(last.part.visual.base.height as string) || 100
    
    const start = direction === 'horizontal' ? first.position.x : first.position.y
    const end = direction === 'horizontal' 
      ? last.position.x + lastSize 
      : last.position.y + lastSize
    const totalSpace = end - start
    const totalSize = sorted.reduce((sum, comp) => sum + (direction === 'horizontal'
      ? parseInt(comp.part.visual.base.width as string) || 200
      : parseInt(comp.part.visual.base.height as string) || 100
    ), 0)
    const gap = (totalSpace - totalSize) / (sorted.length - 1)
    
    let newComponents = [...(plugin.components || [])]
    let currentPos = start
    
    sorted.forEach((comp, index) => {
      const size = direction === 'horizontal'
        ? parseInt(comp.part.visual.base.width as string) || 200
        : parseInt(comp.part.visual.base.height as string) || 100
      
      const newPos = Math.round(currentPos / gridSize) * gridSize
      
      newComponents = newComponents.map(c => {
        if (c.id !== comp.id) return c
        return {
          ...c,
          position: direction === 'horizontal'
            ? { ...c.position, x: newPos }
            : { ...c.position, y: newPos }
        }
      })
      
      currentPos += size + gap
    })
    
    setPlugin(prev => ({ ...prev, components: newComponents }))
    saveHistory(newComponents)
    showToast('success', `已${direction === 'horizontal' ? '水平' : '垂直'}分布`)
  }, [selectedComponents, plugin.components, plugin.canvas?.gridSize, saveHistory, showToast])

  // 组合组件（简单版：创建组标记）
  const groupComponents = useCallback(() => {
    if (selectedComponents.length < 2) return
    
    // 这里可以实现组合逻辑，暂时只是提示
    showToast('success', `已组合 ${selectedComponents.length} 个组件`)
  }, [selectedComponents, showToast])

  // 渲染组件
  const renderComponent = (comp: CanvasComponent) => {
    const isSelected = (plugin.selectedComponentIds || []).includes(comp.id)
    const baseStyles = comp.part.visual.base
    const defaultStyles = comp.part.visual.states.default

    // 构建样式对象，过滤掉 undefined 值
    const styles: any = {
      position: 'absolute',
      left: comp.position.x,
      top: comp.position.y,
      zIndex: comp.zIndex,
      opacity: comp.visible ? (baseStyles.opacity ?? 1) : 0.3,
      cursor: comp.locked || previewMode ? 'default' : 'move',
      // 基础样式
      width: baseStyles.width,
      height: baseStyles.height,
      minWidth: baseStyles.minWidth,
      minHeight: baseStyles.minHeight,
      maxWidth: baseStyles.maxWidth,
      maxHeight: baseStyles.maxHeight,
      padding: baseStyles.padding,
      margin: baseStyles.margin,
      background: baseStyles.background,
      backgroundColor: baseStyles.backgroundColor,
      backgroundImage: baseStyles.backgroundImage,
      border: baseStyles.border,
      borderWidth: baseStyles.borderWidth,
      borderColor: baseStyles.borderColor,
      borderStyle: baseStyles.borderStyle,
      borderRadius: baseStyles.borderRadius,
      boxShadow: baseStyles.boxShadow,
      color: baseStyles.color,
      fontSize: baseStyles.fontSize,
      fontWeight: baseStyles.fontWeight,
      fontFamily: baseStyles.fontFamily,
      textAlign: baseStyles.textAlign,
      lineHeight: baseStyles.lineHeight,
      letterSpacing: baseStyles.letterSpacing,
      display: baseStyles.display,
      overflow: baseStyles.overflow,
      transform: baseStyles.transform,
      transition: baseStyles.transition,
      flexDirection: baseStyles.flexDirection,
      justifyContent: baseStyles.justifyContent,
      alignItems: baseStyles.alignItems,
      gap: baseStyles.gap,
      flexWrap: baseStyles.flexWrap,
      objectFit: baseStyles.objectFit,
      // 默认状态样式覆盖
      ...defaultStyles
    }

    // 构建悬停和点击动画样式
    const hoverStyles = comp.part.visual.states.hover ? {
      backgroundColor: comp.part.visual.states.hover.backgroundColor,
      transform: comp.part.visual.states.hover.transform,
      boxShadow: comp.part.visual.states.hover.boxShadow
    } : undefined

    const tapStyles = comp.part.visual.states.active ? {
      backgroundColor: comp.part.visual.states.active.backgroundColor,
      transform: comp.part.visual.states.active.transform
    } : undefined

    return (
      <motion.div
        key={comp.id}
        style={styles}
        className={cn(
          'select-none',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          !previewMode && 'hover:ring-2 hover:ring-blue-300 hover:ring-offset-2'
        )}
        drag={!comp.locked && !previewMode}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(_, info) => handleComponentDragEnd(comp, info)}
        onClick={(e) => {
          e.stopPropagation()
          selectComponent(comp.id, e.shiftKey)
        }}
        whileHover={!previewMode && hoverStyles ? hoverStyles : undefined}
        whileTap={!previewMode && tapStyles ? tapStyles : undefined}
      >
        {/* 根据零件类型渲染内容 */}
        {comp.part.id.includes('button') && (
          <button className="w-full h-full pointer-events-none">
            {comp.props.text || '按钮'}
          </button>
        )}
        {comp.part.id.includes('text') && (
          <div style={{ textAlign: comp.props.align }}>
            {comp.props.content || '文本'}
          </div>
        )}
        {comp.part.id.includes('input') && (
          <input
            type={comp.props.type}
            placeholder={comp.props.placeholder}
            className="w-full pointer-events-none"
            readOnly
          />
        )}
        {comp.part.id.includes('image') && (
          <img
            src={comp.props.src || 'https://via.placeholder.com/300x200'}
            alt={comp.props.alt}
            className="w-full h-full object-cover pointer-events-none"
          />
        )}
        {comp.part.id.includes('card') && (
          <div className="w-full h-full min-w-[200px] min-h-[150px] flex items-center justify-center text-gray-400">
            卡片容器
          </div>
        )}

        {/* 调整大小手柄 - 仅在选中且未锁定时显示 */}
        {isSelected && !comp.locked && !previewMode && (
          <>
            {/* 四个角 */}
            <ResizeHandle comp={comp} position="nw" />
            <ResizeHandle comp={comp} position="ne" />
            <ResizeHandle comp={comp} position="sw" />
            <ResizeHandle comp={comp} position="se" />
            {/* 四条边 */}
            <ResizeHandle comp={comp} position="n" />
            <ResizeHandle comp={comp} position="s" />
            <ResizeHandle comp={comp} position="w" />
            <ResizeHandle comp={comp} position="e" />
          </>
        )}
      </motion.div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={plugin.name}
              onChange={(e) => setPlugin(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-1.5 text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="插件名称"
            />
          </div>
          
          <div className="h-6 w-px bg-gray-300" />
          
          {/* 撤销重做 */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="撤销 (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="重做 (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图控制 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
              className="p-1.5 rounded hover:bg-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              className="p-1.5 rounded hover:bg-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            )}
            title="显示网格"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-300" />

          {/* 预览和保存 */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              previewMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? '退出预览' : '预览'}
          </button>

          <button
            onClick={handlePreviewCode}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
            title="查看生成的代码"
          >
            <Code className="w-4 h-4" />
            看代码
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className={cn("w-4 h-4", isSaving && "animate-spin")} />
            {isSaving ? '保存中...' : '保存'}
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !plugin.id}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            {isGenerating ? '生成中...' : '生成代码'}
          </button>

          <button
            onClick={handleDeploy}
            disabled={isDeploying || !plugin.id}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Rocket className={cn("w-4 h-4", isDeploying && "animate-spin")} />
            {isDeploying ? '部署中...' : '部署'}
          </button>
        </div>
      </div>

      {/* 对齐工具栏 - 多选时显示 */}
      {selectedComponents.length > 1 && !previewMode && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-200">
          <span className="text-sm text-blue-600 font-medium mr-2">
            已选择 {selectedComponents.length} 个组件
          </span>
          <div className="h-4 w-px bg-blue-300" />
          
          {/* 对齐工具 */}
          <button
            onClick={() => alignComponents('left')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => alignComponents('center')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="水平居中"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => alignComponents('right')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="右对齐"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => alignComponents('top')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="顶部对齐"
          >
            <AlignVerticalJustifyCenter className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={() => alignComponents('middle')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="垂直居中"
          >
            <AlignHorizontalJustifyCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => alignComponents('bottom')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="底部对齐"
          >
            <AlignVerticalJustifyCenter className="w-4 h-4 -rotate-90" />
          </button>
          
          <div className="h-4 w-px bg-blue-300" />
          
          {/* 分布工具 */}
          <button
            onClick={() => distributeComponents('horizontal')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="水平分布"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="3" y2="18" />
              <line x1="12" y1="6" x2="12" y2="18" />
              <line x1="21" y1="6" x2="21" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => distributeComponents('vertical')}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="垂直分布"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="6" y1="3" x2="18" y2="3" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="21" x2="18" y2="21" />
            </svg>
          </button>
          
          <div className="h-4 w-px bg-blue-300" />
          
          {/* 组合/解组 */}
          <button
            onClick={groupComponents}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 text-blue-600 text-sm"
            title="组合"
          >
            <Group className="w-4 h-4" />
            组合
          </button>
          
          <button
            onClick={() => setPlugin(prev => ({ ...prev, selectedComponentIds: [] }))}
            className="ml-auto p-1.5 rounded hover:bg-blue-100 text-blue-600"
            title="取消选择"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 主工作区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          {/* 面板切换 */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'parts', label: '零件', icon: Box },
              { id: 'layers', label: '图层', icon: Layers },
              { id: 'props', label: '属性', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePanel(id as any)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors',
                  activePanel === id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* 面板内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'parts' && (
              <div className="space-y-4">
                {/* 分类筛选 */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'basic', label: '基础' },
                    { id: 'layout', label: '布局' },
                    { id: 'interactive', label: '交互' },
                    { id: 'media', label: '媒体' }
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setSelectedCategory(id)}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full transition-colors',
                        selectedCategory === id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* 零件列表 */}
                <div className="space-y-2">
                  {filteredParts.map(part => (
                    <div
                      key={part.id}
                      draggable
                      onDragStart={(e) => handlePartDragStart(e, part)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors group"
                    >
                      <span className="text-2xl">{part.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{part.name}</div>
                        <div className="text-xs text-gray-500 truncate">{part.description}</div>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'layers' && (
              <div className="space-y-1">
                {(plugin.components || []).slice().reverse().map((comp, index) => (
                  <div
                    key={comp.id}
                    onClick={() => selectComponent(comp.id)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                      (plugin.selectedComponentIds || []).includes(comp.id)
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <span className="text-sm">{comp.part.icon}</span>
                    <span className="flex-1 text-sm truncate">{comp.part.name}</span>
                    <div className="flex items-center gap-1">
                      {!comp.visible && <EyeOff className="w-3 h-3 text-gray-400" />}
                      {comp.locked && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                  </div>
                ))}
                {(plugin.components || []).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    暂无组件
                  </div>
                )}
              </div>
            )}

            {activePanel === 'props' && selectedComponents.length > 0 && (
              <div className="space-y-4">
                {selectedComponents.length === 1 ? (
                  <>
                    {/* 单个组件属性 */}
                    <div className="text-sm font-medium text-gray-900 mb-3">
                      {selectedComponents[0].part.name}
                    </div>
                    
                    {/* 位置 */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">位置</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-400">X</span>
                          <input
                            type="number"
                            value={Math.round(selectedComponents[0].position.x)}
                            onChange={(e) => updateComponent(selectedComponents[0].id, {
                              position: {
                                ...selectedComponents[0].position,
                                x: Number(e.target.value)
                              }
                            })}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400">Y</span>
                          <input
                            type="number"
                            value={Math.round(selectedComponents[0].position.y)}
                            onChange={(e) => updateComponent(selectedComponents[0].id, {
                              position: {
                                ...selectedComponents[0].position,
                                y: Number(e.target.value)
                              }
                            })}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 自定义属性 */}
                    {selectedComponents[0].part.properties.map(prop => (
                      <div key={prop.name} className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">{prop.label}</label>
                        {prop.type === 'string' && (
                          <input
                            type="text"
                            value={selectedComponents[0].props[prop.name] || ''}
                            onChange={(e) => updateComponent(selectedComponents[0].id, {
                              props: { ...selectedComponents[0].props, [prop.name]: e.target.value }
                            })}
                            placeholder={prop.placeholder}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        )}
                        {prop.type === 'select' && (
                          <select
                            value={selectedComponents[0].props[prop.name]}
                            onChange={(e) => updateComponent(selectedComponents[0].id, {
                              props: { ...selectedComponents[0].props, [prop.name]: e.target.value }
                            })}
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            {prop.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}

                    {/* 操作按钮 */}
                    <div className="pt-4 border-t space-y-2">
                      <button
                        onClick={() => updateComponent(selectedComponents[0].id, {
                          locked: !selectedComponents[0].locked
                        })}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100"
                      >
                        {selectedComponents[0].locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {selectedComponents[0].locked ? '解锁' : '锁定'}
                      </button>
                      <button
                        onClick={() => updateComponent(selectedComponents[0].id, {
                          visible: !selectedComponents[0].visible
                        })}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100"
                      >
                        {selectedComponents[0].visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {selectedComponents[0].visible ? '隐藏' : '显示'}
                      </button>
                      <button
                        onClick={() => deleteComponent(selectedComponents[0].id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">
                    已选择 {selectedComponents.length} 个组件
                  </div>
                )}
              </div>
            )}

            {activePanel === 'props' && selectedComponents.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <MousePointer2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                选择组件以编辑属性
              </div>
            )}
          </div>
        </div>

        {/* 画布区域 */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8">
          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onClick={() => setPlugin(prev => ({ ...prev, selectedComponentIds: [] }))}
            className="relative mx-auto bg-white shadow-lg"
            style={{
              width: plugin.canvas?.width || 1200,
              height: plugin.canvas?.height || 800,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              backgroundImage: showGrid
                ? 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)'
                : 'none',
              backgroundSize: showGrid ? `${plugin.canvas?.gridSize || 20}px ${plugin.canvas?.gridSize || 20}px` : 'auto'
            }}
          >
            {/* 渲染所有组件 */}
            {(plugin.components || []).map(renderComponent)}

            {/* 空状态提示 */}
            {(plugin.components || []).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Box className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">从左侧拖拽零件到这里</p>
                  <p className="text-sm">开始构建你的插件</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 代码预览模态框 */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">生成的代码预览</h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{generatedCode}</code>
              </pre>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode || '')
                  showToast('success', '代码已复制到剪贴板')
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                复制代码
              </button>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 新手引导 */}
      {showGuide && (
        <div className="fixed inset-0 z-50">
          {/* 遮罩层 */}
          <div className="absolute inset-0 bg-black/40" onClick={completeGuide} />
          
          {/* 引导卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'absolute bg-white rounded-2xl shadow-2xl p-6 max-w-md',
              guideSteps[guideStep].position === 'center' && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              guideSteps[guideStep].position === 'right' && 'top-1/2 left-80 -translate-y-1/2',
              guideSteps[guideStep].position === 'left' && 'top-1/2 right-4 -translate-y-1/2',
              guideSteps[guideStep].position === 'bottom' && 'top-20 left-1/2 -translate-x-1/2'
            )}
          >
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === guideStep ? 'bg-blue-500 w-4' : 'bg-gray-300'
                  )}
                />
              ))}
            </div>
            
            {/* 图标 */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
                {guideStep === 0 ? (
                  <Sparkles className="w-8 h-8 text-white" />
                ) : guideStep === guideSteps.length - 1 ? (
                  <span className="text-3xl">🎉</span>
                ) : (
                  <span className="text-2xl font-bold text-white">{guideStep}</span>
                )}
              </div>
            </div>
            
            {/* 标题和内容 */}
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              {guideSteps[guideStep].title}
            </h3>
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              {guideSteps[guideStep].description}
            </p>
            
            {/* 按钮 */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevGuideStep}
                disabled={guideStep === 0}
                className={cn(
                  'flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors',
                  guideStep === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={completeGuide}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                >
                  跳过
                </button>
                <button
                  onClick={nextGuideStep}
                  className="flex items-center gap-1 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  {guideStep === guideSteps.length - 1 ? '开始创作' : '下一步'}
                  {guideStep < guideSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* 高亮框 */}
          {guideSteps[guideStep].target && (
            <div
              className="absolute border-4 border-blue-400 rounded-lg pointer-events-none"
              style={{
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4), 0 0 20px rgba(59,130,246,0.5)'
              }}
            />
          )}
        </div>
      )}
      
      {/* 帮助按钮 */}
      <button
        onClick={() => {
          setShowGuide(true)
          setGuideStep(0)
        }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center z-40"
        title="查看引导"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  )
}
