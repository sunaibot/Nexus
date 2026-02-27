import React from 'react'
import { Folder } from 'lucide-react'
import { Module, Plugin } from '../../core'
import { categoriesConfig } from './config'

const CategoriesPlugin: Plugin = {
  id: 'categories',
  name: '分类管理',
  version: '1.0.0',
  description: '分类管理模块，提供分类的增删改查、层级管理等功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Categories plugin registered')
  },
  unregister: () => {
    console.log('Categories plugin unregistered')
  },
}

const CategoriesModule: Module = {
  id: 'categories',
  name: '分类管理',
  description: '分类管理模块，提供分类的增删改查、层级管理等功能',
  version: '1.0.0',
  icon: Folder,
  enabled: true,
  route: '/categories',
  sidebarItem: {
    label: '分类管理',
    icon: Folder,
    order: 2,
    group: 'content',
  },
  component: () => {
    return React.lazy(() => import('./pages/CategoriesPage'))
  },
  plugin: CategoriesPlugin,
  config: categoriesConfig,
}

export { CategoriesModule, CategoriesPlugin }
export * from './types'
export * from './config'
export default CategoriesModule
