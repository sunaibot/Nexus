# Nexus 安全漏洞审计报告

**审计日期**: 2026-03-08  
**审计人员**: AI Security Auditor  
**风险等级**: 🟡 中危

---

## 执行摘要

经过全面的安全审查，大部分高危漏洞**已修复**，剩余 **2个中危漏洞** 和 **3个低危漏洞** 建议后续优化。

### 风险统计
| 等级 | 数量 | 状态 |
|------|------|------|
| 🔴 高危 | 0 | ✅ 已修复 |
| 🟡 中危 | 2 | 建议修复 |
| 🟢 低危 | 3 | 建议优化 |

---

## ✅ 已修复的高危漏洞

### 1. XSS漏洞 - 存储型跨站脚本攻击 ✅

**状态**: ✅ **已修复**

**修复位置**:
- `apps/frontend/plugins/builtin/notes/index.tsx`
- `apps/manager/modules/notes/index.tsx`
- `apps/manager/modules/plugins/components/NotesManager/index.tsx`

**修复内容**:
```typescript
// 添加HTML转义函数
function escapeHtml(text: string): string {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  // 先转义HTML，再处理markdown
  const escaped = escapeHtml(text)
  return escaped
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
    // ... 其他markdown处理
}
```

**验证方式**: 在笔记中输入 `<script>alert('XSS')</script>`，应显示为纯文本而非执行脚本。

---

### 2. 命令注入漏洞 ✅

**状态**: ✅ **已修复**

**修复位置**:
- `apps/server/src/routes/v2/system.ts:112-124`

**修复内容**:
```typescript
// 使用 execFile 代替 execSync
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// 安全的命令执行
const { stdout: runningStdout } = await execFileAsync('docker', ['ps', '-q'], {
  timeout: 1000,
  encoding: 'utf8'
});
```

---

### 3. 路径穿越漏洞 - 文件下载 ✅

**状态**: ✅ **已修复**

**修复位置**:
- `apps/server/src/features/file-transfer/routes.ts`
- `apps/server/src/middleware/security.ts`

**修复内容**:
```typescript
// 路径穿越检测模式
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,           // ../
  /\.\.\\/,           // ..\
  /%2e%2e%2f/i,      // URL encoded
  /^\//,              // 绝对路径
  /^[a-zA-Z]:\\/,     // Windows 绝对路径
]

// 清理文件名
export function sanitizeFilename(filename: string): string {
  let sanitized = filename.replace(/[/\\]/g, '')
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '')
  sanitized = sanitized.replace(/[<>:"|?*]/g, '')
  return sanitized || 'unnamed'
}
```

---

### 4. JWT密钥硬编码/弱密钥 ✅

**状态**: ✅ **已修复**

**修复位置**:
- `apps/server/src/middleware/auth.ts`
- `apps/server/src/utils/envValidator.ts`
- `.env.example` 配置模板

**修复内容**:
- 使用 `YOUR_PASSWORD` 机制，系统自动生成强密钥
- 无需直接设置 `JWT_SECRET` 和 `SESSION_SECRET`
- 密码长度验证（最少8字符）
- 系统基于密码自动生成32位以上强密钥

```typescript
// 从 YOUR_PASSWORD 自动生成密钥
const YOUR_PASSWORD = process.env.YOUR_PASSWORD;

if (!YOUR_PASSWORD || YOUR_PASSWORD.length < 8) {
  throw new Error('YOUR_PASSWORD must be at least 8 characters long');
}

// 自动生成 JWT_SECRET 和 SESSION_SECRET
const JWT_SECRET = generateKeyFromPassword(YOUR_PASSWORD, 'jwt');
const SESSION_SECRET = generateKeyFromPassword(YOUR_PASSWORD, 'session');
```

**配置示例**:
```bash
# 只需设置你的密码（至少8位）
YOUR_PASSWORD=your-strong-password-here

# 系统会自动生成以下密钥（无需手动设置）
# JWT_SECRET=xxx（自动生成）
# SESSION_SECRET=xxx（自动生成）
```

---

### 5. 缺乏速率限制 ✅

**状态**: ✅ **已修复**

**修复位置**:
- `apps/server/src/middleware/rateLimiter.ts`
- `apps/server/src/middleware/index.ts`

**修复内容**:
```typescript
// 登录限制
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5, // 最多5次
  message: '登录尝试次数过多，请15分钟后再试',
  useAppError: true
})

// API 通用限制
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 100,
  message: '请求过于频繁，请稍后再试'
})
```

**应用位置**:
- `/api/v2/auth/login` - 登录限制（5次/15分钟）
- `/api/v2/users/register` - 注册限制
- `/api/file-transfers/download/:token` - 下载限制
- 通用 API 接口 - 100次/分钟

---

### 6. CORS配置过于宽松 ✅

**状态**: ✅ **已修复**

**修复位置**:
- `apps/server/src/index.ts`

**修复内容**:
```typescript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    // 开发环境允许 localhost
    if (!origin || allowedOrigins.includes(origin) || 
        (process.env.NODE_ENV !== 'production' && origin.includes('localhost'))) {
      callback(null, true)
    } else {
      callback(new Error('不允许的跨域请求'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}
```

---

### 7. 不安全的Cookie配置 ✅

**状态**: ✅ **已修复**

**修复位置**:
- `apps/server/src/middleware/sessionAuth.ts`

**修复内容**:
```typescript
res.cookie('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  path: '/',
});
```

---

## 🟡 中危漏洞（建议修复）

### 8. 不安全的反序列化

**位置**:
- `apps/server/src/db/settings.ts`
- `apps/server/src/routes/v2/settings.ts`

**状态**: 🟡 **部分修复**

**当前状态**:
- 已添加 `securityValidator.ts` 进行输入验证
- 但部分接口仍使用 `JSON.parse()` 直接解析用户输入

**建议修复**:
```typescript
import { z } from 'zod';

// 使用 Zod 验证输入
const SettingsSchema = z.object({
  siteName: z.string().max(100).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  // ... 其他字段
});

function parseSettings(data: string): Settings {
  const parsed = JSON.parse(data);
  return SettingsSchema.parse(parsed); // 验证并过滤
}
```

**优先级**: P2 - 建议修复

---

### 9. 敏感信息泄露

**位置**:
- `apps/server/src/routes/v2/system.ts`

**状态**: 🟡 **部分修复**

**当前状态**:
- 系统信息接口仍返回较多信息
- 建议进一步限制敏感信息

**建议修复**:
```typescript
// 只返回必要信息
res.json({
  data: {
    status: 'running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    // 移除：nodeVersion, platform, memory 等敏感信息
  }
})
```

**优先级**: P2 - 建议修复

---

## 🟢 低危漏洞（建议优化）

### 10. 缺乏安全响应头

**位置**: 全局中间件

**状态**: 🟢 **建议添加**

**建议**:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

### 11. 信息泄露 - 错误详情

**位置**: 多处错误处理

**状态**: 🟢 **建议优化**

**当前状态**:
- 开发环境返回详细错误信息
- 生产环境已限制错误详情

**建议**:
确保所有生产环境错误处理统一：
```typescript
if (process.env.NODE_ENV === 'production') {
  res.status(500).json({ error: 'Internal Server Error' });
} else {
  res.status(500).json({ error: error.message, stack: error.stack });
}
```

---

### 12. 缺乏审计日志

**位置**: 关键操作

**状态**: 🟢 **建议添加**

**当前状态**:
- 已添加 `auditAuto.ts` 自动审计中间件
- 但部分关键操作（如权限变更）缺乏详细审计

**建议**:
```typescript
// 关键操作审计
await auditLog({
  action: 'PERMISSION_CHANGE',
  userId: req.user.id,
  target: targetUserId,
  details: { oldRole, newRole },
  ip: req.ip,
  timestamp: new Date()
});
```

---

## 安全功能清单

### 已实现的安全功能 ✅

| 功能 | 状态 | 位置 |
|------|------|------|
| XSS防护 | ✅ | `escapeHtml` + `renderMarkdown` |
| 命令注入防护 | ✅ | `execFile` 替代 `execSync` |
| 路径穿越防护 | ✅ | `security.ts` 路径检测 |
| 速率限制 | ✅ | `rateLimiter.ts` |
| JWT安全 | ✅ | 强制强密钥 + 验证 |
| CORS配置 | ✅ | 限制来源 |
| Cookie安全 | ✅ | httpOnly + secure + sameSite |
| 文件上传安全 | ✅ | 扩展名/MIME类型检查 |
| SSRF防护 | ✅ | `ssrfProtection.ts` |
| 输入验证 | ✅ | `securityValidator.ts` |
| SQL注入防护 | ✅ | 参数化查询 |
| 自动审计 | ✅ | `auditAuto.ts` |

---

## 安全测试建议

### 自动化测试
```bash
# 依赖漏洞扫描
npm audit

# SAST扫描
npm install -g semgrep
semgrep --config=auto .

# 容器扫描
docker scan nexus-server
```

### 手动测试清单
- [ ] XSS测试 - 在笔记中输入 `<script>alert(1)</script>`
- [ ] 路径穿越 - 尝试 `../../../etc/passwd`
- [ ] 速率限制 - 快速请求登录接口验证限制
- [ ] JWT安全 - 尝试使用弱密钥签名Token
- [ ] 文件上传 - 上传 `.php` 文件验证拦截
- [ ] CORS - 从非授权域名发起请求

---

## 修复记录

### 2026-03-08 安全修复更新

**已修复**:
1. ✅ XSS漏洞 - 添加 `escapeHtml` 函数
2. ✅ 命令注入 - 使用 `execFile` 替代 `execSync`
3. ✅ 路径穿越 - 添加路径检测和文件名清理
4. ✅ JWT密钥 - 强制强密钥策略
5. ✅ 速率限制 - 实现全局限流中间件
6. ✅ CORS配置 - 限制跨域来源
7. ✅ Cookie安全 - 添加安全属性

**待优化**:
- 🟡 完善 Zod 输入验证覆盖所有接口
- 🟡 减少系统信息泄露
- 🟢 添加 Helmet 安全响应头
- 🟢 完善关键操作审计日志

---

## 结论

Nexus项目经过安全加固，**高危漏洞已全部修复**。当前安全状况良好，建议：

1. **定期更新依赖** - 每月运行 `npm audit`
2. **监控安全日志** - 关注异常访问模式
3. **后续优化** - 按优先级修复中危和低危漏洞
4. **安全测试** - 每次发布前进行安全测试

---

**报告更新时间**: 2026-03-08  
**下次审计建议**: 3个月后
