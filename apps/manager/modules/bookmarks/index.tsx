import React from 'react'
import { BookMarked } from 'lucide-react'
import { Module, Plugin } from '../../core'
import { bookmarksConfig } from './config'

const BookmarksPlugin: Plugin = {
  id: 'bookmarks',
  name: '书签管理',
  version: '1.0.0',
  description: '书签管理模块，提供书签的增删改查、分类、标签等功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('Bookmarks plugin registered')
  },
  unregister: () => {
    console.log('Bookmarks plugin unregistered')
  },
}

const BookmarksModule: Module = {
  id: 'bookmarks',
  name: '书签管理',
  description: '书签管理模块，提供书签的增删改查、分类、标签等功能',
  version: '1.0.0',
  icon: BookMarked,
  enabled: true,
  route: '/bookmarks',
  sidebarItem: {
    label: '书签管理',
    icon: BookMarked,
    order: 1,
    group: 'content',
  },
  component: () => {
    return React.lazy(() => import('./pages/BookmarksPage'))
  },
  plugin: BookmarksPlugin,
  config: bookmarksConfig,
}

export { BookmarksModule, BookmarksPlugin }
export { BookmarkManager } from './components'
export { useBookmarks } from './hooks'
export * from './types'
export * from './config'
export default BookmarksModule
