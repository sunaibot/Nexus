# cURL 示例

> 最后更新: 2026-02-22

## 📋 基础配置

```bash
# 设置基础URL
BASE_URL="http://localhost:3000/api/v2"

# 设置Token（登录后获取）
TOKEN="your-jwt-token"
```

## 🔐 认证

### 登录

```bash
curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

### 获取当前用户

```bash
curl -X GET "${BASE_URL}/auth/me" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 刷新Token

```bash
curl -X POST "${BASE_URL}/auth/refresh" \
  -H "Authorization: Bearer ${REFRESH_TOKEN}"
```

### 登出

```bash
curl -X POST "${BASE_URL}/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 📚 书签

### 获取书签列表

```bash
curl -X GET "${BASE_URL}/bookmarks" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 获取公开书签

```bash
curl -X GET "${BASE_URL}/bookmarks/public"
```

### 分页获取书签

```bash
curl -X GET "${BASE_URL}/bookmarks/paginated?page=1&pageSize=20&search=keyword" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 创建书签

```bash
curl -X POST "${BASE_URL}/bookmarks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com",
    "title": "GitHub",
    "description": "代码托管平台",
    "category": "开发工具",
    "tags": "git,dev",
    "visibility": "personal"
  }'
```

### 更新书签

```bash
curl -X PUT "${BASE_URL}/bookmarks/bookmark-id" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "GitHub - 更新",
    "description": "更新后的描述"
  }'
```

### 删除书签

```bash
curl -X DELETE "${BASE_URL}/bookmarks/bookmark-id" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 置顶书签

```bash
curl -X PATCH "${BASE_URL}/bookmarks/bookmark-id/pin" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 获取分类统计

```bash
curl -X GET "${BASE_URL}/bookmarks/category-stats" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 👤 用户

### 获取用户列表

```bash
curl -X GET "${BASE_URL}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

### 创建用户

```bash
curl -X POST "${BASE_URL}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "role": "user",
    "email": "user@example.com"
  }'
```

### 更新用户

```bash
curl -X PUT "${BASE_URL}/users/user-id" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### 删除用户

```bash
curl -X DELETE "${BASE_URL}/users/user-id" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

## ⚙️ 设置

### 获取站点设置

```bash
curl -X GET "${BASE_URL}/settings/site"
```

### 更新站点设置

```bash
curl -X PUT "${BASE_URL}/settings/site" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "siteTitle": "我的书签",
    "enableWeather": true
  }'
```

### 批量更新设置

```bash
curl -X PUT "${BASE_URL}/settings/batch" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "siteTitle": "NOWEN",
      "enableBeamAnimation": true,
      "enableLiteMode": false
    }
  }'
```

## 📊 统计

### 获取书签统计

```bash
curl -X GET "${BASE_URL}/bookmarks/stats" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 获取用户统计

```bash
curl -X GET "${BASE_URL}/users/stats" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

## 🏥 健康检查

### 服务状态

```bash
curl -X GET "${BASE_URL}/health"
```

### 详细健康信息

```bash
curl -X GET "${BASE_URL}/health/detailed" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
```

## 📁 批量操作

### 批量删除书签

```bash
curl -X POST "${BASE_URL}/batch/delete" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["bm-1", "bm-2", "bm-3"]
  }'
```

### 批量移动分类

```bash
curl -X POST "${BASE_URL}/batch/move" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["bm-1", "bm-2"],
    "category": "新技术"
  }'
```

## 🔍 搜索

### 搜索书签

```bash
curl -X GET "${BASE_URL}/bookmarks/paginated?search=typescript&page=1&pageSize=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 按分类筛选

```bash
curl -X GET "${BASE_URL}/bookmarks/paginated?category=技术&page=1" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 获取稍后阅读

```bash
curl -X GET "${BASE_URL}/bookmarks/read-later" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 获取置顶书签

```bash
curl -X GET "${BASE_URL}/bookmarks/pinned" \
  -H "Authorization: Bearer ${TOKEN}"
```
