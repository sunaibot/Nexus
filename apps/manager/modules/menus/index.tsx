import { Layout } from 'lucide-react'
import { Module, Plugin } from '../../core'

const MenusPlugin: Plugin = {
  id: 'menus',
  name: '菜单管理',
  version: '1.0.0',
  description: '菜单管理模块，提供菜单的增删改查、排序、权限控制等功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Menus plugin registered')
  },
  unregister: () => {
    console.log('Menus plugin unregistered')
  },
}

const MenusModule: Module = {
  id: 'menus',
  name: '菜单管理',
  description: '菜单管理模块，提供菜单的增删改查、排序、权限控制等功能',
  version: '1.0.0',
  icon: Layout,
  enabled: true,
  route: '/menus',
  sidebarItem: {
    label: '菜单管理',
    icon: Layout,
    order: 6,
    group: 'system',
  },
  plugin: MenusPlugin,
}

export { MenusModule, MenusPlugin }
export default MenusModule
