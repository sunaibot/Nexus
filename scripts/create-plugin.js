#!/usr/bin/env node

/**
 * 插件脚手架工具
 * 用法: node scripts/create-plugin.js <plugin-id>
 * 示例: node scripts/create-plugin.js my-plugin
 */

const fs = require('fs')
const path = require('path')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 插件ID验证
function validatePluginId(id) {
  if (!id) {
    log('错误: 请提供插件ID', 'yellow')
    log('用法: node scripts/create-plugin.js <plugin-id>', 'bright')
    process.exit(1)
  }
  
  if (!/^[a-z0-9-]+$/.test(id)) {
    log('错误: 插件ID只能包含小写字母、数字和连字符', 'yellow')
    process.exit(1)
  }
  
  return id
}

// 创建目录
function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    log(`  📁 ${dir}`, 'cyan')
  }
}

// 写入文件
function writeFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content)
    log(`  📝 ${path.basename(filePath)}`, 'green')
  } else {
    log(`  ⚠️  ${path.basename(filePath)} 已存在，跳过`, 'yellow')
  }
}

// 生成前台组件模板
function generateFrontendTemplate(pluginId, pluginName) {
  const pascalCase = pluginId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
  
  return `/**
 * ${pluginName} 前台组件
 */

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

interface ${pascalCase}Config {
  // 在这里定义插件配置
  title?: string
  refreshInterval?: number
}

export function ${pascalCase}Widget({ config, slot }: PluginComponentProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const pluginConfig: ${pascalCase}Config = config || {}
  
  useEffect(() => {
    // 在这里加载数据
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      // const response = await fetch('/api/v2/${pluginId}/data')
      // const result = await response.json()
      // setData(result.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">{pluginConfig.title || '${pluginName}'}</h3>
      </div>
      <p className="text-sm text-white/60">
        这是 ${pluginName} 插件的前台组件
      </p>
    </div>
  )
}

export default ${pascalCase}Widget
`
}

// 生成后台管理模板
function generateBackendTemplate(pluginId, pluginName) {
  const pascalCase = pluginId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
  
  return `/**
 * ${pluginName} 后台管理模块
 */

import { Settings } from 'lucide-react'
import type { Module } from '@/core/module-system'
import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8787'

function ${pascalCase}Manager() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      // const res = await fetch(\`\${API_BASE}/api/v2/${pluginId}/data\`, {
      //   credentials: 'include'
      // })
      // if (res.ok) {
      //   const result = await res.json()
      //   setData(result.data || [])
      // }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          ${pluginName}管理
        </h1>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-white/50">加载中...</div>
      ) : (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">${pluginName} 管理后台</p>
          <p className="text-sm text-white/30 mt-2">在这里实现你的管理功能</p>
        </div>
      )}
    </div>
  )
}

const ${pascalCase}Module: Module = {
  id: '${pluginId}',
  name: '${pluginName}管理',
  description: '${pluginName}插件的后台管理',
  version: '1.0.0',
  icon: Settings,
  enabled: true,
  routes: [
    {
      path: '/${pluginId}',
      component: ${pascalCase}Manager,
      exact: true
    }
  ],
  sidebarItem: {
    id: '${pluginId}',
    label: '${pluginName}管理',
    icon: Settings,
    order: 90
  }
}

export default ${pascalCase}Module
`
}

// 生成服务端路由模板
function generateServerRoutesTemplate(pluginId, pluginName) {
  return `/**
 * ${pluginName} 服务端路由
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js'
import { queryAll, queryOne, run } from '../../utils/database.js'

const router = Router()

// 成功响应
function success(res: Response, data: any, message?: string) {
  res.json({ success: true, data, message })
}

// 错误响应
function error(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, error: message })
}

/**
 * 获取 ${pluginName} 数据
 * GET /api/v2/${pluginId}
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    // const data = queryAll('SELECT * FROM ${pluginId}_table ORDER BY createdAt DESC')
    // success(res, data)
    success(res, [])
  } catch (err) {
    error(res, '获取数据失败')
  }
})

/**
 * 创建 ${pluginName} 数据
 * POST /api/v2/${pluginId}
 */
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    // const { name, value } = req.body
    // run('INSERT INTO ${pluginId}_table (id, name, value, createdAt) VALUES (?, ?, ?, ?)', [...])
    success(res, null, '创建成功')
  } catch (err) {
    error(res, '创建失败')
  }
})

/**
 * 更新 ${pluginName} 数据
 * PATCH /api/v2/${pluginId}/:id
 */
router.patch('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // const { name, value } = req.body
    // run('UPDATE ${pluginId}_table SET name = ?, value = ? WHERE id = ?', [name, value, id])
    success(res, null, '更新成功')
  } catch (err) {
    error(res, '更新失败')
  }
})

/**
 * 删除 ${pluginName} 数据
 * DELETE /api/v2/${pluginId}/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params
    // run('DELETE FROM ${pluginId}_table WHERE id = ?', [id])
    success(res, null, '删除成功')
  } catch (err) {
    error(res, '删除失败')
  }
})

export default router
`
}

// 生成数据库表初始化模板
function generateDbInitTemplate(pluginId, pluginName) {
  return `  // ${pluginName} 表
  db.run(\`
    CREATE TABLE IF NOT EXISTS ${pluginId}_data (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  \`)
`
}

// 生成插件注册代码
function generatePluginRegistration(pluginId, pluginName) {
  return `  // ${pluginName}
  registerPlugin({
    id: '${pluginId}',
    name: '${pluginName}',
    description: '${pluginName}插件描述',
    version: '1.0.0',
    author: 'Your Name',
    icon: 'Settings',
    visibility: 'public',
    orderIndex: 10,
    hasBackend: true,
    hasFrontend: true,
    defaultSlot: 'content-sidebar',
    config: {
      // 插件配置
    },
    menuConfig: {
      label: '${pluginName}管理',
      path: '/${pluginId}',
      order: 90
    }
  })
`
}

// 主函数
function main() {
  const pluginId = validatePluginId(process.argv[2])
  const pluginName = pluginId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  
  log('')
  log('╔════════════════════════════════════════╗', 'bright')
  log('║     Nowen Plugin Scaffolding Tool      ║', 'bright')
  log('╚════════════════════════════════════════╝', 'bright')
  log('')
  log(`正在创建插件: ${pluginId}`, 'cyan')
  log(`插件名称: ${pluginName}`, 'cyan')
  log('')
  
  // 创建目录结构
  const dirs = {
    frontend: `apps/frontend/plugins/builtin/${pluginId}`,
    backend: `apps/manager/modules/${pluginId}`,
    server: `apps/server/src/routes/v2/${pluginId}.ts`
  }
  
  log('📦 创建目录结构...', 'blue')
  createDir(dirs.frontend)
  createDir(dirs.backend)
  
  log('')
  log('📝 生成文件...', 'blue')
  
  // 生成前台组件
  writeFile(
    path.join(dirs.frontend, 'index.tsx'),
    generateFrontendTemplate(pluginId, pluginName)
  )
  
  // 生成后台管理模块
  writeFile(
    path.join(dirs.backend, 'index.tsx'),
    generateBackendTemplate(pluginId, pluginName)
  )
  
  // 生成服务端路由
  writeFile(
    dirs.server,
    generateServerRoutesTemplate(pluginId, pluginName)
  )
  
  log('')
  log('📋 后续步骤:', 'yellow')
  log('')
  log('1. 注册插件到数据库初始化:', 'bright')
  log(generateDbInitTemplate(pluginId, pluginName), 'cyan')
  log('')
  log('2. 在 apps/server/src/db/init-plugins.ts 中添加:', 'bright')
  log(generatePluginRegistration(pluginId, pluginName), 'cyan')
  log('')
  log('3. 注册服务端路由到 apps/server/src/routes/v2/index.ts:', 'bright')
  log(`   import ${pluginId}Router from './${pluginId}.js'`, 'cyan')
  log(`   router.use('/${pluginId}', ${pluginId}Router)`, 'cyan')
  log('')
  log('4. 注册前台插件到 apps/frontend/plugins/registry.ts', 'bright')
  log('')
  log('5. 注册后台模块到 apps/manager/modules/index.ts', 'bright')
  log('')
  log(`✅ 插件 "${pluginId}" 创建完成!`, 'green')
  log('')
}

main()
