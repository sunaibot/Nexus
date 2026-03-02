import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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
  Tag
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
  { value: 'global', label: '全局', icon: Globe, color: 'blue' },
  { value: 'role', label: '角色', icon: Shield, color: 'purple' },
  { value: 'user', label: '用户', icon: Users, color: 'green' },
]

const DEFAULT_STYLE: CreateBookmarkCardStyleData = {
  name: '新样式',
  description: '',
  scope: 'global',
  priority: 0,
  isDefault: false,
  isEnabled: true,
  // 基础样式
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  borderWidth: '1px',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderStyle: 'solid',
  // 阴影
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowBlur: '10px',
  shadowSpread: '0px',
  shadowX: '0px',
  shadowY: '4px',
  // 间距
  padding: '16px',
  margin: '8px',
  gap: '12px',
  // 字体
  titleFontSize: '16px',
  titleFontWeight: '600',
  titleColor: 'inherit',
  descriptionFontSize: '14px',
  descriptionFontWeight: '400',
  descriptionColor: 'inherit',
  // 效果
  opacity: 1,
  backdropBlur: '10px',
  backdropSaturate: '180%',
  // 悬停
  hoverScale: 1.02,
  hoverTransition: 'all 0.3s ease',
  // 图标
  iconSize: '24px',
  iconBorderRadius: '8px',
  // 图片
  imageHeight: '120px',
  imageBorderRadius: '8px',
  imageObjectFit: 'cover',
  // 标签
  tagBackgroundColor: 'rgba(0, 0, 0, 0.1)',
  tagBorderRadius: '4px',
  tagFontSize: '12px',
}

export default function BookmarkCardStylesPage() {
  const { showToast } = useToast()
  const [styles, setStyles] = useState<BookmarkCardStyle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingStyle, setEditingStyle] = useState<BookmarkCardStyle | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<CreateBookmarkCardStyleData>(DEFAULT_STYLE)
  const [activeTab, setActiveTab] = useState<'basic' | 'typography' | 'effects' | 'hover' | 'components'>('basic')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStyle) {
        await updateBookmarkCardStyle(editingStyle.id, formData)
        showToast('success', '样式配置更新成功')
      } else {
        await createBookmarkCardStyle(formData)
        showToast('success', '样式配置创建成功')
      }
      setEditingStyle(null)
      setIsCreating(false)
      setFormData(DEFAULT_STYLE)
      await loadStyles()
    } catch (err: any) {
      showToast('error', err.message || '操作失败')
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
    setIsCreating(false)
    setFormData({
      name: style.name,
      description: style.description,
      scope: style.scope,
      userId: style.userId,
      role: style.role,
      priority: style.priority,
      isDefault: style.isDefault,
      isEnabled: style.isEnabled,
      backgroundColor: style.backgroundColor,
      backgroundGradient: style.backgroundGradient,
      borderRadius: style.borderRadius,
      borderWidth: style.borderWidth,
      borderColor: style.borderColor,
      borderStyle: style.borderStyle,
      shadowColor: style.shadowColor,
      shadowBlur: style.shadowBlur,
      shadowSpread: style.shadowSpread,
      shadowX: style.shadowX,
      shadowY: style.shadowY,
      padding: style.padding,
      margin: style.margin,
      gap: style.gap,
      titleFontSize: style.titleFontSize,
      titleFontWeight: style.titleFontWeight,
      titleColor: style.titleColor,
      descriptionFontSize: style.descriptionFontSize,
      descriptionFontWeight: style.descriptionFontWeight,
      descriptionColor: style.descriptionColor,
      opacity: style.opacity,
      backdropBlur: style.backdropBlur,
      backdropSaturate: style.backdropSaturate,
      hoverBackgroundColor: style.hoverBackgroundColor,
      hoverBorderColor: style.hoverBorderColor,
      hoverShadowBlur: style.hoverShadowBlur,
      hoverScale: style.hoverScale,
      hoverTransition: style.hoverTransition,
      iconSize: style.iconSize,
      iconColor: style.iconColor,
      iconBackgroundColor: style.iconBackgroundColor,
      iconBorderRadius: style.iconBorderRadius,
      imageHeight: style.imageHeight,
      imageBorderRadius: style.imageBorderRadius,
      imageObjectFit: style.imageObjectFit,
      tagBackgroundColor: style.tagBackgroundColor,
      tagTextColor: style.tagTextColor,
      tagBorderRadius: style.tagBorderRadius,
      tagFontSize: style.tagFontSize,
    })
  }

  const handleReset = () => {
    setEditingStyle(null)
    setIsCreating(false)
    setFormData(DEFAULT_STYLE)
  }

  const updateFormField = (field: keyof CreateBookmarkCardStyleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 渲染表单字段
  const renderFormField = (label: string, field: keyof CreateBookmarkCardStyleData, type: string = 'text', options?: { min?: number; max?: number; step?: number }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      {type === 'color' ? (
        <div className="flex gap-2">
          <input
            type="color"
            value={formData[field] as string || '#000000'}
            onChange={(e) => updateFormField(field, e.target.value)}
            className="w-10 h-8 rounded border cursor-pointer"
          />
          <input
            type="text"
            value={formData[field] as string || ''}
            onChange={(e) => updateFormField(field, e.target.value)}
            className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
            placeholder="rgba(255,255,255,0.1)"
          />
        </div>
      ) : type === 'number' ? (
        <input
          type="number"
          value={formData[field] as number || 0}
          onChange={(e) => updateFormField(field, parseFloat(e.target.value))}
          min={options?.min}
          max={options?.max}
          step={options?.step}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      ) : type === 'range' ? (
        <div className="flex items-center gap-2">
          <input
            type="range"
            value={formData[field] as number || 0}
            onChange={(e) => updateFormField(field, parseFloat(e.target.value))}
            min={options?.min}
            max={options?.max}
            step={options?.step}
            className="flex-1"
          />
          <span className="text-xs w-12 text-right">{String(formData[field] ?? '')}</span>
        </div>
      ) : (
        <input
          type="text"
          value={(formData[field] as string) || ''}
          onChange={(e) => updateFormField(field, e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )}
    </div>
  )

  // 标签页配置
  const tabs = [
    { id: 'basic', label: '基础', icon: Layout },
    { id: 'typography', label: '字体', icon: Type },
    { id: 'effects', label: '效果', icon: Palette },
    { id: 'hover', label: '悬停', icon: MousePointer },
    { id: 'components', label: '组件', icon: Image },
  ]

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">书签卡片样式</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            管理前台书签卡片的显示样式，支持全局、角色、用户级别配置
          </p>
        </div>
        <motion.button
          onClick={() => { setEditingStyle(null); setIsCreating(true); setFormData(DEFAULT_STYLE) }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建样式
        </motion.button>
      </div>

      {/* 样式列表 */}
      {isLoading ? (
        <div className="p-16 text-center">
          <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : styles.length === 0 ? (
        <div className="p-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed">
          <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">暂无样式配置</p>
          <button
            onClick={() => { setEditingStyle(null); setIsCreating(true); setFormData(DEFAULT_STYLE) }}
            className="mt-4 text-blue-500 hover:underline"
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
                className={cn(
                  'p-4 rounded-xl border bg-white dark:bg-gray-800',
                  style.isDefault && 'ring-2 ring-blue-500'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      `bg-${scopeInfo?.color}-100 text-${scopeInfo?.color}-600 dark:bg-${scopeInfo?.color}-900/30 dark:text-${scopeInfo?.color}-400`
                    )}>
                      <ScopeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{style.name || '未命名'}</h3>
                      <p className="text-xs text-gray-500">{scopeInfo?.label}</p>
                    </div>
                  </div>
                  {style.isDefault && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                      默认
                    </span>
                  )}
                </div>

                {style.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {style.description}
                  </p>
                )}

                {/* 预览 */}
                <div
                  className="h-20 rounded-lg mb-3 flex items-center justify-center"
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
                  <span className="text-sm" style={{ color: style.titleColor }}>
                    预览
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(style)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!style.isDefault && (
                    <button
                      onClick={() => handleSetDefault(style)}
                      className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
                      title="设为默认"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(style)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-600"
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

      {/* 编辑表单 */}
      {(editingStyle || isCreating) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {editingStyle ? '编辑样式' : '新建样式'}
            </h2>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 预设样式选择 */}
            {!editingStyle && styles.filter(s => s.id.startsWith('preset-')).length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">选择预设样式</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {styles.filter(s => s.id.startsWith('preset-')).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          name: preset.name,
                          description: preset.description,
                          backgroundColor: preset.backgroundColor,
                          backgroundGradient: preset.backgroundGradient,
                          borderRadius: preset.borderRadius,
                          borderWidth: preset.borderWidth,
                          borderColor: preset.borderColor,
                          shadowColor: preset.shadowColor,
                          shadowBlur: preset.shadowBlur,
                          shadowSpread: preset.shadowSpread,
                          shadowX: preset.shadowX,
                          shadowY: preset.shadowY,
                          padding: preset.padding,
                          margin: preset.margin,
                          gap: preset.gap,
                          titleFontSize: preset.titleFontSize,
                          titleFontWeight: preset.titleFontWeight,
                          titleColor: preset.titleColor,
                          descriptionFontSize: preset.descriptionFontSize,
                          descriptionFontWeight: preset.descriptionFontWeight,
                          descriptionColor: preset.descriptionColor,
                          opacity: preset.opacity,
                          backdropBlur: preset.backdropBlur,
                          backdropSaturate: preset.backdropSaturate,
                          hoverBackgroundColor: preset.hoverBackgroundColor,
                          hoverBorderColor: preset.hoverBorderColor,
                          hoverShadowBlur: preset.hoverShadowBlur,
                          hoverScale: preset.hoverScale,
                          hoverTransition: preset.hoverTransition,
                          iconSize: preset.iconSize,
                          iconColor: preset.iconColor,
                          iconBackgroundColor: preset.iconBackgroundColor,
                          iconBorderRadius: preset.iconBorderRadius,
                          imageHeight: preset.imageHeight,
                          imageBorderRadius: preset.imageBorderRadius,
                          imageObjectFit: preset.imageObjectFit,
                          tagBackgroundColor: preset.tagBackgroundColor,
                          tagTextColor: preset.tagTextColor,
                          tagBorderRadius: preset.tagBorderRadius,
                          tagFontSize: preset.tagFontSize,
                        }))
                      }}
                      className="p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                    >
                      <div className="font-medium text-sm mb-1">{preset.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{preset.description}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">点击上方预设快速应用样式，然后可根据需要调整细节</p>
              </div>
            )}

            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">范围</label>
                <select
                  value={formData.scope}
                  onChange={(e) => updateFormField('scope', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                >
                  {SCOPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">优先级</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => updateFormField('priority', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* 标签页 */}
            <div className="flex gap-2 border-b">
              {tabs.map(tab => {
                const TabIcon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* 表单内容 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeTab === 'basic' && (
                <>
                  {renderFormField('背景颜色', 'backgroundColor', 'color')}
                  {renderFormField('圆角', 'borderRadius')}
                  {renderFormField('边框宽度', 'borderWidth')}
                  {renderFormField('边框颜色', 'borderColor', 'color')}
                  {renderFormField('内边距', 'padding')}
                  {renderFormField('外边距', 'margin')}
                  {renderFormField('间距', 'gap')}
                </>
              )}
              {activeTab === 'typography' && (
                <>
                  {renderFormField('标题大小', 'titleFontSize')}
                  {renderFormField('标题粗细', 'titleFontWeight')}
                  {renderFormField('标题颜色', 'titleColor', 'color')}
                  {renderFormField('描述大小', 'descriptionFontSize')}
                  {renderFormField('描述粗细', 'descriptionFontWeight')}
                  {renderFormField('描述颜色', 'descriptionColor', 'color')}
                </>
              )}
              {activeTab === 'effects' && (
                <>
                  {renderFormField('透明度', 'opacity', 'range', { min: 0, max: 1, step: 0.1 })}
                  {renderFormField('背景模糊', 'backdropBlur')}
                  {renderFormField('背景饱和度', 'backdropSaturate')}
                  {renderFormField('阴影颜色', 'shadowColor', 'color')}
                  {renderFormField('阴影模糊', 'shadowBlur')}
                  {renderFormField('阴影X偏移', 'shadowX')}
                  {renderFormField('阴影Y偏移', 'shadowY')}
                </>
              )}
              {activeTab === 'hover' && (
                <>
                  {renderFormField('悬停背景', 'hoverBackgroundColor', 'color')}
                  {renderFormField('悬停边框', 'hoverBorderColor', 'color')}
                  {renderFormField('悬停阴影', 'hoverShadowBlur')}
                  {renderFormField('悬停缩放', 'hoverScale', 'number', { min: 0.5, max: 1.5, step: 0.01 })}
                  {renderFormField('过渡动画', 'hoverTransition')}
                </>
              )}
              {activeTab === 'components' && (
                <>
                  {renderFormField('图标大小', 'iconSize')}
                  {renderFormField('图标圆角', 'iconBorderRadius')}
                  {renderFormField('图片高度', 'imageHeight')}
                  {renderFormField('图片圆角', 'imageBorderRadius')}
                  {renderFormField('标签背景', 'tagBackgroundColor', 'color')}
                  {renderFormField('标签圆角', 'tagBorderRadius')}
                  {renderFormField('标签字体', 'tagFontSize')}
                </>
              )}
            </div>

            {/* 实时预览 */}
            <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                实时预览
              </h3>
              <div
                className="p-4 max-w-sm"
                style={{
                  background: formData.backgroundGradient
                    ? `linear-gradient(${formData.backgroundGradient.angle}deg, ${formData.backgroundGradient.from}, ${formData.backgroundGradient.to})`
                    : formData.backgroundColor,
                  borderRadius: formData.borderRadius,
                  border: `${formData.borderWidth} ${formData.borderStyle} ${formData.borderColor}`,
                  boxShadow: `${formData.shadowX} ${formData.shadowY} ${formData.shadowBlur} ${formData.shadowSpread} ${formData.shadowColor}`,
                  padding: formData.padding,
                  opacity: formData.opacity,
                  backdropFilter: `blur(${formData.backdropBlur}) saturate(${formData.backdropSaturate})`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: formData.iconBackgroundColor,
                      borderRadius: formData.iconBorderRadius,
                    }}
                  >
                    <Layout className="w-5 h-5" style={{ color: formData.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="truncate"
                      style={{
                        fontSize: formData.titleFontSize,
                        fontWeight: formData.titleFontWeight,
                        color: formData.titleColor,
                      }}
                    >
                      书签标题
                    </h4>
                    <p
                      className="mt-1 line-clamp-2"
                      style={{
                        fontSize: formData.descriptionFontSize,
                        fontWeight: formData.descriptionFontWeight,
                        color: formData.descriptionColor,
                      }}
                    >
                      这是书签的描述文本，用于展示样式效果
                    </p>
                    <div className="mt-2 flex gap-1">
                      <span
                        className="px-2 py-0.5 text-xs"
                        style={{
                          background: formData.tagBackgroundColor,
                          color: formData.tagTextColor,
                          borderRadius: formData.tagBorderRadius,
                          fontSize: formData.tagFontSize,
                        }}
                      >
                        标签
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingStyle ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}
