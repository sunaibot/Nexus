# 私密密码 模块 - 用户级别私密密码管理

> 模块路径: `/api/v2/users/private-password`  
> 最后更新: 2026-03-01

## 📋 模块概述

私密密码模块提供用户级别的私密密码管理功能。每个用户只有一个私密密码，用于保护标记为 `private` 可见性的书签。

## 🔗 接口列表

### 1. 设置私密密码

**POST** `/api/v2/users/private-password`

> 为当前用户设置私密密码

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | ✅ | 私密密码（至少6位） |

#### 请求示例

```json
{
  "password": "mySecret123"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "私密密码设置成功"
}
```

#### 错误码

| 错误码 | 描述 |
|--------|------|
| VALIDATION_ERROR | 密码格式不符合要求（至少6位） |
| UNAUTHORIZED | 用户未登录 |

---

### 2. 验证私密密码

**POST** `/api/v2/users/private-password/verify`

> 验证用户输入的私密密码是否正确

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | ✅ | 待验证的密码 |

#### 请求示例

```json
{
  "password": "mySecret123"
}
```

#### 响应示例

**验证成功：**

```json
{
  "success": true,
  "valid": true,
  "message": "密码验证成功"
}
```

**验证失败：**

```json
{
  "success": true,
  "valid": false,
  "message": "密码错误"
}
```

---

### 3. 检查私密密码状态

**GET** `/api/v2/users/private-password/status`

> 检查当前用户是否已设置私密密码

#### 响应示例

**已设置密码：**

```json
{
  "success": true,
  "data": {
    "hasPassword": true,
    "createdAt": "2025-03-01T10:00:00Z"
  }
}
```

**未设置密码：**

```json
{
  "success": true,
  "data": {
    "hasPassword": false
  }
}
```

---

### 4. 修改私密密码

**PUT** `/api/v2/users/private-password`

> 修改当前用户的私密密码

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | ✅ | 原密码 |
| newPassword | string | ✅ | 新密码（至少6位） |

#### 请求示例

```json
{
  "oldPassword": "mySecret123",
  "newPassword": "newSecret456"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "私密密码修改成功"
}
```

#### 错误码

| 错误码 | 描述 |
|--------|------|
| VALIDATION_ERROR | 新密码格式不符合要求 |
| INVALID_PASSWORD | 原密码错误 |
| UNAUTHORIZED | 用户未登录 |

---

### 5. 删除私密密码

**DELETE** `/api/v2/users/private-password`

> 删除当前用户的私密密码

#### 响应示例

```json
{
  "success": true,
  "message": "私密密码已删除"
}
```

> ⚠️ **注意**：删除私密密码后，所有标记为 `private` 的书签将无法访问，直到重新设置密码。

---

## 🔐 权限说明

| 操作 | 权限要求 |
|------|----------|
| 设置密码 | 已登录用户 |
| 验证密码 | 已登录用户 |
| 检查状态 | 已登录用户 |
| 修改密码 | 已登录用户 |
| 删除密码 | 已登录用户 |

## 📝 错误码

| 错误码 | 描述 |
|--------|------|
| UNAUTHORIZED | 用户未登录 |
| VALIDATION_ERROR | 参数验证失败 |
| INVALID_PASSWORD | 密码错误 |
| NOT_FOUND | 用户未设置密码 |

## 💡 使用示例

### 设置私密密码

```bash
curl -X POST "http://localhost:3000/api/v2/users/private-password" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "mySecret123"
  }'
```

### 验证私密密码

```bash
curl -X POST "http://localhost:3000/api/v2/users/private-password/verify" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "mySecret123"
  }'
```

### JavaScript 示例

```javascript
// 设置私密密码
const response = await fetch('/api/v2/users/private-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ password: 'mySecret123' })
});

const result = await response.json();

// 验证私密密码
const verifyResponse = await fetch('/api/v2/users/private-password/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ password: 'mySecret123' })
});

const verifyResult = await verifyResponse.json();
if (verifyResult.valid) {
  console.log('密码验证成功');
} else {
  console.log('密码错误');
}
```

## 🔒 安全说明

1. **密码加密存储**：私密密码使用 bcrypt 加密存储，不会明文保存
2. **密码验证**：验证时比较哈希值，不会泄露原始密码
3. **会话管理**：验证成功后，建议将验证状态保存在 session 中，避免频繁验证
4. **密码强度**：建议密码长度至少 8 位，包含字母和数字

## 📚 相关文档

- [Bookmarks 模块](./bookmarks.md) - 书签管理，包含 visibility 设置
- [Session Auth 模块](./session-auth.md) - Session 认证（如果使用 Session 模式）
