import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { ToastProvider } from '../../components/admin/Toast'
import { AdminProvider, useAdmin } from '../../contexts/AdminContext'
import { useAdminTabs } from './hooks/useAdminTabs'
import { BookmarkManager } from './components/BookmarkManager'
import { CategoryManager } from './components/CategoryManager'
import { AnalyticsCard } from '../../components/admin/AnalyticsCard'
import { HealthCheckCard } from '../../components/admin/HealthCheckCard'
import { SettingsPanel } from '../../components/admin/SettingsPanel'
import { IconManager } from '../../components/IconManager'
import type { AdminProps, AdminTabType } from './types'
import type { ThemeId } from '../../hooks/useTheme'
import type { SiteSettings, WidgetVisibility } from '../../lib/api'

export { type AdminProps, type AdminTabType } from './types'

// Quotes 占位组件（原 QuotesCard 需要 quotes 数据）
function QuotesPlaceholder() {
  const { t } = useTranslation()
  return (
    <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
      <p>{t('admin.quotes.coming_soon')}</p>
    </div>
  )
}

// IconManager 包装组件
function IconManagerWrapper() {
  const { customIcons, addCustomIcon, deleteCustomIcon } = useAdmin()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <IconManager
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      customIcons={customIcons}
      onAddIcon={addCustomIcon}
      onDeleteIcon={deleteCustomIcon}
      embedded={true}
    />
  )
}

// SettingsPanel 包装组件
function SettingsPanelWrapper() {
  const {
    bookmarks,
    categories,
    updateSettings,
  } = useAdmin()

  // 本地状态
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({
    siteTitle: '',
    siteFavicon: '',
  })
  const [isSavingSiteSettings, setIsSavingSiteSettings] = useState(false)
  const [siteSettingsSuccess, setSiteSettingsSuccess] = useState(false)
  const [siteSettingsError, setSiteSettingsError] = useState('')

  const [widgetVisibility, setWidgetVisibility] = useState<Partial<WidgetVisibility>>({
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

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [isSavingWallpaperSettings, setIsSavingWallpaperSettings] = useState(false)
  const [wallpaperSettingsSuccess, setWallpaperSettingsSuccess] = useState(false)
  const [wallpaperSettingsError, setWallpaperSettingsError] = useState('')

  // 处理函数
  const handleSiteSettingsChange = (settings: Partial<SiteSettings>) => {
    setSiteSettings(settings)
  }

  const handleSaveSiteSettings = async () => {
    setIsSavingSiteSettings(true)
    try {
      await updateSettings(siteSettings as SiteSettings)
      setSiteSettingsSuccess(true)
    } catch (error) {
      setSiteSettingsError('保存失败')
    } finally {
      setIsSavingSiteSettings(false)
    }
  }

  const handleWidgetVisibilityChange = (visibility: Partial<WidgetVisibility>) => {
    setWidgetVisibility(visibility)
  }

  const handleSaveWidgetSettings = async () => {
    setIsSavingWidgetSettings(true)
    try {
      setWidgetSettingsSuccess(true)
    } catch (error) {
      setWidgetSettingsError('保存失败')
    } finally {
      setIsSavingWidgetSettings(false)
    }
  }

  const handleChangePassword = async (_currentPassword: string, _newPassword: string) => {
    setIsChangingPassword(true)
    try {
      setPasswordSuccess(true)
    } catch (error) {
      setPasswordError('修改失败')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleImport = async (_data: { bookmarks: any[]; categories: any[]; settings: any }) => {
    // await importData(data)
  }

  const handleSaveWallpaperSettings = async () => {
    setIsSavingWallpaperSettings(true)
    try {
      setWallpaperSettingsSuccess(true)
    } catch (error) {
      setWallpaperSettingsError('保存失败')
    } finally {
      setIsSavingWallpaperSettings(false)
    }
  }

  // 默认主题设置
  const themeId: ThemeId = 'nebula'
  const isDark = true
  const autoMode = false

  return (
    <SettingsPanel
      siteSettings={siteSettings as SiteSettings}
      onSiteSettingsChange={handleSiteSettingsChange}
      onSaveSiteSettings={handleSaveSiteSettings}
      isSavingSiteSettings={isSavingSiteSettings}
      siteSettingsSuccess={siteSettingsSuccess}
      siteSettingsError={siteSettingsError}
      themeId={themeId}
      isDark={isDark}
      autoMode={autoMode}
      onThemeChange={() => {}}
      onAutoModeChange={() => {}}
      onToggleDarkMode={() => {}}
      widgetVisibility={widgetVisibility as WidgetVisibility}
      onWidgetVisibilityChange={handleWidgetVisibilityChange}
      onSaveWidgetSettings={handleSaveWidgetSettings}
      isSavingWidgetSettings={isSavingWidgetSettings}
      widgetSettingsSuccess={widgetSettingsSuccess}
      widgetSettingsError={widgetSettingsError}
      onChangePassword={handleChangePassword}
      isChangingPassword={isChangingPassword}
      passwordSuccess={passwordSuccess}
      passwordError={passwordError}
      onClearPasswordError={() => setPasswordError('')}
      onClearPasswordSuccess={() => setPasswordSuccess(false)}
      bookmarks={bookmarks}
      categories={categories}
      onImport={handleImport}
      onFactoryReset={() => {}}
      onSaveWallpaperSettings={handleSaveWallpaperSettings}
      isSavingWallpaperSettings={isSavingWallpaperSettings}
      wallpaperSettingsSuccess={wallpaperSettingsSuccess}
      wallpaperSettingsError={wallpaperSettingsError}
    />
  )
}

// 主 Admin 组件
export default function Admin(props: AdminProps) {
  return (
    <ToastProvider>
      <AdminProvider {...props}>
        <AdminContent {...props} />
      </AdminProvider>
    </ToastProvider>
  )
}

// 内部内容组件
function AdminContent(props: AdminProps) {
  const { t } = useTranslation()
  const { activeTab, navigateToTab } = useAdminTabs('bookmarks')
  const { bookmarks, categories, customIcons, username, onBack, onLogout } = useAdmin()

  // 标签页组件映射
  const tabComponents: Record<AdminTabType, React.ComponentType> = {
    bookmarks: BookmarkManager,
    categories: CategoryManager,
    quotes: QuotesPlaceholder,
    icons: IconManagerWrapper,
    analytics: AnalyticsCard,
    'health-check': HealthCheckCard,
    settings: SettingsPanelWrapper,
  }

  const ActiveComponent = tabComponents[activeTab]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={navigateToTab}
        onBack={onBack}
        onLogout={onLogout}
        bookmarkCount={bookmarks.length}
        categoryCount={categories.length}
        quoteCount={0}
        iconCount={customIcons.length}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t(`admin.nav.${activeTab}_full`)}
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {t('admin.welcome', { username })}
            </p>
          </div>

          {/* Active Tab Content */}
          <ActiveComponent />
        </div>
      </main>
    </div>
  )
}
