import React from 'react'
import { Cpu } from 'lucide-react'
import { Module, Plugin } from '../../core'

const SystemMonitorPlugin: Plugin = {
  id: 'system-monitor',
  name: '系统监控',
  version: '1.0.0',
  description: '系统监控模块，提供系统资源使用情况监控',
  author: 'Nexus Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('System Monitor plugin registered')
  },
  unregister: () => {
    console.log('System Monitor plugin unregistered')
  },
}

const SystemMonitorModule: Module = {
  id: 'system-monitor',
  name: '系统监控',
  description: '系统监控模块，提供系统资源使用情况监控',
  version: '1.0.0',
  icon: Cpu,
  enabled: true,
  routes: [
    {
      path: '/system-monitor',
      component: React.lazy(() => import('./pages/SystemMonitorPage')),
      exact: true,
    }
  ],
  sidebarItem: {
    id: 'system-monitor',
    label: '系统监控',
    icon: Cpu,
    order: 5,
    group: 'tools',
  },
  plugin: SystemMonitorPlugin,
}

export { SystemMonitorModule, SystemMonitorPlugin }
export default SystemMonitorModule
