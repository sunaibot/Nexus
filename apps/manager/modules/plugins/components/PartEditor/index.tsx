'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Palette,
  MousePointer,
  Code,
  Eye,
  Save,
  Undo,
  Redo,
  Copy,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Type,
  Image as ImageIcon,
  Layout,
  Database,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Layers,
  Zap,
  Move,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Maximize,
  Minimize,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/admin/Toast'
import type {
  ComponentPart,
  PartStyles,
  PartProperty,
  PartEvent,
  AnimationConfig
} from '../../types/parts'
import {
  PART_CATEGORIES,
  PRESET_ANIMATIONS,
  STYLE_TEMPLATES,
  DEFAULT_NEW_PART
} from '../../types/parts'

// 属性编辑器组件
interface PropertyEditorProps {
  property: PartProperty
  value: any
  onChange: (value: any) => void
}

function PropertyEditor({ property, value, onChange }: PropertyEditorProps) {
  const { type, label, options, description, placeholder, min, max, step } = property

  switch (type) {
    case 'string':
      return (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      )

    case 'textarea':
      return (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      )

    case 'number':
      return (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      )

    case 'boolean':
      return (
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {description && <p className="text-xs text-gray-400">{description}</p>}
          </div>
          <button
            onClick={() => onChange(!value)}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative',
              value ? 'bg-blue-500' : 'bg-gray-300'
            )}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full absolute top-0.5"
              animate={{ left: value ? '26px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      )

    case 'select':
      return (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      )

    case 'color':
      return (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 rounded-lg border cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      )

    case 'icon':
      return (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-gray-50">
              {value ? (
                <span className="text-xl">{value}</span>
              ) : (
                <Box className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="输入图标名称或emoji"
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      )

    default:
      return null
  }
}

// 样式编辑器
interface StyleEditorProps {
  styles: PartStyles
  onChange: (styles: PartStyles) => void
  title?: string
}

function StyleEditor({ styles, onChange, title }: StyleEditorProps) {
  const [activeSection, setActiveSection] = useState<string | null>('layout')

  const updateStyle = useCallback((key: keyof PartStyles, value: any) => {
    onChange({ ...styles, [key]: value })
  }, [styles, onChange])

  const sections = [
    { id: 'layout', label: '布局', icon: Layout },
    { id: 'background', label: '背景', icon: Palette },
    { id: 'border', label: '边框', icon: Box },
    { id: 'text', label: '文字', icon: Type },
    { id: 'effect', label: '效果', icon: Sparkles }
  ]

  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-medium text-gray-700">{title}</h4>}

      {/* 章节切换 */}
      <div className="flex flex-wrap gap-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
              activeSection === section.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <section.icon className="w-3 h-3" />
            {section.label}
            {activeSection === section.id ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ))}
      </div>

      {/* 布局设置 */}
      <AnimatePresence>
        {activeSection === 'layout' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">宽度</label>
                <input
                  type="text"
                  value={styles.width || ''}
                  onChange={(e) => updateStyle('width', e.target.value)}
                  placeholder="auto"
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">高度</label>
                <input
                  type="text"
                  value={styles.height || ''}
                  onChange={(e) => updateStyle('height', e.target.value)}
                  placeholder="auto"
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">内边距 (padding)</label>
              <input
                type="text"
                value={styles.padding || ''}
                onChange={(e) => updateStyle('padding', e.target.value)}
                placeholder="16px"
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">外边距 (margin)</label>
              <input
                type="text"
                value={styles.margin || ''}
                onChange={(e) => updateStyle('margin', e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">显示</label>
                <select
                  value={styles.display || 'block'}
                  onChange={(e) => updateStyle('display', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="block">block</option>
                  <option value="flex">flex</option>
                  <option value="grid">grid</option>
                  <option value="inline">inline</option>
                  <option value="inline-block">inline-block</option>
                  <option value="none">none</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">定位</label>
                <select
                  value={styles.position || 'static'}
                  onChange={(e) => updateStyle('position', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="static">static</option>
                  <option value="relative">relative</option>
                  <option value="absolute">absolute</option>
                  <option value="fixed">fixed</option>
                </select>
              </div>
            </div>

            {styles.display === 'flex' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">主轴对齐</label>
                    <select
                      value={styles.justifyContent || 'flex-start'}
                      onChange={(e) => updateStyle('justifyContent', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="flex-start">start</option>
                      <option value="center">center</option>
                      <option value="flex-end">end</option>
                      <option value="space-between">between</option>
                      <option value="space-around">around</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">交叉轴对齐</label>
                    <select
                      value={styles.alignItems || 'stretch'}
                      onChange={(e) => updateStyle('alignItems', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="stretch">stretch</option>
                      <option value="flex-start">start</option>
                      <option value="center">center</option>
                      <option value="flex-end">end</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">间距 (gap)</label>
                  <input
                    type="text"
                    value={styles.gap || ''}
                    onChange={(e) => updateStyle('gap', e.target.value)}
                    placeholder="16px"
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* 背景设置 */}
        {activeSection === 'background' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div>
              <label className="text-xs text-gray-500">背景颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={styles.backgroundColor || ''}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  placeholder="#ffffff 或 transparent"
                  className="flex-1 px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">背景图片 URL</label>
              <input
                type="text"
                value={styles.backgroundImage || ''}
                onChange={(e) => updateStyle('backgroundImage', e.target.value)}
                placeholder="https://..."
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">渐变背景</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.backgroundGradient?.from || '#3b82f6'}
                    onChange={(e) => updateStyle('backgroundGradient', {
                      ...styles.backgroundGradient,
                      from: e.target.value
                    })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">到</span>
                  <input
                    type="color"
                    value={styles.backgroundGradient?.to || '#8b5cf6'}
                    onChange={(e) => updateStyle('backgroundGradient', {
                      ...styles.backgroundGradient,
                      to: e.target.value
                    })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                </div>
                {styles.backgroundGradient && (
                  <div
                    className="h-8 rounded border"
                    style={{
                      background: `linear-gradient(135deg, ${styles.backgroundGradient.from}, ${styles.backgroundGradient.to})`
                    }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 边框设置 */}
        {activeSection === 'border' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">边框宽度</label>
                <input
                  type="text"
                  value={styles.borderWidth || ''}
                  onChange={(e) => updateStyle('borderWidth', e.target.value)}
                  placeholder="1px"
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">边框样式</label>
                <select
                  value={styles.borderStyle || 'solid'}
                  onChange={(e) => updateStyle('borderStyle', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="solid">solid</option>
                  <option value="dashed">dashed</option>
                  <option value="dotted">dotted</option>
                  <option value="none">none</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">边框颜色</label>
                <input
                  type="color"
                  value={styles.borderColor || '#e5e7eb'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="w-full h-7 rounded border cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">圆角 (border-radius)</label>
              <input
                type="text"
                value={styles.borderRadius || ''}
                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                placeholder="8px"
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
          </motion.div>
        )}

        {/* 文字设置 */}
        {activeSection === 'text' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div>
              <label className="text-xs text-gray-500">文字颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styles.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={styles.color || ''}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1 px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">字体大小</label>
                <input
                  type="text"
                  value={styles.fontSize || ''}
                  onChange={(e) => updateStyle('fontSize', e.target.value)}
                  placeholder="14px"
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">字重</label>
                <select
                  value={styles.fontWeight || 'normal'}
                  onChange={(e) => updateStyle('fontWeight', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="normal">normal</option>
                  <option value="bold">bold</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                  <option value="600">600</option>
                  <option value="700">700</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">对齐方式</label>
              <div className="flex gap-1">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateStyle('textAlign', align)}
                    className={cn(
                      'flex-1 py-1 text-xs rounded border',
                      styles.textAlign === align
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white hover:bg-gray-50'
                    )}
                  >
                    {align === 'left' && <AlignLeft className="w-3 h-3 mx-auto" />}
                    {align === 'center' && <AlignCenter className="w-3 h-3 mx-auto" />}
                    {align === 'right' && <AlignRight className="w-3 h-3 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 效果设置 */}
        {activeSection === 'effect' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div>
              <label className="text-xs text-gray-500">阴影 (box-shadow)</label>
              <select
                value={styles.boxShadow || 'none'}
                onChange={(e) => updateStyle('boxShadow', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="none">无</option>
                <option value="0 1px 2px rgba(0,0,0,0.1)">小</option>
                <option value="0 4px 6px rgba(0,0,0,0.1)">中</option>
                <option value="0 10px 15px rgba(0,0,0,0.1)">大</option>
                <option value="0 20px 25px rgba(0,0,0,0.15)">超大</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500">透明度</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={styles.opacity ?? 1}
                onChange={(e) => updateStyle('opacity', Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{Math.round((styles.opacity ?? 1) * 100)}%</div>
            </div>

            <div>
              <label className="text-xs text-gray-500">鼠标样式</label>
              <select
                value={styles.cursor || 'default'}
                onChange={(e) => updateStyle('cursor', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="default">default</option>
                <option value="pointer">pointer</option>
                <option value="text">text</option>
                <option value="move">move</option>
                <option value="not-allowed">not-allowed</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 主编辑器组件
interface PartEditorProps {
  initialPart?: ComponentPart
  onSave: (part: ComponentPart) => void
  onCancel: () => void
}

export default function PartEditor({ initialPart, onSave, onCancel }: PartEditorProps) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'info' | 'visual' | 'behavior' | 'code'>('visual')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewState, setPreviewState] = useState<'default' | 'hover' | 'active'>('default')

  // 零件状态
  const [part, setPart] = useState<ComponentPart>(() => {
    if (initialPart) return initialPart
    return {
      ...DEFAULT_NEW_PART,
      id: `part_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { downloads: 0, likes: 0, usage: 0 }
    } as ComponentPart
  })

  // 更新零件信息
  const updatePartInfo = useCallback((updates: Partial<ComponentPart>) => {
    setPart(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }))
  }, [])

  // 更新视觉配置
  const updateVisual = useCallback((updates: Partial<ComponentPart['visual']>) => {
    setPart(prev => ({
      ...prev,
      visual: { ...prev.visual, ...updates },
      updatedAt: new Date().toISOString()
    }))
  }, [])

  // 更新样式
  const updateStyles = useCallback((state: string, styles: PartStyles) => {
    setPart(prev => ({
      ...prev,
      visual: {
        ...prev.visual,
        states: {
          ...prev.visual.states,
          [state]: styles
        }
      },
      updatedAt: new Date().toISOString()
    }))
  }, [])

  // 保存零件
  const handleSave = useCallback(() => {
    if (!part.name.trim()) {
      showToast('error', '请输入零件名称')
      return
    }
    onSave(part)
    showToast('success', '零件保存成功')
  }, [part, onSave, showToast])

  // 获取预览样式
  const getPreviewStyles = useCallback((): React.CSSProperties => {
    const baseStyles = part.visual.base
    const stateStyles = part.visual.states[previewState] || {}

    return {
      ...baseStyles,
      ...stateStyles,
      background: stateStyles.backgroundGradient
        ? `linear-gradient(135deg, ${stateStyles.backgroundGradient.from}, ${stateStyles.backgroundGradient.to})`
        : stateStyles.backgroundColor || baseStyles.backgroundColor,
    } as React.CSSProperties
  }, [part.visual, previewState])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {initialPart ? '编辑零件' : '创建新零件'}
          </h2>

          {/* Tab 切换 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {[
              { id: 'info', label: '基本信息', icon: Box },
              { id: 'visual', label: '视觉样式', icon: Palette },
              { id: 'behavior', label: '行为交互', icon: MousePointer },
              { id: 'code', label: '代码', icon: Code }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            保存零件
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：编辑面板 */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* 基本信息 */}
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-4"
              >
                <h3 className="text-sm font-medium text-gray-900">基本信息</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">零件名称</label>
                    <input
                      type="text"
                      value={part.name}
                      onChange={(e) => updatePartInfo({ name: e.target.value })}
                      placeholder="输入零件名称"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={part.description || ''}
                      onChange={(e) => updatePartInfo({ description: e.target.value })}
                      placeholder="描述这个零件的用途"
                      rows={3}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">分类</label>
                    <select
                      value={part.category}
                      onChange={(e) => updatePartInfo({ category: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PART_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">图标</label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-gray-50">
                        {part.icon ? (
                          <span className="text-xl">{part.icon}</span>
                        ) : (
                          <Box className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={part.icon}
                        onChange={(e) => updatePartInfo({ icon: e.target.value })}
                        placeholder="输入emoji或图标名称"
                        className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">标签</label>
                    <input
                      type="text"
                      value={part.tags.join(', ')}
                      onChange={(e) => updatePartInfo({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      placeholder="用逗号分隔，如：按钮, 主要, 交互"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">版本</label>
                      <input
                        type="text"
                        value={part.version}
                        onChange={(e) => updatePartInfo({ version: e.target.value })}
                        placeholder="1.0.0"
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">作者</label>
                      <input
                        type="text"
                        value={part.author}
                        onChange={(e) => updatePartInfo({ author: e.target.value })}
                        placeholder="你的名字"
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 视觉样式 */}
            {activeTab === 'visual' && (
              <motion.div
                key="visual"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-4"
              >
                <h3 className="text-sm font-medium text-gray-900">视觉样式</h3>

                {/* 状态切换 */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  {[
                    { id: 'default', label: '默认' },
                    { id: 'hover', label: '悬停' },
                    { id: 'active', label: '激活' }
                  ].map((state) => (
                    <button
                      key={state.id}
                      onClick={() => setPreviewState(state.id as any)}
                      className={cn(
                        'flex-1 py-1 text-xs rounded transition-colors',
                        previewState === state.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>

                {/* 基础样式 */}
                <StyleEditor
                  styles={part.visual.base}
                  onChange={(styles) => updateVisual({ base: styles })}
                  title="基础样式"
                />

                {/* 状态样式 */}
                {previewState !== 'default' && (
                  <StyleEditor
                    styles={part.visual.states[previewState] || {}}
                    onChange={(styles) => updateStyles(previewState, styles)}
                    title={`${previewState === 'hover' ? '悬停' : '激活'}状态样式`}
                  />
                )}

                {/* 动画配置 */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">动画效果</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">入场动画</label>
                      <select
                        value={part.visual.animations?.entrance?.type || 'none'}
                        onChange={(e) => {
                          const type = e.target.value
                          updateVisual({
                            animations: {
                              ...part.visual.animations,
                              entrance: type === 'none' ? undefined : PRESET_ANIMATIONS[type]
                            }
                          })
                        }}
                        className="w-full px-2 py-1 text-sm border rounded"
                      >
                        <option value="none">无</option>
                        <option value="fadeIn">淡入</option>
                        <option value="slideUp">上滑</option>
                        <option value="scaleIn">缩放</option>
                        <option value="bounce">弹跳</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">悬停动画</label>
                      <select
                        value={part.visual.animations?.hover?.type || 'none'}
                        onChange={(e) => {
                          const type = e.target.value
                          updateVisual({
                            animations: {
                              ...part.visual.animations,
                              hover: type === 'none' ? undefined : PRESET_ANIMATIONS[type]
                            }
                          })
                        }}
                        className="w-full px-2 py-1 text-sm border rounded"
                      >
                        <option value="none">无</option>
                        <option value="pulse">脉冲</option>
                        <option value="scaleIn">放大</option>
                        <option value="shake">摇晃</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 行为交互 */}
            {activeTab === 'behavior' && (
              <motion.div
                key="behavior"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-4"
              >
                <h3 className="text-sm font-medium text-gray-900">行为交互</h3>

                <div className="text-sm text-gray-500">
                  配置零件的交互行为和事件响应
                </div>

                {/* 事件列表 */}
                <div className="space-y-3">
                  {part.behavior.events.map((event, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{event.label}</span>
                        <button
                          onClick={() => {
                            const newEvents = [...part.behavior.events]
                            newEvents.splice(index, 1)
                            setPart(prev => ({
                              ...prev,
                              behavior: { ...prev.behavior, events: newEvents }
                            }))
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">{event.description}</div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setPart(prev => ({
                        ...prev,
                        behavior: {
                          ...prev.behavior,
                          events: [
                            ...prev.behavior.events,
                            {
                              name: 'click',
                              label: '点击事件',
                              description: '当用户点击时触发',
                              actions: []
                            }
                          ]
                        }
                      }))
                    }}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4" />
                    添加事件
                  </button>
                </div>

                {/* 可配置属性 */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">可配置属性</h4>

                  <div className="space-y-3">
                    {part.properties.map((prop, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{prop.label}</span>
                          <button
                            onClick={() => {
                              const newProps = [...part.properties]
                              newProps.splice(index, 1)
                              setPart(prev => ({ ...prev, properties: newProps }))
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">{prop.name} ({prop.type})</div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setPart(prev => ({
                          ...prev,
                          properties: [
                            ...prev.properties,
                            {
                              name: `prop${prev.properties.length + 1}`,
                              label: '新属性',
                              type: 'string',
                              defaultValue: ''
                            }
                          ]
                        }))
                      }}
                      className="w-full py-2 flex items-center justify-center gap-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4" />
                      添加属性
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 代码 */}
            {activeTab === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-4"
              >
                <h3 className="text-sm font-medium text-gray-900">高级代码</h3>

                <div className="text-sm text-gray-500">
                  高级用户可以直接编辑代码
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">HTML 模板</label>
                    <textarea
                      value={part.code?.html || ''}
                      onChange={(e) => updatePartInfo({
                        code: { ...part.code, html: e.target.value }
                      })}
                      placeholder="&lt;div class=&quot;my-part&quot;&gt;{{content}}&lt;/div&gt;"
                      rows={4}
                      className="w-full px-3 py-2 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">CSS 样式</label>
                    <textarea
                      value={part.code?.css || ''}
                      onChange={(e) => updatePartInfo({
                        code: { ...part.code, css: e.target.value }
                      })}
                      placeholder=".my-part { color: red; }"
                      rows={4}
                      className="w-full px-3 py-2 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">JavaScript</label>
                    <textarea
                      value={part.code?.js || ''}
                      onChange={(e) => updatePartInfo({
                        code: { ...part.code, js: e.target.value }
                      })}
                      placeholder="// 交互逻辑"
                      rows={4}
                      className="w-full px-3 py-2 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 中间：预览区 */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {/* 预览工具栏 */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">实时预览</span>
            </div>

            <div className="flex items-center gap-2">
              {/* 设备切换 */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {[
                  { id: 'desktop', icon: Monitor, label: '桌面' },
                  { id: 'tablet', icon: Tablet, label: '平板' },
                  { id: 'mobile', icon: Smartphone, label: '手机' }
                ].map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setPreviewMode(device.id as any)}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      previewMode === device.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                    title={device.label}
                  >
                    <device.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* 状态切换 */}
              <div className="flex gap-1">
                {[
                  { id: 'default', label: '默认' },
                  { id: 'hover', label: '悬停' },
                  { id: 'active', label: '激活' }
                ].map((state) => (
                  <button
                    key={state.id}
                    onClick={() => setPreviewState(state.id as any)}
                    className={cn(
                      'px-3 py-1 text-xs rounded transition-colors',
                      previewState === state.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {state.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 预览画布 */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <motion.div
              className={cn(
                'bg-white rounded-lg shadow-lg transition-all duration-300',
                previewMode === 'desktop' && 'w-full max-w-2xl',
                previewMode === 'tablet' && 'w-96',
                previewMode === 'mobile' && 'w-72'
              )}
              style={{
                minHeight: '200px'
              }}
            >
              {/* 预览内容 */}
              <div className="p-8">
                <motion.div
                  style={getPreviewStyles()}
                  className="transition-all duration-200"
                >
                  {part.icon && <div className="text-4xl mb-2">{part.icon}</div>}
                  <div className="text-lg font-medium">{part.name}</div>
                  {part.description && (
                    <div className="text-sm text-gray-500 mt-1">{part.description}</div>
                  )}
                </motion.div>

                {/* 示例内容 */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-400 mb-2">使用示例：</div>
                  <div className="flex items-center gap-2">
                    <div
                      style={getPreviewStyles()}
                      className="px-4 py-2 text-sm"
                    >
                      示例按钮
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
