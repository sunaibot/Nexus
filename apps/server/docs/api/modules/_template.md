# {ModuleName} 模块 - {中文名称}

> 模块路径: `/api/v2/{module-path}`  
> 最后更新: 2026-02-22

## 📋 模块概述

{模块功能描述}

## 🔗 接口列表

### 1. {接口名称}

**{METHOD}** `/api/v2/{path}`

#### 认证

- **需要认证**: {是/否}
- **需要管理员**: {是/否}

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| {param} | {type} | {required} | {description} |

#### 请求示例

```json
{
  "key": "value"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {}
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

---

## 🔐 权限说明

| 操作 | 权限要求 |
|------|----------|
| {操作} | {权限} |

## 📝 数据模型

### {Model} 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| {field} | {type} | {description} |

## 📝 错误码

| 错误码 | 描述 |
|--------|------|
| {CODE} | {description} |

## 💡 使用示例

### cURL 示例

```bash
curl -X {METHOD} "http://localhost:3000/api/v2/{path}" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

### JavaScript 示例

```javascript
const response = await fetch('/api/v2/{path}', {
  method: '{METHOD}',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ key: 'value' })
});
```
