/**
 * 首页组件
 * 应用主页面，整合所有功能模块
 */

import React from 'react'
import { motion } from 'framer-motion'
import { BookMarked } from 'lucide-react'

import { Header } from '../../components/layout'
import { AddBookmarkModal } from '../../components/features/bookmark'
import { CommandPalette } from '../../components/CommandPalette'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { HeroSection } from '../../components/home/HeroSection'
import { PluginRenderer } from '../../components/plugin-system'
import { AdminLogin } from '../../components/AdminLogin'
import { ForcePasswordChange } from '../../components/ForcePasswordChange'
import { Admin } from '../Admin'
import { TabSidebar } from '../../components/TabSidebar'
import { PluginSlot } from '../../plugins'
import { CustomPluginList } from '../../plugins'

import { WidgetSection, ReadLaterToggle, BookmarkList } from './components'

import { useHomePage } from '../../hooks/useHomePage'
import { cn } from '../../lib/utils'
import type { Bookmark } from '../../types/bookmark'

export function HomePage() {
  const {
    // 数据
    bookmarks,
    categories,
    customIcons,
    tabs,
    activeTabId,
    filteredCategories,
    filteredBookmarks,
    readLaterBookmarks,
    isLoading,

    // 状态
    isDark,
    isLiteMode,
    isLoggedIn,
    isEditMode,
    adminUsername,
    currentPage,
    showReadLaterOnly,
    widgetVisibility,

    // 时间和天气
    formattedTime,
    formattedDate,
    lunarDate,
    greeting,
    weather,
    weatherLoading,

    // UI 状态
    showAddModal,
    showCommandPalette,
    backgroundStyle,
    overlayStyle,
    hasWallpaper,
    editingBookmark,

    // 操作
    setShowAddModal,
    setShowCommandPalette,
    setIsEditMode,
    setShowPrivateBookmarks,
    setShowReadLaterOnly,
    setCurrentPage,
    refreshWeather,
    handleCloseModal,

    // 书签操作
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    reorderBookmarks,

    // 分类操作
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Tab 操作
    switchTab,
    addTab,
    updateTab,
    deleteTab,
    reorderTabs,

    // 图标操作
    addCustomIcon,
    deleteCustomIcon,
    refreshData,

    // 认证操作
    handleLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,

    // 事件处理
    handleMarkRead,
    handleRemoveBookmark,
    handleAddBookmarkFromPalette,
    handleCategoryAdded,
    handleOpenSearch,
    handleBookmarkEdit,
  } = useHomePage()

  // 管理员页面回调
  const handleAdminAddBookmark = React.useCallback(() => {
    setShowAddModal(true)
  }, [setShowAddModal])

  const handleAdminEditBookmark = React.useCallback((_bookmark: Bookmark) => {
    setShowAddModal(true)
  }, [setShowAddModal])

  // 处理书签提交（添加或编辑）
  const handleBookmarkSubmit = React.useCallback((bookmarkData: Omit<Bookmark, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    if (editingBookmark) {
      // 编辑模式：调用 updateBookmark
      updateBookmark(editingBookmark.id, bookmarkData as Partial<Bookmark>)
    } else {
      // 添加模式：调用 addBookmark
      addBookmark(bookmarkData)
    }
  }, [editingBookmark, addBookmark, updateBookmark])

  // 强制修改密码页面
  if (currentPage === 'force-password-change') {
    return (
      <ForcePasswordChange
        username={adminUsername || ''}
        onSuccess={handlePasswordChangeSuccess}
        onLogout={handleAdminLogout}
      />
    )
  }

  // 管理后台页面
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

  // 登录页面
  if (currentPage === 'admin-login') {
    return <AdminLogin onLogin={handleLogin} onBack={() => setCurrentPage('home')} />
  }

  // 主页面
  return (
    <div
      className={cn('min-h-screen transition-colors duration-500 relative', isDark ? 'dark' : '')}
      style={backgroundStyle}
    >
      {/* 壁纸遮罩层 */}
      {hasWallpaper && <div style={overlayStyle} />}

      <ErrorBoundary>
        {/* Tab 侧边栏 */}
        {tabs.length > 0 && (
          <TabSidebar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={(tabId) => {
              // 处理稍后阅读虚拟 TAB
              if (tabId === '__read_later__') {
                setShowReadLaterOnly(true)
              } else {
                setShowReadLaterOnly(false)
                switchTab(tabId)
              }
            }}
            onAddTab={() => {
              // TODO: 打开添加 Tab 弹窗
              // console.log('添加 Tab')
            }}
            isEditMode={isEditMode}
            readLaterCount={readLaterBookmarks.length}
          />
        )}

        <Header
          onOpenCommand={() => setShowCommandPalette(true)}
          onToggleEditMode={() => isLoggedIn && setIsEditMode(!isEditMode)}
          isEditMode={isEditMode}
          isLoggedIn={isLoggedIn}
          username={adminUsername}
          onLogout={handleAdminLogout}
          onPrivateVisibilityChange={setShowPrivateBookmarks}
        />

        <main className={cn(
          "pt-24 pb-12 px-4 sm:px-6 transition-all duration-300",
          tabs.length > 0 ? "ml-16" : ""
        )}>
          <div className="max-w-6xl mx-auto flex gap-6">
            {/* 主内容区 */}
            <div className="flex-1">
              {/* Hero 区域 */}
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

              {/* 插件系统 */}
              <PluginRenderer className="my-8" />

              {/* 自定义插件列表 */}
              <CustomPluginList className="my-8" />

            {/* 系统监控小部件 */}
            <WidgetSection 
              isLiteMode={isLiteMode} 
              widgetVisibility={widgetVisibility} 
            />

            {/* 稍后阅读切换 - 只在非稍后阅读模式显示 */}
            {!showReadLaterOnly && (
              <ReadLaterToggle
                readLaterCount={readLaterBookmarks.length}
                showReadLaterOnly={showReadLaterOnly}
                onToggle={() => setShowReadLaterOnly(!showReadLaterOnly)}
              />
            )}

            {/* 稍后阅读标签页标题 */}
            {showReadLaterOnly && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <BookMarked className="w-6 h-6 text-orange-500" />
                  稍后阅读
                  <span className="text-sm font-normal text-[var(--text-muted)]">
                    ({readLaterBookmarks.length})
                  </span>
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  您收藏的所有稍后阅读书签
                </p>
              </div>
            )}

            {/* 书签列表 */}
            <BookmarkList
              bookmarks={filteredBookmarks}
              categories={filteredCategories}
              isLoading={isLoading}
              isEditMode={isEditMode}
              isLoggedIn={isLoggedIn}
              onEdit={handleBookmarkEdit}
              onDelete={deleteBookmark}
              onTogglePin={togglePin}
              onToggleReadLater={toggleReadLater}
              onReorder={(newBookmarks) => {
                reorderBookmarks(newBookmarks)
              }}
              onChangeCategory={(bookmarkId, categoryId) => {
                updateBookmark(bookmarkId, { category: categoryId })
              }}
            />

            </div>

            {/* 内容侧边栏 - 插件插槽 */}
            <aside className="w-64 hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <PluginSlot slot="content-sidebar" />
              </div>
            </aside>
          </div>
        </main>

        {/* 添加/编辑书签弹窗 */}
        {showAddModal && (
          <AddBookmarkModal
            isOpen={showAddModal}
            onClose={handleCloseModal}
            onAdd={handleBookmarkSubmit}
            categories={categories}
            customIcons={customIcons}
            editBookmark={editingBookmark}
            onCategoryAdded={handleCategoryAdded}
          />
        )}

        {/* 命令面板 */}
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
