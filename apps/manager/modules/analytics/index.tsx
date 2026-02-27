import React from 'react'
import { BarChart3 } from 'lucide-react'
import { Module, Plugin } from '../../core'

const AnalyticsPlugin: Plugin = {
  id: 'analytics',
  name: '数据分析',
  version: '1.0.0',
  description: '数据分析模块，提供书签访问统计、趋势分析等功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Analytics plugin registered')
  },
  unregister: () => {
    console.log('Analytics plugin unregistered')
  },
}

const AnalyticsModule: Module = {
  id: 'analytics',
  name: '数据分析',
  description: '数据分析模块，提供书签访问统计、趋势分析等功能',
  version: '1.0.0',
  icon: BarChart3,
  enabled: true,
  route: '/analytics',
  sidebarItem: {
    label: '数据分析',
    icon: BarChart3,
    order: 6,
    group: 'tools',
  },
  component: () => {
    return React.lazy(() => import('./pages/AnalyticsPage'))
  },
  plugin: AnalyticsPlugin,
}

export { AnalyticsModule, AnalyticsPlugin }
export default AnalyticsModule
