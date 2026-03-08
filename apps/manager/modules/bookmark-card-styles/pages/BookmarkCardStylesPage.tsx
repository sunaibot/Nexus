import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  Globe,
  Users,
  Shield,
  Save,
  RotateCcw,
  Eye,
  Layout,
  Type,
  Palette,
  MousePointer,
  Image,
  Tag,
  X,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useToast } from '../../../components/admin/Toast'
import {
  fetchBookmarkCardStyles,
  createBookmarkCardStyle,
  updateBookmarkCardStyle,
  deleteBookmarkCardStyle,
  setDefaultBookmarkCardStyle,
  type BookmarkCardStyle,
  type CreateBookmarkCardStyleData,
} from '../../../lib/api-client'

const SCOPE_OPTIONS = [
  { value: 'global', label: '全局', icon: Globe, color: 'blue', desc: '所有用户生效' },
  { value: 'role', label: '角色', icon: Shield, color: 'purple', desc: '指定角色生效' },
  { value: 'user', label: '用户', icon: Users, color: 'green', desc: '指定用户生效' },
]

const PRESETS = [
  {
    id: 'glassmorphism',
    name: '玻璃拟态',
    description: '现代毛玻璃效果，适合深色背景',
    icon: Sparkles,
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      backdropBlur: '12px',
      backdropSaturate: '180%',
      shadowColor: 'rgba(0, 0, 0, 0.2)',
    }
  },
  {
    id: 'minimal',
    name: '极简卡片',
    description: '简洁干净的设计风格',
    icon: Layout,
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backdropBlur: '0px',
      backdropSaturate: '100%',
      shadowColor: 'rgba(0, 0, 0, 0.05)',
    }
  },
  {
    id: 'dark',
    name: '深色优雅',
    description: '深色主题，适合夜间模式',
    icon: Monitor,
    style: {
      backgroundColor: 'rgba(30, 30, 40, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      backdropBlur: '8px',
      backdropSaturate: '150%',
      shadowColor: 'rgba(0, 0, 0, 0.4)',
    }
  },
  {
    id: 'gradient',
    name: '渐变炫彩',
    description: '活泼的渐变背景效果',
    icon: Palette,
    style: {
      backgroundColor: 'transparent',
      backgroundGradient: { from: 'rgba(99, 102, 241, 0.2)', to: 'rgba(168, 85, 247, 0.2)', angle: 135 },
      borderColor: 'rgba(255, 255, 255, 0.15)',
      backdropBlur: '0px',
      shadowColor: 'rgba(99, 102, 241, 0.3)',
    }
  },
  {
    id: 'soft',
    name: '柔和阴影',
    description: '柔和的阴影效果，增加层次感',
    icon: Tablet,
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      backdropBlur: '4px',
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowBlur: '20px',
      shadowY: '8px',
    }
  },
  {
    id: 'bordered',
    name: '边框强调',
    description: '醒目的边框设计',
    icon: Smartphone,
    style: {
      backgroundColor: 'transparent',
      borderColor: 'rgba(99, 102, 241, 0.5)',
      borderWidth: '2px',
      backdropBlur: '0px',
      shadowColor: 'rgba(99, 102, 241, 0.2)',
    }
  },
  {
    id: 'circular',
    name: '圆形图标',
    description: '圆形卡片样式，图标居中',
    icon: Image,
    style: {
      isCircular: true,
      circleSize: '80px',
      circleBackgroundColor: 'rgba(99, 102, 241, 0.2)',
      circleBorderWidth: '2px',
      circleBorderColor: 'rgba(99, 102, 241, 0.4)',
      layoutType: 'icon-top',
      iconPosition: 'center',
      showTitle: true,
      showDescription: true,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0px',
      padding: '16px',
    }
  },
  {
    id: 'circular-gradient',
    name: '圆形渐变',
    description: '渐变背景的圆形图标样式',
    icon: Image,
    style: {
      isCircular: true,
      circleSize: '90px',
      circleBackgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      circleBorderWidth: '3px',
      circleBorderColor: 'rgba(255, 255, 255, 0.3)',
      layoutType: 'icon-top',
      iconPosition: 'center',
      showTitle: true,
      showDescription: false,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0px',
      padding: '20px',
      titleFontSize: '14px',
      titleFontWeight: '500',
    }
  },
  {
    id: 'circular-glass',
    name: '圆形玻璃',
    description: '毛玻璃效果的圆形图标',
    icon: Image,
    style: {
      isCircular: true,
      circleSize: '85px',
      circleBackgroundColor: 'rgba(255, 255, 255, 0.15)',
      circleBorderWidth: '1px',
      circleBorderColor: 'rgba(255, 255, 255, 0.25)',
      layoutType: 'icon-top',
      iconPosition: 'center',
      showTitle: true,
      showDescription: false,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0px',
      padding: '16px',
      backdropBlur: '10px',
      titleFontSize: '13px',
      titleFontWeight: '500',
    }
  },
  {
    id: 'circular-minimal',
    name: '圆形极简',
    description: '简约线条圆形图标',
    icon: Image,
    style: {
      isCircular: true,
      circleSize: '70px',
      circleBackgroundColor: 'transparent',
      circleBorderWidth: '2px',
      circleBorderColor: 'rgba(156, 163, 175, 0.5)',
      layoutType: 'icon-top',
      iconPosition: 'center',
      showTitle: true,
      showDescription: false,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0px',
      padding: '12px',
      titleFontSize: '13px',
      titleFontWeight: '400',
      titleColor: 'rgba(255, 255, 255, 0.8)',
    }
  },
  {
    id: 'circular-neon',
    name: '圆形霓虹',
    description: '发光效果的圆形图标',
    icon: Image,
    style: {
      isCircular: true,
      circleSize: '85px',
      circleBackgroundColor: 'rgba(59, 130, 246, 0.2)',
      circleBorderWidth: '2px',
      circleBorderColor: '#3b82f6',
      layoutType: 'icon-top',
      iconPosition: 'center',
      showTitle: true,
      showDescription: false,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0px',
      padding: '20px',
      shadowColor: 'rgba(59, 130, 246, 0.5)',
      shadowBlur: '20px',
      titleFontSize: '14px',
      titleFontWeight: '600',
      titleColor: '#60a5fa',
    }
  },
  {
    id: 'circular-dark',
    name: '圆形暗色',
    description: '深色背景的圆形图标',
    icon: Image,
    style: {
      isCircular: true,
      circleSize: '80px',
      circleBackgroundColor: 'rgba(30, 30, 40, 0.8)',
      circleBorderWidth: '2px',
      circleBorderColor: 'rgba(255, 255, 255, 0.1)',
      layoutType: 'icon-top',
      iconPosition: 'center',
      showTitle: true,
      showDescription: false,
      textAlign: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0px',
      padding: '16px',
      titleFontSize: '13px',
      titleFontWeight: '500',
      titleColor: '#e5e7eb',
    }
  },
  {
    id: 'icon-bg',
    name: '图标背景',
    description: '图标作为背景，文字浮于其上',
    icon: Palette,
    style: {
      iconPosition: 'background',
      iconOpacity: 0.15,
      layoutType: 'standard',
      showTitle: true,
      showDescription: true,
      textAlign: 'left',
      backgroundColor: 'rgba(30, 30, 40, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: '24px',
    }
  },
]

const DEFAULT_STYLE: CreateBookmarkCardStyleData = {
  name: '新样式',
  description: '',
  scope: 'global',
  priority: 0,
  isDefault: false,
  isEnabled: true,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  borderWidth: '1px',
  borderColor: 'rgba(255, 255, 255, 0.15)',
  borderStyle: 'solid',
  shadowColor: 'rgba(0, 0, 0, 0.15)',
  shadowBlur: '12px',
  shadowSpread: '0px',
  shadowX: '0px',
  shadowY: '4px',
  padding: '20px',
  margin: '8px',
  gap: '12px',
  // 尺寸
  width: undefined,
  height: undefined,
  minWidth: undefined,
  minHeight: undefined,
  maxWidth: undefined,
  maxHeight: undefined,
  titleFontSize: '16px',
  titleFontWeight: '600',
  titleColor: 'inherit',
  descriptionFontSize: '14px',
  descriptionFontWeight: '400',
  descriptionColor: 'inherit',
  opacity: 1,
  backdropBlur: '10px',
  backdropSaturate: '180%',
  hoverScale: 1.02,
  hoverTransition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  iconSize: '24px',
  iconBorderRadius: '10px',
  iconOpacity: 1,
  // 圆形卡片
  isCircular: false,
  circleSize: '80px',
  circleBackgroundColor: 'rgba(255, 255, 255, 0.1)',
  circleBorderWidth: '0px',
  circleBorderColor: 'rgba(255, 255, 255, 0.2)',
  circleIconPosition: 'center',
  // 布局
  layoutType: 'standard',
  iconPosition: 'left',
  showTitle: true,
  showDescription: true,
  textAlign: 'left',
  imageHeight: '120px',
  imageBorderRadius: '12px',
  imageObjectFit: 'cover',
  tagBackgroundColor: 'rgba(255, 255, 255, 0.1)',
  tagBorderRadius: '6px',
  tagFontSize: '12px',
}

// 样式编辑器弹窗组件
function StyleEditorModal({
  isOpen,
  onClose,
  editingStyle,
  onSave,
  presets,
}: {
  isOpen: boolean
  onClose: () => void
  editingStyle: BookmarkCardStyle | null
  onSave: (data: CreateBookmarkCardStyleData) => Promise<void>
  presets: BookmarkCardStyle[]
}) {
  const [formData, setFormData] = useState<CreateBookmarkCardStyleData>(DEFAULT_STYLE)
  const [activeTab, setActiveTab] = useState<'basic' | 'layout' | 'typography' | 'effects' | 'hover'>('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [previewHover, setPreviewHover] = useState(false)

  useEffect(() => {
    if (editingStyle) {
      setFormData({
        name: editingStyle.name || '',
        description: editingStyle.description || '',
        scope: editingStyle.scope,
        userId: editingStyle.userId,
        role: editingStyle.role,
        priority: editingStyle.priority,
        isDefault: editingStyle.isDefault,
        isEnabled: editingStyle.isEnabled,
        backgroundColor: editingStyle.backgroundColor,
        backgroundGradient: editingStyle.backgroundGradient,
        borderRadius: editingStyle.borderRadius,
        borderWidth: editingStyle.borderWidth,
        borderColor: editingStyle.borderColor,
        borderStyle: editingStyle.borderStyle,
        shadowColor: editingStyle.shadowColor,
        shadowBlur: editingStyle.shadowBlur,
        shadowSpread: editingStyle.shadowSpread,
        shadowX: editingStyle.shadowX,
        shadowY: editingStyle.shadowY,
        padding: editingStyle.padding,
        margin: editingStyle.margin,
        gap: editingStyle.gap,
        // 尺寸
        width: editingStyle.width,
        height: editingStyle.height,
        minWidth: editingStyle.minWidth,
        minHeight: editingStyle.minHeight,
        maxWidth: editingStyle.maxWidth,
        maxHeight: editingStyle.maxHeight,
        titleFontSize: editingStyle.titleFontSize,
        titleFontWeight: editingStyle.titleFontWeight,
        titleColor: editingStyle.titleColor,
        descriptionFontSize: editingStyle.descriptionFontSize,
        descriptionFontWeight: editingStyle.descriptionFontWeight,
        descriptionColor: editingStyle.descriptionColor,
        opacity: editingStyle.opacity,
        backdropBlur: editingStyle.backdropBlur,
        backdropSaturate: editingStyle.backdropSaturate,
        hoverBackgroundColor: editingStyle.hoverBackgroundColor,
        hoverBorderColor: editingStyle.hoverBorderColor,
        hoverShadowBlur: editingStyle.hoverShadowBlur,
        hoverScale: editingStyle.hoverScale,
        hoverTransition: editingStyle.hoverTransition,
        iconSize: editingStyle.iconSize,
        iconColor: editingStyle.iconColor,
        iconBackgroundColor: editingStyle.iconBackgroundColor,
        iconBorderRadius: editingStyle.iconBorderRadius,
        iconOpacity: editingStyle.iconOpacity,
        isCircular: editingStyle.isCircular,
        circleSize: editingStyle.circleSize,
        circleBackgroundColor: editingStyle.circleBackgroundColor,
        circleBorderWidth: editingStyle.circleBorderWidth,
        circleBorderColor: editingStyle.circleBorderColor,
        layoutType: editingStyle.layoutType,
        iconPosition: editingStyle.iconPosition,
        showTitle: editingStyle.showTitle,
        showDescription: editingStyle.showDescription,
        textAlign: editingStyle.textAlign,
        imageHeight: editingStyle.imageHeight,
        imageBorderRadius: editingStyle.imageBorderRadius,
        imageObjectFit: editingStyle.imageObjectFit,
        tagBackgroundColor: editingStyle.tagBackgroundColor,
        tagTextColor: editingStyle.tagTextColor,
        tagBorderRadius: editingStyle.tagBorderRadius,
        tagFontSize: editingStyle.tagFontSize,
      })
    } else {
      setFormData(DEFAULT_STYLE)
    }
  }, [editingStyle, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const updateFormField = (field: keyof CreateBookmarkCardStyleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return

    const existingPreset = presets.find(p => p.id === `preset-${presetId}`)
    if (existingPreset) {
      setFormData(prev => ({
        ...prev,
        name: existingPreset.name || preset.name,
        description: existingPreset.description || preset.description,
        backgroundColor: existingPreset.backgroundColor,
        backgroundGradient: existingPreset.backgroundGradient,
        borderColor: existingPreset.borderColor,
        borderWidth: existingPreset.borderWidth,
        backdropBlur: existingPreset.backdropBlur,
        backdropSaturate: existingPreset.backdropSaturate,
        shadowColor: existingPreset.shadowColor,
        shadowBlur: existingPreset.shadowBlur,
        shadowY: existingPreset.shadowY,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        name: preset.name,
        description: preset.description,
        ...preset.style,
        layoutType: ((preset.style as any).layoutType as CreateBookmarkCardStyleData['layoutType']) || prev.layoutType,
        iconPosition: ((preset.style as any).iconPosition as CreateBookmarkCardStyleData['iconPosition']) || prev.iconPosition,
        textAlign: ((preset.style as any).textAlign as CreateBookmarkCardStyleData['textAlign']) || prev.textAlign,
      }))
    }
  }

  const tabs = [
    { id: 'basic', label: '基础', icon: Layout },
    { id: 'layout', label: '布局', icon: Image },
    { id: 'typography', label: '字体', icon: Type },
    { id: 'effects', label: '效果', icon: Palette },
    { id: 'hover', label: '悬停', icon: MousePointer },
  ]

  const cardStyle: React.CSSProperties = {
    background: formData.backgroundGradient
      ? `linear-gradient(${formData.backgroundGradient.angle}deg, ${formData.backgroundGradient.from}, ${formData.backgroundGradient.to})`
      : formData.backgroundColor,
    borderRadius: formData.borderRadius,
    borderWidth: formData.borderWidth,
    borderStyle: formData.borderStyle,
    borderColor: formData.borderColor,
    boxShadow: `${formData.shadowX} ${formData.shadowY} ${formData.shadowBlur} ${formData.shadowSpread} ${formData.shadowColor}`,
    padding: formData.padding,
    opacity: formData.opacity,
    backdropFilter: formData.backdropBlur !== '0px' ? `blur(${formData.backdropBlur}) saturate(${formData.backdropSaturate})` : undefined,
    transform: previewHover ? `scale(${formData.hoverScale})` : undefined,
    transition: formData.hoverTransition,
    // 尺寸
    width: formData.width,
    height: formData.height,
    minWidth: formData.minWidth,
    minHeight: formData.minHeight,
    maxWidth: formData.maxWidth,
    maxHeight: formData.maxHeight,
  }

  const hoverCardStyle: React.CSSProperties = previewHover ? {
    background: formData.hoverBackgroundColor || cardStyle.background,
    borderColor: formData.hoverBorderColor || formData.borderColor,
    boxShadow: formData.hoverShadowBlur
      ? `${formData.shadowX} ${formData.shadowY} ${formData.hoverShadowBlur} ${formData.shadowSpread} ${formData.shadowColor}`
      : cardStyle.boxShadow,
  } : {}

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: 'var(--color-bg-primary, #1a1a2e)',
            border: '1px solid var(--color-glass-border, rgba(255,255,255,0.1))',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-glass, rgba(255,255,255,0.05))' }}>
                <Palette className="w-5 h-5" style={{ color: 'var(--color-primary, #6366f1)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {editingStyle ? '编辑样式' : '新建样式'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
                  自定义书签卡片的视觉风格
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* 左侧编辑区 */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* 预设选择 */}
                {!editingStyle && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">选择预设样式</label>
                    <div className="grid grid-cols-3 gap-3">
                      {PRESETS.map((preset) => {
                        const Icon = preset.icon
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset.id)}
                            className="group p-4 rounded-xl border transition-all text-left hover:border-blue-500/50 hover:bg-blue-500/5"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                          >
                            <div className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center transition-colors group-hover:bg-blue-500/10"
                              style={{ background: 'var(--color-glass, rgba(255,255,255,0.05))' }}>
                              <Icon className="w-5 h-5" style={{ color: 'var(--color-primary, #6366f1)' }} />
                            </div>
                            <div className="font-medium text-sm mb-1">{preset.name}</div>
                            <div className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
                              {preset.description}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">样式名称</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">应用范围</label>
                    <select
                      value={formData.scope}
                      onChange={(e) => updateFormField('scope', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                    >
                      {SCOPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">优先级</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => updateFormField('priority', parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                    />
                  </div>
                </div>

                {/* 标签页 */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-glass, rgba(255,255,255,0.03))' }}>
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          activeTab === tab.id
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'hover:bg-white/5'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                {/* 标签页内容 */}
                <div className="space-y-4">
                  {activeTab === 'basic' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>背景颜色</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.backgroundColor?.startsWith('#') ? formData.backgroundColor : '#000000'}
                              onChange={(e) => updateFormField('backgroundColor', e.target.value)}
                              className="w-10 h-10 rounded-lg border cursor-pointer"
                              style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            />
                            <input
                              type="text"
                              value={formData.backgroundColor}
                              onChange={(e) => updateFormField('backgroundColor', e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-sm"
                              style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                              placeholder="rgba(255,255,255,0.1)"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>圆角</label>
                          <input
                            type="text"
                            value={formData.borderRadius}
                            onChange={(e) => updateFormField('borderRadius', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="16px"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>边框宽度</label>
                          <input
                            type="text"
                            value={formData.borderWidth}
                            onChange={(e) => updateFormField('borderWidth', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="1px"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>边框颜色</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.borderColor?.startsWith('#') ? formData.borderColor : '#ffffff'}
                              onChange={(e) => updateFormField('borderColor', e.target.value)}
                              className="w-10 h-10 rounded-lg border cursor-pointer"
                              style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            />
                            <input
                              type="text"
                              value={formData.borderColor}
                              onChange={(e) => updateFormField('borderColor', e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-sm"
                              style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                              placeholder="rgba(255,255,255,0.15)"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>内边距</label>
                          <input
                            type="text"
                            value={formData.padding}
                            onChange={(e) => updateFormField('padding', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="20px"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>外边距</label>
                          <input
                            type="text"
                            value={formData.margin}
                            onChange={(e) => updateFormField('margin', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="8px"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>卡片间距</label>
                          <input
                            type="text"
                            value={formData.gap}
                            onChange={(e) => updateFormField('gap', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="12px"
                          />
                        </div>
                      </div>

                      {/* 卡片尺寸 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>卡片宽度</label>
                          <input
                            type="text"
                            value={formData.width || ''}
                            onChange={(e) => updateFormField('width', e.target.value || undefined)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="auto"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>卡片高度</label>
                          <input
                            type="text"
                            value={formData.height || ''}
                            onChange={(e) => updateFormField('height', e.target.value || undefined)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="auto"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>最小宽度</label>
                          <input
                            type="text"
                            value={formData.minWidth || ''}
                            onChange={(e) => updateFormField('minWidth', e.target.value || undefined)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="200px"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'layout' && (
                    <div className="space-y-6">
                      {/* 布局类型 */}
                      <div>
                        <label className="block text-sm font-medium mb-3">布局类型</label>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { id: 'standard', label: '标准', icon: Layout },
                            { id: 'icon-top', label: '图标在上', icon: Image },
                            { id: 'icon-bottom', label: '图标在下', icon: Image },
                            { id: 'icon-bg', label: '图标背景', icon: Palette },
                          ].map((layout) => {
                            const Icon = layout.icon
                            return (
                              <button
                                key={layout.id}
                                type="button"
                                onClick={() => updateFormField('layoutType', layout.id)}
                                className={cn(
                                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                                  formData.layoutType === layout.id
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-white/10 hover:border-white/20'
                                )}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs">{layout.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* 图标位置 */}
                      <div>
                        <label className="block text-sm font-medium mb-3">图标位置</label>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            { id: 'left', label: '左侧' },
                            { id: 'right', label: '右侧' },
                            { id: 'top', label: '顶部' },
                            { id: 'bottom', label: '底部' },
                            { id: 'center', label: '居中' },
                            { id: 'background', label: '背景' },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => updateFormField('iconPosition', pos.id)}
                              className={cn(
                                'px-3 py-2 rounded-lg text-sm transition-all',
                                formData.iconPosition === pos.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/5 hover:bg-white/10'
                              )}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 显示选项 */}
                      <div>
                        <label className="block text-sm font-medium mb-3">显示选项</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.showTitle}
                              onChange={(e) => updateFormField('showTitle', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm">显示标题</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.showDescription}
                              onChange={(e) => updateFormField('showDescription', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm">显示描述</span>
                          </label>
                        </div>
                      </div>

                      {/* 文字对齐 */}
                      <div>
                        <label className="block text-sm font-medium mb-3">文字对齐</label>
                        <div className="flex gap-2">
                          {['left', 'center', 'right'].map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateFormField('textAlign', align)}
                              className={cn(
                                'px-4 py-2 rounded-lg text-sm capitalize transition-all',
                                formData.textAlign === align
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/5 hover:bg-white/10'
                              )}
                            >
                              {align === 'left' ? '左对齐' : align === 'center' ? '居中' : '右对齐'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 圆形卡片选项 */}
                      <div className="pt-4 border-t border-white/10">
                        <label className="flex items-center gap-3 cursor-pointer mb-4">
                          <input
                            type="checkbox"
                            checked={formData.isCircular}
                            onChange={(e) => updateFormField('isCircular', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">启用圆形卡片</span>
                        </label>

                        {formData.isCircular && (
                          <div className="grid grid-cols-2 gap-4 pl-8">
                            <div>
                              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>圆形大小</label>
                              <input
                                type="text"
                                value={formData.circleSize}
                                onChange={(e) => updateFormField('circleSize', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                                style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                                placeholder="80px"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>圆形背景色</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={formData.circleBackgroundColor?.startsWith('#') ? formData.circleBackgroundColor : '#6366f1'}
                                  onChange={(e) => updateFormField('circleBackgroundColor', e.target.value)}
                                  className="w-10 h-10 rounded-lg border cursor-pointer"
                                  style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                                />
                                <input
                                  type="text"
                                  value={formData.circleBackgroundColor}
                                  onChange={(e) => updateFormField('circleBackgroundColor', e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-sm"
                                  style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                                  placeholder="rgba(255,255,255,0.1)"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>边框宽度</label>
                              <input
                                type="text"
                                value={formData.circleBorderWidth}
                                onChange={(e) => updateFormField('circleBorderWidth', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                                style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                                placeholder="0px"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>图标位置</label>
                              <select
                                value={formData.circleIconPosition || 'center'}
                                onChange={(e) => updateFormField('circleIconPosition', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                                style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                              >
                                <option value="center">居中</option>
                                <option value="top">顶部对齐</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>边框颜色</label>
                              <input
                                type="text"
                                value={formData.circleBorderColor}
                                onChange={(e) => updateFormField('circleBorderColor', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                                style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                                placeholder="rgba(255,255,255,0.2)"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 图标透明度 */}
                      <div>
                        <label className="block text-sm font-medium mb-3">图标透明度</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            value={formData.iconOpacity}
                            onChange={(e) => updateFormField('iconOpacity', parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm w-12 text-right">{Math.round(formData.iconOpacity * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'typography' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>标题字号</label>
                        <input
                          type="text"
                          value={formData.titleFontSize}
                          onChange={(e) => updateFormField('titleFontSize', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                          style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                          placeholder="16px"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>标题字重</label>
                        <select
                          value={formData.titleFontWeight}
                          onChange={(e) => updateFormField('titleFontWeight', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                          style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                        >
                          <option value="400">正常 (400)</option>
                          <option value="500">中等 (500)</option>
                          <option value="600">半粗 (600)</option>
                          <option value="700">粗体 (700)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>描述字号</label>
                        <input
                          type="text"
                          value={formData.descriptionFontSize}
                          onChange={(e) => updateFormField('descriptionFontSize', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                          style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                          placeholder="14px"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>描述字重</label>
                        <select
                          value={formData.descriptionFontWeight}
                          onChange={(e) => updateFormField('descriptionFontWeight', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                          style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                        >
                          <option value="400">正常 (400)</option>
                          <option value="500">中等 (500)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'effects' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>背景模糊</label>
                          <input
                            type="text"
                            value={formData.backdropBlur}
                            onChange={(e) => updateFormField('backdropBlur', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="10px"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>饱和度</label>
                          <input
                            type="text"
                            value={formData.backdropSaturate}
                            onChange={(e) => updateFormField('backdropSaturate', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="180%"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>阴影颜色</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.shadowColor?.startsWith('#') ? formData.shadowColor : '#000000'}
                              onChange={(e) => updateFormField('shadowColor', e.target.value)}
                              className="w-10 h-10 rounded-lg border cursor-pointer"
                              style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            />
                            <input
                              type="text"
                              value={formData.shadowColor}
                              onChange={(e) => updateFormField('shadowColor', e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border bg-transparent text-sm"
                              style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                              placeholder="rgba(0,0,0,0.15)"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>阴影模糊</label>
                          <input
                            type="text"
                            value={formData.shadowBlur}
                            onChange={(e) => updateFormField('shadowBlur', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="12px"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>不透明度</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            value={formData.opacity}
                            onChange={(e) => updateFormField('opacity', parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm w-12 text-right">{Math.round(formData.opacity * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'hover' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>悬停缩放</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={1}
                              max={1.1}
                              step={0.01}
                              value={formData.hoverScale}
                              onChange={(e) => updateFormField('hoverScale', parseFloat(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{formData.hoverScale}x</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>过渡动画</label>
                          <input
                            type="text"
                            value={formData.hoverTransition}
                            onChange={(e) => updateFormField('hoverTransition', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="all 0.3s ease"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>悬停背景色</label>
                          <input
                            type="text"
                            value={formData.hoverBackgroundColor || ''}
                            onChange={(e) => updateFormField('hoverBackgroundColor', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="留空则保持不变"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>悬停边框色</label>
                          <input
                            type="text"
                            value={formData.hoverBorderColor || ''}
                            onChange={(e) => updateFormField('hoverBorderColor', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm"
                            style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}
                            placeholder="留空则保持不变"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-white/5"
                    style={{ color: 'var(--color-text-secondary, #9ca3af)' }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存样式
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 右侧预览区 */}
            <div className="w-80 border-l p-6 flex flex-col" style={{ borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))', background: 'var(--color-bg-secondary, rgba(0,0,0,0.2))' }}>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted, #6b7280)' }} />
                <span className="text-sm font-medium">实时预览</span>
              </div>

              {/* 预览卡片容器 */}
              <div
                className="flex-1 rounded-2xl p-6 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                }}
              >
                <motion.div
                  className="w-full cursor-pointer"
                  style={{
                    ...cardStyle,
                    ...hoverCardStyle,
                    display: 'flex',
                    flexDirection: formData.layoutType === 'icon-top' ? 'column' : formData.layoutType === 'icon-bottom' ? 'column-reverse' : 'row',
                    alignItems: formData.isCircular || formData.layoutType === 'icon-top' || formData.layoutType === 'icon-bottom' ? 'center' : 'flex-start',
                    textAlign: formData.textAlign as any,
                    gap: formData.gap,
                  }}
                  onMouseEnter={() => setPreviewHover(true)}
                  onMouseLeave={() => setPreviewHover(false)}
                  whileHover={{ scale: formData.hoverScale }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {/* 圆形图标 */}
                  {formData.isCircular ? (
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: formData.circleSize,
                        height: formData.circleSize,
                        borderRadius: '50%',
                        background: formData.circleBackgroundColor || 'rgba(99, 102, 241, 0.2)',
                        border: `${formData.circleBorderWidth} solid ${formData.circleBorderColor || 'transparent'}`,
                        opacity: formData.iconOpacity,
                      }}
                    >
                      <Layout className="w-6 h-6" style={{ color: formData.iconColor || 'var(--color-primary, #6366f1)' }} />
                    </div>
                  ) : formData.iconPosition === 'background' ? (
                    /* 图标背景模式 */
                    <div className="relative w-full">
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-20"
                        style={{ opacity: formData.iconOpacity * 0.2 }}
                      >
                        <Layout className="w-20 h-20" style={{ color: formData.iconColor || 'var(--color-primary, #6366f1)' }} />
                      </div>
                      <div className="relative z-10">
                        {formData.showTitle && (
                          <span
                            className="block truncate mb-2"
                            style={{
                              fontSize: formData.titleFontSize,
                              fontWeight: formData.titleFontWeight,
                              color: formData.titleColor === 'inherit' ? 'var(--color-text-primary, #fff)' : formData.titleColor,
                            }}
                          >
                            书签标题
                          </span>
                        )}
                        {formData.showDescription && (
                          <p
                            className="line-clamp-2"
                            style={{
                              fontSize: formData.descriptionFontSize,
                              fontWeight: formData.descriptionFontWeight,
                              color: formData.descriptionColor === 'inherit' ? 'var(--color-text-secondary, #9ca3af)' : formData.descriptionColor,
                            }}
                          >
                            这是书签的描述文本，用于展示样式效果
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 普通图标 */
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: formData.iconSize,
                        height: formData.iconSize,
                        borderRadius: formData.iconBorderRadius,
                        background: formData.iconBackgroundColor || 'rgba(99, 102, 241, 0.2)',
                        opacity: formData.iconOpacity,
                      }}
                    >
                      <Layout className="w-5 h-5" style={{ color: formData.iconColor || 'var(--color-primary, #6366f1)' }} />
                    </div>
                  )}

                  {/* 内容区域 */}
                  {formData.iconPosition !== 'background' && (
                    <div className="flex-1 min-w-0">
                      {formData.showTitle && (
                        <span
                          className="block truncate mb-1"
                          style={{
                            fontSize: formData.titleFontSize,
                            fontWeight: formData.titleFontWeight,
                            color: formData.titleColor === 'inherit' ? 'var(--color-text-primary, #fff)' : formData.titleColor,
                          }}
                        >
                          书签标题
                        </span>
                      )}
                      {formData.showDescription && (
                        <p
                          className="line-clamp-2"
                          style={{
                            fontSize: formData.descriptionFontSize,
                            fontWeight: formData.descriptionFontWeight,
                            color: formData.descriptionColor === 'inherit' ? 'var(--color-text-secondary, #9ca3af)' : formData.descriptionColor,
                          }}
                        >
                          这是书签的描述文本，用于展示样式效果
                        </p>
                      )}
                    </div>
                  )}

                  {/* 预览标签 */}
                  {formData.showTitle && (
                    <div className="flex gap-2 mt-2">
                      <span
                        className="px-2 py-1 text-xs"
                        style={{
                          background: formData.tagBackgroundColor,
                          borderRadius: formData.tagBorderRadius,
                          fontSize: formData.tagFontSize,
                        }}
                      >
                        标签
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* 预览提示 */}
              <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
                悬停在卡片上查看交互效果
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function BookmarkCardStylesPage() {
  const { showToast } = useToast()
  const [styles, setStyles] = useState<BookmarkCardStyle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingStyle, setEditingStyle] = useState<BookmarkCardStyle | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadStyles = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchBookmarkCardStyles()
      setStyles(data)
    } catch (err: any) {
      showToast('error', err.message || '加载样式配置失败')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadStyles()
  }, [loadStyles])

  const handleSave = async (formData: CreateBookmarkCardStyleData) => {
    try {
      if (editingStyle) {
        await updateBookmarkCardStyle(editingStyle.id, formData)
        showToast('success', '样式配置更新成功')
      } else {
        await createBookmarkCardStyle(formData)
        showToast('success', '样式配置创建成功')
      }
      await loadStyles()
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
      throw err
    }
  }

  const handleDelete = async (style: BookmarkCardStyle) => {
    if (!confirm(`确定要删除样式 "${style.name || '未命名'}" 吗？`)) return
    try {
      await deleteBookmarkCardStyle(style.id)
      showToast('success', '样式配置删除成功')
      await loadStyles()
    } catch (err: any) {
      showToast('error', err.message || '删除失败')
    }
  }

  const handleSetDefault = async (style: BookmarkCardStyle) => {
    try {
      await setDefaultBookmarkCardStyle(style.id, style.scope)
      showToast('success', '已设置为默认样式')
      await loadStyles()
    } catch (err: any) {
      showToast('error', err.message || '设置失败')
    }
  }

  const handleEdit = (style: BookmarkCardStyle) => {
    setEditingStyle(style)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingStyle(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingStyle(null)
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">书签卡片样式</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            管理前台书签卡片的显示样式，支持全局、角色、用户级别配置
          </p>
        </div>
        <motion.button
          onClick={handleCreate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg"
          style={{
            background: 'var(--color-primary, #6366f1)',
            color: 'white',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Plus className="w-4 h-4" />
          新建样式
        </motion.button>
      </div>

      {/* 样式列表 */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p style={{ color: 'var(--color-text-muted, #6b7280)' }}>加载中...</p>
        </div>
      ) : styles.length === 0 ? (
        <div
          className="p-16 text-center rounded-2xl border border-dashed"
          style={{
            background: 'var(--color-glass, rgba(255,255,255,0.03))',
            borderColor: 'var(--color-glass-border, rgba(255,255,255,0.1))',
          }}
        >
          <Layout className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted, #6b7280)' }} />
          <p style={{ color: 'var(--color-text-muted, #6b7280)' }}>暂无样式配置</p>
          <button
            onClick={handleCreate}
            className="mt-4 font-medium transition-colors hover:underline"
            style={{ color: 'var(--color-primary, #6366f1)' }}
          >
            创建第一个样式
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {styles.map((style) => {
            const scopeInfo = SCOPE_OPTIONS.find(s => s.value === style.scope)
            const ScopeIcon = scopeInfo?.icon || Globe
            return (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-5 rounded-2xl border transition-all hover:border-blue-500/30"
                style={{
                  background: 'var(--color-glass, rgba(255,255,255,0.03))',
                  borderColor: style.isDefault ? 'var(--color-primary, #6366f1)' : 'var(--color-glass-border, rgba(255,255,255,0.1))',
                  boxShadow: style.isDefault ? '0 0 0 1px var(--color-primary, #6366f1), 0 4px 20px rgba(99, 102, 241, 0.15)' : undefined,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--color-glass, rgba(255,255,255,0.05))' }}
                    >
                      <ScopeIcon className="w-5 h-5" style={{ color: 'var(--color-primary, #6366f1)' }} />
                    </div>
                    <div>
                      <h3 className="font-medium">{style.name || '未命名'}</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>{scopeInfo?.label}</p>
                    </div>
                  </div>
                  {style.isDefault && (
                    <span
                      className="px-2 py-0.5 text-xs rounded-full font-medium"
                      style={{
                        background: 'var(--color-primary, #6366f1)',
                        color: 'white',
                      }}
                    >
                      默认
                    </span>
                  )}
                </div>

                {style.description && (
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>
                    {style.description}
                  </p>
                )}

                {/* 预览 */}
                <div
                  className="h-24 rounded-xl mb-4 flex items-center justify-center overflow-hidden"
                  style={{
                    background: style.backgroundGradient
                      ? `linear-gradient(${style.backgroundGradient.angle}deg, ${style.backgroundGradient.from}, ${style.backgroundGradient.to})`
                      : style.backgroundColor,
                    borderRadius: style.borderRadius,
                    border: `${style.borderWidth} ${style.borderStyle} ${style.borderColor}`,
                    boxShadow: `${style.shadowX} ${style.shadowY} ${style.shadowBlur} ${style.shadowSpread} ${style.shadowColor}`,
                    opacity: style.opacity,
                  }}
                >
                  {style.isCircular ? (
                    /* 圆形图标预览 */
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: style.circleSize,
                        height: style.circleSize,
                        borderRadius: '50%',
                        background: style.circleBackgroundColor || 'rgba(99, 102, 241, 0.2)',
                        border: `${style.circleBorderWidth} solid ${style.circleBorderColor || 'transparent'}`,
                        opacity: style.iconOpacity,
                      }}
                    >
                      <Layout className="w-5 h-5" style={{ color: style.iconColor || 'var(--color-primary, #6366f1)' }} />
                    </div>
                  ) : (
                    <span className="text-sm font-medium" style={{ color: style.titleColor }}>
                      预览效果
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(style)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ color: 'var(--color-text-secondary, #9ca3af)' }}
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  {!style.isDefault && (
                    <button
                      onClick={() => handleSetDefault(style)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-500/10"
                      style={{ color: 'var(--color-primary, #6366f1)' }}
                      title="设为默认"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(style)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 text-red-400"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 样式编辑器弹窗 */}
      <StyleEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingStyle={editingStyle}
        onSave={handleSave}
        presets={styles}
      />
    </div>
  )
}
