/**
 * API 文档自动生成工具
 * 扫描路由文件，提取 API 信息并生成文档
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// API 信息接口
interface ApiInfo {
  method: string
  path: string
  auth: boolean
  admin: boolean
  description: string
  params?: string[]
  query?: string[]
  body?: string[]
}

// 路由文件扫描器
function scanRouteFile(filePath: string): ApiInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const apis: ApiInfo[] = []

  // 匹配路由定义模式
  // 支持: router.get('/path', ...), router.post('/path', ...), 等
  const routePattern = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi

  // 匹配中间件模式
  const authPattern = /authMiddleware/g
  const adminPattern = /adminMiddleware/g

  let match
  while ((match = routePattern.exec(content)) !== null) {
    const method = match[1].toUpperCase()
    const routePath = match[2]

    // 获取该路由定义周围的上下文
    const contextStart = Math.max(0, match.index - 500)
    const contextEnd = Math.min(content.length, match.index + 500)
    const context = content.substring(contextStart, contextEnd)

    // 检查是否有认证中间件
    const hasAuth = authPattern.test(context)
    const hasAdmin = adminPattern.test(context)

    // 尝试提取注释描述
    const commentPattern = /\/\/\s*(.+)|\/\*\s*([^*]+)\*\//g
    let description = ''
    let commentMatch
    while ((commentMatch = commentPattern.exec(context)) !== null) {
      const comment = commentMatch[1] || commentMatch[2]
      if (comment && !comment.includes('router.')) {
        description = comment.trim()
        break
      }
    }

    apis.push({
      method,
      path: routePath,
      auth: hasAuth,
      admin: hasAdmin,
      description: description || `${method} ${routePath}`,
    })
  }

  return apis
}

// 扫描目录下的所有路由文件
function scanRoutesDirectory(dirPath: string): Map<string, ApiInfo[]> {
  const results = new Map<string, ApiInfo[]>()

  function scanDir(dir: string, baseRoute: string = '') {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scanDir(filePath, baseRoute)
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        const apis = scanRouteFile(filePath)
        if (apis.length > 0) {
          const relativePath = path.relative(dirPath, filePath)
          results.set(relativePath, apis)
        }
      }
    }
  }

  scanDir(dirPath)
  return results
}

// 生成 API 文档 Markdown
function generateMarkdownDocs(routes: Map<string, ApiInfo[]>): string {
  let markdown = `# 自动生成的 API 文档\n\n`
  markdown += `> 生成时间: ${new Date().toISOString()}\n\n`

  // 按模块分组
  const modules = new Map<string, ApiInfo[]>()

  for (const [filePath, apis] of routes) {
    const moduleName = path.basename(filePath, '.ts')
    const existing = modules.get(moduleName) || []
    modules.set(moduleName, [...existing, ...apis])
  }

  // 生成目录
  markdown += `## 目录\n\n`
  for (const [moduleName] of modules) {
    markdown += `- [${moduleName}](#${moduleName.toLowerCase()})\n`
  }
  markdown += '\n'

  // 生成每个模块的文档
  for (const [moduleName, apis] of modules) {
    markdown += `## ${moduleName}\n\n`

    for (const api of apis) {
      markdown += `### ${api.method} ${api.path}\n\n`
      markdown += `- **方法**: ${api.method}\n`
      markdown += `- **路径**: \`${api.path}\`\n`
      markdown += `- **认证**: ${api.auth ? '✅ 需要' : '❌ 不需要'}\n`
      markdown += `- **管理员**: ${api.admin ? '✅ 需要' : '❌ 不需要'}\n`
      markdown += `- **描述**: ${api.description}\n`
      markdown += '\n'
    }
  }

  return markdown
}

// 生成 JSON 格式的 API 数据
function generateJsonDocs(routes: Map<string, ApiInfo[]>): object {
  const modules: Record<string, ApiInfo[]> = {}

  for (const [filePath, apis] of routes) {
    const moduleName = path.basename(filePath, '.ts')
    if (!modules[moduleName]) {
      modules[moduleName] = []
    }
    modules[moduleName].push(...apis)
  }

  return {
    generatedAt: new Date().toISOString(),
    version: 'v2',
    modules,
  }
}

// 主函数
function main() {
  const routesDir = path.join(__dirname, '..', 'src', 'routes', 'v2')
  const outputDir = path.join(__dirname, '..', 'docs')

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('🔍 扫描路由文件...')
  const routes = scanRoutesDirectory(routesDir)

  console.log(`✅ 发现 ${routes.size} 个路由文件`)

  // 生成 Markdown 文档
  console.log('📝 生成 Markdown 文档...')
  const markdown = generateMarkdownDocs(routes)
  fs.writeFileSync(path.join(outputDir, 'api-routes-auto.md'), markdown)

  // 生成 JSON 数据
  console.log('📊 生成 JSON 数据...')
  const json = generateJsonDocs(routes)
  fs.writeFileSync(path.join(outputDir, 'api-routes-auto.json'), JSON.stringify(json, null, 2))

  // 统计信息
  let totalApis = 0
  for (const apis of routes.values()) {
    totalApis += apis.length
  }

  console.log('\n📈 统计信息:')
  console.log(`   - 路由文件: ${routes.size}`)
  console.log(`   - API 总数: ${totalApis}`)

  // 按模块统计
  console.log('\n📦 模块分布:')
  const moduleStats = new Map<string, number>()
  for (const [filePath, apis] of routes) {
    const moduleName = path.basename(filePath, '.ts')
    const count = moduleStats.get(moduleName) || 0
    moduleStats.set(moduleName, count + apis.length)
  }

  for (const [module, count] of moduleStats) {
    console.log(`   - ${module}: ${count} 个 API`)
  }

  console.log('\n✨ 文档生成完成!')
  console.log(`   📄 ${path.join(outputDir, 'api-routes-auto.md')}`)
  console.log(`   📊 ${path.join(outputDir, 'api-routes-auto.json')}`)
}

main()
