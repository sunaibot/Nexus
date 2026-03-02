import React from 'react'
import { Quote } from 'lucide-react'
import { Module, Plugin } from '../../core'

const QuotesPlugin: Plugin = {
  id: 'quotes',
  name: '名言管理',
  version: '1.0.0',
  description: '名言管理模块，提供名言的增删改查功能',
  author: 'Nexus Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Quotes plugin registered')
  },
  unregister: () => {
    console.log('Quotes plugin unregistered')
  },
}

const QuotesModule: Module = {
  id: 'quotes',
  name: '名言管理',
  description: '名言管理模块，提供名言的增删改查功能',
  version: '1.0.0',
  icon: Quote,
  enabled: true,
  routes: [
    {
      path: '/quotes',
      component: React.lazy(() => import('./pages/QuotesPage')),
      exact: true,
    }
  ],
  sidebarItem: {
    id: 'quotes',
    label: '名言管理',
    icon: Quote,
    order: 7,
    group: 'content',
  },
  plugin: QuotesPlugin,
}

export { QuotesModule, QuotesPlugin }
export default QuotesModule
