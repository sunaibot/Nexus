# Users 模块 - 用户管理

> 模块路径: `/api/v2/users`  
> 最后更新: 2026-02-22

## 📋 模块概述

用户模块提供用户账户管理、角色权限控制、用户统计等功能。

## 🔗 接口列表

### 1. 获取用户列表

**GET** `/api/v2/users`

> 需要管理员权限

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | ❌ | 角色筛选: admin/user/guest |
| status | string | ❌ | 状态筛选: active/inactive/suspended |
| search | string | ❌ | 搜索关键词 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "username": "admin",
      "role": "admin",
      "status": "active",
      "email": "admin@example.com",
      "lastLoginAt": "2025-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. 获取单个用户

**GET** `/api/v2/users/:id`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 用户ID |

---

### 3. 创建用户

**POST** `/api/v2/users`

> 需要管理员权限

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名 (3-20位) |
| password | string | ✅ | 密码 (至少6位) |
| role | string | ❌ | 角色: admin/user/guest |
| email | string | ❌ | 邮箱 |
| avatar | string | ❌ | 头像URL |
| nickname | string | ❌ | 昵称 |
| bio | string | ❌ | 简介 |

#### 请求示例

```json
{
  "username": "newuser",
  "password": "secure-password",
  "role": "user",
  "email": "user@example.com",
  "nickname": "新用户"
}
```

---

### 4. 更新用户

**PUT** `/api/v2/users/:id`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 用户ID |

#### 请求参数

与创建用户相同，所有字段可选。

---

### 5. 删除用户

**DELETE** `/api/v2/users/:id`

> 需要管理员权限

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 用户ID |

---

### 6. 激活用户

**PATCH** `/api/v2/users/:id/activate`

> 需要管理员权限

---

### 7. 禁用用户

**PATCH** `/api/v2/users/:id/deactivate`

> 需要管理员权限

---

### 8. 设置用户角色

**PATCH** `/api/v2/users/:id/role`

> 需要管理员权限

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | ✅ | 角色: admin/user/guest |

---

### 9. 重置密码

**POST** `/api/v2/users/:id/reset-password`

> 需要管理员权限

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newPassword | string | ✅ | 新密码 |

---

### 10. 获取用户统计

**GET** `/api/v2/users/stats`

> 需要管理员权限

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 80,
    "inactive": 15,
    "suspended": 5,
    "admins": 3,
    "regularUsers": 97
  }
}
```

---

### 11. 获取最近登录用户

**GET** `/api/v2/users/recent-logins`

> 需要管理员权限

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | number | ❌ | 10 | 数量限制 |

---

## 🔐 权限说明

| 操作 | 权限要求 |
|------|----------|
| 查看用户列表 | admin |
| 创建用户 | admin |
| 更新任意用户 | admin |
| 删除用户 | admin |
| 修改角色 | admin |
| 重置密码 | admin |
| 查看自己信息 | 已登录 |
| 修改自己信息 | 已登录 |

## 📝 数据模型

### User 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| username | string | 用户名 |
| role | string | 角色 |
| status | string | 状态 |
| email | string | 邮箱 |
| avatar | string | 头像 |
| nickname | string | 昵称 |
| bio | string | 简介 |
| lastLoginAt | string | 最后登录时间 |
| lastLoginIp | string | 最后登录IP |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |
| isActive | boolean | 是否激活 |

## 💡 使用示例

### 创建用户

```bash
curl -X POST "http://localhost:3000/api/v2/users" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "role": "user",
    "email": "user@example.com"
  }'
```

### 设置用户角色

```bash
curl -X PATCH "http://localhost:3000/api/v2/users/user-123/role" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```
