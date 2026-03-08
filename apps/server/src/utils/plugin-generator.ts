/**
 * 插件代码生成器
 * 将可视化构建数据生成真实可用的前后端代码
 * 让小学生也能轻松创建插件！
 */

// 内联类型定义，避免依赖 manager 的代码
interface PartStyles {
  width?: string
  height?: string
  padding?: string
  margin?: string
  background?: string
  backgroundColor?: string
  border?: string
  borderRadius?: string
  boxShadow?: string
  color?: string
  fontSize?: string
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  display?: string
  position?: string
  overflow?: string
  opacity?: number
  transform?: string
  transition?: string
  cursor?: string
  [key: string]: any
}

interface PartProperty {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'icon' | 'json' | 'textarea'
  defaultValue: any
  options?: Array<{ label: string; value: any }>
  placeholder?: string
}

interface PartEvent {
  name: string
  label: string
  description?: string
}

interface ComponentPart {
  id: string
  name: string
  description?: string
  version: string
  author: string
  icon: string
  category: 'basic' | 'layout' | 'data' | 'interactive' | 'media' | 'custom'
  tags: string[]
  visual: {
    base: PartStyles
    states: {
      default: PartStyles
      hover?: PartStyles
      active?: PartStyles
      focus?: PartStyles
      disabled?: PartStyles
    }
  }
  behavior?: {
    events?: PartEvent[]
    dataBinding?: {
      supported: boolean
      properties?: Array<{ name: string; type: string; description?: string }>
    }
  }
  properties: PartProperty[]
}

interface CanvasComponent {
  id: string
  partId: string
  part?: ComponentPart
  position: { x: number; y: number }
  size: { width: string; height: string }
  props: Record<string, any>
  customStyles?: PartStyles
  dataBinding?: {
    source: string
    path: string
    transform?: string
  }
  zIndex: number
  visible: boolean
  locked: boolean
}

interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
  gridSize: number
  showGrid: boolean
}

interface BuildingPlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  canvas: CanvasConfig
  components: CanvasComponent[]
}

// 生成的插件代码结构
export interface GeneratedPlugin {
  id: string
  name: string
  frontend: {
    component: string      // React 组件代码
    styles: string         // CSS 样式
    types: string          // TypeScript 类型
  }
  backend: {
    routes: string         // Express 路由
    database: string       // 数据库表结构
    types: string          // 类型定义
  }
  config: {
    slot: string
    hasBackend: boolean
    hasFrontend: boolean
  }
}

// 基础模板
const FRONTEND_TEMPLATE = `
import { useState, useEffect } from 'react'
import type { PluginComponentProps } from '../../types'

// {{name}} 插件
// 由插件构建器自动生成
export default function {{componentName}}({ config }: PluginComponentProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  {{dataFetching}}

  {{renderLogic}}
}
`

const BACKEND_TEMPLATE = `
import { Router } from 'express'
import { authMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'

const router = Router()

{{routes}}

export default router
`

/**
 * 生成插件代码
 */
export function generatePluginCode(buildingPlugin: BuildingPlugin): GeneratedPlugin {
  const componentName = generateComponentName(buildingPlugin.name)
  const pluginId = buildingPlugin.id || generatePluginId(buildingPlugin.name)
  
  // 分析组件，确定是否需要后端
  const needsBackend = analyzeBackendNeeds(buildingPlugin.components)
  
  return {
    id: pluginId,
    name: buildingPlugin.name,
    frontend: {
      component: generateFrontendComponent(buildingPlugin, componentName),
      styles: generateStyles(buildingPlugin),
      types: generateTypes(buildingPlugin)
    },
    backend: needsBackend ? {
      routes: generateBackendRoutes(buildingPlugin, pluginId),
      database: generateDatabaseSchema(buildingPlugin, pluginId),
      types: generateBackendTypes(buildingPlugin)
    } : {
      routes: '',
      database: '',
      types: ''
    },
    config: {
      slot: 'content-sidebar',
      hasBackend: needsBackend,
      hasFrontend: true
    }
  }
}

/**
 * 生成组件名
 */
function generateComponentName(name: string): string {
  return name
    .replace(/[^\\w\\s]/g, '')
    .split(/\\s+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('') + 'Plugin'
}

/**
 * 生成插件ID
 */
function generatePluginId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\\w\\s]/g, '')
    .replace(/\\s+/g, '-')
}

/**
 * 分析是否需要后端
 */
function analyzeBackendNeeds(components: CanvasComponent[]): boolean {
  // 检查是否有数据绑定或需要API的组件
  return components.some(comp => 
    comp.dataBinding || 
    comp.part?.behavior?.dataBinding?.supported
  )
}

/**
 * 生成前端组件代码
 */
function generateFrontendComponent(plugin: BuildingPlugin, componentName: string): string {
  const { components } = plugin
  
  // 生成导入
  const imports = generateImports(components)
  
  // 生成状态管理
  const stateManagement = generateStateManagement(components)
  
  // 生成渲染代码
  const renderCode = generateRenderCode(components)
  
  return `import { useState, useEffect } from 'react'
import type { PluginComponentProps } from '../../types'
${imports}

/**
 * ${plugin.name} 插件
 * ${plugin.description || '由插件构建器自动生成'}
 * @version ${plugin.version || '1.0.0'}
 * @author ${plugin.author || 'Nexus Builder'}
 */
export default function ${componentName}({ config }: PluginComponentProps) {
${stateManagement}

  return (
    <div className="w-full h-full" style={${JSON.stringify(generateContainerStyles(plugin.canvas))}}>
${renderCode}
    </div>
  )
}
`
}

/**
 * 生成导入语句
 */
function generateImports(components: CanvasComponent[]): string {
  const imports = new Set<string>()
  
  components.forEach(comp => {
    const part = comp.part
    if (!part) return
    
    // 根据零件类型添加导入
    switch (part.category) {
      case 'basic':
        if (part.name.includes('按钮')) imports.add("import { Button } from '@/components/ui/button'")
        if (part.name.includes('输入')) imports.add("import { Input } from '@/components/ui/input'")
        break
      case 'data':
        imports.add("import { Card } from '@/components/ui/card'")
        break
      case 'media':
        imports.add("import Image from 'next/image'")
        break
    }
  })
  
  return Array.from(imports).join('\\n')
}

/**
 * 生成状态管理代码
 */
function generateStateManagement(components: CanvasComponent[]): string {
  const states: string[] = []
  const effects: string[] = []
  
  components.forEach(comp => {
    const part = comp.part
    if (!part) return
    
    // 为每个组件生成状态
    const stateName = `comp${comp.id.replace(/[^a-zA-Z0-9]/g, '')}`
    states.push(`  const [${stateName}Data, set${stateName}Data] = useState<any>(null)`)
    states.push(`  const [${stateName}Loading, set${stateName}Loading] = useState(false)`)
    
    // 如果有数据绑定，生成数据获取逻辑
    if (comp.dataBinding) {
      effects.push(`
  // 获取 ${part.name} 数据
  useEffect(() => {
    const fetchData = async () => {
      set${stateName}Loading(true)
      try {
        const response = await fetch('${comp.dataBinding.source}')
        const result = await response.json()
        set${stateName}Data(result)
      } catch (error) {
        console.error('获取数据失败:', error)
      } finally {
        set${stateName}Loading(false)
      }
    }
    fetchData()
  }, [])
`)
    }
  })
  
  return [...states, '', ...effects].join('\\n')
}

/**
 * 生成渲染代码
 */
function generateRenderCode(components: CanvasComponent[]): string {
  return components.map(comp => {
    const part = comp.part
    if (!part) return ''
    
    const styles = generateComponentStyles(comp)
    const props = generateComponentProps(comp)
    
    return `      {/* ${part.name} */}
      <div
        className="absolute"
        style={${styles}}
      >
        ${generateComponentJSX(comp, props)}
      </div>`
  }).join('\\n\\n')
}

/**
 * 生成组件样式
 */
function generateComponentStyles(comp: CanvasComponent): string {
  const baseStyles = comp.part?.visual?.base || {}
  const customStyles = comp.customStyles || {}
  
  const styles = {
    left: comp.position.x,
    top: comp.position.y,
    width: comp.size.width,
    height: comp.size.height,
    zIndex: comp.zIndex,
    ...baseStyles,
    ...customStyles
  }
  
  return JSON.stringify(styles, null, 2).replace(/"/g, "'")
}

/**
 * 生成组件属性
 */
function generateComponentProps(comp: CanvasComponent): string {
  const props: string[] = []
  
  // 从 props 中生成属性
  Object.entries(comp.props || {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      props.push(`${key}="${value}"`)
    } else {
      props.push(`${key}={${JSON.stringify(value)}}`)
    }
  })
  
  return props.join(' ')
}

/**
 * 生成组件 JSX
 */
function generateComponentJSX(comp: CanvasComponent, props: string): string {
  const part = comp.part
  if (!part) return '<div />'
  
  const tagName = getComponentTagName(part)
  
  if (part.category === 'basic' && part.name.includes('按钮')) {
    return `<${tagName} ${props}>${comp.props?.text || part.name}</${tagName}>`
  }
  
  if (part.category === 'basic' && part.name.includes('文本')) {
    return `<${tagName} ${props}>${comp.props?.content || ''}</${tagName}>`
  }
  
  return `<${tagName} ${props} />`
}

/**
 * 获取组件标签名
 */
function getComponentTagName(part: ComponentPart): string {
  if (part.category === 'basic') {
    if (part.name.includes('按钮')) return 'button'
    if (part.name.includes('输入')) return 'input'
    if (part.name.includes('文本')) return 'span'
  }
  if (part.category === 'layout') return 'div'
  if (part.category === 'data') return 'div'
  return 'div'
}

/**
 * 生成容器样式
 */
function generateContainerStyles(canvas: any): object {
  return {
    width: canvas.width,
    height: canvas.height,
    backgroundColor: canvas.backgroundColor,
    position: 'relative' as const
  }
}

/**
 * 生成样式代码
 */
function generateStyles(plugin: BuildingPlugin): string {
  return `
/* ${plugin.name} 插件样式 */
.${generatePluginId(plugin.name)}-plugin {
  width: 100%;
  height: 100%;
}

/* 组件基础样式 */
.${generatePluginId(plugin.name)}-plugin .component {
  transition: all 0.2s ease;
}

.${generatePluginId(plugin.name)}-plugin .component:hover {
  transform: translateY(-2px);
}
`
}

/**
 * 生成类型定义
 */
function generateTypes(plugin: BuildingPlugin): string {
  return `
/**
 * ${plugin.name} 插件类型定义
 */
export interface ${generateComponentName(plugin.name)}Props {
  config?: Record<string, any>
}

export interface ${generateComponentName(plugin.name)}Data {
  // 在这里定义数据类型
}
`
}

/**
 * 生成后端路由
 */
function generateBackendRoutes(plugin: BuildingPlugin, pluginId: string): string {
  return `
/**
 * ${plugin.name} 插件后端路由
 * 自动生成于 ${new Date().toISOString()}
 */
import { Router } from 'express'
import { authMiddleware } from '../../../../middleware/index.js'
import { successResponse, errorResponse } from '../../../utils/routeHelpers.js'
import { getDatabase } from '../../../../db/core.js'

const router = Router()

// 获取插件数据
router.get('/data', async (req, res) => {
  try {
    const db = getDatabase()
    // 在这里添加数据查询逻辑
    const data = { message: 'Hello from ${plugin.name}!' }
    return successResponse(res, data)
  } catch (error) {
    console.error('获取数据失败:', error)
    return errorResponse(res, '获取数据失败')
  }
})

// 保存插件数据（需要登录）
router.post('/data', authMiddleware, async (req, res) => {
  try {
    const { data } = req.body
    // 在这里添加数据保存逻辑
    return successResponse(res, { success: true })
  } catch (error) {
    console.error('保存数据失败:', error)
    return errorResponse(res, '保存数据失败')
  }
})

export default router
`
}

/**
 * 生成数据库表结构
 */
function generateDatabaseSchema(plugin: BuildingPlugin, pluginId: string): string {
  const tableName = pluginId.replace(/-/g, '_')
  
  return `
-- ${plugin.name} 插件数据表
CREATE TABLE IF NOT EXISTS ${tableName}_data (
  id TEXT PRIMARY KEY,
  userId TEXT,
  data TEXT, -- JSON 格式存储
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_${tableName}_user ON ${tableName}_data(userId);
CREATE INDEX IF NOT EXISTS idx_${tableName}_created ON ${tableName}_data(createdAt);
`
}

/**
 * 生成后端类型
 */
function generateBackendTypes(plugin: BuildingPlugin): string {
  return `
/**
 * ${plugin.name} 插件后端类型
 */
export interface ${generateComponentName(plugin.name)}Data {
  id: string
  userId?: string
  data: any
  createdAt: string
  updatedAt: string
}

export interface Create${generateComponentName(plugin.name)}Request {
  data: any
}
`
}

/**
 * 保存生成的插件代码到文件系统
 */
export function saveGeneratedPlugin(generated: GeneratedPlugin, basePath: string): void {
  const fs = require('fs')
  const path = require('path')
  
  // 创建插件目录
  const pluginDir = path.join(basePath, generated.id)
  fs.mkdirSync(pluginDir, { recursive: true })
  
  // 保存前端代码
  const frontendDir = path.join(pluginDir, 'frontend')
  fs.mkdirSync(frontendDir, { recursive: true })
  fs.writeFileSync(path.join(frontendDir, 'index.tsx'), generated.frontend.component)
  fs.writeFileSync(path.join(frontendDir, 'styles.css'), generated.frontend.styles)
  fs.writeFileSync(path.join(frontendDir, 'types.ts'), generated.frontend.types)
  
  // 保存后端代码（如果需要）
  if (generated.config.hasBackend) {
    const backendDir = path.join(pluginDir, 'backend')
    fs.mkdirSync(backendDir, { recursive: true })
    fs.writeFileSync(path.join(backendDir, 'routes.ts'), generated.backend.routes)
    fs.writeFileSync(path.join(backendDir, 'database.sql'), generated.backend.database)
    fs.writeFileSync(path.join(backendDir, 'types.ts'), generated.backend.types)
  }
  
  // 保存配置文件
  fs.writeFileSync(
    path.join(pluginDir, 'plugin.json'),
    JSON.stringify({
      id: generated.id,
      name: generated.name,
      config: generated.config,
      generatedAt: new Date().toISOString()
    }, null, 2)
  )
}
