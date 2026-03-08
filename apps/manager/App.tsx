import React from 'react'
import { AdminLogin } from './components/AdminLogin'
import { ForcePasswordChange } from './components/ForcePasswordChange'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useBookmarkStore } from './hooks/useBookmarkStore'
import { useAuth } from './hooks/useAuth'
import { useThemeContext } from './hooks/useTheme'
import { cn } from './lib/utils'
import { Admin } from './pages/Admin'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { useEffect, useState } from 'react'

type AuthPage = 'login' | 'forgot-password' | 'reset-password'

function App() {
  const { 
    bookmarks, 
    categories, 
    customIcons, 
    refreshData 
  } = useBookmarkStore()
  
  const { 
    currentPage, 
    adminUsername, 
    isLoggedIn, 
    handleAdminLogin, 
    handlePasswordChangeSuccess, 
    handleAdminLogout 
  } = useAuth()
  
  const { isDark } = useThemeContext()
  
  // 检查 URL 参数，如果 login=true 则强制显示登录页
  const [forceLogin, setForceLogin] = useState(false)
  // 当前认证页面状态
  const [authPage, setAuthPage] = useState<AuthPage>('login')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('login') === 'true') {
      setForceLogin(true)
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname)
    }
    // 检查是否是重置密码页面
    if (params.get('token')) {
      setAuthPage('reset-password')
      setForceLogin(true)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      refreshData()
    }
  }, [isLoggedIn, refreshData])

  const handleLogin = async (username: string, requirePasswordChange?: boolean) => {
    setForceLogin(false) // 登录成功后重置 forceLogin
    handleAdminLogin(username, requirePasswordChange)
  }

  const handleAddBookmark = () => {
  }

  const handleEditBookmark = (_bookmark: any) => {
  }

  const handleDeleteBookmark = async (_id: string) => {
  }

  const handleTogglePin = async (_id: string) => {
  }

  const handleToggleReadLater = async (_id: string) => {
  }

  const handleUpdateBookmark = async (_id: string, _updates: any) => {
  }

  const handleAddCategory = (_category: any) => {
  }

  const handleUpdateCategory = (_id: string, _updates: any) => {
  }

  const handleDeleteCategory = (_id: string) => {
  }

  const handleReorderCategories = (_categories: any) => {
  }

  const handleAddCustomIcon = (_icon: any) => {
  }

  const handleDeleteCustomIcon = (_id: string) => {
  }

  const handleBackToFrontend = () => {
    window.location.href = 'http://localhost:5173'
  }

  // 处理忘记密码
  const handleForgotPassword = () => {
    setAuthPage('forgot-password')
  }

  // 处理返回登录
  const handleBackToLogin = () => {
    setAuthPage('login')
    // 清除URL中的token
    window.history.replaceState({}, '', window.location.pathname)
  }

  // 如果强制登录或用户未登录，显示登录页面
  if (forceLogin || !isLoggedIn) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <ErrorBoundary>
          {authPage === 'login' && (
            <AdminLogin
              onLogin={handleLogin}
              onBack={handleBackToFrontend}
              onForgotPassword={handleForgotPassword}
            />
          )}
          {authPage === 'forgot-password' && (
            <ForgotPassword
              onBack={handleBackToLogin}
              isDark={isDark}
            />
          )}
          {authPage === 'reset-password' && (
            <ResetPassword
              onBack={handleBackToLogin}
              isDark={isDark}
            />
          )}
        </ErrorBoundary>
      </div>
    )
  }

  if (currentPage === 'force-password-change') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <ErrorBoundary>
          <ForcePasswordChange 
            username={adminUsername || ''}
            onSuccess={handlePasswordChangeSuccess}
            onLogout={handleAdminLogout}
          />
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-500',
      isDark ? 'dark' : ''
    )} style={{
      '--color-bg-primary': isDark ? '#0f0f0f' : '#fafafa',
      '--color-bg-secondary': isDark ? '#1a1a1a' : '#ffffff',
      '--color-bg-tertiary': isDark ? '#262626' : '#f5f5f5',
      '--color-text-primary': isDark ? '#ffffff' : '#1a1a1a',
      '--color-text-secondary': isDark ? '#a3a3a3' : '#525252',
      '--color-text-muted': isDark ? '#737373' : '#737373',
      '--color-border': isDark ? '#333333' : '#e5e5e5',
      '--color-border-light': isDark ? '#262626' : '#f5f5f5',
      '--color-glass': isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      '--color-glass-border': isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      '--color-glass-hover': isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      '--color-primary': '#8b5cf6',
      '--color-accent': '#ec4899',
      '--color-success': '#22c55e',
      '--color-warning': '#f59e0b',
      '--color-error': '#ef4444',
      '--color-glow': 'rgba(139, 92, 246, 0.3)',
      '--gradient-1': '#8b5cf6',
      '--gradient-2': '#ec4899',
    } as React.CSSProperties}>
      
      <ErrorBoundary>
        <Admin
          bookmarks={bookmarks}
          categories={categories}
          customIcons={customIcons}
          username={adminUsername || ''}
          onBack={handleBackToFrontend}
          onLogout={handleAdminLogout}
          onRefreshData={refreshData}
          onAddBookmark={handleAddBookmark}
          onEditBookmark={handleEditBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onTogglePin={handleTogglePin}
          onToggleReadLater={handleToggleReadLater}
          onUpdateBookmark={handleUpdateBookmark}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategories={handleReorderCategories}
          onAddCustomIcon={handleAddCustomIcon}
          onDeleteCustomIcon={handleDeleteCustomIcon}
        />
      </ErrorBoundary>
    </div>
  )
}

export default App
