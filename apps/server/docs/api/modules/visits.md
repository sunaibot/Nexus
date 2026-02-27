# 访问 模块 - 访问统计

> 模块路径: `/api/v2/visits`  
> 最后更新: 2026-02-22

## 📋 模块概述

访问统计模块提供相关功能的 API 接口。

## 🔗 接口列表

### 1. 获取列表

**GET** `/api/v2/visits`

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | ❌ | 页码 |
| pageSize | number | ❌ | 每页数量 |

#### 响应示例

```json
{
  "success": true,
  "data": []
}
```

---

### 2. 获取详情

**GET** `/api/v2/visits/:id`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 资源ID |

---

### 3. 创建

**POST** `/api/v2/visits`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 名称 |

---

### 4. 更新

**PUT** `/api/v2/visits/:id`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 资源ID |

---

### 5. 删除

**DELETE** `/api/v2/visits/:id`

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

```bash
curl -X GET "http://localhost:3000/api/v2/visits" \
  -H "Authorization: Bearer <token>"
```

### 创建

```bash
curl -X POST "http://localhost:3000/api/v2/visits" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "示例"}'
```
