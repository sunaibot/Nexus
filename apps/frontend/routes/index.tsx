/**
 * 路由配置
 * 集中管理应用路由
 */

import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '../pages/Home'

// 懒加载文件提取页面
const FileExtractPage = lazy(() => import('../pages/FileExtract'))

// 加载中组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/file-extract"
        element={
          <Suspense fallback={<PageLoader />}>
            <FileExtractPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
