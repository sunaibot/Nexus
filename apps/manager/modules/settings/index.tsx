import React from 'react'
import { Settings } from 'lucide-react'
import { Module, Plugin } from '../../core'

const SettingsPlugin: Plugin = {
  id: 'settings',
  name: '系统设置',
  version: '1.0.0',
  description: '系统设置管理模块，提供网站配置、主题、壁纸等设置功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Settings plugin registered')
  },
  unregister: () => {
    console.log('Settings plugin unregistered')
  },
}

const SettingsModule: Module = {
  id: 'settings',
  name: '系统设置',
  description: '系统设置管理模块，提供网站配置、主题、壁纸等设置功能',
  version: '1.0.0',
  icon: Settings,
  enabled: true,
  routes: [
    {
      path: '/settings',
      component: React.lazy(() => import('./pages/SettingsTabsPage')),
      exact: true,
    }
  ],
  sidebarItem: {
    id: 'settings',
    label: '系统设置',
    icon: Settings,
    order: 100,
    group: 'system',
  },
  plugin: SettingsPlugin,
}

export { SettingsModule, SettingsPlugin }
export { default as SettingsTabsPage } from './pages/SettingsTabsPage'
export { default as SettingsPage } from './pages/SettingsPage'
export * from './types'
export * from './api'
export * from './hooks'
export default SettingsModule
