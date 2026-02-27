import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { BookmarkGrid } from './components/BookmarkGrid'
import { AddBookmarkModal } from './components/AddBookmarkModal'
import { AdminLogin } from './components/AdminLogin'
import { ForcePasswordChange } from './components/ForcePasswordChange'
import { CommandPalette } from './components/CommandPalette'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HeroSection } from './components/home/HeroSection'
import { HeroCard } from './components/HeroCard'
import { EmptyState } from './components/home/EmptyState'
import { ReadLaterSection } from './components/home/ReadLaterSection'
import { SystemMonitorCard } from './components/SystemMonitorCard'
import { HardwareIdentityCard } from './components/HardwareIdentityCard'
import { HardwareSpecsCard } from './components/HardwareSpecsCard'
import { VitalSignsCard } from './components/VitalSignsCard'
import { NetworkTelemetryCard } from './components/NetworkTelemetryCard'
import { useBookmarkStore } from './hooks/useBookmarkStore'
import { useAuth } from './hooks/useAuth'
import { useThemeContext } from './hooks/useTheme'
import { useSiteSettings } from './hooks/useSiteSettings'
import { useTime } from './hooks/useTime'
import { useWeather } from './hooks/useWeather'
import { cn } from './lib/utils'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Admin } from './pages/Admin'
import { Bookmark } from './types/bookmark'

function ManagerRedirect() {
  const location = useLocation()
  
  useEffect(() => {
    if (location.pathname.includes('manager')) {
      window.location.href = 'http://localhost:5174'
    }
  }, [location])
  
  return null
}

function HomePage() {
  const { 
    bookmarks, 
    categories, 
    customIcons, 
    isLoading, 
    addBookmark, 
    updateBookmark, 
    deleteBookmark, 
    togglePin, 
    toggleReadLater, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    reorderCategories, 
    addCustomIcon, 
    deleteCustomIcon, 
    refreshData 
  } = useBookmarkStore()
  
  const { 
    currentPage, 
    adminUsername, 
    isLoggedIn, 
    setCurrentPage, 
    handleAdminLogin, 
    handlePasswordChangeSuccess, 
    handleAdminLogout 
  } = useAuth()
  
  const { isDark, setTheme, themeId } = useThemeContext()
  const { isLiteMode, siteSettings, settingsLoaded, widgetVisibility } = useSiteSettings()
  
  // 同步站点主题设置
  useEffect(() => {
    if (settingsLoaded && siteSettings.themeId && siteSettings.themeId !== themeId) {
      console.log('[App] Syncing theme from siteSettings:', siteSettings.themeId)
      setTheme(siteSettings.themeId as any)
    }
  }, [settingsLoaded, siteSettings.themeId, themeId, setTheme])
  const { formattedTime, formattedDate, lunarDate, greeting } = useTime()
  const { weather, loading: weatherLoading, refresh: refreshWeather } = useWeather()
  
  // 获取壁纸设置
  const wallpaper = siteSettings.wallpaper
  const hasWallpaper = wallpaper?.enabled && (wallpaper?.imageUrl || wallpaper?.imageData)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedCategory] = useState<string>('all')
  const [searchQuery] = useState('')
  const [showPrivateBookmarks, setShowPrivateBookmarks] = useState(false)

  // 登出时自动退出编辑模式
  useEffect(() => {
    if (!isLoggedIn) {
      setIsEditMode(false)
    }
  }, [isLoggedIn])

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'uncategorized' ? !bookmark.category : bookmark.category === selectedCategory) ||
      (selectedCategory === 'read-later' ? bookmark.isReadLater : true)
    
    const matchesSearch = searchQuery === '' || 
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // 私密书签过滤：如果未验证通过，不显示私密书签
    const matchesPrivate = bookmark.visibility !== 'private' || showPrivateBookmarks
    
    return matchesCategory && matchesSearch && matchesPrivate
  })

  const readLaterBookmarks = bookmarks.filter(b => b.isReadLater)
  const pinnedBookmark = bookmarks.find(b => b.isPinned) || null

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = bookmarks.findIndex(b => b.id === active.id)
    const newIndex = bookmarks.findIndex(b => b.id === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      arrayMove(bookmarks, oldIndex, newIndex)
    }
  }, [bookmarks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleLogin = async (username: string) => {
    handleAdminLogin(username, false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(!showCommandPalette)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCommandPalette])

  const handleMarkRead = (id: string) => {
    toggleReadLater(id)
  }

  const handleRemoveBookmark = (id: string) => {
    deleteBookmark(id)
  }

  const handleAddBookmarkFromPalette = (_url: string) => {
    setShowCommandPalette(false)
    setShowAddModal(true)
  }

  const handleCategoryAdded = (category: any) => {
    addCategory(category)
  }

  const handleAdminAddBookmark = () => {
    setShowAddModal(true)
  }

  const handleAdminEditBookmark = (_bookmark: Bookmark) => {
    setShowAddModal(true)
  }

  const handleBookmarkEdit = (_bookmark: Bookmark) => {
    setShowAddModal(true)
  }

  const handleOpenSearch = () => {
    setShowCommandPalette(true)
  }

  if (currentPage === 'force-password-change') {
    return (
      <ForcePasswordChange 
        username={adminUsername || ''}
        onSuccess={handlePasswordChangeSuccess}
        onLogout={handleAdminLogout}
      />
    )
  }

  if (currentPage === 'admin' && isLoggedIn) {
    return (
      <Admin
        bookmarks={bookmarks}
        categories={categories}
        customIcons={customIcons}
        username={adminUsername || ''}
        onBack={() => setCurrentPage('home')}
        onLogout={handleAdminLogout}
        onRefreshData={refreshData}
        onAddBookmark={handleAdminAddBookmark}
        onEditBookmark={handleAdminEditBookmark}
        onDeleteBookmark={deleteBookmark}
        onTogglePin={togglePin}
        onToggleReadLater={toggleReadLater}
        onUpdateBookmark={updateBookmark}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onReorderCategories={reorderCategories}
        onAddCustomIcon={addCustomIcon}
        onDeleteCustomIcon={deleteCustomIcon}
      />
    )
  }

  if (currentPage === 'admin-login') {
    return <AdminLogin onLogin={handleLogin} onBack={() => setCurrentPage('home')} />
  }

  // 构建背景样式
  const backgroundStyle: React.CSSProperties = hasWallpaper
    ? {
        backgroundImage: `url(${wallpaper?.imageUrl || wallpaper?.imageData})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {}

  // 构建遮罩样式
  const overlayStyle: React.CSSProperties = hasWallpaper
    ? {
        position: 'fixed',
        inset: 0,
        backgroundColor: `rgba(0, 0, 0, ${(wallpaper?.overlay ?? 30) / 100})`,
        backdropFilter: `blur(${wallpaper?.blur ?? 0}px)`,
        zIndex: 0,
        pointerEvents: 'none',
      }
    : {}

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-500 relative',
      isDark ? 'dark' : ''
    )} style={{
      // 只保留壁纸背景样式，颜色变量由主题系统管理
      ...backgroundStyle,
    } as React.CSSProperties}>
      
      {/* 壁纸遮罩层 */}
      {hasWallpaper && <div style={overlayStyle} />}
      
      <ErrorBoundary>
        <Header 
          onOpenCommand={() => setShowCommandPalette(true)}
          onToggleEditMode={() => isLoggedIn && setIsEditMode(!isEditMode)}
          isEditMode={isEditMode}
          isLoggedIn={isLoggedIn}
          username={adminUsername}
          onLogout={handleAdminLogout}
          onPrivateVisibilityChange={setShowPrivateBookmarks}
        />

        <main className="pt-24 pb-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <HeroSection 
              formattedTime={formattedTime} 
              formattedDate={formattedDate} 
              lunarDate={lunarDate} 
              greeting={greeting} 
              weather={weather}
              weatherLoading={weatherLoading}
              onRefreshWeather={refreshWeather}
              onOpenSearch={handleOpenSearch}
            />

            {/* 系统监控组件 */}
            {!isLiteMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {widgetVisibility?.systemMonitor && <SystemMonitorCard />}
                {widgetVisibility?.hardwareIdentity && <HardwareIdentityCard />}
                {widgetVisibility?.vitalSigns && <VitalSignsCard />}
                {widgetVisibility?.networkTelemetry && <NetworkTelemetryCard />}
              </div>
            )}

            {readLaterBookmarks.length > 0 && (
              <ReadLaterSection 
                bookmarks={readLaterBookmarks}
                isLiteMode={isLiteMode}
                onMarkRead={handleMarkRead}
                onRemove={handleRemoveBookmark}
              />
            )}

            {filteredBookmarks.length === 0 ? (
              <EmptyState onAddBookmark={() => setShowAddModal(true)} />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredBookmarks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <BookmarkGrid
                    bookmarks={filteredBookmarks}
                    categories={categories}
                    isLoading={isLoading}
                    newlyAddedId={null}
                    onEdit={handleBookmarkEdit}
                    onDelete={deleteBookmark}
                    onTogglePin={togglePin}
                    onToggleReadLater={toggleReadLater}
                  />
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>

        {pinnedBookmark && (
          <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-center">
                <HeroCard 
                  bookmark={pinnedBookmark}
                  onArchive={handleMarkRead}
                  onMarkRead={handleMarkRead}
                />
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <AddBookmarkModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={addBookmark}
            categories={categories}
            customIcons={customIcons}
            onCategoryAdded={handleCategoryAdded}
          />
        )}

        {showCommandPalette && (
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            bookmarks={bookmarks}
            onAddBookmark={handleAddBookmarkFromPalette}
          />
        )}
      </ErrorBoundary>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ManagerRedirect />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
