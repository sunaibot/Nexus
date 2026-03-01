# Bookmarks 模块 - 书签管理

> 模块路径: `/api/v2/bookmarks`  
> 最后更新: 2026-02-22

## 📋 模块概述

书签模块是 NOWEN 的核心功能，提供书签的 CRUD 操作、分类管理、权限控制等功能。

## 🔗 接口列表

### 1. 获取书签列表

**GET** `/api/v2/bookmarks`

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| visibility | string | ❌ | 可见性: public/personal/private |
| includePublic | boolean | ❌ | 是否包含公开书签 |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "bm-123",
      "url": "https://example.com",
      "title": "示例网站",
      "description": "这是一个示例",
      "favicon": "https://example.com/favicon.ico",
      "category": "技术",
      "tags": "web,example",
      "isPinned": true,
      "isReadLater": false,
      "visibility": "personal",
      "clickCount": 10,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. 获取公开书签

**GET** `/api/v2/bookmarks/public`

> 无需认证

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "bm-456",
      "url": "https://public-site.com",
      "title": "公开网站",
      "visibility": "public"
    }
  ]
}
```

---

### 3. 分页获取书签

**GET** `/api/v2/bookmarks/paginated`

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | ❌ | 1 | 页码 |
| pageSize | number | ❌ | 20 | 每页数量 |
| search | string | ❌ | - | 搜索关键词 |
| category | string | ❌ | - | 分类筛选 |
| isPinned | boolean | ❌ | - | 是否置顶 |
| isReadLater | boolean | ❌ | - | 是否稍后阅读 |
| sortBy | string | ❌ | createdAt | 排序字段 |
| sortOrder | string | ❌ | desc | 排序方向: asc/desc |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

---

### 4. 获取单个书签

**GET** `/api/v2/bookmarks/:id`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 书签ID |

---

### 5. 创建书签

**POST** `/api/v2/bookmarks`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | ✅ | 链接地址 |
| title | string | ✅ | 标题 |
| description | string | ❌ | 描述 |
| favicon | string | ❌ | 图标URL |
| category | string | ❌ | 分类 |
| tags | string | ❌ | 标签（逗号分隔） |
| notes | string | ❌ | 笔记 |
| isReadLater | boolean | ❌ | 稍后阅读 |
| visibility | string | ❌ | 可见性: public/personal/private |

#### 请求示例

```json
{
  "url": "https://github.com",
  "title": "GitHub",
  "description": "代码托管平台",
  "category": "开发工具",
  "tags": "git,dev",
  "visibility": "personal"
}
```

---

### 6. 更新书签

**PUT** `/api/v2/bookmarks/:id`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 书签ID |

#### 请求参数

与创建书签相同，所有字段可选。

---

### 7. 删除书签

**DELETE** `/api/v2/bookmarks/:id`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 书签ID |

---

### 8. 置顶/取消置顶

**PATCH** `/api/v2/bookmarks/:id/pin`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 书签ID |

---

### 9. 重新排序

**PATCH** `/api/v2/bookmarks/reorder`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | ✅ | 排序项数组 |

```json
{
  "items": [
    { "id": "bm-1", "orderIndex": 0 },
    { "id": "bm-2", "orderIndex": 1 }
  ]
}
```

---

### 10. 移动到分类

**PATCH** `/api/v2/bookmarks/:id/move`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | ✅ | 目标分类（null表示未分类） |

---

### 11. 获取稍后阅读列表

**GET** `/api/v2/bookmarks/read-later`

---

### 12. 获取置顶书签

**GET** `/api/v2/bookmarks/pinned`

---

### 13. 获取分类统计

**GET** `/api/v2/bookmarks/category-stats`

#### 响应示例

```json
{
  "success": true,
  "data": [
    { "category": "技术", "count": 50 },
    { "category": "生活", "count": 20 },
    { "category": "uncategorized", "count": 10 }
  ]
}
```

---

### 14. 修改书签可见性

**PATCH** `/api/v2/bookmarks/:id/visibility`

> 修改书签的可见性状态（public/personal/private）

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 书签ID |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| visibility | string | ✅ | 可见性: public/personal/private |

#### 请求示例

```json
{
  "visibility": "private"
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "bm-123",
    "visibility": "private",
    "updatedAt": "2025-03-01T12:00:00Z"
  }
}
```

#### 权限说明

- 普通用户只能修改自己的书签
- 管理员可以修改所有书签

---

### 15. 获取用户统计

**GET** `/api/v2/bookmarks/stats`

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total": 100,
    "public": 20,
    "personal": 70,
    "private": 10,
    "pinned": 15,
    "readLater": 5
  }
}
```

---

### 16. 增加点击次数

**POST** `/api/v2/bookmarks/:id/click`

> 用于记录书签被点击

---

## 🔐 权限说明

| 可见性 | 说明 | 访问权限 |
|--------|------|----------|
| public | 公开书签 | 所有人可见 |
| personal | 个人书签 | 仅创建者可见 |
| private | 私有书签 | 需要密码访问 |

## 📝 数据模型

### Bookmark 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| url | string | 链接地址 |
| internalUrl | string | 内部链接 |
| title | string | 标题 |
| description | string | 描述 |
| favicon | string | 图标 |
| ogImage | string | 预览图 |
| category | string | 分类 |
| tags | string | 标签 |
| notes | string | 笔记 |
| orderIndex | number | 排序索引 |
| isPinned | boolean | 是否置顶 |
| isReadLater | boolean | 稍后阅读 |
| clickCount | number | 点击次数 |
| visibility | string | 可见性 |
| userId | string | 创建者ID |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

## 💡 使用示例

### 创建书签

```bash
curl -X POST "http://localhost:3000/api/v2/bookmarks" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com",
    "title": "GitHub",
    "category": "开发工具",
    "visibility": "personal"
  }'
```

### 搜索书签

```bash
curl -X GET "http://localhost:3000/api/v2/bookmarks/paginated?search=github&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### JavaScript 示例

```javascript
// 获取书签列表
const response = await fetch('/api/v2/bookmarks', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data: bookmarks } = await response.json();

// 创建书签
const newBookmark = await fetch('/api/v2/bookmarks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    title: '示例',
    visibility: 'personal'
  })
});
```
