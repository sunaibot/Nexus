/**
 * 首页组件
 * 应用主页面，整合所有功能模块
 */

import React from 'react'
import { motion } from 'framer-motion'

import { Header } from '../../components/layout'
import { AddBookmarkModal } from '../../components/features/bookmark'
import { CommandPalette } from '../../components/CommandPalette'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { HeroSection } from '../../components/home/HeroSection'
import { ReadLaterSection } from '../../components/home/ReadLaterSection'
import { PluginRenderer } from '../../components/plugin-system'
import { AdminLogin } from '../../components/AdminLogin'
import { ForcePasswordChange } from '../../components/ForcePasswordChange'
import { Admin } from '../Admin'

import { WidgetSection, ReadLaterToggle, BookmarkList, PinnedBookmark } from './components'

import { useHomePage } from '../../hooks/useHomePage'
import { cn } from '../../lib/utils'
import type { Bookmark } from '../../types/bookmark'

export function HomePage() {
  const {
    // 数据
    bookmarks,
    categories,
    customIcons,
    filteredBookmarks,
    readLaterBookmarks,
    pinnedBookmark,
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

    // 操作
    setShowAddModal,
    setShowCommandPalette,
    setIsEditMode,
    setShowPrivateBookmarks,
    setShowReadLaterOnly,
    setCurrentPage,
    refreshWeather,

    // 书签操作
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,

    // 分类操作
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

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
        <Header
          onOpenCommand={() => setShowCommandPalette(true)}
          onToggleEditMode={() => isLoggedIn && setIsEditMode(!isEditMode)}
          isEditMode={isEditMode}
          isLoggedIn={isLoggedIn}
          username={adminUsername}
          onLogout={handleAdminLogout}
          onPrivateVisibilityChange={setShowPrivateBookmarks}
        />

        <main className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
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

            {/* 系统监控小部件 */}
            <WidgetSection 
              isLiteMode={isLiteMode} 
              widgetVisibility={widgetVisibility} 
            />

            {/* 稍后阅读区域 */}
            {readLaterBookmarks.length > 0 && !showReadLaterOnly && (
              <ReadLaterSection
                bookmarks={readLaterBookmarks}
                isLiteMode={isLiteMode}
                onMarkRead={handleMarkRead}
                onRemove={handleRemoveBookmark}
              />
            )}

            {/* 稍后阅读切换 */}
            <ReadLaterToggle
              readLaterCount={readLaterBookmarks.length}
              showReadLaterOnly={showReadLaterOnly}
              onToggle={() => setShowReadLaterOnly(!showReadLaterOnly)}
            />

            {/* 书签列表 */}
            <BookmarkList
              bookmarks={filteredBookmarks}
              categories={categories}
              isLoading={isLoading}
              isEditMode={isEditMode}
              isLoggedIn={isLoggedIn}
              onEdit={handleBookmarkEdit}
              onDelete={deleteBookmark}
              onTogglePin={togglePin}
              onToggleReadLater={toggleReadLater}
              onReorder={(newBookmarks) => {
                // TODO: 实现书签重新排序的保存
                console.log('书签重新排序:', newBookmarks)
              }}
            />

            {/* 置顶稍后阅读书签卡片 - 放在页面流中 */}
            <PinnedBookmark 
              bookmark={pinnedBookmark} 
              onMarkRead={handleMarkRead} 
            />
          </div>
        </main>

        {/* 添加书签弹窗 */}
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
