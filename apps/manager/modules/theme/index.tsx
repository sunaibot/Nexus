import React from 'react'
import { Palette } from 'lucide-react'
import { Module, Plugin } from '../../core'

const ThemePlugin: Plugin = {
  id: 'theme',
  name: '主题管理',
  version: '1.0.0',
  description: '主题管理模块，提供系统主题、配色方案自定义功能',
  author: 'Nexus Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Theme plugin registered')
  },
  unregister: () => {
    console.log('Theme plugin unregistered')
  },
}

const ThemeModule: Module = {
  id: 'theme',
  name: '主题管理',
  description: '主题管理模块，提供系统主题、配色方案自定义功能',
  version: '1.0.0',
  icon: Palette,
  enabled: true,
  routes: [
    {
      path: '/theme',
      component: React.lazy(() => import('./pages/ThemePage')),
      exact: true,
    }
  ],
  sidebarItem: {
    id: 'theme',
    label: '主题管理',
    icon: Palette,
    order: 90,
    group: 'appearance',
  },
  plugin: ThemePlugin,
}

export { ThemeModule, ThemePlugin }
export { default as ThemePage } from './pages/ThemePage'
export default ThemeModule
