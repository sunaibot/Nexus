import { useState, useEffect, useRef, useCallback, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
  Menu,
  X,
  BarChart3,
  Puzzle,
  Users,
  Layout,
  BookMarked,
  Folder,
  ClipboardList,
  Shield,
  Palette as PaletteIcon,
  Image as ImageIcon,
  Server,
  Activity,
  FileCode,
  type LucideIcon
} from 'lucide-react'
import { MobileFloatingDock } from '../ui/mobile-floating-dock'
import { fetchAdminMenus, fetchMenuStats, type AdminMenu, type MenuStats } from '../../lib/api-client'
import request, { getAuthToken } from '../../lib/api-client/client'

type TabType = 'bookmarks' | 'categories' | 'analytics' | 'plugins' | 'menus' | 'users' | 'security' | 'settings' | 'theme' | 'wallpaper' | 'dock' | 'settings-tabs' | 'nav-items'

interface AdminSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onBack: () => void
  onLogout: () => void
}

const iconMap: Record<string, LucideIcon> = {
  BookMarked,
  Bookmark,
  FolderOpen,
  Folder,
  Settings,
  BarChart3,
  Puzzle,
  Users,
  Layout,
  ClipboardList,
  Shield,
  Palette: PaletteIcon,
  Image: ImageIcon,
}

const LIQUID_SPRING = {
  capsule: { type: 'spring' as const, stiffness: 180, damping: 35 },
  magneticAttract: { type: 'spring' as const, stiffness: 200, damping: 25 },
  magneticRelease: { type: 'spring' as const, stiffness: 120, damping: 12, mass: 1.2 },
  breath: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
  enter: { type: 'spring' as const, stiffness: 200, damping: 28 },
}

const a11yTextShadow = {
  primary: { textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.3)' },
  secondary: { textShadow: '0 1px 2px rgba(0,0,0,0.4)' },
  icon: { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' },
}

function useMagneticEffect(strength: number = 3) {
  const ref = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = (e.clientX - centerX) / (rect.width / 2)
    const deltaY = (e.clientY - centerY) / (rect.height / 2)
    
    setOffset({
      x: deltaX * strength,
      y: deltaY * strength,
    })
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 })
    setIsHovering(false)
  }

  return { ref, offset, isHovering, handleMouseMove, handleMouseLeave }
}

interface NavItemProps {
  item: AdminMenu
  isActive: boolean
  count: number | null
  onClick: () => void
  index: number
}

function NavItem({ item, isActive, count, onClick, index }: NavItemProps) {
  const { ref, offset, isHovering, handleMouseMove, handleMouseLeave } = useMagneticEffect(3)

  const magneticTransition = isHovering 
    ? LIQUID_SPRING.magneticAttract 
    : LIQUID_SPRING.magneticRelease

  const Icon = item.icon ? (iconMap[item.icon] || Settings) : Settings

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, ...LIQUID_SPRING.enter }}
      className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl group"
    >
      {isActive && (
        <motion.div
          layoutId="glowingCapsule"
          initial={false}
          className="absolute inset-0 rounded-xl overflow-hidden"
          transition={LIQUID_SPRING.capsule}
        >
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--color-glass-hover)' }} />
          <div className="absolute inset-0 rounded-xl border" style={{ borderColor: 'var(--color-glass-border)' }} />
          <motion.div 
            className="absolute top-0 left-1/4 right-1/4 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={LIQUID_SPRING.breath}
          />
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-full"
            style={{
              background: 'linear-gradient(180deg, var(--color-accent), var(--color-primary))',
              boxShadow: '0 0 10px var(--color-glow), 0 0 20px var(--color-glow-secondary)',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              height: ['28px', '32px', '28px'],
            }}
            transition={LIQUID_SPRING.breath}
          />
          <motion.div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 20% 50%, var(--color-glow), transparent)',
            }}
            animate={{
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={LIQUID_SPRING.breath}
          />
        </motion.div>
      )}

      <motion.div
        animate={{
          x: isActive ? 0 : offset.x,
          y: isActive ? 0 : offset.y,
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
        }}
        transition={magneticTransition}
        className="relative z-10"
      >
        <Icon className="w-5 h-5" />
      </motion.div>
      
      <motion.span 
        animate={{
          x: isActive ? 0 : offset.x,
          y: isActive ? 0 : offset.y,
          color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        }}
        transition={magneticTransition}
        className="relative z-10 font-medium text-sm"
      >
        {item.name}
      </motion.span>
      
      {count !== null && (
        <motion.span 
          animate={{
            x: isActive ? 0 : offset.x * 0.3,
            background: isActive ? 'var(--color-glow)' : 'var(--color-glass)',
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}
          transition={magneticTransition}
          className="relative z-10 ml-auto text-xs px-2 py-0.5 rounded-full border"
          style={{ borderColor: 'var(--color-glass-border)' }}
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  )
}

// 服务状态类型
interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'checking'
  latency?: number
  lastChecked: Date
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  onBack,
  onLogout,
}: AdminSidebarProps) {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menus, setMenus] = useState<AdminMenu[]>([])
  const [menuStats, setMenuStats] = useState<MenuStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // 服务状态
  const [serverStatus, setServerStatus] = useState<ServiceStatus>({
    name: '后端服务',
    status: 'checking',
    lastChecked: new Date()
  })
  const [managerStatus, setManagerStatus] = useState<ServiceStatus>({
    name: '管理服务',
    status: 'checking',
    lastChecked: new Date()
  })

  // 检测后端服务状态 - 使用 useCallback 避免重复创建
  const checkServerStatus = useCallback(async () => {
    const startTime = Date.now()
    try {
      // 使用 ping 端点检测后端是否在线（无限制流）
      await request('/v2/ping', { method: 'GET' })
      const latency = Date.now() - startTime
      setServerStatus(prev => ({
        ...prev,
        status: 'online',
        latency,
        lastChecked: new Date()
      }))
    } catch (error) {
      console.error('Backend status check failed:', error)
      setServerStatus(prev => ({
        ...prev,
        status: 'offline',
        lastChecked: new Date()
      }))
    }
  }, [])

  // 检测管理服务状态（当前页面就是管理服务，主要检测自身运行状态）
  const checkManagerStatus = useCallback(() => {
    // 管理服务就是当前页面，如果代码能执行到这里，说明是在运行中
    // 但我们也可以检测一些关键资源是否加载成功
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const loadTime = navigationEntries.length > 0 
      ? Math.round(navigationEntries[0].loadEventEnd - navigationEntries[0].startTime)
      : undefined
    
    setManagerStatus(prev => ({
      ...prev,
      status: 'online',
      latency: loadTime,
      lastChecked: new Date()
    }))
  }, [])

  // 刷新菜单统计
  const refreshMenuStats = useCallback(async () => {
    try {
      const statsData = await fetchMenuStats()
      setMenuStats(statsData)
    } catch (error) {
      console.error('Failed to refresh menu stats:', error)
    }
  }, [])

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const [menusData, statsData] = await Promise.all([
          fetchAdminMenus(),
          fetchMenuStats()
        ])
        console.log('Loaded menus:', menusData)
        console.log('Loaded menu stats:', statsData)
        
        if (Array.isArray(menusData)) {
          // 兼容后端返回的数据结构：如果字段不存在，使用默认值
          setMenus(menusData.filter(m => {
            const isEnabled = m.isEnabled !== undefined ? m.isEnabled : true
            const isVisible = m.isVisible !== undefined ? m.isVisible : true
            return isEnabled && isVisible && m.path
          }).sort((a, b) => {
            const orderA = a.orderIndex !== undefined ? a.orderIndex : 0
            const orderB = b.orderIndex !== undefined ? b.orderIndex : 0
            return orderA - orderB
          }))
        } else {
          console.error('Menus data is not an array:', menusData)
          setMenus([])
        }
        
        setMenuStats(statsData)
      } catch (error) {
        console.error('Failed to load menus:', error)
        setMenus([])
      } finally {
        setIsLoading(false)
      }
    }
    loadMenus()
    
    // 初始检测服务状态
    checkServerStatus()
    checkManagerStatus()
    
    // 定时检测服务状态（每30秒）
    const interval = setInterval(() => {
      checkServerStatus()
      checkManagerStatus()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [checkServerStatus, checkManagerStatus])

  // 当切换到书签或分类页面时，刷新统计
  useEffect(() => {
    if (activeTab === 'bookmarks' || activeTab === 'categories') {
      refreshMenuStats()
    }
  }, [activeTab, refreshMenuStats])

  const getCount = (id: string): number | null => {
    if (!menuStats) return null
    return menuStats[id] ?? null
  }

  const handleTabChange = (tab: TabType) => {
    onTabChange(tab)
    setMobileMenuOpen(false)
  }

  if (isLoading) {
    return null
  }

  return (
    <>
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={LIQUID_SPRING.enter}
        className="hidden md:flex w-64 h-screen flex-col relative"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        {/* 玻璃效果背景 */}
        <div 
          className="absolute inset-0 backdrop-blur-xl" 
          style={{ background: 'var(--color-glass)' }}
        />
        
        {/* 主题渐变光效 */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 120% 80% at 50% 30%, var(--color-glow-secondary), transparent 50%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={LIQUID_SPRING.breath}
        />
        
        {/* 右侧发光线条 */}
        <motion.div 
          className="absolute right-0 top-[10%] bottom-[10%] w-[1px]"
          style={{
            background: 'linear-gradient(180deg, transparent, var(--color-primary), var(--color-accent), transparent)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={LIQUID_SPRING.breath}
        />
        
        {/* 顶部发光线条 */}
        <motion.div 
          className="absolute top-0 left-[20%] right-[20%] h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={LIQUID_SPRING.breath}
        />

        <div className="relative p-6 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div 
                className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-glow-secondary), var(--color-glow))',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              </motion.div>
              <motion.div 
                className="absolute -inset-3 rounded-xl blur-xl -z-10"
                style={{ 
                  background: 'radial-gradient(circle, var(--color-glow), transparent)',
                }}
                animate={{
                  opacity: [0.2, 0.45, 0.2],
                  scale: [0.9, 1.05, 0.9],
                }}
                transition={LIQUID_SPRING.breath}
              />
            </div>
            <div>
              <h1 
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t('admin.console')}
              </h1>
              <p 
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Nexus
              </p>
            </div>
          </div>
          
          {/* 服务状态指示器 */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
            <div className="flex items-center gap-3">
              {/* 后端服务状态 */}
              <div className="flex items-center gap-1.5" title={`后端服务: ${serverStatus.status === 'online' ? '运行中' : serverStatus.status === 'offline' ? '离线' : '检测中'}${serverStatus.latency ? ` (${serverStatus.latency}ms)` : ''}`}>
                <div className={`w-2 h-2 rounded-full ${
                  serverStatus.status === 'online' ? 'bg-green-500' : 
                  serverStatus.status === 'offline' ? 'bg-red-500' : 
                  'bg-yellow-500 animate-pulse'
                }`} />
                <Server className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {serverStatus.status === 'online' ? '后端在线' : 
                   serverStatus.status === 'offline' ? '后端离线' : 
                   '检测中'}
                </span>
              </div>
              
              {/* 分隔符 */}
              <div className="w-px h-3" style={{ background: 'var(--color-border)' }} />
              
              {/* 管理服务状态 */}
              <div className="flex items-center gap-1.5" title={`管理服务: ${managerStatus.status === 'online' ? '运行中' : '离线'}${managerStatus.latency ? ` (加载${managerStatus.latency}ms)` : ''}`}>
                <div className={`w-2 h-2 rounded-full ${
                  managerStatus.status === 'online' ? 'bg-green-500' : 
                  managerStatus.status === 'offline' ? 'bg-red-500' : 
                  'bg-yellow-500 animate-pulse'
                }`} />
                <Activity className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {managerStatus.status === 'online' ? '管理在线' : 
                   managerStatus.status === 'offline' ? '管理离线' : 
                   '检测中'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 p-4 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : menus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <span className="text-destructive text-lg">!</span>
              </div>
              <p className="text-sm text-muted-foreground">菜单加载失败</p>
              <p className="text-xs text-muted-foreground/60 mt-1">请检查后端服务状态</p>
            </div>
          ) : (
            menus.map((item, index) => {
              const path = item.path as string
              return (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === path}
                  count={getCount(path)}
                  onClick={() => handleTabChange(path as TabType)}
                  index={index}
                />
              )
            })
          )}
        </nav>

        <div className="relative p-4 space-y-1 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
          <motion.a
            href={`/api/v2/docs?token=${getAuthToken() || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: -4, color: 'var(--color-text-secondary)', background: 'var(--color-glass-hover)' }}
            transition={LIQUID_SPRING.magneticRelease}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <FileCode className="w-5 h-5" />
            <span className="text-sm font-medium">API 文档</span>
          </motion.a>

          <motion.button
            onClick={onBack}
            whileHover={{ x: -4, color: 'var(--color-text-secondary)', background: 'var(--color-glass-hover)' }}
            transition={LIQUID_SPRING.magneticRelease}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('admin.back_to_home')}</span>
          </motion.button>

          <motion.button
            onClick={() => {
              if (confirm(t('admin.logout_confirm'))) {
                onLogout()
              }
            }}
            whileHover={{ scale: 1.01, color: '#f87171', background: 'rgba(239, 68, 68, 0.06)' }}
            whileTap={{ scale: 0.99 }}
            transition={LIQUID_SPRING.magneticRelease}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{ color: 'rgba(248, 113, 113, 0.7)' }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">{t('admin.logout')}</span>
          </motion.button>
        </div>
      </motion.aside>

      <div 
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-xl border-b border-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, var(--color-glow-secondary), var(--color-glow))',
              border: '1px solid var(--color-glass-border)',
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          </div>
          <span 
            className="font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('admin.console')}
          </span>
        </div>
        
        <motion.button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg text-white/70 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
          aria-label={mobileMenuOpen ? t('common.close') : t('common.edit')}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={LIQUID_SPRING.capsule}
              className="md:hidden fixed top-14 left-4 right-4 z-40 p-4 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/[0.06] overflow-hidden"
            >
              <motion.div 
                className="absolute top-0 left-1/4 right-1/4 h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.3), transparent)',
                }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={LIQUID_SPRING.breath}
              />
              
              <nav className="space-y-1">
                {menus.map((item) => {
                  const path = item.path as string
                  const isActive = activeTab === path
                  const count = getCount(path)
                  
                  const Icon = item.icon ? (iconMap[item.icon] || Settings) : Settings
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleTabChange(path as TabType)}
                      whileTap={{ scale: 0.98 }}
                      className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobileGlowingCapsule"
                          initial={false}
                          className="absolute inset-0 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                          transition={LIQUID_SPRING.capsule}
                        />
                      )}
                      <Icon 
                        className="w-5 h-5 relative z-10"
                        style={{ 
                          color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        }}
                      />
                      <span 
                        className="font-medium text-sm relative z-10"
                        style={{ 
                          color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {item.name}
                      </span>
                      {count !== null && (
                        <span 
                          className="ml-auto text-xs px-2 py-0.5 rounded-full relative z-10"
                          style={{
                            background: isActive ? 'var(--color-glow)' : 'var(--color-glass)',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </nav>

              <div className="mt-4 pt-4 space-y-1 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <motion.a
                  href={`/api/v2/docs?token=${getAuthToken() || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <FileCode className="w-5 h-5" />
                  <span className="text-sm font-medium">API 文档</span>
                </motion.a>

                <motion.button
                  onClick={() => {
                    onBack()
                    setMobileMenuOpen(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('admin.back_to_home')}</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    if (confirm(t('admin.logout_confirm'))) {
                      onLogout()
                    }
                    setMobileMenuOpen(false)
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{ color: 'rgba(248, 113, 113, 0.7)' }}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('admin.logout')}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MobileFloatingDock
        className="md:hidden"
        items={menus.map(item => {
          const path = item.path as string
          const Icon = item.icon ? (iconMap[item.icon] || Settings) : Settings
          return {
            id: path,
            label: item.name,
            icon: Icon,
            onClick: () => onTabChange(path as TabType),
            isActive: activeTab === path,
          }
        })}
      />
    </>
  )
}
