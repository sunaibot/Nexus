import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Edit3, Sparkles, Languages, User, LogOut, Settings, Shield, BookMarked, ChevronDown, LayoutDashboard } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTime } from '../../hooks/useTime'
import { useTheme } from '../../hooks/useTheme'
import { useServiceStatus } from '../../hooks/useServiceStatus'
import { cn } from '../../lib/utils'
import { PrivatePasswordToggle } from '../PrivatePasswordToggle'
import { PluginSlot } from '../../plugins'

interface HeaderProps {
  onOpenCommand: () => void
  onToggleEditMode?: () => void
  isEditMode?: boolean
  isLoggedIn?: boolean
  username?: string
  onLogout?: () => void
  onPrivateVisibilityChange?: (showPrivate: boolean) => void
}

// 服务状态指示器组件
function ServiceStatusIndicator({ 
  label, 
  isOnline, 
  title 
}: { 
  label: string
  isOnline: boolean
  title: string 
}) {
  return (
    <motion.div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-lg',
        'bg-white/5 border border-white/5',
        'transition-all duration-200'
      )}
      whileHover={{ scale: 1.02 }}
      title={title}
    >
      <div className="relative">
        <div 
          className={cn(
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-red-500'
          )}
        />
        {isOnline && (
          <motion.div
            className="absolute inset-0 w-2 h-2 rounded-full bg-green-500"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </motion.div>
  )
}

export function Header({ onOpenCommand, onToggleEditMode, isEditMode, isLoggedIn, username, onLogout, onPrivateVisibilityChange }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { formattedTime, formattedDate } = useTime()
  const { isDark, toggleDarkMode } = useTheme()
  const { status } = useServiceStatus()

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en'
    i18n.changeLanguage(nextLang)
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* 左侧 - Logo/品牌 */}
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gradient-1)] to-[var(--gradient-2)] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div 
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {formattedTime}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {formattedDate}
            </div>
          </div>
        </motion.div>

        {/* 右侧 - 控制按钮 */}
        <div className="flex items-center gap-2">
          {/* 服务状态指示器 */}
          <div className="flex items-center gap-1 mr-2">
            <ServiceStatusIndicator 
              label="后端" 
              isOnline={status.backend}
              title={`后端服务: ${status.backend ? '正常运行' : '离线'}`}
            />
            <ServiceStatusIndicator 
              label="管理" 
              isOnline={status.manager}
              title={`管理服务: ${status.manager ? '正常运行' : '离线'}`}
            />
            <ServiceStatusIndicator 
              label="前台" 
              isOnline={status.frontend}
              title={`前台服务: ${status.frontend ? '正常运行' : '离线'}`}
            />
          </div>

          {/* 语言切换 */}
          <motion.button
            onClick={toggleLanguage}
            className={cn(
              'p-2.5 rounded-xl',
              'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
              'transition-all duration-200 cursor-pointer'
            )}
            style={{ color: 'var(--text-secondary)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('language_toggle')}
            title={t('language_toggle')}
          >
            <Languages className="w-4 h-4" />
          </motion.button>

          {/* Header 左侧插槽 */}
          <PluginSlot slot="header-left" className="flex items-center gap-2" />

          {/* 私密书签切换 - 对认证用户显示 */}
          <PrivatePasswordToggle onVisibilityChange={onPrivateVisibilityChange} />

          {/* 编辑模式切换 - 仅登录后显示 */}
          {isLoggedIn && (
            <motion.button
              onClick={onToggleEditMode}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                isEditMode 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10'
              )}
              style={{ color: isEditMode ? undefined : 'var(--text-secondary)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t('edit_mode')}
              title={t('edit_mode_tooltip')}
            >
              <Edit3 className="w-4 h-4" />
            </motion.button>
          )}

          {/* Header 右侧插槽 */}
          <PluginSlot slot="header-right" className="flex items-center gap-2" />

          {/* 主题切换 */}
          <motion.button
            onClick={() => toggleDarkMode()}
            className={cn(
              'p-2.5 rounded-xl',
              'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
              'transition-all duration-200 cursor-pointer'
            )}
            style={{ color: 'var(--text-secondary)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('theme_toggle')}
            title={t('theme_toggle')}
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </motion.button>

          {/* 登录/管理后台按钮 - 未登录时显示 */}
          {!isLoggedIn && (
            <motion.a
              href="http://localhost:5174?login=true"
              className={cn(
                'p-2.5 rounded-xl',
                'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
                'transition-all duration-200 cursor-pointer'
              )}
              style={{ color: 'var(--text-secondary)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t('login')}
              title={t('login')}
            >
              <User className="w-4 h-4" />
            </motion.a>
          )}

          {/* 已登录显示用户下拉菜单 */}
          {isLoggedIn && username && (
            <UserDropdown 
              username={username} 
              onLogout={onLogout}
              onOpenCommand={onOpenCommand}
            />
          )}
        </div>
      </div>
    </motion.header>
  )
}

// 用户下拉菜单组件
interface UserDropdownProps {
  username: string
  onLogout?: () => void
  onOpenCommand: () => void
}

function UserDropdown({ username, onLogout, onOpenCommand }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    {
      id: 'bookmarks',
      label: '我的书签',
      icon: BookMarked,
      onClick: () => {
        onOpenCommand()
        setIsOpen(false)
      },
    },
    {
      id: 'admin',
      label: '管理后台',
      icon: LayoutDashboard,
      onClick: () => {
        window.location.href = 'http://localhost:5174'
        setIsOpen(false)
      },
    },
    {
      id: 'settings',
      label: '个人设置',
      icon: Settings,
      onClick: () => {
        // console.log('打开个人设置')
        setIsOpen(false)
      },
    },
    {
      id: 'security',
      label: '安全中心',
      icon: Shield,
      onClick: () => {
        // console.log('打开安全中心')
        setIsOpen(false)
      },
    },
  ]

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl',
          'bg-purple-500/10 border border-purple-500/20',
          'transition-all duration-200 cursor-pointer',
          isOpen && 'bg-purple-500/20 border-purple-500/30'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {username}
        </span>
        <ChevronDown 
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          style={{ color: 'var(--text-secondary)' }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full mt-2 w-48 rounded-xl',
              'bg-[var(--bg-secondary)] border border-[var(--border)]',
              'shadow-lg shadow-black/20',
              'overflow-hidden z-50'
            )}
          >
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {username}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    已登录
                  </div>
                </div>
              </div>
            </div>

            <div className="py-1">
              {menuItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5',
                    'hover:bg-white/5 transition-colors duration-150',
                    'text-left cursor-pointer'
                  )}
                  whileHover={{ x: 2 }}
                >
                  <item.icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>

            <div className="border-t border-[var(--border)]" />

            <div className="py-1">
              <motion.button
                onClick={() => {
                  onLogout?.()
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5',
                  'hover:bg-red-500/10 transition-colors duration-150',
                  'text-left cursor-pointer'
                )}
                whileHover={{ x: 2 }}
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">
                  {t('logout')}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
