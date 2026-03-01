# Session 认证 模块

> 模块路径: `/api/v2/session-auth`  
> 最后更新: 2026-03-01

## 📋 模块概述

Session 认证模块提供基于服务器端 Session 的认证机制，适用于前端和管理后台部署在同一域名下的场景。相比 JWT Token，Session 认证可以实现跨端登录状态共享，用户只需登录一次即可访问前台和管理后台。

## 🔗 接口列表

### 1. 管理员登录

**POST** `/api/v2/session-auth/admin/login`

> 管理员登录并创建 Session

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |

#### 请求示例

```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### 响应示例

**登录成功：**

```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**首次登录需要修改密码：**

```json
{
  "success": true,
  "requirePasswordChange": true,
  "user": {
    "id": "user-123",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**登录失败（账号锁定）：**

```json
{
  "success": false,
  "error": "账号已锁定，请30分钟后重试",
  "locked": true,
  "remainingTime": 1800
}
```

#### 错误码

| 错误码 | 描述 |
|--------|------|
| INVALID_CREDENTIALS | 用户名或密码错误 |
| ACCOUNT_LOCKED | 账号已锁定 |
| VALIDATION_ERROR | 参数验证失败 |

---

### 2. 检查认证状态

**GET** `/api/v2/session-auth/status`

> 检查当前 Session 的认证状态

#### 响应示例

**已登录：**

```json
{
  "success": true,
  "isValid": true,
  "username": "admin",
  "role": "admin",
  "requirePasswordChange": false
}
```

**未登录：**

```json
{
  "success": true,
  "isValid": false
}
```

---

### 3. 管理员登出

**POST** `/api/v2/session-auth/admin/logout`

> 销毁当前 Session，退出登录

#### 响应示例

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 🔐 权限说明

| 操作 | 权限要求 |
|------|----------|
| 登录 | 无需认证 |
| 检查状态 | 无需认证 |
| 登出 | 已登录 |

## 📝 错误码

| 错误码 | 描述 |
|--------|------|
| UNAUTHORIZED | 未登录或 Session 已过期 |
| SESSION_EXPIRED | Session 已过期 |
| INVALID_CREDENTIALS | 凭据无效 |

## 💡 使用示例

### 登录

```bash
curl -X POST "http://localhost:3000/api/v2/session-auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  --cookie-jar cookies.txt
```

### 检查登录状态

```bash
curl -X GET "http://localhost:3000/api/v2/session-auth/status" \
  --cookie cookies.txt
```

### 访问受保护资源

```bash
curl -X GET "http://localhost:3000/api/v2/bookmarks" \
  --cookie cookies.txt
```

### 登出

```bash
curl -X POST "http://localhost:3000/api/v2/session-auth/admin/logout" \
  --cookie cookies.txt
```

### JavaScript 示例

```javascript
// 登录
const loginResponse = await fetch('/api/v2/session-auth/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  }),
  credentials: 'include' // 重要：包含 cookie
});

const loginResult = await loginResponse.json();

// 检查登录状态
const statusResponse = await fetch('/api/v2/session-auth/status', {
  credentials: 'include'
});

const status = await statusResponse.json();
if (status.isValid) {
  console.log(`已登录: ${status.username}`);
}

// 访问受保护资源
const bookmarksResponse = await fetch('/api/v2/bookmarks', {
  credentials: 'include'
});

const bookmarks = await bookmarksResponse.json();

// 登出
await fetch('/api/v2/session-auth/admin/logout', {
  method: 'POST',
  credentials: 'include'
});
```

## 🔒 安全说明

1. **Session 存储**：Session 数据存储在服务器内存中，重启后会丢失（生产环境建议使用 Redis）
2. **Cookie 安全**：
   - `httpOnly`: true - 防止 XSS 攻击
   - `secure`: true - 仅 HTTPS 传输（生产环境）
   - `sameSite`: 'lax' - 防止 CSRF 攻击
3. **Session 过期**：默认 24 小时无操作后过期
4. **并发控制**：同一用户可同时拥有多个 Session

## ⚙️ 配置选项

在服务器配置中可调整以下选项：

```typescript
{
  session: {
    secret: 'your-secret-key',      // Session 加密密钥
    resave: false,                   // 不强制保存未修改的 Session
    saveUninitialized: false,        // 不保存未初始化的 Session
    cookie: {
      secure: false,                 // 生产环境设为 true（HTTPS）
      httpOnly: true,                // 防止客户端访问 cookie
      maxAge: 24 * 60 * 60 * 1000,   // 24 小时过期
      sameSite: 'lax'                // CSRF 防护
    }
  }
}
```

## 📚 相关文档

- [Auth 模块](./auth.md) - JWT Token 认证
- [Users 模块](./users.md) - 用户管理
- [Private Password 模块](./private-password.md) - 私密密码管理
