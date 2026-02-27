/**
 * API 文档生成脚本
 * 自动生成模块化的 API 文档
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 模块定义
const modules = [
  { name: 'admin', title: '管理员', description: '管理员功能模块' },
  { name: 'admin-menus', title: '菜单管理', description: '后台菜单管理' },
  { name: 'announcements', title: '公告管理', description: '系统公告管理' },
  { name: 'audit', title: '审计日志', description: '操作审计日志' },
  { name: 'batch', title: '批量操作', description: '批量数据处理' },
  { name: 'categories', title: '分类管理', description: '书签分类管理' },
  { name: 'categories-enhanced', title: '增强分类', description: '增强版分类功能' },
  { name: 'custom-metrics', title: '自定义指标', description: '自定义监控指标' },
  { name: 'data', title: '数据管理', description: '数据导入导出' },
  { name: 'dock-configs', title: 'Dock配置', description: 'Dock栏配置' },
  { name: 'file-transfers', title: '文件传输', description: '文件上传下载' },
  { name: 'frontend-nav', title: '前端导航', description: '前端导航配置' },
  { name: 'health', title: '健康检查', description: '服务健康检查' },
  { name: 'i18n', title: '国际化', description: '多语言支持' },
  { name: 'ip-filters', title: 'IP过滤', description: 'IP访问控制' },
  { name: 'metadata', title: '元数据', description: '元数据管理' },
  { name: 'notifications', title: '通知', description: '系统通知' },
  { name: 'notepads', title: '记事本', description: '记事本管理' },
  { name: 'notes', title: '笔记', description: '笔记管理' },
  { name: 'permissions', title: '权限', description: '权限管理' },
  { name: 'plugins', title: '插件', description: '插件管理' },
  { name: 'private-mode', title: '私有模式', description: '私有模式设置' },
  { name: 'quotes', title: '名言', description: '名言管理' },
  { name: 'rss', title: 'RSS', description: 'RSS订阅' },
  { name: 'security', title: '安全', description: '安全相关' },
  { name: 'service-monitors', title: '服务监控', description: '服务状态监控' },
  { name: 'settings-tabs', title: '设置标签', description: '设置页面标签' },
  { name: 'shares', title: '分享', description: '内容分享' },
  { name: 'stats', title: '统计', description: '数据统计' },
  { name: 'system', title: '系统', description: '系统管理' },
  { name: 'tags', title: '标签', description: '标签管理' },
  { name: 'theme', title: '主题', description: '主题管理' },
  { name: 'visits', title: '访问', description: '访问统计' },
  { name: 'webdav', title: 'WebDAV', description: 'WebDAV同步' },
  { name: 'widgets', title: '小部件', description: '小部件管理' }
]

// 生成模块文档
function generateModuleDoc(module) {
  return `# ${module.title} 模块 - ${module.description}

> 模块路径: \`/api/v2/${module.name}\`  
> 最后更新: ${new Date().toISOString().split('T')[0]}

## 📋 模块概述

${module.description}模块提供相关功能的 API 接口。

## 🔗 接口列表

### 1. 获取列表

**GET** \`/api/v2/${module.name}\`

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | ❌ | 页码 |
| pageSize | number | ❌ | 每页数量 |

#### 响应示例

\`\`\`json
{
  "success": true,
  "data": []
}
\`\`\`

---

### 2. 获取详情

**GET** \`/api/v2/${module.name}/:id\`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 资源ID |

---

### 3. 创建

**POST** \`/api/v2/${module.name}\`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 名称 |

---

### 4. 更新

**PUT** \`/api/v2/${module.name}/:id\`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 资源ID |

---

### 5. 删除

**DELETE** \`/api/v2/${module.name}/:id\`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 资源ID |

---

## 🔐 权限说明

| 操作 | 权限要求 |
|------|----------|
| 查看 | 已登录 |
| 创建 | admin |
| 更新 | admin/所有者 |
| 删除 | admin |

## 📝 错误码

| 错误码 | 描述 |
|--------|------|
| NOT_FOUND | 资源不存在 |
| PERMISSION_DENIED | 权限不足 |

## 💡 使用示例

### 获取列表

\`\`\`bash
curl -X GET "http://localhost:3000/api/v2/${module.name}" \\
  -H "Authorization: Bearer <token>"
\`\`\`

### 创建

\`\`\`bash
curl -X POST "http://localhost:3000/api/v2/${module.name}" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "示例"}'
\`\`\`
`
}

// 主函数
function main() {
  const docsDir = path.join(__dirname, '..', 'docs', 'api', 'modules')
  
  // 确保目录存在
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }
  
  let generatedCount = 0
  
  modules.forEach(module => {
    const filePath = path.join(docsDir, `${module.name}.md`)
    
    // 如果文件不存在，则创建
    if (!fs.existsSync(filePath)) {
      const content = generateModuleDoc(module)
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`✅ 生成: ${module.name}.md`)
      generatedCount++
    } else {
      console.log(`⏭️  跳过: ${module.name}.md (已存在)`)
    }
  })
  
  console.log(`\n📊 生成完成: ${generatedCount}/${modules.length} 个文档`)
}

main()
