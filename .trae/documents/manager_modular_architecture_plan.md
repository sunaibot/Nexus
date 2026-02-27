# NOWEN Manager 模块化架构设计方案

## 📋 一、现状分析

### 1.1 现有架构概述

当前 Manager 应用采用以下技术栈：
- **前端框架**: React 18.3.1 + TypeScript 5.6.2
- **构建工具**: Vite 6.0.3
- **样式方案**: Tailwind CSS 3.4.16
- **状态管理**: React Context + 自定义 hooks
- **后端服务**: Express + SQLite (8787端口)

### 1.2 现有目录结构

```
apps/manager/
├── components/
│   ├── admin/          # 管理后台组件
│   ├── home/           # 首页组件
│   ├── monitor/         # 监控组件
│   ├── ui/             # UI 基础组件
│   └── ...             # 共享组件
├── contexts/             # React Context
├── hooks/               # 自定义 hooks
├── lib/                  # 工具函数和 API
├── pages/                # 页面组件
├── types/                # TypeScript 类型定义
└── locales/              # 国际化翻译
```

### 1.3 现有功能模块

1. **书签管理**
   - CRUD 操作
   - 分页查询
   - 搜索和筛选
   - 分类管理
   - 私密密码保护
   - 链接健康检查
   - 图标管理

2. **系统监控**
   - 硬件信息展示
   - 网络遥测
   - 生命体征
   - 进程矩阵

3. **设置管理**
   - 站点设置
   - 主题设置
   - 壁纸设置
   - 数据导入导出

4. **数据分析**
   - 访问统计
   - 热门书签
   - 访问趋势

---

## 🎯 二、模块化架构设计目标

### 2.1 核心原则

1. **高内聚、低耦合**
   - 每个模块职责单一
   - 模块间通过明确接口通信
   - 减少模块间的直接依赖

2. **插件化热插拔**
   - 支持动态加载/卸载模块
   - 模块独立开发、独立部署
   - 不影响其他模块运行

3. **优先复用后端服务**
   - 充分利用现有后端 API
   - 避免重复开发
   - 统一数据格式标准化

4. **性能优化**
   - 懒加载
   - 代码分割
   - 数据缓存
   - 虚拟列表

---

## 🏗️ 三、模块化架构设计

### 3.1 新目录结构

```
apps/manager/
├── modules/                    # 功能模块目录
│   ├── bookmarks/           # 书签模块
│   │   ├── index.ts        # 模块入口
│   │   ├── components/    # 模块组件
│   │   ├── hooks/        # 模块 hooks
│   │   ├── types.ts       # 模块类型
│   │   └── config.ts       # 模块配置
│   ├── categories/         # 分类模块
│   ├── system-monitor/     # 系统监控模块
│   ├── analytics/          # 数据分析模块
│   ├── settings/           # 设置管理模块
│   ├── health-check/       # 健康检查模块
│   └── icons/             # 图标管理模块
│
├── core/                      # 核心框架层
│   ├── plugin-system/      # 插件系统
│   │   ├── PluginRegistry.ts
│   │   ├── PluginLoader.ts
│   │   └── types.ts
│   │   └── index.ts
│   ├── module-system/       # 模块系统
│   │   ├── ModuleManager.ts
│   │   └── types.ts
│   └── state-management/   # 状态管理
│   │   ├── Store.ts
│   │   └── index.ts
│
├── shared/                    # 共享层
│   ├── components/         # 共享组件
│   ├── hooks/           # 共享 hooks
│   ├── utils/           # 共享工具
│   └── types/           # 共享类型
│
├── pages/                     # 页面层
│   ├── Admin.tsx         # 管理页面（使用模块组合）
│   └── ...
│
└── config/                    # 配置层
    ├── modules.ts          # 模块配置
    └── plugins.ts         # 插件配置
```

### 3.2 核心模块设计

#### 3.2.1 插件系统 (Plugin System)

**设计理念**: 采用事件驱动的插件架构，支持插件注册、加载、卸载

**核心文件**:

```typescript
// core/plugin-system/types.ts
export interface Plugin {
  id: string
  name: string
  version: string
  enabled: boolean
  dependencies?: string[]
  components?: Record<string, React.ComponentType<any>>
  hooks?: Record<string, (...args: any[]) => any>
  onLoad?: () => void
  onUnload?: () => void
}

export interface PluginRegistry {
  register(plugin: Plugin): void
  unregister(pluginId: string): void
  getPlugin(pluginId: string): Plugin | undefined
  getAllPlugins(): Plugin[]
  enablePlugin(pluginId: string): void
  disablePlugin(pluginId: string): void
}
```

#### 3.2.2 模块系统 (Module System)

**设计理念**: 每个功能模块是一个独立的模块，可以独立加载

```typescript
// core/module-system/types.ts
export interface Module {
  id: string
  name: string
  enabled: boolean
  route?: string
  components: Record<string, React.ComponentType<any>>
  sidebarItem?: {
    label: string
    icon: React.ComponentType<any>
    order: number
  }
  apiEndpoints?: Record<string, string>
}
```

---

## 📦 四、功能模块详细设计

### 4.1 书签模块 (Bookmarks Module)

**模块配置**:
```typescript
modules/bookmarks/
├── index.ts
├── components/
│   ├── BookmarkList.tsx
│   ├── BookmarkEditor.tsx
│   ├── BookmarkFilters.tsx
│   └── index.ts
├── hooks/
│   ├── useBookmarks.ts
│   ├── useBookmarkPagination.ts
│   └── index.ts
├── types.ts
└── config.ts
```

**功能特性**:
- ✅ CRUD 操作（复用后端 API）
- ✅ 分页查询（复用后端分页）
- ✅ 搜索和筛选
- ✅ 分类管理
- ✅ 私密密码保护
- ✅ 链接健康检查（集成 Health Check 模块）
- ✅ 图标管理（集成 Icons 模块）

### 4.2 分类模块 (Categories Module)

**模块配置**:
```typescript
modules/categories/
├── index.ts
├── components/
│   ├── CategoryList.tsx
│   ├── CategoryEditor.tsx
│   └── index.ts
├── hooks/
│   ├── useCategories.ts
│   └── index.ts
├── types.ts
└── config.ts
```

### 4.3 系统监控模块 (System Monitor Module)

**模块配置**:
```typescript
modules/system-monitor/
├── index.ts
├── components/
│   ├── HardwareInfo.tsx
│   ├── NetworkTelemetry.tsx
│   ├── VitalSigns.tsx
│   ├── ProcessMatrix.tsx
│   └── index.ts
├── hooks/
│   ├── useSystemMonitor.ts
│   └── index.ts
├── types.ts
└── config.ts
```

### 4.4 数据分析模块 (Analytics Module)

**模块配置**:
```typescript
modules/analytics/
├── index.ts
├── components/
│   ├── VisitStats.tsx
│   ├── TopBookmarks.tsx
│   ├── VisitTrend.tsx
│   └── index.ts
├── hooks/
│   ├── useAnalytics.ts
│   └── index.ts
├── types.ts
└── config.ts
```

### 4.5 设置管理模块 (Settings Module)

**模块配置**:
```typescript
modules/settings/
├── index.ts
├── components/
│   ├── SiteSettings.tsx
│   ├── ThemeSettings.tsx
│   ├── WallpaperSettings.tsx
│   ├── DataManagement.tsx
│   └── index.ts
├── hooks/
│   ├── useSettings.ts
│   └── index.ts
├── types.ts
└── config.ts
```

---

## ⚡ 五、性能优化策略

### 5.1 代码分割与懒加载

```typescript
// 使用 React.lazy 和 Suspense
const BookmarkModule = React.lazy(() => import('modules/bookmarks'))
const CategoriesModule = React.lazy(() => import('modules/categories'))
```

### 5.2 数据缓存策略

- 使用 SWR 进行数据缓存
- 实现请求去重
- 缓存过期策略
- 乐观更新

### 5.3 虚拟列表

- 使用 @tanstack/react-virtual 实现长列表虚拟化

### 5.4 图片优化

- 图片懒加载
- WebP 格式优先
- 图片 CDN 加速

---

## 📝 六、实施计划

### 阶段一：核心框架搭建

1. 创建 `core/` 目录结构
2. 实现插件系统 (Plugin System)
3. 实现模块系统 (Module System)
4. 实现状态管理 (State Management)

### 阶段二：模块迁移

1. 迁移书签模块
2. 迁移分类模块
3. 迁移系统监控模块
4. 迁移数据分析模块
5. 迁移设置管理模块
6. 迁移健康检查模块
7. 迁移图标管理模块

### 阶段三：集成与测试

1. 模块集成测试
2. 插件热插拔测试
3. 性能测试
4. 兼容性测试

---

## ✅ 七、检查清单

### 架构设计
- [ ] 核心框架搭建完成
- [ ] 插件系统实现
- [ ] 模块系统实现
- [ ] 状态管理实现

### 模块迁移
- [ ] 书签模块迁移完成
- [ ] 分类模块迁移完成
- [ ] 系统监控模块迁移完成
- [ ] 数据分析模块迁移完成
- [ ] 设置管理模块迁移完成
- [ ] 健康检查模块迁移完成
- [ ] 图标管理模块迁移完成

### 性能优化
- [ ] 代码分割实现
- [ ] 懒加载实现
- [ ] 数据缓存实现
- [ ] 虚拟列表实现
- [ ] 图片优化实现

### 测试
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 兼容性测试

---

## 📊 八、后端 API 复用清单

### 已有的后端 API

1. **书签 API**
   - ✅ GET /api/bookmarks - 获取所有书签
   - ✅ GET /api/bookmarks/paginated - 分页获取书签
   - ✅ POST /api/bookmarks - 创建书签
   - ✅ PATCH /api/bookmarks/:id - 更新书签
   - ✅ DELETE /api/bookmarks/:id - 删除书签
   - ✅ PATCH /api/bookmarks/reorder - 重排书签
   - ✅ PATCH /api/bookmarks/:id/visibility - 切换可见性
   - ✅ POST /api/bookmarks/:id/password - 设置私密密码
   - ✅ POST /api/bookmarks/:id/password/verify - 验证私密密码
   - ✅ DELETE /api/bookmarks/:id/password - 删除私密密码

2. **分类 API**
   - ✅ GET /api/categories - 获取所有分类
   - ✅ POST /api/categories - 创建分类
   - ✅ PATCH /api/categories/:id - 更新分类
   - ✅ DELETE /api/categories/:id - 删除分类
   - ✅ PATCH /api/categories/reorder - 重排分类

3. **健康检查 API**
   - ✅ POST /api/health-check - 检查书签健康状态

4. **设置 API**
   - ✅ GET /api/settings - 获取设置
   - ✅ PATCH /api/settings - 更新设置

5. **访问统计 API**
   - ✅ GET /api/visits/stats - 获取统计概览
   - ✅ GET /api/visits/top - 获取热门书签
   - ✅ GET /api/visits/trend - 获取访问趋势
   - ✅ GET /api/visits/recent - 获取最近访问

6. **名言 API**
   - ✅ GET /api/quotes - 获取名言
   - ✅ PUT /api/quotes - 更新名言

7. **数据导入导出 API**
   - ✅ GET /api/export - 导出数据
   - ✅ POST /api/import - 导入数据
   - ✅ POST /api/factory-reset - 恢复出厂设置

8. **管理员 API**
   - ✅ POST /api/admin/login - 管理员登录
   - ✅ POST /api/admin/change-password - 修改密码
   - ✅ GET /api/admin/verify - 验证 Token
   - ✅ POST /api/admin/logout - 退出登录

9. **元数据 API**
   - ✅ POST /api/metadata - 解析 URL 元数据

---

## 🎉 九、总结

本方案通过以下方式实现模块化架构：

1. **高内聚、低耦合**: 每个模块独立，通过明确的接口通信
2. **插件化热插拔**: 支持动态加载/卸载模块
3. **优先复用后端服务**: 充分利用现有后端 API
4. **性能优化**: 懒加载、代码分割、数据缓存

通过这个方案，NOWEN Manager 系统将具备良好的可扩展性、可维护性和性能。
