'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette, Type, Eye, MousePointer2, Check, RefreshCw, Move, Maximize2, Minimize2 } from 'lucide-react'
import { useToast } from '../../../components/admin/Toast'
import { updateSettings, type ThemeColors } from '../../../lib/api'
import { Theme } from '../../../hooks/useTheme'

interface ThemeEditModalProps {
  isOpen: boolean
  onClose: () => void
  theme: Theme | null
  currentColors: ThemeColors
  onColorsChange: (colors: ThemeColors) => void
}

// 拖拽钩子
function useDraggable() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const currentPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    setIsDragging(true)
    dragStartPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y
      currentPos.current = {
        x: currentPos.current.x + deltaX,
        y: currentPos.current.y + deltaY
      }
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      setPosition({ ...currentPos.current })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const resetPosition = useCallback(() => {
    currentPos.current = { x: 0, y: 0 }
    setPosition({ x: 0, y: 0 })
  }, [])

  return { position, isDragging, handleMouseDown, resetPosition }
}

// 颜色输入组件
function ColorInput({
  label,
  value,
  onChange,
  icon: Icon,
  description
}: {
  label: string
  value: string
  onChange: (value: string) => void
  icon: React.ElementType
  description?: string
}) {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
      </div>
      {description && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}
      <div className="flex gap-2">
        <div className="relative flex-shrink-0">
          <input
            type="color"
            value={localValue || (label.includes('背景') ? '#667eea' : '#ffffff')}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="w-10 h-10 rounded-lg border-2"
            style={{
              backgroundColor: localValue || 'transparent',
              borderColor: 'var(--color-glass-border)'
            }}
          />
        </div>
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="例如: #667eea 或 rgba(255,255,255,0.9)"
          className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none transition-all"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-glass-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>
    </div>
  )
}

// 预览组件
function ThemePreview({ colors, theme }: { colors: ThemeColors; theme: Theme }) {
  const isDark = theme.mode === 'dark'
  const bgColor = isDark ? '#0a0a0a' : '#fafafa'
  const cardBg = isDark ? 'rgba(23, 23, 32, 0.5)' : 'rgba(255, 255, 255, 0.85)'

  return (
    <div
      className="rounded-xl p-6 space-y-4"
      style={{ backgroundColor: bgColor }}
    >
      {/* 模拟分类标题 */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ backgroundColor: cardBg, border: '1px solid var(--color-glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-2xl"
            style={{ color: colors.iconPrimary || (isDark ? 'rgba(255,255,255,0.95)' : '#171717') }}
          >
            📁
          </span>
          <div>
            <div
              className="font-medium text-lg"
              style={{ color: colors.textPrimary || (isDark ? 'rgba(255,255,255,0.95)' : '#171717') }}
            >
              常用工具
            </div>
            <div
              className="text-sm"
              style={{ color: colors.textMuted || (isDark ? 'rgba(255,255,255,0.45)' : '#a3a3a3') }}
            >
              5 个书签
            </div>
          </div>
        </div>
      </div>

      {/* 模拟书签卡片 */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ backgroundColor: cardBg, border: '1px solid var(--color-glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.buttonPrimaryBg || theme.colors.primary }}
          >
            <span style={{ color: colors.buttonPrimaryText || '#ffffff' }}>🔖</span>
          </div>
          <div>
            <div
              className="font-medium"
              style={{ color: colors.textPrimary || (isDark ? 'rgba(255,255,255,0.95)' : '#171717') }}
            >
              豆包
            </div>
            <div
              className="text-sm"
              style={{ color: colors.textSecondary || (isDark ? 'rgba(255,255,255,0.72)' : '#525252') }}
            >
              字节跳动AI助手
            </div>
          </div>
        </div>
      </div>

      {/* 按钮展示 */}
      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: colors.buttonPrimaryBg || theme.colors.primary,
            color: colors.buttonPrimaryText || '#ffffff'
          }}
        >
          主要按钮
        </button>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: colors.buttonSecondaryBg || (isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f5'),
            color: colors.buttonSecondaryText || (isDark ? 'rgba(255,255,255,0.9)' : '#171717')
          }}
        >
          次要按钮
        </button>
      </div>
    </div>
  )
}

export default function ThemeEditModal({
  isOpen,
  onClose,
  theme,
  currentColors,
  onColorsChange
}: ThemeEditModalProps) {
  const [colors, setColors] = useState<ThemeColors>(currentColors)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const { showToast } = useToast()

  // 拖拽功能
  const { position, isDragging, handleMouseDown, resetPosition } = useDraggable()

  // 重置位置当弹窗打开时
  useEffect(() => {
    if (isOpen) {
      resetPosition()
      setIsMaximized(false)
    }
  }, [isOpen, resetPosition])

  useEffect(() => {
    setColors(currentColors)
    setHasChanges(false)
  }, [currentColors, isOpen])

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [key]: value }
    setColors(newColors)
    setHasChanges(true)
    onColorsChange?.(newColors)
  }

  const handleReset = () => {
    setColors({})
    setHasChanges(true)
    onColorsChange?.({})
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateSettings({ themeColors: colors })
      setHasChanges(false)
      showToast('success', '主题颜色已保存')
      onClose()
    } catch (error) {
      showToast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  if (!theme) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* 弹窗容器 - 用于居中定位 */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: isMaximized ? '1rem' : undefined }}
          >
            {/* 弹窗 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              drag={false}
              className="rounded-2xl overflow-hidden flex flex-col shadow-2xl pointer-events-auto"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-glass-border)',
                transform: isMaximized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
                width: isMaximized ? '100%' : 'calc(100% - 2rem)',
                height: isMaximized ? '100%' : 'auto',
                maxWidth: isMaximized ? 'none' : '896px',
                maxHeight: isMaximized ? 'none' : '90vh',
                cursor: isDragging ? 'grabbing' : 'default'
              }}
            >
            {/* 头部 - 可拖拽区域 */}
            <div
              className="flex items-center justify-between p-4 border-b select-none"
              style={{ 
                borderColor: 'var(--color-glass-border)',
                cursor: isMaximized ? 'default' : 'grab'
              }}
              onMouseDown={isMaximized ? undefined : handleMouseDown}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  {theme.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    编辑主题: {theme.name}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {theme.mode === 'dark' ? '深色模式' : '浅色模式'} · 自定义颜色配置
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 拖拽提示 */}
                {!isMaximized && (
                  <div 
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="拖拽标题栏移动弹窗"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">拖拽移动</span>
                  </div>
                )}
                {/* 最大化/最小化按钮 */}
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title={isMaximized ? '最小化' : '最大化'}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                  ) : (
                    <Maximize2 className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </button>
                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="关闭"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 颜色配置面板 */}
                <div className="space-y-6">
                  {/* 文字颜色 */}
                  <div
                    className="p-5 rounded-xl space-y-4"
                    style={{ backgroundColor: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
                      <Type className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        文字颜色
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <ColorInput
                        label="主要文字颜色"
                        value={colors.textPrimary || ''}
                        onChange={(v) => handleColorChange('textPrimary', v)}
                        icon={Type}
                        description="分类名称、标题等主要文字颜色"
                      />
                      <ColorInput
                        label="次要文字颜色"
                        value={colors.textSecondary || ''}
                        onChange={(v) => handleColorChange('textSecondary', v)}
                        icon={Type}
                        description="次要文字内容的颜色"
                      />
                      <ColorInput
                        label="淡化文字颜色"
                        value={colors.textMuted || ''}
                        onChange={(v) => handleColorChange('textMuted', v)}
                        icon={Type}
                        description="提示文字、禁用状态等淡化文字颜色"
                      />
                    </div>
                  </div>

                  {/* 图标颜色 */}
                  <div
                    className="p-5 rounded-xl space-y-4"
                    style={{ backgroundColor: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
                      <Eye className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        图标颜色
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <ColorInput
                        label="主图标颜色"
                        value={colors.iconPrimary || ''}
                        onChange={(v) => handleColorChange('iconPrimary', v)}
                        icon={Eye}
                        description="主要图标和强调元素的颜色"
                      />
                      <ColorInput
                        label="次图标颜色"
                        value={colors.iconSecondary || ''}
                        onChange={(v) => handleColorChange('iconSecondary', v)}
                        icon={Eye}
                        description="次要图标和辅助元素的颜色"
                      />
                      <ColorInput
                        label="淡化图标颜色"
                        value={colors.iconMuted || ''}
                        onChange={(v) => handleColorChange('iconMuted', v)}
                        icon={Eye}
                        description="禁用或提示性图标的颜色"
                      />
                    </div>
                  </div>

                  {/* 按钮颜色 */}
                  <div
                    className="p-5 rounded-xl space-y-4"
                    style={{ backgroundColor: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
                      <MousePointer2 className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        按钮颜色
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <ColorInput
                        label="主按钮背景"
                        value={colors.buttonPrimaryBg || ''}
                        onChange={(v) => handleColorChange('buttonPrimaryBg', v)}
                        icon={MousePointer2}
                        description="主要操作按钮的背景色"
                      />
                      <ColorInput
                        label="主按钮文字"
                        value={colors.buttonPrimaryText || ''}
                        onChange={(v) => handleColorChange('buttonPrimaryText', v)}
                        icon={Type}
                        description="主要按钮上的文字颜色"
                      />
                      <ColorInput
                        label="次按钮背景"
                        value={colors.buttonSecondaryBg || ''}
                        onChange={(v) => handleColorChange('buttonSecondaryBg', v)}
                        icon={MousePointer2}
                        description="次要按钮的背景色"
                      />
                      <ColorInput
                        label="次按钮文字"
                        value={colors.buttonSecondaryText || ''}
                        onChange={(v) => handleColorChange('buttonSecondaryText', v)}
                        icon={Type}
                        description="次要按钮上的文字颜色"
                      />
                    </div>
                  </div>
                </div>

                {/* 实时预览 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      实时预览
                    </h4>
                  </div>
                  <ThemePreview colors={colors} theme={theme} />
                  <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                    预览将实时反映您的颜色更改
                  </p>
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div
              className="flex items-center justify-between p-6 border-t"
              style={{ borderColor: 'var(--color-glass-border)' }}
            >
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <RefreshCw className="w-4 h-4" />
                重置为默认
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff'
                  }}
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSaving ? '保存中...' : '保存更改'}
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
