# Nexus

> **智能书签管理系统** - 您的个人链接枢纽

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="license">
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg?logo=react" alt="react">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript" alt="typescript">
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
- 📚 **智能书签管理** - 支持分类、标签、搜索
- 🎨 **现代化界面** - 流畅的动画效果和优雅的设计
- 🌓 **深色/浅色模式** - 自动适配您的系统偏好
- 🌍 **多语言支持** - 中文、英文等多语言界面
- 📱 **响应式设计** - 完美适配桌面和移动设备

### 管理功能
- 👥 **多用户支持** - 角色权限管理
- ⚙️ **动态配置** - Dock、导航、设置页全部可配置
- 📊 **数据分析** - 使用统计和分析
- 🔒 **安全设置** - 密码管理、访问控制

---

## 🛠️ 技术栈

### 前端
- **React 18** + **TypeScript**
- **Tailwind CSS** - 原子化 CSS 框架
- **Framer Motion** - 流畅动画
- **i18next** - 国际化
- **@dnd-kit** - 拖拽交互

### 后端
- **Node.js** + **Express**
- **TypeScript**
- **SQL.js** - SQLite 数据库
- **Zod** - 数据验证

### 管理后台
- **React 18** + **TypeScript**
- **Vite** - 构建工具
- **Lucide React** - 图标库

---

## 📦 项目结构

```
nexus-project/
├── apps/
│   ├── frontend/          # 前端用户界面
│   ├── manager/           # 管理后台
│   └── server/            # 后端 API 服务
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
# 启动所有服务（需要多个终端）
npm run dev:server   # 后端 API
npm run dev:frontend # 前端界面
npm run dev:manager  # 管理后台
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
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 🙏 致谢

- [NOWEN](https://github.com/cropflre/NOWEN) - 原始项目和灵感来源
- [React](https://reactjs.org/) - 前端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- 所有开源贡献者

---

<p align="center">
  Made with ❤️ by Nexus Team
</p>
