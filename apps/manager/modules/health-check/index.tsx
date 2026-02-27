import React from 'react'
import { Activity } from 'lucide-react'
import { Module, Plugin } from '../../core'

const HealthCheckPlugin: Plugin = {
  id: 'health-check',
  name: '健康检查',
  version: '1.0.0',
  description: '健康检查模块，提供链接健康状态检查功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Health Check plugin registered')
  },
  unregister: () => {
    console.log('Health Check plugin unregistered')
  },
}

const HealthCheckModule: Module = {
  id: 'health-check',
  name: '健康检查',
  description: '健康检查模块，提供链接健康状态检查功能（已整合到书签管理）',
  version: '1.0.0',
  icon: Activity,
  enabled: true,
  route: '/health-check',
  // 不显示在侧边栏，功能已整合到书签管理的"链接检查"标签页
  component: () => {
    return React.lazy(() => import('./pages/HealthCheckPage'))
  },
  plugin: HealthCheckPlugin,
}

export { HealthCheckModule, HealthCheckPlugin }
export default HealthCheckModule
