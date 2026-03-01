/**
 * 路由配置
 * 集中管理应用路由
 */

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '../pages/Home'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
