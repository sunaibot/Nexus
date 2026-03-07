'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Palette, Eye, MousePointer2, Type, RefreshCw, Check, Text } from 'lucide-react'
import { useToast } from '../../../components/admin/Toast'
import { updateSettings, type ThemeColors } from '../../../lib/api'
import { cn } from '../../../lib/utils'

interface ThemeColorCustomizerProps {
  currentColors?: ThemeColors
  isDark: boolean
  onColorsChange?: (colors: ThemeColors) => void
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
        <div className="relative flex-1">
          <input
            type="color"
            value={localValue || (label.includes('背景') ? '#667eea' : '#ffffff')}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="w-10 h-10 rounded-lg border-2 flex-shrink-0"
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
function ThemePreview({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const bgColor = isDark ? '#0a0a0a' : '#fafafa'
  const cardBg = isDark ? 'rgba(23, 23, 32, 0.5)' : 'rgba(255, 255, 255, 0.85)'

  return (
    <div
      className="rounded-xl p-6 space-y-4"
      style={{ backgroundColor: bgColor }}
    >
      {/* 模拟导航栏 */}
      <div
        className="flex items-center justify-between p-3 rounded-lg"
        style={{ backgroundColor: cardBg, border: '1px solid var(--color-glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.buttonPrimaryBg || '#667eea' }}
          >
            <span style={{ color: colors.buttonPrimaryText || '#ffffff' }}>🏠</span>
          </div>
          <span style={{ color: colors.iconPrimary || (isDark ? 'rgba(255,255,255,0.95)' : '#171717') }}>
            网站标题
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.buttonSecondaryBg || (isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f5') }}
          >
            <span style={{ color: colors.buttonSecondaryText || (isDark ? 'rgba(255,255,255,0.9)' : '#171717') }}>
              🔍
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.buttonSecondaryBg || (isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f5') }}
          >
            <span style={{ color: colors.iconSecondary || (isDark ? 'rgba(255,255,255,0.72)' : '#525252') }}>
              🌙
            </span>
          </div>
        </div>
      </div>

      {/* 模拟卡片 */}
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
              className="font-medium"
              style={{ color: colors.textPrimary || (isDark ? 'rgba(255,255,255,0.95)' : '#171717') }}
            >
              分类标题
            </div>
            <div
              className="text-sm"
              style={{ color: colors.textMuted || (isDark ? 'rgba(255,255,255,0.45)' : '#a3a3a3') }}
            >
              12 个书签
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: colors.buttonPrimaryBg || '#667eea',
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

      {/* 图标展示 */}
      <div className="flex items-center gap-4 justify-center">
        <span
          className="text-2xl"
          style={{ color: colors.iconPrimary || (isDark ? 'rgba(255,255,255,0.95)' : '#171717') }}
          title="主图标颜色"
        >
          ⭐
        </span>
        <span
          className="text-2xl"
          style={{ color: colors.iconSecondary || (isDark ? 'rgba(255,255,255,0.72)' : '#525252') }}
          title="次图标颜色"
        >
          🔖
        </span>
        <span
          className="text-2xl"
          style={{ color: colors.iconMuted || (isDark ? 'rgba(255,255,255,0.45)' : '#a3a3a3') }}
          title="淡化图标颜色"
        >
          💤
        </span>
      </div>
    </div>
  )
}

export default function ThemeColorCustomizer({
  currentColors = {},
  isDark,
  onColorsChange
}: ThemeColorCustomizerProps) {
  const [colors, setColors] = useState<ThemeColors>(currentColors)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    setColors(currentColors)
  }, [currentColors])

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
    } catch (error) {
      showToast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <Palette className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            自定义颜色
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            调整图标和按钮的颜色以匹配您的品牌
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 颜色配置面板 */}
        <div
          className="p-5 rounded-2xl space-y-6"
          style={{ backgroundColor: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
        >
          {/* 图标颜色 */}
          <div className="space-y-4">
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

          {/* 文字颜色 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <Text className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                文字颜色
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <ColorInput
                label="主要文字颜色"
                value={colors.textPrimary || ''}
                onChange={(v) => handleColorChange('textPrimary', v)}
                icon={Text}
                description="分类名称、标题等主要文字颜色"
              />
              <ColorInput
                label="次要文字颜色"
                value={colors.textSecondary || ''}
                onChange={(v) => handleColorChange('textSecondary', v)}
                icon={Text}
                description="次要文字内容的颜色"
              />
              <ColorInput
                label="淡化文字颜色"
                value={colors.textMuted || ''}
                onChange={(v) => handleColorChange('textMuted', v)}
                icon={Text}
                description="提示文字、禁用状态等淡化文字颜色"
              />
            </div>
          </div>

          {/* 按钮颜色 */}
          <div className="space-y-4">
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

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              重置为默认
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                hasChanges && !isSaving ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
              )}
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
              {isSaving ? '保存中...' : '保存颜色设置'}
            </button>
          </div>
        </div>

        {/* 实时预览 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              实时预览
            </h4>
          </div>
          <ThemePreview colors={colors} isDark={isDark} />
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            预览将实时反映您的颜色更改
          </p>
        </div>
      </div>
    </motion.div>
  )
}
