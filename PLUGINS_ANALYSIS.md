# 后端 API 插件化分析

## 已实现的插件
1. ✅ **文件快传** (file-transfers) - 已完成
2. ✅ **名言警句** (quotes) - 已完成
3. ✅ **插槽系统** (plugin-slots) - 已完成

## 可插件化的功能列表

### 高优先级（独立功能模块）

#### 1. **RSS 订阅** (`/rss`)
- **后端**: `apps/server/src/routes/v2/rss.js`
- **功能**: RSS 源管理、文章抓取
- **前台展示**: 侧边栏 RSS 阅读器
- **管理后台**: RSS 源配置

#### 2. **笔记/便签** (`/notes`, `/notepads`)
- **后端**: `apps/server/src/routes/v2/notes.js`, `notepads.js`
- **功能**: 快速笔记、便签管理
- **前台展示**: 浮动便签组件
- **管理后台**: 笔记管理

#### 3. **服务监控** (`/service-monitors`)
- **后端**: `apps/server/src/routes/v2/service-monitors.js`
- **功能**: 监控服务状态、健康检查
- **前台展示**: 状态指示器
- **管理后台**: 监控配置

#### 4. **自定义指标** (`/custom-metrics`)
- **后端**: `apps/server/src/routes/v2/custom-metrics.js`
- **功能**: 自定义数据指标
- **前台展示**: 指标卡片
- **管理后台**: 指标配置

#### 5. **访问统计** (`/visits`)
- **后端**: `apps/server/src/routes/v2/visits.js`
- **功能**: 访问追踪、统计分析
- **前台展示**: 访问计数器
- **管理后台**: 统计报表

#### 6. **分享管理** (`/shares`)
- **后端**: `apps/server/src/routes/v2/shares.js`
- **功能**: 书签分享、分享链接管理
- **前台展示**: 分享按钮
- **管理后台**: 分享管理

#### 7. **WebDAV 同步** (`/webdav`)
- **后端**: `apps/server/src/features/webdav/routes.js`
- **功能**: WebDAV 同步、备份
- **前台展示**: 同步状态
- **管理后台**: WebDAV 配置

#### 8. **通知系统** (`/notifications`)
- **后端**: `apps/server/src/features/notification/routes.js`
- **功能**: 通知推送、消息中心
- **前台展示**: 通知铃铛
- **管理后台**: 通知设置

### 中优先级（增强功能）

#### 9. **天气插件** (`/weather`)
- **后端**: `apps/server/src/routes/v2/weather.js`
- **功能**: 天气查询
- **前台展示**: 天气小组件
- **管理后台**: 天气配置

#### 10. **IP 过滤** (`/ip-filters`)
- **后端**: `apps/server/src/routes/v2/ipFilters.js`
- **功能**: IP 黑白名单
- **前台展示**: 无
- **管理后台**: IP 过滤配置

#### 11. **私密模式** (`/private-mode`)
- **后端**: `apps/server/src/routes/v2/privateMode.js`
- **功能**: 私密书签保护
- **前台展示**: 私密切换
- **管理后台**: 私密设置

#### 12. **批量操作** (`/batch`)
- **后端**: `apps/server/src/routes/v2/batch.js`
- **功能**: 批量导入导出
- **前台展示**: 无
- **管理后台**: 批量操作界面

### 系统级功能（低优先级）

#### 13. **主题管理** (`/theme`)
- 已经是模块，但可以增强为插件

#### 14. **Dock 配置** (`/dock-configs`)
- 已经是配置系统

#### 15. **前端导航** (`/frontend-nav`)
- 已经是配置系统

#### 16. **公告系统** (`/announcements`)
- **后端**: `apps/server/src/routes/v2/announcements.js`
- **功能**: 系统公告
- **前台展示**: 公告栏
- **管理后台**: 公告管理

## 建议实施顺序

### 第一阶段（核心功能）
1. RSS 订阅插件
2. 笔记/便签插件
3. 访问统计插件

### 第二阶段（增强功能）
4. 服务监控插件
5. 天气插件
6. 分享管理插件

### 第三阶段（高级功能）
7. WebDAV 同步插件
8. 通知系统插件
9. 自定义指标插件

## 技术实现要点

### 后端
- 每个插件需要独立的 API 路由文件
- 数据库表需要支持插件启用/禁用状态
- 插件配置存储在 `plugin_configs` 表

### 管理后台
- 在 `apps/manager/modules/` 下创建插件模块
- 每个插件需要：模块定义、页面组件、API 客户端
- 在 `PluginsPage` 中添加插件管理卡片

### 前台
- 在 `apps/frontend/plugins/builtin/` 下创建插件组件
- 使用插槽系统控制显示位置
- 支持插件配置持久化
