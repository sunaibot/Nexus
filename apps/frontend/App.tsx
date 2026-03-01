/**
 * 应用入口组件
 * 仅保留路由配置和全局 Provider
 */

import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProviders } from './providers'
import { HomePage } from './pages/Home'

// 插件系统初始化
import { registerFrontendPlugin } from './components/plugin-system'
import { QuotePlugin } from './components/plugin-system/plugins/QuotePlugin'
import { ClockPlugin } from './components/plugin-system/plugins/ClockPlugin'
import { WeatherPlugin } from './components/plugin-system/plugins/WeatherPlugin'
import { SearchPlugin } from './components/plugin-system/plugins/SearchPlugin'

// 注册插件组件
registerFrontendPlugin('名言', QuotePlugin)
registerFrontendPlugin('时钟', ClockPlugin)
registerFrontendPlugin('天气', WeatherPlugin)
registerFrontendPlugin('搜索', SearchPlugin)

/**
 * 管理后台重定向组件
 * 将 /manager 路径重定向到管理后台端口
 */
function ManagerRedirect() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.includes('manager')) {
      window.location.href = 'http://localhost:5174'
    }
  }, [location])

  return null
}

/**
 * 应用路由配置
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/**
 * 根应用组件
 */
function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <ManagerRedirect />
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  )
}

export default App
