import type { Module } from '../../core'
import { Settings } from 'lucide-react'
import React from 'react'

const SystemConfigsModule: Module = {
  id: 'system-configs',
  name: '系统配置',
  description: '管理系统运行参数和安全策略',
  version: '1.0.0',
  icon: Settings,
  enabled: true,
  routes: [
    {
      path: '/system-configs',
      component: React.lazy(() => import('./pages/SystemConfigsPage')),
      exact: true,
      requireAuth: true,
      meta: {
        title: '系统配置',
        description: '管理系统运行参数和安全策略'
      }
    }
  ],
  sidebarItem: {
    id: 'system-configs',
    label: '系统配置',
    icon: Settings,
    order: 80,
    group: 'system'
  }
}

export { SystemConfigsModule }
export default SystemConfigsModule
