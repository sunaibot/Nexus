import React from 'react'
import { Palette } from 'lucide-react'
import { Module, Plugin } from '../../core'

const IconsPlugin: Plugin = {
  id: 'icons',
  name: '图标管理',
  version: '1.0.0',
  description: '图标管理模块，提供自定义图标上传、管理等功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Icons plugin registered')
  },
  unregister: () => {
    console.log('Icons plugin unregistered')
  },
}

const IconsModule: Module = {
  id: 'icons',
  name: '图标管理',
  description: '图标管理模块，提供自定义图标上传、管理等功能（已整合到书签管理）',
  version: '1.0.0',
  icon: Palette,
  enabled: true,
  route: '/icons',
  // 不显示在侧边栏，功能已整合到书签管理的"图标管理"标签页
  component: () => {
    return React.lazy(() => import('./pages/IconsPage'))
  },
  plugin: IconsPlugin,
}

export { IconsModule, IconsPlugin }
export default IconsModule
