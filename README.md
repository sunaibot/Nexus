# Nexus

> **智能书签管理系统** - 您的个人链接枢纽

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="license">
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg?logo=react" alt="react">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript" alt="typescript">
  <img src="https://img.shields.io/badge/Node.js-18-339933.svg?logo=node.js" alt="nodejs">
  <img src="https://img.shields.io/badge/SQLite-3-003B57.svg?logo=sqlite" alt="sqlite">
</p>

---

## ✨ 项目介绍

**Nexus** 是一个现代化的智能书签管理系统，帮助您高效地组织、管理和访问您的网络资源。

"Nexus" 意为"连接点"或"枢纽"，正如其名，它将成为您所有重要链接的中央枢纽。

---

## 🙏 致敬原作者

本项目 **Nexus** 深受 [**NOWEN**](https://github.com/cropflre/NOWEN) 的启发。

- **NOWEN** 由 [cropflre](https://github.com/cropflre) 创建
- 我们在 NOWEN 的基础上进行了大量改进和功能扩展
- 感谢原作者的开源贡献，让我们能够在此基础上构建更好的工具

如果您喜欢本项目，也请给 [NOWEN](https://github.com/cropflre/NOWEN) 一个 ⭐️

---

## 🚀 主要特性

### 核心功能
- 📚 **智能书签管理** - 支持分类、标签、搜索、置顶、稍后阅读
- 🎨 **现代化界面** - 流畅的动画效果和优雅的设计
- 🌓 **深色/浅色模式** - 自动适配您的系统偏好
- 🌍 **多语言支持** - 中文、英文等多语言界面
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔖 **私密书签** - 支持密码保护的私密书签

### 插件系统
- 🔌 **模块化插件** - 可扩展的插件架构
- 📤 **文件快传** - 临时文件上传和分享功能
- 📝 **便签笔记** - 快速记录和管理笔记
- 📡 **RSS订阅** - 订阅和管理RSS源
- 📊 **访问统计** - 书签访问数据可视化
- 🌤️ **天气组件** - 实时天气信息显示
- 💬 **每日名言** - 随机展示名言警句

### 管理功能
- 👥 **多用户支持** - 角色权限管理（管理员/用户）
- 🔐 **权限系统** - 细粒度的API和页面权限控制
- ⚙️ **动态配置** - Dock、导航、设置页全部可配置
- 📊 **数据分析** - 使用统计和分析
- 🔒 **安全设置** - 密码管理、访问控制、IP过滤
- 🔔 **通知系统** - 多通道通知推送
- 📋 **审计日志** - 完整的操作审计追踪

### 数据同步
- 🔄 **WebDAV同步** - 支持多协议书签同步
- 💾 **数据导入导出** - JSON格式的数据备份
- 📦 **批量操作** - 批量删除、移动、更新书签

---

## 🛠️ 技术栈

### 前端
- **React 18** + **TypeScript**
- **Tailwind CSS** - 原子化 CSS 框架
- **Framer Motion** - 流畅动画
- **i18next** - 国际化
- **@dnd-kit** - 拖拽交互
- **Axios** - HTTP 客户端

### 后端
- **Node.js** + **Express**
- **TypeScript**
- **SQL.js** - SQLite 数据库
- **Zod** - 数据验证
- **JWT** - 身份认证
- **bcrypt** - 密码加密

### 管理后台
- **React 18** + **TypeScript**
- **Vite** - 构建工具
- **Lucide React** - 图标库
- **Recharts** - 数据可视化

---

## 📦 项目结构

```
nexus-project/
├── apps/
│   ├── frontend/          # 前端用户界面
│   │   ├── components/    # 组件目录
│   │   ├── pages/         # 页面目录
│   │   ├── plugins/       # 插件系统
│   │   └── ...
│   ├── manager/           # 管理后台
│   │   ├── modules/       # 功能模块
│   │   ├── components/    # 组件目录
│   │   └── ...
│   └── server/            # 后端 API 服务
│       ├── src/
│       │   ├── features/  # 功能模块
│       │   ├── routes/    # API路由
│       │   ├── db/        # 数据库
│       │   └── ...
├── package.json           # 根项目配置
└── README.md              # 项目说明
```

---

## 🚀 快速开始

### 安装依赖

```bash
# 安装根项目依赖
npm install

# 安装各应用依赖
cd apps/frontend && npm install
cd apps/manager && npm install
cd apps/server && npm install
```

### 开发模式

```bash
# 方式1：使用根目录命令（推荐）
npm run dev:all      # 同时启动所有服务

# 方式2：分别启动（需要多个终端）
npm run dev:server   # 后端 API (端口 8787)
npm run dev:frontend # 前端界面 (端口 5173)
npm run dev:manager  # 管理后台 (端口 5174)
```

### 构建生产版本

```bash
# 构建所有应用
npm run build

# 启动生产服务器
cd apps/server && npm run start
```

---

## 📝 配置说明

### 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# 前端 (端口 5173)
VITE_API_BASE_URL=http://localhost:8787

# 管理端 (端口 5174)
VITE_API_BASE_URL=http://localhost:8787

# 后端 (端口 8787)
PORT=8787
NODE_ENV=development
JWT_SECRET=your-secret-key
DATABASE_PATH=./data/nexus.db
```

### 默认账号

系统初始化后会创建默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

**注意**：请在首次登录后立即修改默认密码！

### API 文档

启动后端服务后，访问以下地址查看 API 文档：
- 本地开发：`http://localhost:8787/api/docs`
- 包含完整的 API 列表、请求参数、响应示例和数据库结构说明

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 开发规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 和 Prettier 代码规范
- 提交前运行测试确保代码质量
- 编写清晰的提交信息

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 🙏 致谢

- [NOWEN](https://github.com/cropflre/NOWEN) - 原始项目和灵感来源
- [React](https://reactjs.org/) - 前端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Express](https://expressjs.com/) - 后端框架
- [SQL.js](https://sql.js.org/) - SQLite 数据库
- 所有开源贡献者

---

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：
- 提交 [GitHub Issue](https://github.com/yourusername/nexus/issues)
- 发送邮件至：your.email@example.com

---

<p align="center">
  Made with ❤️ by Nexus Team
</p>

<p align="center">
  <a href="https://github.com/yourusername/nexus">⭐ Star 本项目</a> •
  <a href="https://github.com/yourusername/nexus/fork">🍴 Fork 本项目</a>
</p>
