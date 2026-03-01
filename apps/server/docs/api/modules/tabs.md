# Tab 模块 - 快速导航标签

> 模块路径: `/api/v2/tabs`  
> 最后更新: 2026-03-01

## 📋 模块概述

Tab 模块提供快速导航标签的 CRUD 操作。每个 Tab 可以关联多个分类，用于在前端左侧边栏快速切换不同的书签视图。

## 🔗 接口列表

### 1. 获取所有 Tab

**GET** `/api/v2/tabs`

#### 认证

- **需要认证**: 否（可选）
- **需要管理员**: 否

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "tab-home",
      "name": "主页",
      "icon": "Home",
      "color": "#3B82F6",
      "orderIndex": 0,
      "isDefault": true,
      "userId": "admin",
      "createdAt": "2026-03-01T07:11:13.561Z",
      "updatedAt": "2026-03-01T07:11:13.561Z",
      "categories": [
        {
          "id": "cat-tools",
          "name": "常用工具",
          "icon": "Wrench",
          "color": "#3b82f6",
          "orderIndex": 0
        }
      ]
    }
  ],
  "meta": {
    "timestamp": "2026-03-01T07:11:38.483Z"
  }
}
```

---

### 2. 获取当前 Tab

**GET** `/api/v2/tabs/current`

返回默认 Tab 或第一个 Tab。

#### 认证

- **需要认证**: 否（可选）
- **需要管理员**: 否

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "tab-home",
    "name": "主页",
    "icon": "Home",
    "color": "#3B82F6",
    "orderIndex": 0,
    "isDefault": true,
    "categories": []
  }
}
```

---

### 3. 获取单个 Tab

**GET** `/api/v2/tabs/:id`

#### 认证

- **需要认证**: 否（可选）
- **需要管理员**: 否

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | Tab ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "tab-home",
    "name": "主页",
    "icon": "Home",
    "color": "#3B82F6",
    "orderIndex": 0,
    "isDefault": true,
    "categories": []
  }
}
```

---

### 4. 创建 Tab

**POST** `/api/v2/tabs`

#### 认证

- **需要认证**: 是
- **需要管理员**: 否（普通用户可创建自己的 Tab）

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | Tab 名称 |
| icon | string | 否 | 图标名称（Lucide 图标） |
| color | string | 否 | 颜色代码（如 #3B82F6） |
| categoryIds | string[] | 否 | 关联的分类 ID 列表 |

#### 请求示例

```json
{
  "name": "我的工具",
  "icon": "Wrench",
  "color": "#3B82F6",
  "categoryIds": ["cat-tools", "cat-dev"]
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "tab-xxx",
    "name": "我的工具",
    "icon": "Wrench",
    "color": "#3B82F6",
    "orderIndex": 5,
    "isDefault": false,
    "userId": "user-xxx",
    "createdAt": "2026-03-01T08:00:00.000Z",
    "updatedAt": "2026-03-01T08:00:00.000Z"
  }
}
```

---

### 5. 更新 Tab

**PATCH** `/api/v2/tabs/:id`

#### 认证

- **需要认证**: 是
- **需要管理员**: 否（只能更新自己的 Tab，管理员可更新所有）

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | Tab ID |

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | Tab 名称 |
| icon | string | 否 | 图标名称 |
| color | string | 否 | 颜色代码 |
| categoryIds | string[] | 否 | 关联的分类 ID 列表（会替换原有） |
| isDefault | boolean | 否 | 是否设为默认 Tab |

#### 请求示例

```json
{
  "name": "常用工具",
  "color": "#10B981",
  "categoryIds": ["cat-tools"]
}
```

---

### 6. 删除 Tab

**DELETE** `/api/v2/tabs/:id`

#### 认证

- **需要认证**: 是
- **需要管理员**: 否（只能删除自己的 Tab，管理员可删除所有）

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | Tab ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

### 7. 重排序 Tab

**PATCH** `/api/v2/tabs/reorder`

#### 认证

- **需要认证**: 是
- **需要管理员**: 否

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | 是 | 排序项目列表 |
| items[].id | string | 是 | Tab ID |
| items[].orderIndex | number | 是 | 新的排序索引 |

#### 请求示例

```json
{
  "items": [
    { "id": "tab-home", "orderIndex": 0 },
    { "id": "tab-dev", "orderIndex": 1 },
    { "id": "tab-ai", "orderIndex": 2 }
  ]
}
```

---

## 🔐 权限说明

| 操作 | 权限要求 |
|------|----------|
| 获取所有 Tab | 公开访问 |
| 获取当前 Tab | 公开访问 |
| 获取单个 Tab | 公开访问 |
| 创建 Tab | 需要登录 |
| 更新 Tab | 需要登录，只能更新自己的 Tab（管理员除外） |
| 删除 Tab | 需要登录，只能删除自己的 Tab（管理员除外） |
| 重排序 Tab | 需要登录 |

## 📝 数据模型

### Tab 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | Tab 唯一标识 |
| name | string | Tab 名称 |
| icon | string | 图标名称（Lucide 图标） |
| color | string | 颜色代码 |
| orderIndex | number | 排序索引 |
| isDefault | boolean | 是否为默认 Tab |
| userId | string | 创建者 ID |
| categories | Category[] | 关联的分类列表 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

## 📝 错误码

| 错误码 | 描述 |
|--------|------|
| TAB_NOT_FOUND | Tab 不存在 |
| UNAUTHORIZED | 未授权访问 |
| FORBIDDEN | 无权操作此 Tab |
| VALIDATION_ERROR | 参数验证失败 |

## 💡 使用示例

### cURL 示例

```bash
# 获取所有 Tab
curl -X GET "http://localhost:3000/api/v2/tabs"

# 创建 Tab
curl -X POST "http://localhost:3000/api/v2/tabs" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的工具",
    "icon": "Wrench",
    "color": "#3B82F6",
    "categoryIds": ["cat-tools"]
  }'

# 更新 Tab
curl -X PATCH "http://localhost:3000/api/v2/tabs/tab-xxx" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "常用工具",
    "color": "#10B981"
  }'

# 删除 Tab
curl -X DELETE "http://localhost:3000/api/v2/tabs/tab-xxx" \
  -H "Authorization: Bearer <token>"

# 重排序 Tab
curl -X PATCH "http://localhost:3000/api/v2/tabs/reorder" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "id": "tab-home", "orderIndex": 0 },
      { "id": "tab-dev", "orderIndex": 1 }
    ]
  }'
```

### JavaScript 示例

```javascript
// 获取所有 Tab
const response = await fetch('/api/v2/tabs');
const { data: tabs } = await response.json();

// 创建 Tab
const response = await fetch('/api/v2/tabs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '我的工具',
    icon: 'Wrench',
    color: '#3B82F6',
    categoryIds: ['cat-tools']
  })
});

// 切换 Tab（前端逻辑）
function switchTab(tabId) {
  // 根据 tabId 过滤显示的书签
  const activeTab = tabs.find(t => t.id === tabId);
  const categoryIds = activeTab.categories.map(c => c.id);
  const filteredBookmarks = bookmarks.filter(b => 
    categoryIds.includes(b.category)
  );
}
```
