<div align="center">

# 🔗 Nexus

> **智能书签管理系统** - 您的个人链接枢纽

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/nexus/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933.svg?logo=node.js)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg?logo=sqlite)](https://sqlite.org)

<p align="center">
  <b>🌟 Star 我们 · 🍴 Fork 项目 · 🤝 参与贡献</b>
</p>

[📖 在线文档](https://docs.nexus.app) · [🚀 在线演示](https://demo.nexus.app) · [💬 加入社区](https://discord.gg/nexus) · [🐛 报告问题](../../issues)

<img src="https://raw.githubusercontent.com/yourusername/nexus/main/docs/screenshot.png" alt="Nexus Screenshot" width="800">

</div>

---

## ✨ 项目介绍

**Nexus** 是一个现代化的智能书签管理系统，帮助您高效地组织、管理和访问您的网络资源。

"Nexus" 意为"连接点"或"枢纽"，正如其名，它将成为您所有重要链接的中央枢纽。

### 🎥 功能预览

| 功能 | 描述 | 状态 |
|------|------|------|
| 🔖 智能书签 | 分类、标签、搜索、置顶 | ✅ 可用 |
| 🔌 插件系统 | 模块化扩展，无限可能 | ✅ 可用 |
| 🌓 深色模式 | 自动适配系统主题 | ✅ 可用 |
| 📱 响应式 | 完美适配移动端 | ✅ 可用 |
| 🔒 私密书签 | 密码保护敏感链接 | ✅ 可用 |
| 🔄 WebDAV | 多设备数据同步 | ✅ 可用 |

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
│   └── server/            # 后端 API 服务 (模块化架构)
│       ├── src/
│       │   ├── routes/    # API路由 (模块化)
│       │   │   └── v2/
│       │   │       └── modules/     # 路由模块
│       │   │           ├── bookmarks/      # 书签模块
│       │   │           ├── categories/     # 分类模块
│       │   │           ├── plugins/        # 统一插件模块
│       │   │           ├── widgets/        # 小部件模块
│       │   │           ├── rss/            # RSS模块
│       │   │           ├── notes/          # 笔记模块
│       │   │           ├── notepads/       # 便签模块
│       │   │           ├── quotes/         # 名言模块
│       │   │           ├── visits/         # 访问统计模块
│       │   │           ├── service-monitors/ # 服务监控模块
│       │   │           └── metrics/        # 指标模块
│       │   ├── db/        # 数据库 (模块化)
│       │   │   └── modules/         # 数据库模块
│       │   │       ├── bookmarks/    # 书签数据操作
│       │   │       ├── categories/   # 分类数据操作
│       │   │       ├── plugins/      # 插件数据操作
│       │   │       ├── widgets/      # 小部件数据操作
│       │   │       ├── rss/          # RSS数据操作
│       │   │       ├── notes/        # 笔记数据操作
│       │   │       ├── quotes/       # 名言数据操作
│       │   │       └── ...           # 其他模块
│       │   ├── features/  # 功能特性
│       │   └── ...
├── package.json           # 根项目配置
└── README.md              # 项目说明
```

### 架构特点

- **🧩 模块化设计** - 高内聚、低耦合的模块结构
- **📦 独立数据库模块** - 每个模块拥有独立的数据访问层
- **🔌 统一插件系统** - 内置插件和自定义插件统一管理
- **🛡️ 分层权限控制** - 公开/个人/私有三级权限模型
- **⚡ 缓存优化** - 模块级缓存策略，提升性能

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

## 🐳 Docker Compose 部署指南

### 适用场景
- **飞牛 NAS**、**群晖 NAS**、**威联通 NAS** 等家用存储设备
- 希望一键部署、自动运行的用户
- 需要数据持久化和备份的用户

---

### 📋 部署前准备

#### 1. 确认 Docker 环境

确保您的 NAS 已安装 Docker 和 Docker Compose：

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker-compose --version
```

#### 2. 创建项目目录

在 NAS 上创建项目存放目录：

**飞牛 NAS 示例：**
```bash
# 通过 SSH 登录飞牛 NAS
ssh root@你的飞牛IP

# 创建项目目录
mkdir -p /vol1/1000/docker/nexus
cd /vol1/1000/docker/nexus
```

**群晖 NAS 示例：**
```bash
# 通过 SSH 登录群晖
ssh admin@你的群晖IP

# 创建项目目录
mkdir -p /volume1/docker/nexus
cd /volume1/docker/nexus
```

---

### 🚀 详细部署步骤

#### 步骤 1：下载项目文件

**方式一：使用 Git 克隆（推荐）**

```bash
# 进入项目目录
cd /vol1/1000/docker/nexus  # 飞牛 NAS 示例路径

# 克隆项目
git clone https://github.com/sunaibot/Nexus.git .
```

**方式二：手动下载上传**

1. 在电脑上下载项目 ZIP 文件：`https://github.com/sunaibot/Nexus/archive/refs/heads/main.zip`
2. 解压 ZIP 文件
3. 通过 NAS 文件管理器上传到 `/vol1/1000/docker/nexus` 目录

#### 步骤 2：配置环境变量

复制示例配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下关键配置：

```env
# ============================================
# ⚠️ 必须修改：安全密钥（使用强随机字符串）
# 生成方法: openssl rand -base64 32
# ============================================
JWT_SECRET=your-random-secret-key-here-min-32-chars
SESSION_SECRET=your-different-random-secret-key-here

# ============================================
# 端口配置（建议修改默认端口，避免冲突）
# ============================================
# 飞牛 NAS 建议使用以下端口
SERVER_PORT=18787
FRONTEND_PORT=15173
MANAGER_PORT=15174

# ============================================
# 数据存储路径（必须修改为绝对路径）
# ============================================
# 飞牛 NAS 示例
DATA_PATH=/vol1/1000/docker/nexus/data

# 群晖 NAS 示例
# DATA_PATH=/volume1/docker/nexus/data

# 威联通 NAS 示例
# DATA_PATH=/share/Container/nexus/data

# ============================================
# 其他配置
# ============================================
NODE_ENV=production
LOG_LEVEL=info
```

#### 步骤 3：创建数据目录

```bash
# 创建数据存储目录
mkdir -p /vol1/1000/docker/nexus/data

# 设置目录权限（确保 Docker 容器可以读写）
chmod 755 /vol1/1000/docker/nexus/data
```

#### 步骤 4：启动服务

```bash
# 进入项目目录
cd /vol1/1000/docker/nexus

# 拉取镜像并启动服务（首次启动需要下载镜像，可能需要几分钟）
docker-compose up -d

# 查看服务启动状态
docker-compose ps

# 查看实时日志（按 Ctrl+C 退出）
docker-compose logs -f
```

**启动成功标志：**
```
Name                Command               State           Ports
-------------------------------------------------------------------------
nexus-frontend     nginx -g daemon off;             Up      0.0.0.0:15173->80/tcp
nexus-manager      nginx -g daemon off;             Up      0.0.0.0:15174->80/tcp
nexus-server       node dist/index.js               Up      0.0.0.0:18787->8787/tcp
```

#### 步骤 5：访问服务

服务启动后，通过浏览器访问：

| 服务 | 访问地址 | 说明 |
|------|----------|------|
| **前端界面** | `http://你的NAS-IP:15173` | 用户导航主页 |
| **管理后台** | `http://你的NAS-IP:15174` | 管理员界面 |
| **API 服务** | `http://你的NAS-IP:18787` | 后端 API |

**默认管理员账号：**
- 用户名：`admin`
- 密码：`admin123`

⚠️ **重要**：首次登录后请立即修改默认密码！

---

### 🐮 飞牛 NAS 专属部署指南

#### 飞牛 NAS 特点
- 基于 Debian 的 Linux 系统
- 默认 Docker 已安装
- 文件路径以 `/vol1/` 开头

#### 飞牛 NAS 完整部署命令

```bash
# 1. 通过 SSH 登录飞牛 NAS（默认端口 22）
ssh root@你的飞牛IP地址

# 2. 创建并进入项目目录
mkdir -p /vol1/1000/docker/nexus
cd /vol1/1000/docker/nexus

# 3. 克隆项目
git clone https://github.com/sunaibot/Nexus.git .

# 4. 复制并编辑环境变量
cp .env.example .env

# 5. 使用 sed 快速修改配置（或手动编辑）
# 生成随机密钥
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# 修改 .env 文件
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|g" .env
sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|g" .env
sed -i "s|SERVER_PORT=.*|SERVER_PORT=18787|g" .env
sed -i "s|FRONTEND_PORT=.*|FRONTEND_PORT=15173|g" .env
sed -i "s|MANAGER_PORT=.*|MANAGER_PORT=15174|g" .env
sed -i "s|DATA_PATH=.*|DATA_PATH=/vol1/1000/docker/nexus/data|g" .env

# 6. 创建数据目录
mkdir -p /vol1/1000/docker/nexus/data

# 7. 启动服务
docker-compose up -d

# 8. 查看日志确认启动成功
docker-compose logs -f
```

#### 飞牛 NAS 文件管理器操作

如果不熟悉命令行，可以通过飞牛 NAS 的 Web 界面操作：

1. **打开文件管理器** → 进入 `docker` 文件夹
2. **创建文件夹** → 新建 `nexus` 文件夹
3. **上传文件** → 将下载的项目文件上传到 `nexus` 文件夹
4. **编辑配置文件** → 右键点击 `.env` 文件 → 编辑
5. **打开终端** → 在 `nexus` 文件夹右键 → 在终端中打开
6. **执行命令** → 输入 `docker-compose up -d`

---

### 🔧 常用管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f nexus-server

# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart nexus-server

# 停止服务
docker-compose down

# 停止并删除数据卷（谨慎使用！）
docker-compose down -v

# 更新到最新版本
git pull
docker-compose down
docker-compose up -d --build
```

---

### 💾 数据备份与恢复

#### 自动备份脚本

创建备份脚本 `/vol1/1000/docker/nexus/backup.sh`：

```bash
#!/bin/bash

# 备份目录
BACKUP_DIR="/vol1/1000/docker/nexus/backups"
DATA_DIR="/vol1/1000/docker/nexus/data"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 停止服务
cd /vol1/1000/docker/nexus
docker-compose down

# 备份数据
tar -czvf ${BACKUP_DIR}/nexus_backup_${DATE}.tar.gz ${DATA_DIR}

# 重新启动服务
docker-compose up -d

# 删除 30 天前的备份
find ${BACKUP_DIR} -name "nexus_backup_*.tar.gz" -mtime +30 -delete

echo "备份完成: ${BACKUP_DIR}/nexus_backup_${DATE}.tar.gz"
```

设置定时任务（飞牛 NAS）：
```bash
# 添加执行权限
chmod +x /vol1/1000/docker/nexus/backup.sh

# 编辑 crontab
crontab -e

# 添加每天凌晨 3 点自动备份
0 3 * * * /vol1/1000/docker/nexus/backup.sh >> /vol1/1000/docker/nexus/backup.log 2>&1
```

#### 手动备份

```bash
# 停止服务
docker-compose down

# 备份数据目录
tar -czvf nexus-backup-$(date +%Y%m%d).tar.gz ./data

# 启动服务
docker-compose up -d
```

#### 恢复数据

```bash
# 停止服务
docker-compose down

# 解压备份文件
tar -xzvf nexus-backup-20240101.tar.gz

# 确保数据目录权限正确
chmod 755 ./data

# 启动服务
docker-compose up -d
```

---

### 🛡️ 安全建议

1. **修改默认密码**
   - 首次登录后立即修改管理员密码
   - 密码长度建议 12 位以上，包含大小写字母、数字和特殊字符

2. **使用强密钥**
   - 务必修改 `JWT_SECRET` 和 `SESSION_SECRET`
   - 使用 `openssl rand -base64 32` 生成强随机字符串

3. **修改默认端口**
   - 避免使用默认端口（5173, 5174, 8787）
   - 使用高位端口（15000-65000 范围）

4. **配置防火墙**
   - 只开放必要的端口
   - 限制访问来源 IP

5. **启用 HTTPS（推荐）**
   ```yaml
   # 在 docker-compose.yml 中添加反向代理
   # 或使用 Nginx Proxy Manager 等工具
   ```

6. **定期更新**
   - 定期执行 `git pull` 获取最新版本
   - 关注安全更新

---

### ❓ 常见问题

**Q: 容器启动失败，提示端口被占用？**  
A: 修改 `.env` 文件中的端口配置，使用其他未被占用的端口。

**Q: 提示权限错误，无法写入数据？**  
A: 执行 `chmod 755 /vol1/1000/docker/nexus/data` 设置目录权限。

**Q: 如何更新到最新版本？**  
A: 执行 `git pull && docker-compose down && docker-compose up -d --build`

**Q: 忘记管理员密码怎么办？**  
A: 进入容器执行重置命令：
```bash
docker exec -it nexus-server sh
cd /app && npx tsx scripts/reset-admin.ts
```

**Q: 数据库文件在哪里？**  
A: 数据库存储在 `DATA_PATH` 指定的目录中，默认是 `./data/zen-garden.db`

**Q: 如何查看容器日志？**  
A: 执行 `docker-compose logs -f` 查看实时日志，或 `docker-compose logs -f nexus-server` 查看特定服务日志。

---

### 📊 Docker 服务说明

| 服务 | 容器名称 | 默认端口 | 资源限制 | 说明 |
|------|----------|----------|----------|------|
| 后端服务 | nexus-server | 8787 | CPU: 1.0, 内存: 512M | API 和数据处理 |
| 前端界面 | nexus-frontend | 5173 | CPU: 0.5, 内存: 128M | 用户导航页 |
| 管理后台 | nexus-manager | 5174 | CPU: 0.5, 内存: 128M | 管理员界面 |

---

### 🌐 NAS 专属配置参考

#### 飞牛 NAS
```env
DATA_PATH=/vol1/1000/docker/nexus/data
SERVER_PORT=18787
FRONTEND_PORT=15173
MANAGER_PORT=15174
```

#### 群晖 NAS
```env
DATA_PATH=/volume1/docker/nexus/data
SERVER_PORT=28787
FRONTEND_PORT=25173
MANAGER_PORT=25174
```

#### 威联通 NAS
```env
DATA_PATH=/share/Container/nexus/data
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

### 模块化 API 路由

后端采用模块化架构，API 路由按功能模块组织：

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| 书签 | `/api/v2/bookmarks` | 书签增删改查、排序 |
| 分类 | `/api/v2/categories` | 分类管理 |
| 插件 | `/api/v2/plugins` | 统一插件管理（内置+自定义） |
| 小部件 | `/api/v2/widgets` | 首页小部件 |
| RSS | `/api/v2/rss` | RSS订阅管理 |
| 笔记 | `/api/v2/notes` | 笔记管理 |
| 便签 | `/api/v2/notepads` | 便签管理 |
| 名言 | `/api/v2/quotes` | 每日名言 |
| 访问统计 | `/api/v2/visits` | 访问数据统计 |
| 服务监控 | `/api/v2/service-monitors` | 服务状态监控 |
| 指标 | `/api/v2/metrics` | 自定义指标 |

### 权限模型

- **公开接口** - 无需认证，如 `/api/v2/bookmarks/public`
- **可选认证** - 支持匿名和登录用户，如 `/api/v2/bookmarks`
- **需要认证** - 必须登录，如 `/api/v2/bookmarks/admin/all`
- **管理员权限** - 需要管理员角色，如 `/api/v2/plugins` (POST)

---

## 🎯 加入我们 - 一起打造更好的 Nexus！

> **我们正在寻找热爱开源的开发者！** 无论你是前端高手、后端专家，还是全栈工程师，都欢迎加入 Nexus 开发团队。

### 🌟 为什么参与 Nexus？

- **🚀 技术成长** - 使用最新的 React 18、TypeScript 5、Node.js 技术栈
- **🎨 创意实现** - 插件系统让你可以尽情发挥创意，打造独特功能
- **👥 社区支持** - 活跃的开发者社区，互相学习，共同进步
- **💼 简历亮点** - 参与知名开源项目，提升个人技术影响力
- **🎁 贡献回报** - 核心贡献者将获得项目署名权和特殊荣誉

### 🛠️ 我们正在寻找的贡献者

| 方向 | 技能要求 | 任务示例 |
|------|----------|----------|
| **前端开发** | React, TypeScript, Tailwind CSS | 开发新插件 UI、优化交互体验 |
| **后端开发** | Node.js, Express, SQLite | API 开发、性能优化、数据库设计 |
| **插件开发** | 全栈能力 | 开发天气、日历、待办等实用插件 |
| **UI/UX 设计** | Figma, CSS | 设计新主题、优化界面布局 |
| **文档翻译** | 英语/其他语言 | 完善多语言文档、翻译界面 |
| **测试工程师** | 自动化测试 | 编写测试用例、保障代码质量 |

### 🚦 新手友好任务

如果你是第一次参与开源，以下任务非常适合入门：

- 🐛 **修复 Bug** - 查看 [Issues](https://github.com/yourusername/nexus/issues) 标签为 `good first issue` 的任务
- 🎨 **UI 优化** - 改进按钮样式、调整颜色对比度
- 📝 **完善文档** - 补充代码注释、修复文档错别字
- 🌍 **界面翻译** - 添加新的语言支持
- ⚡ **性能优化** - 优化图片加载、减少 bundle 体积

### 🏗️ 插件开发指南

Nexus 拥有强大的插件系统，开发插件非常简单：

```typescript
// 示例：创建一个简单的时钟插件
export default function ClockPlugin() {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div className="text-2xl font-bold">
      {time.toLocaleTimeString()}
    </div>
  )
}
```

更多插件开发文档：[Plugin Development Guide](./docs/plugin-development.md)

### 🤝 贡献流程

1. **Fork 项目** - 点击右上角的 Fork 按钮
2. **克隆代码** - `git clone https://github.com/你的用户名/nexus.git`
3. **创建分支** - `git checkout -b feature/你的功能名`
4. **提交更改** - `git commit -m "✨ feat: 添加新功能"`
5. **推送分支** - `git push origin feature/你的功能名`
6. **创建 PR** - 在 GitHub 上提交 Pull Request

### 📋 代码规范

- **TypeScript** - 所有代码必须使用 TypeScript
- **ESLint** - 遵循项目 ESLint 配置
- **提交信息** - 使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范
  - `✨ feat:` 新功能
  - `🐛 fix:` 修复 Bug
  - `📚 docs:` 文档更新
  - `💄 style:` 代码格式
  - `♻️ refactor:` 重构
  - `⚡ perf:` 性能优化
  - `✅ test:` 测试相关

### 💬 加入社区

- 📧 **邮件联系**: your.email@example.com
- 💭 **Discord**: [加入我们的 Discord](https://discord.gg/nexus)
- 🐦 **Twitter**: [@NexusApp](https://twitter.com/NexusApp)
- 📱 **微信群**: 扫码加入开发者群

### 🏆 核心贡献者

感谢以下开发者对 Nexus 的贡献：

<a href="https://github.com/yourusername/nexus/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=yourusername/nexus" />
</a>

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
