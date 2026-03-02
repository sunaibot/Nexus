import { Puzzle } from 'lucide-react'
import { Module, Plugin } from '../../core'

const PluginsPlugin: Plugin = {
  id: 'plugins',
  name: '插件中心',
  version: '1.0.0',
  description: '插件管理模块，提供插件的安装、卸载、配置等功能',
  author: 'Nexus Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Plugins plugin registered')
  },
  unregister: () => {
    console.log('Plugins plugin unregistered')
  },
}

const PluginsModule: Module = {
  id: 'plugins',
  name: '插件中心',
  description: '插件管理模块，提供插件的安装、卸载、配置等功能',
  version: '1.0.0',
  icon: Puzzle,
  enabled: true,
  routes: [
    {
      path: '/plugins',
      component: () => null,
      exact: true,
    }
  ],
  sidebarItem: {
    id: 'plugins',
    label: '插件中心',
    icon: Puzzle,
    order: 5,
    group: 'system',
  },
  plugin: PluginsPlugin,
}

export { PluginsModule, PluginsPlugin }
export default PluginsModule
