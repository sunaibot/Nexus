'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Monitor,
  Sun,
  Moon,
  Check,
  Sparkles,
  Palette,
  Edit3,
} from 'lucide-react'
import { useToast } from '../../../components/admin/Toast'
import { themes, darkThemes, lightThemes, ThemeId, Theme, useTheme } from '../../../hooks/useTheme'
import { cn } from '../../../lib/utils'
import { updateSettings, fetchSettings, type ThemeColors } from '../../../lib/api'
import ThemeColorCustomizer from '../components/ThemeColorCustomizer'
import ThemeEditModal from '../components/ThemeEditModal'

// 主题预览卡片组件
function ThemePreviewCard({
  theme,
  isActive,
  onClick,
  onEdit,
  isCurrent
}: {
  theme: Theme
  isActive: boolean
  onClick: () => void
  onEdit?: (e: React.MouseEvent) => void
  isCurrent: boolean
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative p-4 rounded-xl text-left transition-all border-2 cursor-pointer group',
        isActive ? 'border-[var(--color-primary)]' : 'border-transparent'
      )}
      style={{
        background: `linear-gradient(135deg, ${theme.colors.bgSecondary}, ${theme.colors.bgTertiary})`,
        boxShadow: isActive ? `0 0 20px ${theme.colors.glow}` : 'none'
      }}
      onClick={onClick}
    >
      {/* 编辑按钮 */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-2 left-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          title="编辑主题颜色"
        >
          <Edit3 className="w-3.5 h-3.5 text-white" />
        </button>
      )}

      {/* 选中标记 */}
      {isActive && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* 主题图标 */}
      <div className="text-3xl mb-3">{theme.icon}</div>

      {/* 主题名称 */}
      <div
        className="font-medium text-sm mb-1"
        style={{ color: theme.colors.textPrimary }}
      >
        {theme.name}
      </div>

      {/* 模式标签 */}
      <div
        className="text-xs px-2 py-0.5 rounded-full inline-block mb-3"
        style={{
          backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          color: theme.colors.textMuted
        }}
      >
        {theme.mode === 'dark' ? '深色模式' : '浅色模式'}
      </div>

      {/* 颜色预览 */}
      <div className="flex gap-1.5">
        {[theme.colors.primary, theme.colors.accent, theme.colors.bgPrimary].map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2"
            style={{
              backgroundColor: color,
              borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// 页面动画配置
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function ThemePage() {
  const { themeId, setTheme, isDark, autoMode, setAutoMode } = useTheme()
  const [previewTheme, setPreviewTheme] = useState<ThemeId>(themeId)
  const [themeColors, setThemeColors] = useState<ThemeColors>({})
  const [isLoadingColors, setIsLoadingColors] = useState(true)
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { showToast } = useToast()

  // 加载保存的主题颜色
  useEffect(() => {
    const loadThemeColors = async () => {
      try {
        const settings = await fetchSettings()
        if (settings.themeColors) {
          setThemeColors(settings.themeColors)
        }
      } catch (error) {
        console.error('加载主题颜色失败:', error)
      } finally {
        setIsLoadingColors(false)
      }
    }
    loadThemeColors()
  }, [])

  // 处理编辑主题
  const handleEditTheme = (e: React.MouseEvent, theme: Theme) => {
    e.stopPropagation()
    setEditingTheme(theme)
    setIsEditModalOpen(true)
  }

  // 保存主题设置到后端
  const saveThemeSettings = async (newThemeId: ThemeId, newMode: 'light' | 'dark' | 'auto') => {
    try {
      await updateSettings({
        themeId: newThemeId,
        themeMode: newMode
      })
      showToast('success', '主题设置已保存')
    } catch (error) {
      showToast('error', '保存主题设置失败')
    }
  }

  // 处理主题切换
  const handleThemeChange = (id: ThemeId) => {
    setPreviewTheme(id)
    setTheme(id)
    const mode = autoMode ? 'auto' : (isDark ? 'dark' : 'light')
    saveThemeSettings(id, mode)
  }

  // 处理模式切换
  const handleModeChange = () => {
    const currentMode = themes[themeId].mode
    const newThemeId = currentMode === 'dark' ? 'daylight' : 'nebula'
    const newMode = currentMode === 'dark' ? 'light' : 'dark'
    
    setTheme(newThemeId)
    saveThemeSettings(newThemeId, newMode)
  }

  // 处理自动模式切换
  const handleAutoModeChange = () => {
    const newAutoMode = !autoMode
    setAutoMode(newAutoMode)
    const mode = newAutoMode ? 'auto' : (isDark ? 'dark' : 'light')
    saveThemeSettings(themeId, mode)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
          }}
        >
          <Palette className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            主题管理
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            自定义系统外观和配色方案
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* 自动切换 */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl cursor-pointer transition-all"
          style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
          onClick={handleAutoModeChange}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-bg-tertiary)' }}
              >
                <Monitor className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div className="font-medium text-lg" style={{ color: 'var(--color-text-primary)' }}>
                  自动切换
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  根据时间自动切换日夜主题（6:00-18:00 日间）
                </div>
              </div>
            </div>
            <div
              className={cn(
                'w-14 h-7 rounded-full transition-all relative',
                autoMode ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-glass-border)]'
              )}
            >
              <motion.div
                className="absolute top-1 w-5 h-5 rounded-full bg-white"
                animate={{ left: autoMode ? '32px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        </motion.div>

        {/* 深色/浅色切换 */}
        {!autoMode && (
          <motion.div
            variants={itemVariants}
            className="flex gap-2 p-1.5 rounded-xl"
            style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
          >
            <button
              onClick={() => isDark && handleModeChange()}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                !isDark ? 'text-white' : 'text-[var(--color-text-muted)]'
              )}
              style={{ background: !isDark ? 'var(--color-primary)' : 'transparent' }}
            >
              <Sun className="w-4 h-4" />
              浅色模式
            </button>
            <button
              onClick={() => !isDark && handleModeChange()}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                isDark ? 'text-white' : 'text-[var(--color-text-muted)]'
              )}
              style={{ background: isDark ? 'var(--color-primary)' : 'transparent' }}
            >
              <Moon className="w-4 h-4" />
              深色模式
            </button>
          </motion.div>
        )}

        {/* 主题列表 */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {isDark ? '深色主题' : '浅色主题'}
            </h3>
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: 'var(--color-glass)', color: 'var(--color-text-muted)', border: '1px solid var(--color-glass-border)' }}
            >
              {(isDark ? darkThemes : lightThemes).length} 款主题
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(isDark ? darkThemes : lightThemes).map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                isActive={previewTheme === theme.id}
                isCurrent={themeId === theme.id}
                onClick={() => handleThemeChange(theme.id)}
                onEdit={(e) => handleEditTheme(e, theme)}
              />
            ))}
          </div>
        </motion.div>

        {/* 当前主题 */}
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl flex items-center justify-between"
          style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ background: 'var(--color-bg-tertiary)' }}
            >
              {themes[themeId].icon}
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>当前主题</div>
              <div className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {themes[themeId].name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {themes[themeId].mode === 'dark' ? '深色模式' : '浅色模式'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <Check className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
          </div>
        </motion.div>

      </motion.div>

      {/* 主题编辑弹窗 */}
      <ThemeEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        theme={editingTheme}
        currentColors={themeColors}
        onColorsChange={setThemeColors}
      />
    </div>
  )
}
