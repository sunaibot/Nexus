import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Folder, Check, Palette, Type, Sparkles, AlertCircle } from 'lucide-react'
import { Category } from '../../../types/bookmark'
import { cn, presetIcons, getIconComponent } from '../../../lib/utils'
import { IconifyPicker } from '../../../components/IconifyPicker'

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Category>) => void
  initialData?: Category | null
  parentId?: string | null
  categories?: Category[]
}

// 预设颜色 - 按色系分组
const presetColors = [
  // 红色系
  '#ef4444', '#f97316', '#f59e0b',
  // 绿色系
  '#84cc16', '#22c55e', '#10b981',
  // 青蓝色系
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  // 紫色系
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  // 粉色系
  '#ec4899', '#f43f5e',
  // 灰色系
  '#64748b', '#94a3b8', '#cbd5e1'
]

// 颜色分组标签
const colorGroups = [
  { label: '暖色', range: [0, 3] },
  { label: '绿色', range: [3, 6] },
  { label: '蓝色', range: [6, 10] },
  { label: '紫色', range: [10, 14] },
  { label: '粉色', range: [14, 16] },
  { label: '灰色', range: [16, 19] },
]

export function CategoryForm({ isOpen, onClose, onSubmit, initialData, parentId: initialParentId, categories = [] }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#8b5cf6')
  const [icon, setIcon] = useState('folder')
  const [parentId, setParentId] = useState<string | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'preset' | 'iconify'>('preset')
  const [styleTab, setStyleTab] = useState<'color' | 'icon'>('color')
  const [nameError, setNameError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const iconPickerRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // 当 initialData 变化时重置表单
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setColor(initialData.color || '#8b5cf6')
      setIcon(initialData.icon || 'folder')
      setParentId(initialData.parentId || null)
    } else {
      setName('')
      setDescription('')
      setColor('#8b5cf6')
      setIcon('folder')
      setParentId(initialParentId || null)
    }
    setNameError('')
    setIsSubmitting(false)
  }, [initialData, initialParentId, isOpen])

  // 自动聚焦名称输入框
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // 点击外部关闭图标选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false)
      }
    }

    if (showIconPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showIconPicker])

  const validateName = useCallback((value: string) => {
    if (!value.trim()) {
      setNameError('分类名称不能为空')
      return false
    }
    if (value.trim().length < 2) {
      setNameError('分类名称至少需要2个字符')
      return false
    }
    if (value.trim().length > 20) {
      setNameError('分类名称不能超过20个字符')
      return false
    }
    setNameError('')
    return true
  }, [])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (nameError) validateName(value)
  }

  const handleNameBlur = () => {
    validateName(name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateName(name)) return
    
    setIsSubmitting(true)
    
    try {
      // 提交所有字段，包括 description 和 parentId
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
        parentId
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleColorSelect = (c: string) => {
    setColor(c)
  }

  const handleIconSelect = (iconName: string) => {
    setIcon(iconName)
    setShowIconPicker(false)
  }

  const SelectedIcon = getIconComponent(icon)

  // 获取当前颜色所属的分组
  const currentColorIndex = presetColors.indexOf(color)
  const currentGroup = colorGroups.find(
    g => currentColorIndex >= g.range[0] && currentColorIndex < g.range[1]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            style={{ 
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* 头部 */}
            <div 
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}20`, color }}
                >
                  <SelectedIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 
                    className="text-base font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {initialData ? '编辑分类' : '新建分类'}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* 父级分类选择 */}
              <div>
                <label
                  className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <Folder className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  父级分类<span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>（可选）</span>
                </label>
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent transition-all text-sm"
                  style={{
                    borderColor: 'var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-bg-secondary)'
                  }}
                >
                  <option value="">作为一级分类</option>
                  {categories
                    .filter((c) => c.id !== initialData?.id) // 不能选择自己作为父级
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  选择父级分类将创建为子分类，支持多级嵌套
                </p>
              </div>

              {/* 名称和描述 - 并排布局 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 名称 */}
                <div>
                  <label
                    className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Type className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    名称<span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    placeholder="如：开发工具"
                    maxLength={20}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border bg-transparent transition-all text-sm',
                      nameError && 'border-red-400 focus:border-red-400'
                    )}
                    style={{
                      borderColor: nameError ? 'rgb(248, 113, 113)' : 'var(--color-glass-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {nameError ? (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {nameError}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        2-20个字符
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {name.length}/20
                    </span>
                  </div>
                </div>

                {/* 描述 */}
                <div>
                  <label 
                    className="flex items-center gap-1.5 text-sm font-medium mb-1.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    描述<span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>（可选）</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="分类用途描述"
                    maxLength={50}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent transition-all text-sm"
                    style={{
                      borderColor: 'var(--color-glass-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <div className="text-right mt-1">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {description.length}/50
                    </span>
                  </div>
                </div>
              </div>

              {/* 颜色和图标选择 - TAB页形式 */}
              <div className="rounded-lg border p-3" style={{ borderColor: 'var(--color-glass-border)', background: 'var(--color-glass)' }}>
                {/* TAB切换 */}
                <div className="flex gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setStyleTab('color')}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                      styleTab === 'color' 
                        ? 'text-white' 
                        : 'hover:bg-white/5'
                    )}
                    style={{ 
                      background: styleTab === 'color' ? 'var(--color-primary)' : 'transparent',
                      color: styleTab === 'color' ? 'white' : 'var(--color-text-secondary)'
                    }}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    颜色
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ background: color }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStyleTab('icon')}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                      styleTab === 'icon' 
                        ? 'text-white' 
                        : 'hover:bg-white/5'
                    )}
                    style={{ 
                      background: styleTab === 'icon' ? 'var(--color-primary)' : 'transparent',
                      color: styleTab === 'icon' ? 'white' : 'var(--color-text-secondary)'
                    }}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    图标
                    <SelectedIcon className="w-3.5 h-3.5" style={{ color: styleTab === 'icon' ? 'white' : 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                {/* 颜色选择内容 */}
                {styleTab === 'color' && (
                  <div className="flex flex-wrap gap-1.5">
                    {presetColors.map((c) => (
                      <motion.button
                        key={c}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleColorSelect(c)}
                        className={cn(
                          'w-6 h-6 rounded-md transition-all relative flex-shrink-0',
                          color === c && 'ring-2 ring-offset-1 ring-offset-[var(--color-bg-secondary)]'
                        )}
                        style={{ 
                          background: c,
                          '--tw-ring-color': c
                        } as React.CSSProperties}
                        title={c}
                      >
                        {color === c && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white drop-shadow-md" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* 图标选择内容 */}
                {styleTab === 'icon' && (
                  <div ref={iconPickerRef} className="space-y-2">
                    {/* 当前选中图标 */}
                    <div 
                      className="flex items-center gap-2 p-2 rounded-lg border"
                      style={{ 
                        background: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-glass-border)'
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ background: `${color}20`, color }}
                      >
                        <SelectedIcon className="w-4 h-4" />
                      </div>
                      <span 
                        className="text-sm flex-1 truncate"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {icon}
                      </span>
                    </div>

                    {/* 图标选择器 */}
                    <div 
                      className="p-2 rounded-lg border"
                      style={{ 
                        background: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-glass-border)'
                      }}
                    >
                      {/* 子标签切换 */}
                      <div className="flex gap-1 mb-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('preset')}
                          className={cn(
                            'px-2 py-1 rounded-md text-xs font-medium transition-all',
                            activeTab === 'preset' 
                              ? 'text-white' 
                              : 'hover:bg-white/5'
                          )}
                          style={{ 
                            background: activeTab === 'preset' ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === 'preset' ? 'white' : 'var(--color-text-secondary)'
                          }}
                        >
                          预设
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('iconify')}
                          className={cn(
                            'px-2 py-1 rounded-md text-xs font-medium transition-all',
                            activeTab === 'iconify' 
                              ? 'text-white' 
                              : 'hover:bg-white/5'
                          )}
                          style={{ 
                            background: activeTab === 'iconify' ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === 'iconify' ? 'white' : 'var(--color-text-secondary)'
                          }}
                        >
                          更多
                        </button>
                      </div>

                      {activeTab === 'preset' ? (
                        <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 content-start w-full">
                          {presetIcons.map(({ name: iconName, icon: IconComponent }) => {
                            const isSelected = icon === iconName
                            return (
                              <motion.button
                                key={iconName}
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleIconSelect(iconName)}
                                className={cn(
                                  'w-8 h-8 rounded-md transition-all flex items-center justify-center',
                                  isSelected && 'ring-2'
                                )}
                                style={{
                                  background: isSelected ? color : 'transparent',
                                  '--tw-ring-color': color
                                } as React.CSSProperties}
                                title={iconName}
                              >
                                <IconComponent 
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{ 
                                    color: isSelected ? 'white' : 'var(--color-text-secondary)'
                                  }}
                                />
                              </motion.button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="max-h-32 overflow-y-auto">
                          <IconifyPicker
                            onSelect={handleIconSelect}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            {/* 实时预览 */}
            <motion.div 
              className="p-3 rounded-lg border"
              style={{ 
                background: `${color}08`,
                borderColor: `${color}30`
              }}
              layout
            >
              <div className="flex items-center gap-3">
                <motion.div
                  key={icon + color}
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                    color,
                    boxShadow: `0 2px 10px ${color}30`
                  }}
                >
                  <SelectedIcon className="w-5 h-5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <motion.div 
                    key={name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-semibold text-base truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {name || '未命名分类'}
                  </motion.div>
                  {description ? (
                    <motion.div 
                      key={description}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {description}
                    </motion.div>
                  ) : (
                    <div 
                      className="text-xs mt-0.5 italic"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      暂无描述
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 按钮 */}
            <div className="flex gap-2 pt-1">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors"
                style={{ 
                  background: 'var(--color-glass)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                取消
              </motion.button>
              <motion.button
                type="submit"
                disabled={!name.trim() || !!nameError || isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                style={{ background: color }}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </motion.div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {initialData ? '保存' : '创建'}
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
