# 飞牛 NAS (FnOS) Docker 部署指南

> 📖 本文档专门针对飞牛 NAS 用户编写，提供最简单直观的部署步骤

## 📋 目录

1. [快速开始（3分钟部署）](#快速开始)
2. [详细图文教程](#详细图文教程)
3. [常见问题](#常见问题)
4. [安全加固](#安全加固)
5. [备份与恢复](#备份与恢复)

---

## 🚀 快速开始

### 准备工作

1. 确保飞牛 NAS 已安装 Docker 应用
2. 想一个你自己的密码（至少8位，比如手机号+名字）

### 3步部署

```bash
# 第1步：下载配置文件
# 下载 docker-compose.yml 到你的飞牛 NAS

# 第2步：修改环境变量文件
# 编辑 .env 文件，设置你的密码
YOUR_PASSWORD=woaini1234

# 第3步：启动容器
docker-compose up -d
```

### 访问地址

- **前台页面**：`http://你的飞牛IP:5173`
- **管理后台**：`http://你的飞牛IP:5174`
- **默认账号**：`admin` / `admin123`

---

## 📸 详细图文教程

### 第一步：准备配置文件

1. **打开飞牛文件管理器**
   - 创建一个文件夹，比如 `/vol1/docker/nexus`

2. **下载配置文件**
   - 下载 `docker-compose.yml` 到该文件夹
   - 下载 `.env.example` 并重命名为 `.env`

### 第二步：设置你的密码

**超简单！只需2步：**

1. 打开 `.env` 文件
2. 找到 `YOUR_PASSWORD=`，填入你自己的密码（至少8位）

```bash
# 示例：
YOUR_PASSWORD=13812345678zhangsan
# 或
YOUR_PASSWORD=woaini1234
```

> ✅ 系统会自动用你的密码生成安全密钥，无需手动操作！

### 第三步：修改数据路径（推荐）

飞牛 NAS 建议将数据存储在 Docker 专用目录：

```bash
# 编辑 .env 文件，修改这行：
DATA_PATH=./data
# 改成：
DATA_PATH=/vol1/@docker/nexus/data
```

### 第四步：启动容器

**方法A：使用飞牛 Docker 图形界面（推荐新手）**

1. 打开飞牛 OS 的「Docker」应用
2. 点击左侧「Compose」
3. 点击右上角「创建项目」
4. 填写项目名称：`nexus`
5. 选择「上传 Compose 文件」，选择你的 `docker-compose.yml`
6. 点击「创建并启动」

**方法B：使用 SSH/终端（高级用户）**

1. SSH 登录飞牛 NAS
2. 进入配置文件所在目录：
   ```bash
   cd /vol1/docker/nexus
   ```
3. 启动容器：
   ```bash
   docker-compose up -d
   ```

### 第五步：验证部署

1. 在 Docker 应用中查看容器状态
2. 等待所有容器显示「运行中」（约30秒）
3. 打开浏览器访问：`http://你的飞牛IP:5173`

---

## 🔐 首次配置

### 1. 修改默认密码

1. 访问管理后台：`http://你的飞牛IP:5174`
2. 使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. 系统会强制要求修改密码，按提示操作

### 2. 配置 SSRF（NAS用户必做）

由于飞牛 NAS 是内网部署，需要开启内网访问：

1. 登录管理后台
2. 进入「安全管理」→「SSRF防护」
3. 开启「允许访问内网地址」
4. 保存配置

这样你就可以监控内网服务（如路由器、其他 Docker 容器）了。

---

## ❓ 常见问题

### Q1: 端口冲突怎么办？

**现象**：启动时报错 `port is already allocated`

**解决**：修改 `.env` 文件中的端口：

```bash
# 原来：
SERVER_PORT=8787
FRONTEND_PORT=5173
MANAGER_PORT=5174

# 改成：
SERVER_PORT=8788
FRONTEND_PORT=5175
MANAGER_PORT=5176
```

### Q2: 数据存储在哪里？

默认存储在 `./data` 文件夹（docker-compose.yml 同级目录）。

飞牛 NAS 建议修改为：

```bash
DATA_PATH=/vol1/@docker/nexus/data
```

### Q3: 如何更新到新版？

```bash
# 1. 进入目录
cd /vol1/docker/nexus

# 2. 拉取最新镜像
docker-compose pull

# 3. 重启容器
docker-compose up -d
```

### Q4: 容器启动失败怎么办？

1. **查看日志**：
   ```bash
   docker logs nexus-server
   ```

2. **常见问题**：
   - 密码未设置 → 检查 `.env` 文件中 `YOUR_PASSWORD` 是否已填写
   - 权限不足 → 检查 data 目录权限：`chmod 755 data`
   - 内存不足 → 飞牛 NAS 建议至少 2GB 可用内存

### Q5: 如何外网访问？

**方法1：使用飞牛自带的外网访问**
- 开启飞牛 OS 的「远程访问」功能
- 通过飞牛提供的域名访问

**方法2：使用反向代理（推荐）**
- 在飞牛 Docker 中部署 Nginx Proxy Manager
- 配置反向代理到 Nexus 服务
- 开启 HTTPS

---

## 🔒 安全加固

### 必做检查清单

- [ ] 设置了 `YOUR_PASSWORD`（至少8位，不要是简单密码）
- [ ] 首次登录后修改了管理员密码
- [ ] 配置了 SSRF（内网部署开启，公网部署关闭）
- [ ] 设置了数据目录权限：`chmod 700 data`

### 可选安全设置

```bash
# 在 .env 文件中添加：

# 限制允许访问的域名
ALLOWED_ORIGINS=https://your-domain.com

# 更严格的日志级别
LOG_LEVEL=warn
```

---

## 💾 备份与恢复

### 自动备份

飞牛 NAS 可以使用「备份」应用：

1. 打开飞牛「备份」应用
2. 创建新的备份任务
3. 选择源目录：`/vol1/@docker/nexus/data`
4. 选择目标目录：你的备份位置
5. 设置定时备份（建议每天一次）

### 手动备份

```bash
# 备份
cp -r /vol1/docker/nexus/data /vol1/backup/nexus-$(date +%Y%m%d)

# 恢复
cp -r /vol1/backup/nexus-20240101 /vol1/docker/nexus/data
```

> ⚠️ **重要**：恢复数据时需要使用相同的 `YOUR_PASSWORD`，否则无法解密！

---

## 📞 获取帮助

- **GitHub Issues**: https://github.com/sunaibot/Nexus/issues
- **安全文档**: [SECURITY.md](./SECURITY.md)
- **安全审计报告**: [security-audit-report.md](../security-audit-report.md)

---

**祝你使用愉快！** 🎉
