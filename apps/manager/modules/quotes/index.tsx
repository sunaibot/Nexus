import React from 'react'
import { Quote } from 'lucide-react'
import { Module, Plugin } from '../../core'

const QuotesPlugin: Plugin = {
  id: 'quotes',
  name: '名言管理',
  version: '1.0.0',
  description: '名言管理模块，提供名言的增删改查功能',
  author: 'Nowen Team',
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
  route: '/quotes',
  sidebarItem: {
    label: '名言管理',
    icon: Quote,
    order: 7,
    group: 'content',
  },
  component: () => {
    return React.lazy(() => import('./pages/QuotesPage'))
  },
  plugin: QuotesPlugin,
}

export { QuotesModule, QuotesPlugin }
export default QuotesModule
