import { motion } from 'framer-motion'
import { Sun, Moon, Edit3, Sparkles, Languages, User, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTime } from '../hooks/useTime'
import { useTheme } from '../hooks/useTheme'
import { useServiceStatus } from '../hooks/useServiceStatus'
import { cn } from '../lib/utils'
import { PrivatePasswordToggle } from './PrivatePasswordToggle'

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

  // 切换语言：在 'en' 和 'zh' 之间循环
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

          {/* 私密书签切换 - 仅登录后显示 */}
          {isLoggedIn && (
            <PrivatePasswordToggle onVisibilityChange={onPrivateVisibilityChange} />
          )}

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
              href="http://localhost:5174"
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

          {/* 已登录显示用户名和退出按钮 */}
          {isLoggedIn && username && (
            <>
              <motion.div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl',
                  'bg-purple-500/10 border border-purple-500/20',
                  'transition-all duration-200'
                )}
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {username}
                </span>
              </motion.div>
              
              <motion.button
                onClick={onLogout}
                className={cn(
                  'p-2.5 rounded-xl',
                  'bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20',
                  'transition-all duration-200 cursor-pointer'
                )}
                style={{ color: 'var(--text-secondary)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={t('logout')}
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
