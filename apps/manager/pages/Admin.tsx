import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
} from 'lucide-react'
import { Bookmark, Category, CustomIcon } from '../types/bookmark'
import { cn } from '../lib/utils'
import { adminChangePassword, fetchSettings, updateSettings, SiteSettings, WidgetVisibility, importData } from '../lib/api'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { SettingsPanel } from '../components/admin/SettingsPanel'
import { AnalyticsCard } from '../components/admin/AnalyticsCard'
import { ToastProvider, useToast } from '../components/admin/Toast'
import { useTheme, ThemeId } from '../hooks/useTheme.tsx'
import { AdminProvider, useAdmin, useBookmarkActions, useCategoryActions, useIconActions } from '../contexts/AdminContext'
import BookmarksPage from '../modules/bookmarks/pages/BookmarksPage'
import { ImportBookmarksModal } from '../modules/bookmarks/components/ImportBookmarksModal'
import PluginsPage from '../modules/plugins/pages/PluginsPage'
import MenusPage from '../modules/menus/pages/MenusPage'
import UsersPage from '../modules/users/pages/UsersPage'
import SecurityPage from '../modules/security/pages/SecurityPage'
import DockConfigsPage from '../modules/dock/pages/DockConfigsPage'
import { SettingsTabsPage } from '../modules/settings/index.tsx'
import { NavItemsPage } from '../modules/navigation'
import CategoriesPage from '../modules/categories/pages/CategoriesPage'
import SettingsPage from '../modules/settings/pages/SettingsPage'
import ThemePage from '../modules/theme/pages/ThemePage'
import { WallpaperPage } from '../modules/wallpaper'
import BookmarkCardStylesPage from '../modules/bookmark-card-styles'
import { fetchPlugins, fetchAdminMenus } from '../lib/api-client'

// Props 简化为仅外部必需的回调
export interface AdminProps {
  bookmarks: Bookmark[]
  categories: Category[]
  customIcons: CustomIcon[]
  username: string
  onBack: () => void
  onLogout: () => void | Promise<void>
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleReadLater: (id: string) => void
  onUpdateBookmark: (id: string, updates: Partial<Bookmark>) => void
  onAddCategory: (category: Omit<Category, 'id' | 'orderIndex'>) => void
  onUpdateCategory: (id: string, updates: Partial<Category>) => void
  onDeleteCategory: (id: string) => void
  onReorderCategories: (categories: Category[]) => void
  onAddCustomIcon: (icon: Omit<CustomIcon, 'id' | 'createdAt'>) => void
  onDeleteCustomIcon: (id: string) => void
  onRefreshData?: () => void
  onQuotesUpdate?: (quotes: string[], useDefault: boolean) => void
  onSettingsChange?: (settings: SiteSettings) => void
}

function AdminContent() {
  const { t } = useTranslation()
  // 从 Context 获取数据和操作
  const { 
    bookmarks,
    categories,
    customIcons,
    onBack, 
    onLogout,
    updateSettings: onSettingsChange,
    isAddModalOpen,
    setIsAddModalOpen,
    editingBookmark,
    setEditingBookmark,
  } = useAdmin()
  
  const { 
    addBookmark: onAddBookmark, 
  } = useBookmarkActions()
  
  const {
    addCategory: onAddCategory,
    updateCategory: onUpdateCategory,
    deleteCategory: onDeleteCategory,
    reorderCategories: onReorderCategories,
  } = useCategoryActions()

  const {
    addCustomIcon: onAddCustomIcon,
    deleteCustomIcon: onDeleteCustomIcon,
  } = useIconActions()

  const { showToast } = useToast()
  const { themeId, isDark, setTheme, toggleDarkMode, autoMode, setAutoMode } = useTheme()
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'categories' | 'analytics' | 'settings' | 'plugins' | 'menus' | 'users' | 'security' | 'theme' | 'wallpaper' | 'dock' | 'settings-tabs' | 'nav-items' | 'bookmark-card-styles'>('bookmarks')
  
  // 密码修改状态
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // 站点设置状态
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: 'Nexus',
    siteFavicon: '',
    enableBeamAnimation: true,
    widgetVisibility: {
      systemMonitor: true,
      hardwareIdentity: true,
      vitalSigns: true,
      networkTelemetry: true,
      processMatrix: true,
      dockMiniMonitor: true,
      mobileTicker: true,
    },
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  // 仪表设置状态
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  })
  const [isSavingWidgetSettings, setIsSavingWidgetSettings] = useState(false)
  const [widgetSettingsSuccess, setWidgetSettingsSuccess] = useState(false)
  const [widgetSettingsError, setWidgetSettingsError] = useState('')

  // 导入书签弹窗状态
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // 加载站点设置
  useEffect(() => {
    fetchSettings().then(settings => {
      setSiteSettings(settings)
      // 同步仪表显示设置
      if (settings.widgetVisibility) {
        setWidgetVisibility(settings.widgetVisibility)
      }
    }).catch(console.error)

    fetchPlugins().then(data => {
      setPluginCount(data.length)
    }).catch(console.error)

    fetchAdminMenus().then(data => {
      setMenuCount(data.length)
    }).catch(console.error)
  }, [])

  // 修改密码
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    setIsChangingPassword(true)
    
    try {
      await adminChangePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      showToast('success', t('admin.settings.security.changed'))
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.message || '修改密码失败')
      throw err
    } finally {
      setIsChangingPassword(false)
    }
  }

  // 保存站点设置
  const handleSaveSettings = async () => {
    setSettingsError('')
    setSettingsSuccess(false)
    setIsSavingSettings(true)
    
    try {
      const updated = await updateSettings(siteSettings)
      setSiteSettings(updated)
      setSettingsSuccess(true)
      showToast('success', t('admin.settings.site.saved'))
      
      // 通知父组件更新设置（实时生效）
      onSettingsChange(updated)
      
      // 更新页面标题
      if (updated.siteTitle) {
        document.title = updated.siteTitle
      }
      
      // 更新 favicon
      if (updated.siteFavicon) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (link) {
          link.href = updated.siteFavicon
        } else {
          const newLink = document.createElement('link')
          newLink.rel = 'icon'
          newLink.href = updated.siteFavicon
          document.head.appendChild(newLink)
        }
      }
      
      setTimeout(() => setSettingsSuccess(false), 3000)
    } catch (err: any) {
      setSettingsError(err.message || t('admin.settings.data.export_error'))
      showToast('error', t('admin.settings.data.export_error'))
    } finally {
      setIsSavingSettings(false)
    }
  }

  // 保存仪表设置
  const handleSaveWidgetSettings = async () => {
    setWidgetSettingsError('')
    setWidgetSettingsSuccess(false)
    setIsSavingWidgetSettings(true)
    
    try {
      const updatedSettings = {
        ...siteSettings,
        widgetVisibility,
      }
      const updated = await updateSettings(updatedSettings)
      setSiteSettings(updated)
      if (updated.widgetVisibility) {
        setWidgetVisibility(updated.widgetVisibility)
      }
      setWidgetSettingsSuccess(true)
      showToast('success', t('admin.settings.widget.saved'))
      
      // 通知父组件更新设置（实时生效）
      onSettingsChange(updated)
      
      setTimeout(() => setWidgetSettingsSuccess(false), 3000)
    } catch (err: any) {
      setWidgetSettingsError(err.message || t('admin.settings.data.export_error'))
      showToast('error', t('admin.settings.data.export_error'))
    } finally {
      setIsSavingWidgetSettings(false)
    }
  }

  // Tab titles for header
  const tabTitles: Record<string, string> = {
    bookmarks: t('admin.nav.bookmarks_full'),
    categories: t('admin.nav.categories_full'),
    analytics: t('admin.nav.analytics_full'),
    plugins: '插件中心',
    menus: '菜单管理',
    users: '用户管理',
    security: '安全管理',
    settings: t('admin.nav.settings_full'),
    dock: 'Dock配置',
    'settings-tabs': '设置标签管理',
    'nav-items': '前端导航管理',
    theme: '主题管理',
    wallpaper: '壁纸设置',
  }

  const [pluginCount, setPluginCount] = useState(0)
  const [menuCount, setMenuCount] = useState(0)
  const [userCount] = useState(0)

  return (
    <div 
      className="flex h-screen font-sans overflow-hidden transition-colors duration-500"
      style={{ 
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-14 pb-20 md:pt-0 md:pb-0 overflow-hidden">
        {/* Background Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{ background: 'var(--color-bg-gradient)' }}
        />
        
        <div className="relative flex flex-col h-full p-4 md:p-8">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10 flex-shrink-0"
          >
            <div>
              <h1 
                className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(to right, var(--color-text-primary), var(--color-text-muted))` 
                }}
              >
                {tabTitles[activeTab]}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {activeTab === 'bookmarks' && t('admin.stats.total_bookmarks', { count: (bookmarks || []).length })}
                {activeTab === 'categories' && t('admin.stats.total_categories', { count: (categories || []).length })}
                {activeTab === 'analytics' && t('admin.stats.view_analytics')}
                {activeTab === 'settings' && t('admin.stats.manage_config')}
                {activeTab === 'plugins' && `共 ${pluginCount} 个插件`}
                {activeTab === 'menus' && `共 ${menuCount} 个菜单`}
                {activeTab === 'users' && '用户管理'}
                {activeTab === 'security' && '系统安全管理'}
                {activeTab === 'dock' && `Dock导航配置`}
              </p>
            </div>

            {activeTab === 'bookmarks' && (
              <motion.button
                onClick={() => setIsImportModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-white font-medium shadow-lg text-sm md:text-base w-full sm:w-auto justify-center"
                style={{ 
                  background: `linear-gradient(to right, var(--color-primary), var(--color-accent))`,
                  boxShadow: '0 4px 20px var(--color-glow)',
                }}
              >
                <Plus className="w-4 h-4" />
                导入书签
              </motion.button>
            )}
          </motion.header>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative min-h-0">
            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div className="h-full overflow-auto">
                <BookmarksPage />
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="h-full overflow-auto">
                <CategoriesPage />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="h-full overflow-auto max-w-5xl">
                <AnalyticsCard onShowToast={showToast} />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="h-full overflow-auto max-w-6xl">
                <SettingsPage />
              </div>
            )}

            {/* Plugins Tab */}
            {activeTab === 'plugins' && (
              <div className="h-full overflow-auto">
                <PluginsPage />
              </div>
            )}

            {/* Menus Tab */}
            {activeTab === 'menus' && (
              <div className="h-full overflow-auto">
                <MenusPage />
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="h-full overflow-auto">
                <UsersPage />
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="h-full overflow-auto">
                <SecurityPage />
              </div>
            )}

            {/* Dock Tab */}
            {activeTab === 'dock' && (
              <div className="h-full overflow-auto">
                <DockConfigsPage />
              </div>
            )}

            {/* Settings Tabs Tab */}
            {activeTab === 'settings-tabs' && (
              <div className="h-full overflow-auto">
                <SettingsTabsPage />
              </div>
            )}

            {/* Nav Items Tab */}
            {activeTab === 'nav-items' && (
              <div className="h-full overflow-auto">
                <NavItemsPage />
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <div className="h-full overflow-auto">
                <ThemePage />
              </div>
            )}

            {/* Wallpaper Tab */}
            {activeTab === 'wallpaper' && (
              <div className="h-full overflow-auto">
                <WallpaperPage />
              </div>
            )}

            {/* Bookmark Card Styles Tab */}
            {activeTab === 'bookmark-card-styles' && (
              <div className="h-full overflow-auto">
                <BookmarkCardStylesPage />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 导入书签弹窗 */}
      <ImportBookmarksModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          // 刷新书签列表
          window.location.reload()
        }}
      />
    </div>
  )
}

// 导出带 Provider 的组件
export function Admin(props: AdminProps) {
  return (
    <AdminProvider
      bookmarks={props.bookmarks}
      categories={props.categories}
      customIcons={props.customIcons}
      username={props.username}
      onBack={props.onBack}
      onLogout={props.onLogout}
      onAddBookmark={props.onAddBookmark}
      onEditBookmark={props.onEditBookmark}
      onDeleteBookmark={props.onDeleteBookmark}
      onTogglePin={props.onTogglePin}
      onToggleReadLater={props.onToggleReadLater}
      onUpdateBookmark={props.onUpdateBookmark}
      onAddCategory={props.onAddCategory}
      onUpdateCategory={props.onUpdateCategory}
      onDeleteCategory={props.onDeleteCategory}
      onReorderCategories={props.onReorderCategories}
      onAddCustomIcon={props.onAddCustomIcon}
      onDeleteCustomIcon={props.onDeleteCustomIcon}
      onRefreshData={props.onRefreshData}
      onQuotesUpdate={props.onQuotesUpdate}
      onSettingsChange={props.onSettingsChange}
    >
      <ToastProvider>
        <AdminContent />
      </ToastProvider>
    </AdminProvider>
  )
}