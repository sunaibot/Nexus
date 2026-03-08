import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Home, Code, Bot, BookOpen, Wrench, BookMarked } from 'lucide-react'
import { Tab } from '../types/tab'
import { cn } from '../lib/utils'
import { IconRenderer } from './IconRenderer'

interface TabSidebarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabChange: (tabId: string) => void
  onAddTab?: () => void
  isEditMode?: boolean
  readLaterCount?: number
}

// 默认图标映射
const defaultIcons: Record<string, React.ReactNode> = {
  'Home': <Home className="w-5 h-5" />,
  'Code': <Code className="w-5 h-5" />,
  'Bot': <Bot className="w-5 h-5" />,
  'BookOpen': <BookOpen className="w-5 h-5" />,
  'Wrench': <Wrench className="w-5 h-5" />,
}

export function TabSidebar({
  tabs,
  activeTabId,
  onTabChange,
  onAddTab,
  isEditMode = false,
  readLaterCount = 0,
}: TabSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 稍后阅读虚拟 TAB ID
  const READ_LATER_TAB_ID = '__read_later__'

  return (
    <motion.div
      initial={{ x: -80 }}
      animate={{ x: 0 }}
      className={cn(
        'fixed left-0 top-0 h-full z-40',
        'flex flex-col items-center',
        'bg-[var(--card)]/80 backdrop-blur-xl',
        'border-r border-[var(--border)]',
        'transition-all duration-300 ease-out',
        isExpanded ? 'w-48' : 'w-16'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo/Avatar 区域 */}
      <div className="w-full py-6 flex justify-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          N
        </div>
      </div>

      {/* Tab 列表 */}
      <div className="flex-1 w-full flex flex-col gap-1 px-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const Icon = tab.icon ? defaultIcons[tab.icon] : null

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                'transition-all duration-200',
                'hover:bg-[var(--hover)]',
                isActive && 'bg-[var(--active)]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* 图标 */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                  'transition-colors duration-200',
                  isActive ? 'text-white' : 'text-[var(--text-secondary)]'
                )}
                style={{
                  backgroundColor: isActive ? tab.color || '#3B82F6' : 'transparent',
                }}
              >
                {Icon || <IconRenderer icon={tab.icon} className="w-5 h-5" />}
              </div>

              {/* 名称 - 仅在展开时显示 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className={cn(
                      'text-sm font-medium whitespace-nowrap overflow-hidden',
                      isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {tab.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* 激活指示器 */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute left-0 w-1 h-8 rounded-r-full"
                  style={{ backgroundColor: tab.color || '#3B82F6' }}
                />
              )}
            </motion.button>
          )
        })}

        {/* 添加 Tab 按钮 - 仅在编辑模式显示 */}
        {isEditMode && (
          <motion.button
            onClick={onAddTab}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
              'border border-dashed border-[var(--border)]',
              'text-[var(--text-muted)]',
              'hover:bg-[var(--hover)] hover:text-[var(--text-secondary)]',
              'transition-all duration-200'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  添加 Tab
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* 稍后阅读虚拟 TAB - 当有稍后阅读书签时显示 */}
        {readLaterCount > 0 && (
          <motion.button
            onClick={() => onTabChange(READ_LATER_TAB_ID)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
              'transition-all duration-200',
              'hover:bg-[var(--hover)]',
              activeTabId === READ_LATER_TAB_ID && 'bg-[var(--active)]'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* 图标 */}
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                'transition-colors duration-200',
                activeTabId === READ_LATER_TAB_ID ? 'text-white' : 'text-[var(--text-secondary)]'
              )}
              style={{
                backgroundColor: activeTabId === READ_LATER_TAB_ID ? '#F97316' : 'transparent',
              }}
            >
              <BookMarked className="w-5 h-5" />
            </div>

            {/* 名称 - 仅在展开时显示 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className={cn(
                    'text-sm font-medium whitespace-nowrap overflow-hidden flex-1',
                    activeTabId === READ_LATER_TAB_ID ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  )}
                >
                  稍后阅读
                </motion.span>
              )}
            </AnimatePresence>

            {/* 数量徽章 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium"
                >
                  {readLaterCount}
                </motion.span>
              )}
            </AnimatePresence>

            {/* 激活指示器 */}
            {activeTabId === READ_LATER_TAB_ID && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute left-0 w-1 h-8 rounded-r-full bg-orange-500"
              />
            )}
          </motion.button>
        )}
      </div>

      {/* 底部操作区 - 已移除管理 Tab 按钮，统一在管理后台管理 */}
      <div className="w-full py-4 px-2 flex flex-col gap-1">
        {/* 预留空间或添加其他快捷操作 */}
      </div>
    </motion.div>
  )
}
