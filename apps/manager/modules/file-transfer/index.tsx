import React from 'react'
import { FileUp } from 'lucide-react'
import { Module, Plugin } from '../../core'

const FileTransferPlugin: Plugin = {
  id: 'file-transfer',
  name: '文件快传',
  version: '1.0.0',
  description: '文件快传管理模块，提供文件上传、下载、分享链接管理等功能',
  author: 'Nowen Team',
  enabled: true,
  dependencies: [],
  register: () => {
    console.log('File Transfer plugin registered')
  },
  unregister: () => {
    console.log('File Transfer plugin unregistered')
  },
}

const FileTransferModule: Module = {
  id: 'file-transfer',
  name: '文件快传',
  description: '文件快传管理模块，提供文件上传、下载、分享链接管理等功能',
  version: '1.0.0',
  icon: FileUp,
  enabled: true,
  routes: [
    {
      path: '/file-transfer',
      component: React.lazy(() => import('./pages/FileTransferPage.tsx')),
      exact: true,
    }
  ],
  sidebarItem: {
    id: 'file-transfer',
    label: '文件快传',
    icon: FileUp,
    order: 8,
    group: 'tools',
  },
  plugin: FileTransferPlugin,
}

export { FileTransferModule, FileTransferPlugin }
export default FileTransferModule
