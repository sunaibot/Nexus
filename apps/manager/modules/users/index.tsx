import { Users } from 'lucide-react'
import { Module, Plugin } from '../../core'

const UsersPlugin: Plugin = {
  id: 'users',
  name: '用户管理',
  version: '1.0.0',
  description: '用户管理模块，提供用户的增删改查、角色管理、权限控制等功能',
  author: 'Nexus Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Users plugin registered')
  },
  unregister: () => {
    console.log('Users plugin unregistered')
  },
}

const UsersModule: Module = {
  id: 'users',
  name: '用户管理',
  description: '用户管理模块，提供用户的增删改查、角色管理、权限控制等功能',
  version: '1.0.0',
  icon: Users,
  enabled: true,
  routes: [
    {
      path: '/users',
      component: () => null,
      exact: true,
    }
  ],
  sidebarItem: {
    id: 'users',
    label: '用户管理',
    icon: Users,
    order: 7,
    group: 'system',
  },
  plugin: UsersPlugin,
}

export { UsersModule, UsersPlugin }
export default UsersModule
