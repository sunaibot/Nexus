# 环境配置说明

## 统一端口配置

所有环境使用相同的端口 **8787**，简化部署和开发。

### 后端服务 (apps/server)

| 环境 | 端口 | 数据库路径 | 启动命令 |
|------|------|------------|----------|
| 开发 | 8787 | `./data/zen-garden.db` | `pnpm dev` |
| Docker | 8787 | `/data/zen-garden.db` | `docker-compose up` |

### 配置文件

**开发环境**: `.env.development`
```env
PORT=8787
NODE_ENV=development
DB_PATH=./data/zen-garden.db
```

**生产/Docker 环境**: `.env.production`
```env
PORT=8787
NODE_ENV=production
DB_PATH=/data/zen-garden.db
```

## 前端应用

| 应用 | 开发端口 | Docker 端口 | 说明 |
|------|----------|-------------|------|
| frontend | 8785 | 7171 | 用户前台 |
| manager | 8786 | 7272 | 管理后台 |

### API 地址配置

前端通过环境变量配置 API 地址：

**开发模式**:
```env
VITE_API_URL=http://localhost:8787/api
```

**生产模式**:
```env
VITE_API_URL=/api
```

## 快速启动

### 1. 开发模式

```bash
# 安装依赖
pnpm install

# 启动后端（端口 8787）
cd apps/server
pnpm dev

# 启动前台（端口 8785）
cd apps/frontend
pnpm dev

# 启动后台（端口 8786）
cd apps/manager
pnpm dev
```

### 2. Docker 模式

```bash
# 一键启动所有服务
docker-compose up -d

# 访问地址
# 前台: http://NAS_IP:7171
# 后台: http://NAS_IP:7272
# API: http://NAS_IP:8787
```

## 环境切换开关

通过 `NODE_ENV` 环境变量切换：

```bash
# 开发模式
NODE_ENV=development

# 生产模式
NODE_ENV=production
```

数据库路径通过 `DB_PATH` 环境变量控制：

```bash
# 本地开发
DB_PATH=./data/zen-garden.db

# Docker 部署
DB_PATH=/data/zen-garden.db
```

## 飞牛NAS 部署

```bash
# 1. 复制项目到 NAS
cp -r Nexus-main /volume1/docker/

# 2. 进入目录
cd /volume1/docker/Nexus-main

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

数据持久化：
- 数据库挂载到 `./data/zen-garden.db`
- 建议定期备份 `data/` 目录
