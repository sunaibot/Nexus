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

## 🐳 NAS 部署指南（Docker）

### 适用场景
- **飞牛 NAS**、**群晖 NAS**、**威联通 NAS** 等家用存储设备
- 希望一键部署、自动运行的用户
- 需要数据持久化和备份的用户

### 快速部署步骤

#### 1. 准备工作

```bash
# 克隆项目
git clone https://github.com/sunaibot/Nexus.git
cd Nexus

# 复制环境变量配置文件
cp .env.example .env
```

#### 2. 修改环境变量（重要！）

编辑 `.env` 文件，修改以下关键配置：

```env
# ⚠️ 必须修改：安全密钥（使用强随机字符串）
# 生成方法: openssl rand -base64 32
JWT_SECRET=your-random-secret-key-here
SESSION_SECRET=your-different-random-secret-here

# 端口配置（建议修改默认端口，避免冲突）
SERVER_PORT=8787
FRONTEND_PORT=5173
MANAGER_PORT=5174

# 数据存储路径（NAS 用户建议修改为绝对路径）
# 示例：飞牛 NAS
DATA_PATH=/vol1/1000/docker/nexus/data
# 示例：群晖 NAS
# DATA_PATH=/volume1/docker/nexus/data
```

#### 3. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 4. 访问服务

- **前端界面**：`http://你的NAS-IP:5173`
- **管理后台**：`http://你的NAS-IP:5174`
- **API 服务**：`http://你的NAS-IP:8787`

### NAS 专属配置建议

#### 飞牛 NAS
```env
# 数据路径示例
DATA_PATH=/vol1/1000/docker/nexus/data

# 建议端口（避免与飞牛默认服务冲突）
SERVER_PORT=18787
FRONTEND_PORT=15173
MANAGER_PORT=15174
```

#### 群晖 NAS
```env
# 数据路径示例
DATA_PATH=/volume1/docker/nexus/data

# 建议端口
SERVER_PORT=28787
FRONTEND_PORT=25173
MANAGER_PORT=25174
```

#### 威联通 NAS
```env
# 数据路径示例
DATA_PATH=/share/Container/nexus/data

# 建议端口
SERVER_PORT=38787
FRONTEND_PORT=35173
MANAGER_PORT=35174
```

### Docker 服务说明

| 服务 | 容器名称 | 默认端口 | 资源限制 | 说明 |
|------|----------|----------|----------|------|
| 后端服务 | nexus-server | 8787 | CPU: 1.0, 内存: 512M | API 和数据处理 |
| 前端界面 | nexus-frontend | 5173 | CPU: 0.5, 内存: 128M | 用户导航页 |
| 管理后台 | nexus-manager | 5174 | CPU: 0.5, 内存: 128M | 管理员界面 |

### 数据备份与恢复

#### 备份数据
```bash
# 备份数据目录
tar -czvf nexus-backup-$(date +%Y%m%d).tar.gz ./data

# 或使用 NAS 的备份功能
```

#### 恢复数据
```bash
# 停止服务
docker-compose down

# 恢复数据
tar -xzvf nexus-backup-20240101.tar.gz

# 重启服务
docker-compose up -d
```

### 安全建议

1. **修改默认密码**：首次登录后立即修改管理员密码
2. **使用强密钥**：务必修改 JWT_SECRET 和 SESSION_SECRET
3. **修改默认端口**：避免使用默认端口，减少被扫描风险
4. **配置防火墙**：只开放必要的端口
5. **启用 HTTPS**：建议使用反向代理（如 Nginx Proxy Manager）启用 HTTPS
6. **定期备份**：设置自动备份任务，保护数据安全

### 常见问题

**Q: 容器启动失败怎么办？**  
A: 检查日志 `docker-compose logs`，常见问题包括端口冲突、权限不足、内存不足等。

**Q: 如何更新到最新版本？**  
A: 执行 `git pull` 拉取最新代码，然后 `docker-compose up -d --build` 重新构建。

**Q: 数据存储在哪里？**  
A: 数据存储在 `DATA_PATH` 指定的目录中，默认是 `./data`，建议修改为 NAS 的持久化存储路径。

**Q: 如何修改端口？**  
A: 编辑 `.env` 文件修改端口配置，然后执行 `docker-compose up -d` 重启服务。

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
