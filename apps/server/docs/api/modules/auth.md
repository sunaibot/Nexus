# Auth 模块 - 认证与授权

> 模块路径: `/api/v2/auth`  
> 最后更新: 2026-02-22

## 📋 模块概述

认证模块负责用户的登录、注册、Token 管理和权限验证。

## 🔗 接口列表

### 1. 用户登录

**POST** `/api/v2/auth/login`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |

#### 请求示例

```json
{
  "username": "admin",
  "password": "your-password"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-123",
      "username": "admin",
      "role": "admin",
      "email": "admin@example.com"
    }
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用户名或密码错误"
  }
}
```

---

### 2. 用户注册

**POST** `/api/v2/auth/register`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名 (3-20位字母数字下划线) |
| password | string | ✅ | 密码 (至少6位) |
| email | string | ❌ | 邮箱 |

#### 请求示例

```json
{
  "username": "newuser",
  "password": "secure-password",
  "email": "user@example.com"
}
```

---

### 3. 刷新 Token

**POST** `/api/v2/auth/refresh`

#### 请求头

```http
Authorization: Bearer <refresh-token>
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 4. 登出

**POST** `/api/v2/auth/logout`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

### 5. 获取当前用户信息

**GET** `/api/v2/auth/me`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "username": "admin",
    "role": "admin",
    "email": "admin@example.com",
    "avatar": "https://...",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 6. 修改密码

**PUT** `/api/v2/auth/password`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | ✅ | 旧密码 |
| newPassword | string | ✅ | 新密码 |

#### 请求头

```http
Authorization: Bearer <token>
```

---

## 🔐 权限说明

| 角色 | 权限 |
|------|------|
| admin | 所有权限 |
| user | 管理自己的资源 |
| guest | 只读公开资源 |

## 📝 错误码

| 错误码 | 描述 |
|--------|------|
| INVALID_CREDENTIALS | 用户名或密码错误 |
| USERNAME_EXISTS | 用户名已存在 |
| EMAIL_EXISTS | 邮箱已被使用 |
| TOKEN_EXPIRED | Token 已过期 |
| TOKEN_INVALID | Token 无效 |
| PASSWORD_TOO_WEAK | 密码强度不足 |

## 💡 使用示例

### cURL 示例

```bash
# 登录
curl -X POST "http://localhost:3000/api/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'

# 获取用户信息
curl -X GET "http://localhost:3000/api/v2/auth/me" \
  -H "Authorization: Bearer <your-token>"
```

### JavaScript 示例

```javascript
// 登录
const response = await fetch('/api/v2/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'your-password'
  })
});

const { data } = await response.json();
localStorage.setItem('token', data.token);
```
