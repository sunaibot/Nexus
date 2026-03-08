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
2. 准备两个安全密钥（后面会教你怎么生成）

### 3步部署

```bash
# 第1步：下载配置文件
# 下载 docker-compose.fnos.yml 到你的飞牛 NAS

# 第2步：生成安全密钥（在飞牛终端运行）
openssl rand -base64 32
# 运行两次，分别得到 JWT_SECRET 和 SESSION_SECRET

# 第3步：修改配置文件中的密钥，然后启动
docker-compose -f docker-compose.fnos.yml up -d
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
   - 下载 `docker-compose.fnos.yml` 到该文件夹
   - 或者新建文件，复制粘贴内容

### 第二步：生成安全密钥

**方法A：使用飞牛终端（推荐）**

1. 打开飞牛 OS 的「终端」应用
2. 运行以下命令两次：

```bash
openssl rand -base64 32
```

3. 你会得到类似这样的字符串：
   ```
   aBcD1234xYz789...（共44个字符）
   ```

**方法B：在线生成**

1. 访问：https://generate-random.org/encryption-key-generator
2. 选择 Base64 格式，32字节长度
3. 生成两次，记录两个不同的密钥

### 第三步：修改配置文件

1. **右键编辑** `docker-compose.fnos.yml`
2. **找到并修改这两行**：

```yaml
# 原来是这样的：
- JWT_SECRET=your-jwt-secret-here-change-this-in-production
- SESSION_SECRET=your-session-secret-here-change-this-too

# 改成你生成的密钥（示例）：
- JWT_SECRET=aBcD1234xYz789...（你生成的第一个密钥）
- SESSION_SECRET=mNoP5678qRs012...（你生成的第二个密钥）
```

3. **保存文件**

### 第四步：启动容器

**方法A：使用飞牛 Docker 图形界面（推荐新手）**

1. 打开飞牛 OS 的「Docker」应用
2. 点击左侧「Compose」
3. 点击右上角「创建项目」
4. 填写项目名称：`nexus`
5. 选择「上传 Compose 文件」，选择你的 `docker-compose.fnos.yml`
6. 点击「创建并启动」

**方法B：使用 SSH/终端（高级用户）**

1. SSH 登录飞牛 NAS
2. 进入配置文件所在目录：
   ```bash
   cd /vol1/docker/nexus
   ```
3. 启动容器：
   ```bash
   docker-compose -f docker-compose.fnos.yml up -d
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

**解决**：修改 `docker-compose.fnos.yml` 中的端口映射：

```yaml
ports:
  - "8788:8787"  # 把主机的 8787 改成 8788
  - "5175:80"    # 把主机的 5173 改成 5175
  - "5176:80"    # 把主机的 5174 改成 5176
```

### Q2: 数据存储在哪里？

默认存储在 `docker-compose.fnos.yml` 同目录的 `data` 文件夹。

飞牛 NAS 建议修改为：

```yaml
volumes:
  - /vol1/@docker/nexus/data:/data
```

### Q3: 如何更新到新版？

```bash
# 1. 进入目录
cd /vol1/docker/nexus

# 2. 拉取最新镜像
docker-compose -f docker-compose.fnos.yml pull

# 3. 重启容器
docker-compose -f docker-compose.fnos.yml up -d
```

### Q4: 容器启动失败怎么办？

1. **查看日志**：
   ```bash
   docker logs nexus-server
   ```

2. **常见问题**：
   - 密钥未修改 → 修改 JWT_SECRET 和 SESSION_SECRET
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

- [ ] 修改了 JWT_SECRET（使用随机字符串）
- [ ] 修改了 SESSION_SECRET（与 JWT_SECRET 不同）
- [ ] 首次登录后修改了管理员密码
- [ ] 配置了 SSRF（内网部署开启，公网部署关闭）
- [ ] 设置了数据目录权限：`chmod 700 data`

### 可选安全设置

```yaml
# 在 docker-compose.fnos.yml 中添加：

environment:
  # 限制允许访问的域名
  - ALLOWED_ORIGINS=https://your-domain.com
  
  # 更严格的日志级别
  - LOG_LEVEL=warn
```

---

## 💾 备份与恢复

### 自动备份

飞牛 NAS 可以使用「备份」应用：

1. 打开飞牛「备份」应用
2. 创建新的备份任务
3. 选择源目录：`/vol1/docker/nexus/data`
4. 选择目标目录：你的备份位置
5. 设置定时备份（建议每天一次）

### 手动备份

```bash
# 备份
cp -r /vol1/docker/nexus/data /vol1/backup/nexus-$(date +%Y%m%d)

# 恢复
cp -r /vol1/backup/nexus-20240101 /vol1/docker/nexus/data
```

---

## 📞 获取帮助

- **GitHub Issues**: https://github.com/sunaibot/Nexus/issues
- **安全文档**: [SECURITY_DEEP_ANALYSIS.md](../../SECURITY_DEEP_ANALYSIS.md)
- **安装指南**: [INSTALL_GUIDE.md](../../INSTALL_GUIDE.md)

---

**祝你使用愉快！** 🎉
