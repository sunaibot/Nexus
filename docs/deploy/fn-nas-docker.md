# 飞牛 NAS Docker 部署指南

本文档介绍如何在飞牛 NAS 上使用 Docker Compose 部署 NOWEN。

## 📋 前置要求

- 飞牛 NAS 系统已安装 Docker 和 Docker Compose
- 已开启 SSH 或文件管理器访问权限
- 建议预留 2GB 以上存储空间

## 🚀 快速部署

### 1. 下载代码

通过 SSH 登录飞牛 NAS，进入共享文件夹：

```bash
cd /vol1/共享文件夹

# 克隆代码
git clone https://github.com/cropflre/NOWEN.git
cd NOWEN
```

或通过文件管理器直接上传代码压缩包并解压。

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑环境变量
vi .env
```

**必须修改的变量：**

```bash
# 安全密钥（务必修改为随机字符串！）
JWT_SECRET=your-random-secret-key-here
SESSION_SECRET=your-random-session-key-here
```

> ⚠️ **安全提示**：JWT_SECRET 和 SESSION_SECRET 必须使用强随机字符串，可使用 `openssl rand -base64 32` 生成。

### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 4. 访问服务

等待服务启动完成后（约 30 秒），通过浏览器访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端页面 | http://NAS_IP:5173 | 主要使用界面 |
| 管理后台 | http://NAS_IP:5174 | 管理员配置界面 |
| API 接口 | http://NAS_IP:8787 | 后端 API |

> 将 `NAS_IP` 替换为你的飞牛 NAS 实际 IP 地址。

## 🔧 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f nowen-server
docker-compose logs -f nowen-frontend
docker-compose logs -f nowen-manager

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 完全删除（保留数据）
docker-compose down

# 完全删除（包括数据！）
docker-compose down -v
```

## 💾 数据备份

数据存储在项目目录的 `data/` 文件夹中：

```bash
# 备份数据
cp -r data data.backup.$(date +%Y%m%d)

# 或使用 tar 打包
tar czvf nowen-backup-$(date +%Y%m%d).tar.gz data/
```

## 🌐 反向代理配置（可选）

如需使用域名访问，可在飞牛 NAS 的 Nginx 中配置反向代理：

```nginx
server {
    listen 80;
    server_name nav.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 更新升级

```bash
cd /vol1/共享文件夹/NOWEN

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

## ❓ 常见问题

### 1. 端口冲突

如果端口被占用，修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8788:8787"  # 将主机端口改为 8788
```

### 2. 数据持久化

数据默认存储在项目目录的 `data/` 文件夹中。如需更改位置，修改：

```yaml
volumes:
  - /vol1/其他路径/nowen-data:/data
```

### 3. 内存不足

如果 NAS 内存较小，可单独部署前端（使用预构建镜像）：

```yaml
# 修改 docker-compose.yml，将 build 改为 image
nowen-frontend:
  image: nginx:alpine
  volumes:
    - ./frontend-dist:/usr/share/nginx/html:ro
```

### 4. 防火墙问题

确保飞牛 NAS 防火墙允许以下端口：
- 5173（前端）
- 5174（管理后台）
- 8787（API）

## 📞 获取帮助

- GitHub Issues: https://github.com/cropflre/NOWEN/issues
- 文档: https://github.com/cropflre/NOWEN/tree/main/docs
