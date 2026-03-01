# NOWEN API 文档

> 版本: v2.0  
> 更新日期: 2026-02-22  
> 文档架构: 模块化、高内聚、低耦合、高扩展

## 📚 文档结构

```
docs/api/
├── README.md                 # 本文档 - 总入口
├── guides/                   # 使用指南
│   ├── authentication.md     # 认证指南
│   ├── error-handling.md     # 错误处理
│   ├── rate-limiting.md      # 限流说明
│   └── pagination.md         # 分页指南
├── modules/                  # 模块文档（高内聚）
│   ├── core/                 # 核心模块
│   ├── bookmark/             # 书签模块
│   ├── user/                 # 用户模块
│   ├── admin/                # 管理模块
│   └── system/               # 系统模块
└── examples/                 # 示例代码
    ├── curl-examples.md
    └── javascript-examples.md
```

## 🚀 快速开始

### 基础信息

- **基础URL**: `http://localhost:3000/api/v2`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 认证示例

```bash
curl -X GET "http://localhost:3000/api/v2/bookmarks" \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 📦 API 模块

### 核心模块 (Core)

| 模块 | 描述 | 文档链接 |
|------|------|----------|
| **Auth** | 认证与授权 | [查看文档](./modules/auth.md) |
| **Users** | 用户管理 | [查看文档](./modules/users.md) |
| **Bookmarks** | 书签管理 | [查看文档](./modules/bookmarks.md) |

### 管理模块 (Admin)

| 模块 | 描述 | 文档链接 |
|------|------|----------|
| **Admin** | 管理员功能 | [查看文档](./modules/admin.md) |
| **AdminMenus** | 菜单管理 | [查看文档](./modules/admin-menus.md) |
| **Audit** | 审计日志 | [查看文档](./modules/audit.md) |
| **Stats** | 统计数据 | [查看文档](./modules/stats.md) |

### 系统模块 (System)

| 模块 | 描述 | 文档链接 |
|------|------|----------|
| **Settings** | 系统设置 | [查看文档](./modules/settings.md) |
| **System** | 系统监控 | [查看文档](./modules/system.md) |
| **Health** | 健康检查 | [查看文档](./modules/health.md) |
| **Security** | 安全相关 | [查看文档](./modules/security.md) |

### 扩展模块 (Extensions)

| 模块 | 描述 | 文档链接 |
|------|------|----------|
| **Plugins** | 插件管理 | [查看文档](./modules/plugins.md) |
| **Theme** | 主题管理 | [查看文档](./modules/theme.md) |
| **Widgets** | 小部件管理 | [查看文档](./modules/widgets.md) |
| **Categories** | 分类管理 | [查看文档](./modules/categories.md) |
| **Tags** | 标签管理 | [查看文档](./modules/tags.md) |
| **Visits** | 访问统计 | [查看文档](./modules/visits.md) |
| **Notifications** | 通知管理 | [查看文档](./modules/notifications.md) |
| **RSS** | RSS订阅 | [查看文档](./modules/rss.md) |
| **WebDAV** | WebDAV同步 | [查看文档](./modules/webdav.md) |
| **FileTransfers** | 文件传输 | [查看文档](./modules/file-transfers.md) |
| **Shares** | 分享功能 | [查看文档](./modules/shares.md) |
| **Quotes** | 名言管理 | [查看文档](./modules/quotes.md) |
| **Notes** | 笔记管理 | [查看文档](./modules/notes.md) |
| **Notepads** | 记事本管理 | [查看文档](./modules/notepads.md) |
| **Metadata** | 元数据管理 | [查看文档](./modules/metadata.md) |
| **I18n** | 国际化 | [查看文档](./modules/i18n.md) |
| **Batch** | 批量操作 | [查看文档](./modules/batch.md) |
| **Data** | 数据导入导出 | [查看文档](./modules/data.md) |
| **FrontendNav** | 前端导航 | [查看文档](./modules/frontend-nav.md) |
| **DockConfigs** | Dock配置 | [查看文档](./modules/dock-configs.md) |
| **SettingsTabs** | 设置标签页 | [查看文档](./modules/settings-tabs.md) |
| **Announcements** | 公告管理 | [查看文档](./modules/announcements.md) |
| **ServiceMonitors** | 服务监控 | [查看文档](./modules/service-monitors.md) |
| **CustomMetrics** | 自定义指标 | [查看文档](./modules/custom-metrics.md) |
| **IpFilters** | IP过滤 | [查看文档](./modules/ip-filters.md) |
| **PrivatePassword** | 私密密码管理 | [查看文档](./modules/private-password.md) |
| **SessionAuth** | Session 认证 | [查看文档](./modules/session-auth.md) |
| **Permissions** | 权限管理 | [查看文档](./modules/permissions.md) |
| **CategoriesEnhanced** | 增强分类 | [查看文档](./modules/categories-enhanced.md) |

## 🔐 认证机制

NOWEN 支持两种认证方式：**JWT Token** 和 **Session 认证**

### 方式一：JWT Token（默认）

#### 获取 Token

```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

#### 使用 Token

```http
GET /api/v2/bookmarks
Authorization: Bearer <token>
```

### 方式二：Session 认证（推荐用于同域部署）

Session 认证适用于前端和管理后台部署在同一域名下的场景，可以实现跨端登录状态共享。

#### 管理员登录

```http
POST /api/v2/session-auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

#### 检查登录状态

```http
GET /api/v2/session-auth/status
```

#### 登出

```http
POST /api/v2/session-auth/admin/logout
```

> 📚 详细文档：[Session Auth 模块](./modules/session-auth.md)

## ⚠️ 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "认证失败"
  }
}
```

### 常见错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未认证 |
| 403 | FORBIDDEN | 无权限 |
| 404 | NOT_FOUND | 资源不存在 |
| 429 | RATE_LIMITED | 请求过于频繁 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 📊 分页规范

### 请求参数

```http
GET /api/v2/bookmarks/paginated?page=1&pageSize=20&search=keyword
```

### 响应格式

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

## 🛡️ 限流策略

| 接口类型 | 限流策略 | 说明 |
|----------|----------|------|
| 公开接口 | 300次/分钟 | 如获取公开书签 |
| 认证接口 | 100次/分钟 | 需要登录的接口 |
| 敏感操作 | 5次/15分钟 | 如登录、修改密码 |
| 上传接口 | 10次/小时 | 文件上传相关 |

## 📝 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.0 | 2026-02-22 | 模块化文档架构重构 |
| v1.0 | 2025-01-01 | 初始版本 |

## 🔗 相关链接

- [项目主页](../../../README.md)
- [开发指南](../../CONTRIBUTING.md)
- [更新日志](../../CHANGELOG.md)
