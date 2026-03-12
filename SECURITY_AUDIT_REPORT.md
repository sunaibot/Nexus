# NOWEN 项目安全审计报告

## 审计日期
2026-03-08

## 审计范围
- 后端API安全 (apps/server)
- 文件上传/下载安全
- 认证授权机制
- 数据库操作安全
- 网络安全配置

---

## 🔴 高危问题

### 1. 文件上传路径穿越风险

**位置**: `apps/server/src/features/file-transfer/service.ts`

**问题**: 虽然代码有检查文件名中的 `..` 和 `/`，但使用的是简单的字符串检查：
```typescript
if (request.fileName.includes('/') || request.fileName.includes('\\') || request.fileName.includes('..')) {
  return { success: false, error: '非法文件名' }
}
```

**风险**: 可能被绕过，如使用 `....//` 或编码绕过。

**修复建议**:
```typescript
// 使用 path.basename 提取纯文件名
const sanitizedFileName = path.basename(request.fileName).replace(/[\/\\]/g, '')
if (!sanitizedFileName || sanitizedFileName.startsWith('.')) {
  return { success: false, error: '非法文件名' }
}
```

---

### 2. 分片上传目录穿越风险

**位置**: `apps/server/src/utils/chunk-upload.ts`

**问题**: `mergeChunks` 方法接收 `targetPath` 参数，但没有验证路径是否在允许目录内。

**风险**: 攻击者可能通过控制 targetPath 写入任意位置。

**修复建议**: 添加路径验证：
```typescript
async mergeChunks(sessionId: string, targetPath: string, allowedDir: string): Promise<string> {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedAllowed = path.resolve(allowedDir)
  if (!resolvedTarget.startsWith(resolvedAllowed + path.sep)) {
    throw new Error('目标路径不在允许目录内')
  }
  // ...
}
```

---

### 3. 文件下载路径穿越风险

**位置**: `apps/server/src/features/file-transfer/routes.ts`

**问题**: 虽然代码有路径检查，但使用的是 `normalize` 后检查 `..`，仍可能有绕过方式。

**当前代码**:
```typescript
const normalizedFilePath = pathModule.normalize(file.filePath).replace(/^(\.\.(\/|\\|$))+/, '')
```

**修复建议**: 使用更严格的验证：
```typescript
// 只允许文件名，不包含任何路径分隔符
const safeFileName = path.basename(file.filePath)
const filePath = path.join(uploadsDir, safeFileName)
// 再次验证解析后的路径
if (!filePath.startsWith(uploadsDir + path.sep)) {
  return res.status(403).json({ error: '非法文件路径' })
}
```

---

### 4. CSRF 白名单过于宽泛

**位置**: `apps/server/src/index.ts`

**问题**: CSRF 忽略的 path 列表包含太多敏感路径：
```typescript
ignorePaths: [
  '/api/v2/bookmarks',
  '/api/v2/categories',
  '/api/v2/users',
  // ...
]
```

**风险**: 这些路径允许无 CSRF 保护访问，可能被利用进行 CSRF 攻击。

**修复建议**: 只忽略真正需要公开访问的路径，敏感操作必须验证 CSRF。

---

## 🟡 中危问题

### 5. 缺少安全响应头

**位置**: `apps/server/src/index.ts`

**问题**: 没有配置 Helmet 或手动添加安全响应头。

**风险**: 
- XSS 攻击（缺少 CSP）
- 点击劫持（缺少 X-Frame-Options）
- MIME 嗅探攻击（缺少 X-Content-Type-Options）

**修复建议**: 添加 Helmet 中间件：
```typescript
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

---

### 6. CORS 配置过于宽松

**位置**: `apps/server/src/index.ts`

**问题**: 
```typescript
if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
  return callback(null, true)
}
```

**风险**: 生产环境可能意外允许本地开发访问。

**修复建议**: 生产环境严格限制：
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : []

if (process.env.NODE_ENV === 'production') {
  if (!allowedOrigins.includes(origin)) {
    return callback(new Error('Not allowed by CORS'))
  }
}
```

---

### 7. 错误信息泄露

**位置**: 多个路由文件

**问题**: 部分错误直接返回详细错误信息：
```typescript
} catch (error) {
  console.error('文件下载错误:', error)
  res.status(500).json({ success: false, error: '文件下载失败' })
}
```

**风险**: 虽然大部分已处理，但仍需确保生产环境不泄露堆栈信息。

**修复建议**: 统一错误处理，生产环境只返回通用错误信息。

---

### 8. 数据库动态 SQL 拼接

**位置**: `apps/server/src/db/users.ts`

**问题**: 
```typescript
db.run(`UPDATE users SET ${setParts.join(', ')} WHERE id = ?`, params)
```

**风险**: 虽然使用了参数化查询，但列名是动态拼接的。

**修复建议**: 使用白名单验证列名：
```typescript
const ALLOWED_COLUMNS = ['username', 'email', 'role', 'isActive']
if (!ALLOWED_COLUMNS.includes(column)) {
  throw new Error('非法的更新字段')
}
```

---

## 🟢 低危问题

### 9. 会话 Cookie 配置

**位置**: `apps/server/src/index.ts`

**当前配置**:
```typescript
cookie: {
  secure: !isDevEnv,
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: isDevEnv ? 'lax' : 'strict'
}
```

**评估**: 配置基本合理，但建议：
- 生产环境使用 `sameSite: 'strict'` ✓ 已配置
- 考虑缩短会话有效期

---

### 10. 密码重置令牌强度

**位置**: `apps/server/src/services/UserService.ts`

**当前实现**:
```typescript
const token = generateId() + generateId()
```

**评估**: 令牌长度足够（约32字符），但建议使用加密安全随机数：
```typescript
const token = crypto.randomBytes(32).toString('hex')
```

---

## ✅ 安全亮点

1. **JWT Secret 强制检查**: 生产环境必须设置 JWT_SECRET
2. **密码强度验证**: 注册和修改密码时有长度要求
3. **登录锁定机制**: 多次失败登录后自动锁定
4. **SQL注入防护**: 大部分查询使用参数化查询
5. **文件类型白名单**: 上传文件检查扩展名
6. **危险文件类型黑名单**: 禁止上传可执行文件
7. **IP 过滤功能**: 支持配置 IP 黑白名单
8. **审计日志**: 记录敏感操作
9. **CSRF 防护**: 双提交 Cookie 模式
10. **Referer 检查**: 额外的安全层

---

## 🔧 立即修复建议

### 高优先级（必须修复）

1. **修复文件路径穿越** - 所有文件操作使用 `path.basename()` 提取纯文件名
2. **收紧 CSRF 白名单** - 只保留真正需要公开访问的路径
3. **添加 Helmet 中间件** - 配置安全响应头

### 中优先级（建议修复）

4. **加强 CORS 配置** - 生产环境严格限制来源
5. **统一错误处理** - 避免泄露敏感信息
6. **验证数据库列名** - 使用白名单验证动态列名

### 低优先级（可选优化）

7. **增强令牌强度** - 使用 crypto.randomBytes
8. **缩短会话有效期** - 根据安全需求调整

---

## 📋 NAS 部署安全建议

### 1. 环境变量配置
```bash
# 必须设置（至少8位密码，系统会自动生成安全密钥）
YOUR_PASSWORD=your-strong-password-here

# 可选配置（使用默认值可省略）
NODE_ENV=production
SERVER_PORT=8787
FRONTEND_PORT=8785
MANAGER_PORT=8786

# CORS 配置（根据实际域名）
ALLOWED_ORIGINS=https://your-nas-domain.com

# 禁用开发功能
ENABLE_SWAGGER=false
```

**安全提示**：使用 `YOUR_PASSWORD` 代替直接设置 `JWT_SECRET` 和 `SESSION_SECRET`，系统会自动基于密码生成强密钥。

### 2. 文件权限
```bash
# 上传目录权限
chmod 755 ./uploads
chown -R nobody:nogroup ./uploads

# 数据库目录
chmod 700 ./data
```

### 3. 反向代理配置 (Nginx)
```nginx
server {
    listen 443 ssl http2;
    server_name your-nas-domain.com;
    
    # SSL 配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 安全响应头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 限制请求体大小
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Docker 安全
```yaml
# docker-compose.yml
services:
  nowen:
    image: nowen:latest
    read_only: true  # 只读文件系统
    user: "1000:1000"  # 非 root 用户
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    volumes:
      - ./data:/app/data:rw
      - ./uploads:/app/uploads:rw
      - /tmp:/tmp:rw
```

---

## 📊 风险评级

| 类别 | 高危 | 中危 | 低危 | 总计 |
|------|------|------|------|------|
| 数量 | 4 | 4 | 2 | 10 |

---

## 🔍 后续建议

1. 定期进行安全扫描（使用 `npm audit`）
2. 关注依赖项安全更新
3. 启用自动备份
4. 监控异常访问日志
5. 考虑使用 WAF（Web Application Firewall）

---

*报告生成时间: 2026-03-08*
*审计人员: AI Security Assistant*
