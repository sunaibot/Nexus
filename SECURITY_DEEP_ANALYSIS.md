# NOWEN 项目深度安全分析报告

## 分析日期
2026-03-08

## 分析范围
- 全量代码审计
- SSRF 漏洞检测
- 命令注入检测
- 反序列化漏洞
- 权限提升漏洞
- 敏感信息泄露
- DoS 攻击向量

---

## 🏠 NAS部署特别说明

### 场景分析
本项目设计用于NAS部署，存在以下特点：
- **局域网访问**：NAS通常在家庭/企业内网，需要访问局域网资源
- **服务监控**：可能需要监控内网其他服务（如路由器、其他Docker容器）
- **安全风险**：公网暴露时，攻击者可能利用SSRF探测内网

### 解决方案：分层防护策略

```
┌─────────────────────────────────────────────────────────────┐
│                    SSRF 防护层级                             │
├─────────────────────────────────────────────────────────────┤
│  🔴 严格禁止（始终阻止）                                      │
│     • 本地回环 (127.0.0.0/8, localhost)                     │
│     • 云服务元数据 (169.254.169.254)                         │
│     • 特殊用途IP (0.0.0.0/8, 224-255.x.x.x)                 │
├─────────────────────────────────────────────────────────────┤
│  🟡 可配置（根据设置决定）                                    │
│     • 私有网络 (10.x.x.x, 172.16-31.x.x, 192.168.x.x)       │
│     • 运营商级NAT (100.64.x.x)                              │
├─────────────────────────────────────────────────────────────┤
│  🟢 不同功能不同策略                                          │
│     • 元数据抓取：严格模式（禁止所有内网）                     │
│     • 服务监控：可配置（允许监控内网服务）                     │
│     • 壁纸API：严格模式（只允许公网）                        │
└─────────────────────────────────────────────────────────────┘
```

### 配置方法

**API接口**（管理员权限）：
```bash
# 查看当前设置
GET /api/v2/system/security/ssrf

# 允许监控内网服务（NAS环境推荐）
PUT /api/v2/system/security/ssrf
Body: { "allowPrivateIPs": true }

# 禁止监控内网服务（公网暴露时）
PUT /api/v2/system/security/ssrf
Body: { "allowPrivateIPs": false }
```

---

## 🔴 高危漏洞

### 1. SSRF (服务器端请求伪造) 漏洞

**风险等级**: 🔴 高危

**位置**: 
- `apps/server/src/routes/v2/metadata.ts`
- `apps/server/src/services/metadata.ts`
- `apps/server/src/routes/v2/modules/service-monitors/index.ts`
- `apps/server/src/routes/v2/modules/wallpaper/index.ts`

**漏洞描述**:
元数据抓取功能直接接受用户传入的 URL 并发起请求，没有进行任何 URL 白名单或内网地址过滤：

```typescript
// metadata.ts
router.post('/', async (req: Request, res: Response) => {
  const { url } = req.body
  const metadata = await extractMetadata(url)  // 直接请求用户提供的URL
})

// service-monitors/index.ts
const response = await fetch(monitor.url, {  // 监控URL可被设置为内网地址
  method: monitor.method || 'GET',
})
```

**攻击场景**:
1. 攻击者设置监控目标为 `http://localhost:22` 探测本地 SSH 服务
2. 攻击者设置监控目标为 `http://169.254.169.254/latest/meta-data/` 读取云服务器元数据
3. 攻击者通过元数据接口请求内网管理后台 `http://192.168.1.1/admin`

**修复方案**（已实施）：

```typescript
// utils/ssrfProtection.ts - 分层防护

// 1. 严格禁止（始终阻止）
const STRICT_BLOCKED_HOSTS = new Set([
  'localhost', '127.0.0.1',
  '169.254.169.254',  // 云元数据
  'metadata.google.internal',
])

// 2. 可配置（NAS环境可允许）
function isPrivateIP(ip: string): boolean {
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
}

// 3. 不同功能不同策略
export function validateMetadataUrl(url: string) {
  return validateUrl(url, { allowPrivateIPs: false })  // 严格
}

export function validateMonitorUrl(url: string) {
  const config = getSSRFConfig()  // 读取配置
  return validateUrl(url, { allowPrivateIPs: config.allowPrivateIPs })  // 可配置
}
```

---
const SSRF_PROTECTION = {
  // 禁止的IP段
  blockedIPs: [
    '127.0.0.0/8',      // 本地回环
    '10.0.0.0/8',       // 私有网络
    '172.16.0.0/12',    // 私有网络
    '192.168.0.0/16',   // 私有网络
    '169.254.0.0/16',   // 链路本地
    '0.0.0.0/8',        // 当前网络
    '::1/128',          // IPv6 回环
    'fc00::/7',         // IPv6 私有
    'fe80::/10',        // IPv6 链路本地
  ],
  
  // 禁止的主机名
  blockedHosts: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]',
    '[::]',
    'metadata.google.internal',
    '169.254.169.254',
  ],
  
  // 允许的协议
  allowedProtocols: ['http:', 'https:'],
}

// URL 验证函数
export function validateUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString)
    
    // 检查协议
    if (!SSRF_PROTECTION.allowedProtocols.includes(url.protocol)) {
      return { valid: false, error: '不支持的协议' }
    }
    
    // 检查主机名
    const hostname = url.hostname.toLowerCase()
    if (SSRF_PROTECTION.blockedHosts.includes(hostname)) {
      return { valid: false, error: '禁止访问该主机' }
    }
    
    // 检查IP地址
    const ip = hostname.replace(/[\[\]]/g, '')
    if (isPrivateIP(ip)) {
      return { valid: false, error: '禁止访问私有IP' }
    }
    
    // 解析DNS并再次检查（防止DNS重绑定攻击）
    // 实际实现中需要异步DNS解析
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: '无效的URL' }
  }
}

// 检查是否为私有IP
function isPrivateIP(ip: string): boolean {
  // 实现IP段匹配逻辑
  const parts = ip.split('.').map(Number)
  if (parts.length === 4) {
    // 127.0.0.0/8
    if (parts[0] === 127) return true
    // 10.0.0.0/8
    if (parts[0] === 10) return true
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true
    // 169.254.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true
  }
  return false
}
```

---

### 2. 命令注入风险

**风险等级**: 🟡 中危

**位置**: `apps/server/src/routes/v2/system.ts`

**漏洞描述**:
系统监控功能使用 `execFile` 执行 Docker 命令，虽然使用了参数数组而非字符串拼接，但仍存在潜在风险：

```typescript
const { execFile } = await import('child_process')
const { stdout: runningStdout } = await execFileAsync('docker', ['ps', '-q'], {
  encoding: 'utf8',
  timeout: 1000,
  windowsHide: true
})
```

**风险**: 当前实现相对安全，但建议添加命令白名单和更严格的超时控制。

**修复方案**:
```typescript
// 命令白名单
const ALLOWED_COMMANDS = {
  'docker': ['ps', '-q', '-aq'],
} as const

// 安全的命令执行
async function safeExec(command: string, args: string[]): Promise<string> {
  // 验证命令在白名单中
  if (!ALLOWED_COMMANDS[command as keyof typeof ALLOWED_COMMANDS]) {
    throw new Error('命令不在白名单中')
  }
  
  // 验证参数（只允许字母数字和特定符号）
  const validArgPattern = /^[a-zA-Z0-9\-_]+$/
  for (const arg of args) {
    if (!validArgPattern.test(arg)) {
      throw new Error('非法参数')
    }
  }
  
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const execFileAsync = promisify(execFile)
  
  const { stdout } = await execFileAsync(command, args, {
    encoding: 'utf8',
    timeout: 5000,  // 更短的超时
    windowsHide: true,
    maxBuffer: 1024 * 1024,  // 限制输出大小
  })
  
  return stdout
}
```

---

### 3. 敏感数据泄露风险

**风险等级**: 🟡 中危

**位置**: 
- `apps/server/src/routes/v2/data.ts` (数据导出)
- `apps/server/src/routes/v2/wallpaper-providers.ts`

**漏洞描述**:

1. **数据导出接口** 导出所有用户数据，包括敏感信息：
```typescript
// 导出所有数据，包含用户ID等敏感信息
const exportData: ExportData = {
  bookmarks,      // 包含 userId
  categories,     // 包含 userId
  settings,       // 可能包含敏感配置
  // ...
}
```

2. **壁纸源配置** 返回 API Key：
```typescript
// 返回包含 apiKey 的配置
return {
  id: row.id,
  apiKey: row.apiKey,  // 敏感信息泄露
  // ...
}
```

**修复方案**:
```typescript
// 数据导出时脱敏
function sanitizeExportData(data: any): any {
  const sensitiveFields = ['userId', 'password', 'apiKey', 'secret', 'token']
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeExportData(item))
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeExportData(value)
      }
    }
    return sanitized
  }
  
  return data
}

// API响应中隐藏敏感字段
function parseProvider(row: any) {
  return {
    id: row.id,
    name: row.name,
    // ... 其他字段
    hasApiKey: !!row.apiKey,  // 只返回是否有API Key，不返回值
    // apiKey: row.apiKey,    // 不返回实际值
  }
}
```

---

### 4. DoS 攻击向量

**风险等级**: 🟡 中危

**位置**: 
- `apps/server/src/services/metadata.ts`
- `apps/server/src/features/file-transfer/service.ts`

**漏洞描述**:

1. **元数据抓取超时过长**:
```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  timeout = 10000  // 10秒超时过长
): Promise<Response>
```

2. **翻译API无限制调用**:
```typescript
// 可能被滥用进行大量翻译请求
async function translateText(text: string, from: string, to: string)
```

3. **文件上传无大小限制**:
```typescript
// 虽然检查了 fileSize，但实际的 Base64 数据可能更大
const base64Data = request.fileData.replace(/^data:.*;base64,/, '')
```

**修复方案**:
```typescript
// 1. 缩短超时时间
const DEFAULT_TIMEOUT = 5000  // 5秒
const MAX_RETRIES = 1

// 2. 添加翻译频率限制
const translationLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1分钟
  max: 10,  // 每IP最多10次翻译请求
})

// 3. 严格限制文件大小
const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB
const MAX_BASE64_SIZE = Math.ceil(MAX_FILE_SIZE * 4 / 3)  // Base64膨胀系数

if (request.fileData.length > MAX_BASE64_SIZE) {
  return { success: false, error: '文件过大' }
}
```

---

### 5. 权限提升风险

**风险等级**: 🟡 中危

**位置**: `apps/server/src/routes/v2/data.ts`

**漏洞描述**:
数据导入功能允许导入用户ID字段，可能导致权限混乱：
```typescript
const userId = bm.userId || user?.id || null  // 信任导入数据中的userId
```

攻击者可以构造导入数据，将书签关联到其他用户ID。

**修复方案**:
```typescript
// 强制使用当前用户ID，忽略导入数据中的userId
const userId = user?.id || null  // 不使用 bm.userId
```

---

## 🟡 中危问题

### 6. JSON 解析缺乏错误处理

**位置**: 多处使用 `JSON.parse` 没有 try-catch

**修复方案**:
```typescript
function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}
```

### 7. 正则表达式 DoS (ReDoS)

**位置**: 多处正则表达式可能回溯

**风险代码**:
```typescript
const metaMatch = html.match(/<meta[^>]+charset=["']?([^"';\s>]+)/i)
```

**修复方案**: 使用非回溯的正则表达式引擎或限制输入长度。

---

## 🟢 安全亮点

1. ✅ **密码加密存储** - 使用 bcrypt 哈希
2. ✅ **SQL 参数化查询** - 防止 SQL 注入
3. ✅ **JWT 认证** - 使用 HS256 算法
4. ✅ **Helmet 安全头** - 已配置 CSP、HSTS 等
5. ✅ **文件类型白名单** - 限制可上传文件类型
6. ✅ **路径安全验证** - 使用 path.basename 防止穿越

---

## 📋 完整加固方案

### 1. 立即修复（高危）

```typescript
// middleware/ssrfProtection.ts
import { Request, Response, NextFunction } from 'express'

export function ssrfProtection(req: Request, res: Response, next: NextFunction) {
  const url = req.body.url || req.query.url || req.body.serverUrl
  
  if (url) {
    const validation = validateUrl(url)
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: `URL验证失败: ${validation.error}` 
      })
    }
  }
  
  next()
}
```

### 2. 配置加固

```typescript
// config/security.ts
export const SECURITY_CONFIG = {
  // 请求限制
  requestLimits: {
    maxBodySize: '10mb',
    maxJsonSize: '1mb',
    maxUrlLength: 2048,
  },
  
  // 超时配置
  timeouts: {
    metadataFetch: 5000,
    fileUpload: 60000,
    apiRequest: 30000,
  },
  
  // 频率限制
  rateLimits: {
    metadata: { windowMs: 60000, max: 30 },
    translation: { windowMs: 60000, max: 10 },
    fileUpload: { windowMs: 60000, max: 5 },
  },
}
```

### 3. 监控告警

```typescript
// 安全事件监控
export function securityMonitor(req: Request, res: Response, next: NextFunction) {
  // 检测可疑请求模式
  const suspiciousPatterns = [
    /\.\.[\/\\]/,           // 路径穿越尝试
    /<(script|iframe|object)/i,  // XSS 尝试
    /(union|select|insert|delete|update|drop)\s+/i,  // SQL注入尝试
  ]
  
  const requestData = JSON.stringify(req.body) + req.url
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      console.warn(`[Security Alert] Suspicious request from ${req.ip}: ${pattern}`)
      // 记录到安全日志
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip: req.ip,
        pattern: pattern.toString(),
        url: req.url,
        timestamp: new Date().toISOString(),
      })
    }
  }
  
  next()
}
```

---

## 🚀 NAS 部署安全建议

### 1. 网络隔离
```bash
# Docker 网络隔离
docker network create --internal nowen-internal
docker run --network nowen-internal ...
```

### 2. 资源限制
```bash
# 限制容器资源
docker run \
  --memory=1g \
  --memory-swap=1g \
  --cpus=1.0 \
  --pids-limit=100 \
  ...
```

### 3. 只读文件系统
```bash
docker run \
  --read-only \
  --tmpfs /tmp:noexec,nosuid,size=100m \
  --tmpfs /app/uploads:noexec,nosuid,size=1g \
  ...
```

### 4. 安全扫描
```bash
# 使用 Trivy 扫描镜像
trivy image nowen-server:latest

# 使用 Snyk 扫描依赖
snyk test
```

---

## 📊 风险评分

| 漏洞类型 | 风险等级 | 利用难度 | 影响范围 | 修复优先级 |
|---------|---------|---------|---------|-----------|
| SSRF | 🔴 高危 | 低 | 内网渗透 | P0 |
| 敏感数据泄露 | 🟡 中危 | 低 | 数据安全 | P1 |
| DoS | 🟡 中危 | 低 | 服务可用性 | P1 |
| 权限提升 | 🟡 中危 | 中 | 访问控制 | P1 |
| 命令注入 | 🟡 中危 | 高 | 服务器安全 | P2 |
| ReDoS | 🟡 中危 | 中 | 服务可用性 | P2 |

---

## 📝 修复检查清单

### 已修复 ✅
- [x] 添加 SSRF 防护中间件
- [x] 限制元数据抓取URL白名单（严格模式）
- [x] 服务监控添加URL验证（可配置模式）
- [x] 数据导出脱敏处理
- [x] 隐藏壁纸源API Key
- [x] 添加强制用户ID验证
- [x] 添加Helmet安全头

### 待完成 ⏳
- [ ] 缩短请求超时时间
- [ ] 添加翻译频率限制
- [ ] 加强文件大小限制
- [ ] 添加安全事件监控
- [ ] 配置Docker安全选项
- [ ] 部署WAF规则

---

## 🏠 NAS部署快速配置指南

### 1. 首次部署配置

```bash
# 1. 启动服务后，登录管理后台
# 2. 配置SSRF策略（根据部署环境选择）

# 纯内网部署（推荐开启）
curl -X PUT http://your-nas:3000/api/v2/system/security/ssrf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"allowPrivateIPs": true}'

# 公网暴露（必须关闭）
curl -X PUT http://your-nas:3000/api/v2/system/security/ssrf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"allowPrivateIPs": false}'
```

### 2. 不同场景配置建议

| 部署场景 | allowPrivateIPs | 说明 |
|---------|-----------------|------|
| 纯内网NAS | `true` | 可监控内网服务，方便管理 |
| 内网+VPN | `true` | 通过VPN访问时保持内网功能 |
| 公网暴露 | `false` | 防止攻击者探测内网 |
| 反向代理 | 视情况 | 根据代理位置决定 |

### 3. 安全加固检查

```bash
# 检查当前配置
curl http://your-nas:3000/api/v2/system/security/ssrf \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试SSRF防护（应该被拒绝）
curl -X POST http://your-nas:3000/api/v2/metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "http://192.168.1.1"}'

# 测试服务监控（根据配置决定是否允许）
curl -X POST http://your-nas:3000/api/v2/service-monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Router", "url": "http://192.168.1.1"}'
```
