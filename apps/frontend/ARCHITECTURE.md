# Frontend 项目架构规范

## 📁 目录结构

```
apps/frontend/
├── components/              # 组件层
│   ├── ui/                  # 基础 UI 组件（纯展示，无业务逻辑）
│   ├── layout/              # 布局组件（Header, Footer, Sidebar 等）
│   ├── features/            # 功能组件（按业务领域划分）
│   │   ├── bookmark/        # 书签相关组件
│   │   ├── category/        # 分类相关组件
│   │   ├── search/          # 搜索相关组件
│   │   ├── admin/           # 管理后台组件
│   │   ├── plugin/          # 插件系统组件
│   │   └── home/            # 首页相关组件
│   └── widgets/             # 小组件（首页展示用）
│
├── hooks/                   # Hooks 层
│   ├── domain/              # 领域 Hooks（按业务划分）
│   │   ├── bookmark/        # 书签相关 Hooks
│   │   ├── category/        # 分类相关 Hooks
│   │   ├── auth/            # 认证相关 Hooks
│   │   └── plugin/          # 插件相关 Hooks
│   └── common/              # 通用 Hooks
│
├── lib/                     # 工具层
│   ├── api-client/          # API 客户端
│   ├── utils/               # 工具函数
│   └── validation/          # 验证逻辑
│
├── stores/                  # 状态管理（Zustand）
├── pages/                   # 页面组件
├── providers/               # 全局 Provider
├── routes/                  # 路由配置
└── types/                   # 类型定义
```

## 🎯 设计原则

### 1. 组件分类原则

| 类型 | 职责 | 示例 |
|------|------|------|
| **UI 组件** | 纯展示，无业务逻辑，可复用 | Button, Card, Modal |
| **布局组件** | 页面结构，控制布局 | Header, Sidebar, Footer |
| **功能组件** | 业务逻辑，领域相关 | BookmarkCard, CategoryList |
| **小组件** | 首页展示，独立功能 | WeatherWidget, ClockWidget |

### 2. Hooks 分类原则

| 类型 | 职责 | 示例 |
|------|------|------|
| **领域 Hooks** | 特定业务逻辑 | useBookmarks, useCategories |
| **通用 Hooks** | 跨领域复用 | useAsync, useForm, useTheme |

### 3. 文件命名规范

- 组件文件: `PascalCase.tsx` (如 `BookmarkCard.tsx`)
- Hook 文件: `camelCase.ts` (如 `useBookmarks.ts`)
- 工具文件: `camelCase.ts` (如 `formatDate.ts`)
- 类型文件: `kebab-case.ts` (如 `api-types.ts`)

### 4. 导入规范

```typescript
// ✅ 推荐：使用路径别名
import { Button } from '@/components/ui'
import { useBookmarks } from '@/hooks/domain/bookmark'

// ❌ 避免：相对路径过深
import { Button } from '../../../components/ui'
```

## 📋 重构进度

### Phase 1: 基础架构 ✅
- [x] 统一 API 层
- [x] 拆分 App.tsx
- [x] 建立目录规范

### Phase 2: 组件层重构 ⏳
- [ ] 迁移 home 组件到 features/home
- [ ] 迁移 admin 组件到 features/admin
- [ ] 迁移 plugin-system 到 features/plugin
- [ ] 拆分大组件

### Phase 3: Hooks 层重构 ⏳
- [ ] 创建 domain/bookmark hooks
- [ ] 创建 domain/category hooks
- [ ] 拆分 useBookmarkStore

### Phase 4: 状态管理优化 ⏳
- [ ] 评估 Store 划分
- [ ] 优化状态流

### Phase 5: 检查验证 ⏳
- [ ] 代码规范检查
- [ ] 功能测试
- [ ] 性能检查
