'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Grid,
  List,
  Download,
  Heart,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Share2,
  Box,
  Layout,
  Database,
  MousePointer,
  Image as ImageIcon,
  Sparkles,
  Filter,
  SortAsc,
  Wrench,
  Hammer,
  ChevronRight,
  Star,
  Eye,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/admin/Toast'
import type { ComponentPart } from '../../types/parts'
import { PART_CATEGORIES } from '../../types/parts'
import PartEditor from '../PartEditor'

// 示例零件数据
const SAMPLE_PARTS: ComponentPart[] = [
  {
    id: 'part_1',
    name: '彩虹按钮',
    description: '渐变色背景的漂亮按钮',
    version: '1.0.0',
    author: '系统',
    icon: '🎨',
    category: 'basic',
    tags: ['按钮', '渐变', '交互'],
    visual: {
      base: {
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: '500',
        color: '#ffffff',
        cursor: 'pointer'
      },
      states: {
        default: {
          backgroundGradient: { from: '#3b82f6', to: '#8b5cf6', direction: '135deg' }
        },
        hover: {
          backgroundGradient: { from: '#2563eb', to: '#7c3aed', direction: '135deg' },
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
        },
        active: {
          transform: 'translateY(0)',
          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
        },
        focus: {},
        disabled: {}
      },
      animations: {
        hover: { type: 'scale', duration: 200, easing: 'ease-out' }
      }
    },
    behavior: {
      events: [
        { name: 'click', label: '点击', description: '点击时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'text', label: '按钮文字', type: 'string', defaultValue: '按钮' },
      { name: 'size', label: '尺寸', type: 'select', defaultValue: 'medium', options: [
        { label: '小', value: 'small' },
        { label: '中', value: 'medium' },
        { label: '大', value: 'large' }
      ]}
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 1234, likes: 567, usage: 890 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_2',
    name: '数据卡片',
    description: '展示数据的卡片组件',
    version: '1.2.0',
    author: '系统',
    icon: '📊',
    category: 'data',
    tags: ['卡片', '数据', '展示'],
    visual: {
      base: {
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      },
      states: {
        default: {},
        hover: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        },
        active: {},
        focus: {},
        disabled: {}
      },
      animations: {
        entrance: { type: 'fade', duration: 300, easing: 'ease-out' }
      }
    },
    behavior: {
      events: []
    },
    properties: [
      { name: 'title', label: '标题', type: 'string', defaultValue: '卡片标题' },
      { name: 'value', label: '数值', type: 'string', defaultValue: '0' },
      { name: 'trend', label: '趋势', type: 'select', defaultValue: 'neutral', options: [
        { label: '上升', value: 'up' },
        { label: '下降', value: 'down' },
        { label: '持平', value: 'neutral' }
      ]}
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 2345, likes: 890, usage: 1234 },
    createdAt: '2024-01-01',
    updatedAt: '2024-03-15'
  },
  {
    id: 'part_3',
    name: '网格容器',
    description: '响应式网格布局容器',
    version: '1.0.0',
    author: '系统',
    icon: '⊞',
    category: 'layout',
    tags: ['布局', '网格', '容器'],
    visual: {
      base: {
        display: 'grid',
        gap: '16px',
        padding: '16px'
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
    properties: [
      { name: 'columns', label: '列数', type: 'number', defaultValue: 3, min: 1, max: 12 },
      { name: 'gap', label: '间距', type: 'string', defaultValue: '16px' }
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 890, likes: 234, usage: 567 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_4',
    name: '主按钮',
    description: '主要操作按钮，支持多种尺寸',
    version: '1.0.0',
    author: '系统',
    icon: '🔘',
    category: 'basic',
    tags: ['按钮', '主要', '操作'],
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
        },
        focus: {},
        disabled: {
          backgroundColor: '#9ca3af',
          cursor: 'not-allowed'
        }
      }
    },
    behavior: {
      events: [
        { name: 'click', label: '点击', description: '点击按钮时触发', actions: [] },
        { name: 'hover', label: '悬停', description: '鼠标悬停时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'text', label: '文字', type: 'string', defaultValue: '按钮' },
      { name: 'size', label: '尺寸', type: 'select', defaultValue: 'medium', options: [
        { label: '小', value: 'small' },
        { label: '中', value: 'medium' },
        { label: '大', value: 'large' }
      ]}
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 1200, likes: 89, usage: 450 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_5',
    name: '卡片容器',
    description: '带阴影的卡片容器',
    version: '1.0.0',
    author: '系统',
    icon: '🃏',
    category: 'layout',
    tags: ['卡片', '容器', '布局'],
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
        },
        active: {},
        focus: {},
        disabled: {}
      }
    },
    behavior: {
      events: [
        { name: 'click', label: '点击', description: '点击卡片时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'padding', label: '内边距', type: 'select', defaultValue: '24px', options: [
        { label: '小', value: '16px' },
        { label: '中', value: '24px' },
        { label: '大', value: '32px' }
      ]}
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 980, likes: 76, usage: 320 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_6',
    name: '标题文本',
    description: '大标题文本组件',
    version: '1.0.0',
    author: '系统',
    icon: '📝',
    category: 'basic',
    tags: ['文本', '标题', '文字'],
    visual: {
      base: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: '1.4'
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
    properties: [
      { name: 'content', label: '内容', type: 'string', defaultValue: '标题文字' },
      { name: 'align', label: '对齐', type: 'select', defaultValue: 'left', options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' }
      ]}
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 850, likes: 65, usage: 280 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_7',
    name: '输入框',
    description: '表单输入框，支持多种类型',
    version: '1.0.0',
    author: '系统',
    icon: '📥',
    category: 'interactive',
    tags: ['输入', '表单', '文本'],
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
        hover: {},
        active: {},
        focus: {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 3px rgba(59,130,246,0.1)'
        },
        disabled: {
          backgroundColor: '#f3f4f6',
          cursor: 'not-allowed'
        }
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '变化', description: '内容变化时触发', actions: [] },
        { name: 'focus', label: '聚焦', description: '获得焦点时触发', actions: [] },
        { name: 'blur', label: '失焦', description: '失去焦点时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'placeholder', label: '占位符', type: 'string', defaultValue: '请输入...' },
      { name: 'type', label: '类型', type: 'select', defaultValue: 'text', options: [
        { label: '文本', value: 'text' },
        { label: '密码', value: 'password' },
        { label: '数字', value: 'number' },
        { label: '邮箱', value: 'email' }
      ]}
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 720, likes: 54, usage: 210 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_8',
    name: '开关',
    description: '开关切换组件',
    version: '1.0.0',
    author: '系统',
    icon: '🔛',
    category: 'interactive',
    tags: ['开关', '切换', '布尔'],
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
        hover: {},
        active: {},
        focus: {},
        disabled: {},
        checked: {
          backgroundColor: '#3b82f6'
        }
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '切换', description: '开关状态变化时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'checked', label: '默认开启', type: 'boolean', defaultValue: false },
      { name: 'label', label: '标签文字', type: 'string', defaultValue: '开关' }
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 680, likes: 52, usage: 195 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_9',
    name: '下拉选择',
    description: '下拉选择框',
    version: '1.0.0',
    author: '系统',
    icon: '📋',
    category: 'interactive',
    tags: ['选择', '下拉', '选项'],
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
        hover: {},
        active: {},
        focus: {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 3px rgba(59,130,246,0.1)'
        },
        disabled: {}
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '选择', description: '选项变化时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'placeholder', label: '占位符', type: 'string', defaultValue: '请选择...' },
      { name: 'options', label: '选项', type: 'string', defaultValue: '选项1,选项2,选项3' }
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 620, likes: 48, usage: 175 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_10',
    name: '复选框',
    description: '多选复选框',
    version: '1.0.0',
    author: '系统',
    icon: '☑️',
    category: 'interactive',
    tags: ['复选', '多选', '勾选'],
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
        hover: {},
        active: {},
        focus: {},
        disabled: {},
        checked: {
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6'
        }
      }
    },
    behavior: {
      events: [
        { name: 'change', label: '变化', description: '选中状态变化时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'label', label: '标签', type: 'string', defaultValue: '选项' },
      { name: 'checked', label: '默认选中', type: 'boolean', defaultValue: false }
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 580, likes: 45, usage: 160 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_11',
    name: '图片',
    description: '图片展示组件',
    version: '1.0.0',
    author: '系统',
    icon: '🖼️',
    category: 'media',
    tags: ['图片', '媒体', '照片'],
    visual: {
      base: {
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        objectFit: 'cover'
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
      events: [
        { name: 'click', label: '点击', description: '点击图片时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'src', label: '图片地址', type: 'string', defaultValue: '' },
      { name: 'alt', label: '替代文字', type: 'string', defaultValue: '图片' }
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 650, likes: 48, usage: 180 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_12',
    name: '列表',
    description: '数据列表展示',
    version: '1.0.0',
    author: '系统',
    icon: '📃',
    category: 'data',
    tags: ['列表', '数据', '项'],
    visual: {
      base: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
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
      events: [
        { name: 'itemClick', label: '点击项', description: '点击列表项时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'items', label: '列表项', type: 'string', defaultValue: '项目1,项目2,项目3' },
      { name: 'showIcon', label: '显示图标', type: 'boolean', defaultValue: true },
      { name: 'striped', label: '斑马纹', type: 'boolean', defaultValue: false }
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 540, likes: 42, usage: 145 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_13',
    name: '标签页',
    description: '标签切换组件',
    version: '1.0.0',
    author: '系统',
    icon: '📑',
    category: 'layout',
    tags: ['标签', '切换', '导航'],
    visual: {
      base: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
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
      events: [
        { name: 'tabChange', label: '切换标签', description: '切换标签时触发', actions: [] }
      ]
    },
    properties: [
      { name: 'tabs', label: '标签', type: 'string', defaultValue: '标签1,标签2,标签3' },
      { name: 'activeTab', label: '默认标签', type: 'string', defaultValue: '0' }
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 480, likes: 38, usage: 125 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_14',
    name: '进度条',
    description: '进度展示组件',
    version: '1.0.0',
    author: '系统',
    icon: '📈',
    category: 'data',
    tags: ['进度', '百分比', '条'],
    visual: {
      base: {
        width: '100%',
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
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
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 420, likes: 35, usage: 110 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_15',
    name: '徽标',
    description: '数字徽标标记',
    version: '1.0.0',
    author: '系统',
    icon: '🏷️',
    category: 'basic',
    tags: ['徽标', '数字', '标记'],
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
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 380, likes: 32, usage: 95 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'part_16',
    name: '分割线',
    description: '内容分隔线',
    version: '1.0.0',
    author: '系统',
    icon: '➖',
    category: 'layout',
    tags: ['分割', '线条', '分隔'],
    visual: {
      base: {
        width: '100%',
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '16px 0'
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
    properties: [
      { name: 'text', label: '文字', type: 'string', defaultValue: '' },
      { name: 'type', label: '类型', type: 'select', defaultValue: 'horizontal', options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' }
      ]}
    ],
    isBuiltin: true,
    isPublic: true,
    stats: { downloads: 320, likes: 28, usage: 80 },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
]

// 零件卡片组件
interface PartCardProps {
  part: ComponentPart
  viewMode: 'grid' | 'list'
  onEdit: (part: ComponentPart) => void
  onDuplicate: (part: ComponentPart) => void
  onDelete: (part: ComponentPart) => void
  onUse: (part: ComponentPart) => void
}

function PartCard({ part, viewMode, onEdit, onDuplicate, onDelete, onUse }: PartCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const category = PART_CATEGORIES.find(c => c.id === part.category)

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-2xl">
          {part.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{part.name}</h3>
            {part.isBuiltin && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                内置
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{part.description}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Box className="w-3 h-3" />
              {category?.name}
            </span>
            <span>v{part.version}</span>
            <span>by {part.author}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {part.stats.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {part.stats.likes}
          </span>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onUse(part)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            使用
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <button
                      onClick={() => { onEdit(part); setShowMenu(false) }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => { onDuplicate(part); setShowMenu(false) }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      复制
                    </button>
                    <button
                      onClick={() => { onDelete(part); setShowMenu(false) }}
                      className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden"
    >
      {/* 预览区 */}
      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
        <div
          className="px-6 py-3 rounded-lg text-center transition-all"
          style={{
            background: part.visual.states.default.backgroundGradient
              ? `linear-gradient(135deg, ${part.visual.states.default.backgroundGradient.from}, ${part.visual.states.default.backgroundGradient.to})`
              : part.visual.base.backgroundColor,
            color: part.visual.base.color,
            borderRadius: part.visual.base.borderRadius,
            boxShadow: part.visual.base.boxShadow
          }}
        >
          <div className="text-2xl mb-1">{part.icon}</div>
          <div className="text-sm font-medium">{part.name}</div>
        </div>

        {/* 悬停操作 */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onUse(part)}
            className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            使用
          </button>
          <button
            onClick={() => onEdit(part)}
            className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 信息区 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-medium text-gray-900">{part.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{part.description}</p>
          </div>
          {part.isBuiltin && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              内置
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Box className="w-3 h-3" />
            {category?.name}
          </span>
          <span>•</span>
          <span>v{part.version}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {part.stats.downloads}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {part.stats.likes}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <button
                      onClick={() => { onEdit(part); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => { onDuplicate(part); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      复制
                    </button>
                    <button
                      onClick={() => { onDelete(part); setShowMenu(false) }}
                      className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 主组件
export default function PartWorkshop() {
  const { showToast } = useToast()
  const [parts, setParts] = useState<ComponentPart[]>(SAMPLE_PARTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'name'>('newest')
  const [editingPart, setEditingPart] = useState<ComponentPart | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // 过滤和排序零件
  const filteredParts = useMemo(() => {
    let result = [...parts]

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(part =>
        part.name.toLowerCase().includes(query) ||
        part.description?.toLowerCase().includes(query) ||
        part.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      result = result.filter(part => part.category === selectedCategory)
    }

    // 排序
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
      case 'popular':
        result.sort((a, b) => b.stats.downloads - a.stats.downloads)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [parts, searchQuery, selectedCategory, sortBy])

  // 创建新零件
  const handleCreate = useCallback(() => {
    setIsCreating(true)
    setEditingPart(null)
  }, [])

  // 编辑零件
  const handleEdit = useCallback((part: ComponentPart) => {
    setEditingPart(part)
    setIsCreating(false)
  }, [])

  // 保存零件
  const handleSave = useCallback((part: ComponentPart) => {
    setParts(prev => {
      const index = prev.findIndex(p => p.id === part.id)
      if (index >= 0) {
        // 更新现有零件
        const newParts = [...prev]
        newParts[index] = part
        return newParts
      } else {
        // 添加新零件
        return [...prev, part]
      }
    })
    setEditingPart(null)
    setIsCreating(false)
    showToast('success', '零件保存成功')
  }, [showToast])

  // 复制零件
  const handleDuplicate = useCallback((part: ComponentPart) => {
    const newPart: ComponentPart = {
      ...part,
      id: `part_${Date.now()}`,
      name: `${part.name} (复制)`,
      isBuiltin: false,
      stats: { downloads: 0, likes: 0, usage: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setParts(prev => [...prev, newPart])
    showToast('success', '零件复制成功')
  }, [showToast])

  // 删除零件
  const handleDelete = useCallback((part: ComponentPart) => {
    if (confirm(`确定要删除零件 "${part.name}" 吗？`)) {
      setParts(prev => prev.filter(p => p.id !== part.id))
      showToast('success', '零件删除成功')
    }
  }, [showToast])

  // 使用零件
  const handleUse = useCallback((part: ComponentPart) => {
    showToast('info', `零件 "${part.name}" 已添加到构建器`)
    // 这里可以触发构建器打开并添加该零件
  }, [showToast])

  // 取消编辑
  const handleCancel = useCallback(() => {
    setEditingPart(null)
    setIsCreating(false)
  }, [])

  // 显示编辑器
  if (editingPart || isCreating) {
    return (
      <PartEditor
        initialPart={editingPart || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部工具栏 */}
      <div className="flex flex-col gap-4 p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Hammer className="w-6 h-6 text-blue-600" />
              零件工坊
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              像我的世界一样，创造属于你的零件
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建新零件
          </button>
        </div>

        {/* 过滤和搜索 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索零件..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部分类</option>
            {PART_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">最新更新</option>
            <option value="popular">最受欢迎</option>
            <option value="name">名称排序</option>
          </select>

          {/* 视图切换 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 分类快捷标签 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            全部
          </button>
          {PART_CATEGORIES.map(cat => {
            const Icon = cat.icon === 'Box' ? Box :
                        cat.icon === 'Layout' ? Layout :
                        cat.icon === 'Database' ? Database :
                        cat.icon === 'MousePointer' ? MousePointer :
                        cat.icon === 'Image' ? ImageIcon :
                        cat.icon === 'Sparkles' ? Sparkles : Box
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  selectedCategory === cat.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* 零件列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Box className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">没有找到零件</p>
            <p className="text-sm">尝试调整搜索条件或创建新零件</p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3'
          )}>
            <AnimatePresence>
              {filteredParts.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  viewMode={viewMode}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onUse={handleUse}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>共 {parts.length} 个零件</span>
          <span>•</span>
          <span>内置 {parts.filter(p => p.isBuiltin).length} 个</span>
          <span>•</span>
          <span>自定义 {parts.filter(p => !p.isBuiltin).length} 个</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
            <Upload className="w-4 h-4" />
            导入零件
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            导出全部
          </button>
        </div>
      </div>
    </div>
  )
}
