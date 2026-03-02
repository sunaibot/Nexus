# Nexus 飞牛部署安全指南

## 概述

本文档提供在飞牛 NAS 上部署 Nexus 时的安全建议和配置指南。

## 安全加固清单

### 1. 文件上传安全 ✅

**已实施的保护措施：**
- [x] 禁止上传可执行文件（.exe, .php, .jsp, .py 等）
- [x] 文件名路径穿越检查（禁止 `../` 等）
- [x] 默认只允许常见文档和图片类型
- [x] 文件上传需要登录认证
- [x] 文件大小限制（默认 100MB）

**飞牛部署建议：**
```bash
# 设置上传目录权限（只读/只写分离）
chmod 755 /path/to/uploads
chown -R www-data:www-data /path/to/uploads

# 禁止执行权限
chmod -R -x /path/to/uploads
```

### 2. 路径穿越防护 ✅

**已实施的保护措施：**
- [x] 下载时验证文件路径在允许目录内
- [x] 文件名过滤危险字符
- [x] 使用 `path.resolve()` 和 `startsWith()` 检查

**飞牛部署建议：**
```bash
# 使用绝对路径配置上传目录
# 在 .env 文件中设置：
FILE_TRANSFER_UPLOAD_PATH=/volume1/docker/nexus/uploads

# 确保目录不在网站根目录下
# 推荐：/volume1/docker/nexus/data/uploads
```

### 3. 认证与授权 ✅

**已实施的保护措施：**
- [x] 文件上传需要登录
- [x] JWT Token + Session 双认证
- [x] 角色权限检查
- [x] 审计日志记录

**飞牛部署建议：**
```bash
# 生成强密钥
openssl rand -base64 32

# 在 .env 中配置：
JWT_SECRET=your-strong-random-key-here
SESSION_SECRET=another-strong-random-key
```

### 4. 网络安全

**飞牛部署建议：**
```yaml
# docker-compose.yml 网络隔离
networks:
  nexus-network:
    driver: bridge
    internal: false  # 根据需求调整

services:
  server:
    networks:
      - nexus-network
    # 不暴露端口到主机，通过反向代理访问
    expose:
      - "8787"
  
  frontend:
    networks:
      - nexus-network
    expose:
      - "5173"
  
  manager:
    networks:
      - nexus-network
    expose:
      - "5174"
```

### 5. 反向代理配置（Nginx）

```nginx
# /etc/nginx/conf.d/nexus.conf
server {
    listen 80;
    server_name your-domain.com;
    
    # 强制 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全响应头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 前端
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 管理后台（建议限制 IP 访问）
    location /admin {
        # 可选：限制管理后台访问 IP
        # allow 192.168.1.0/24;
        # deny all;
        
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 上传大小限制
        client_max_body_size 100M;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
        return 404;
    }
    
    location ~ \.(db|sqlite|sql|env|config)$ {
        deny all;
        return 404;
    }
}
```

### 6. 文件系统权限

```bash
#!/bin/bash
# setup-permissions.sh

NEXUS_DIR="/volume1/docker/nexus"

# 创建目录结构
mkdir -p $NEXUS_DIR/{data,uploads,logs,backups}

# 设置权限
chown -R 1000:1000 $NEXUS_DIR

# 数据目录 - 只有所有者读写
chmod 700 $NEXUS_DIR/data

# 上传目录 - 可读写，但不可执行
chmod 733 $NEXUS_DIR/uploads
chmod -R -x $NEXUS_DIR/uploads

# 日志目录
chmod 755 $NEXUS_DIR/logs

# 备份目录
chmod 700 $NEXUS_DIR/backups

echo "权限设置完成"
```

### 7. 定期安全维护

```bash
#!/bin/bash
# security-check.sh

echo "=== Nexus 安全检查 ==="

# 检查可疑文件
echo "检查上传目录中的可疑文件..."
find /volume1/docker/nexus/uploads -type f \( \
    -name "*.php" -o \
    -name "*.jsp" -o \
    -name "*.asp" -o \
    -name "*.py" -o \
    -name "*.sh" -o \
    -name "*.exe" -o \
    -name "*.bat" \
\) -ls

# 检查目录权限
echo "检查目录权限..."
ls -la /volume1/docker/nexus/

# 检查磁盘空间
echo "检查磁盘空间..."
df -h /volume1/docker/nexus

# 检查日志中的异常
echo "检查最近的安全日志..."
docker logs nexus-server 2>&1 | grep -i "security\|error\|attack" | tail -20

echo "=== 检查完成 ==="
```

### 8. 备份策略

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/volume1/docker/nexus/backups"
DATA_DIR="/volume1/docker/nexus/data"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/nexus_backup_$DATE.tar.gz \
    -C $DATA_DIR \
    --exclude='*.log' \
    --exclude='cache/*' \
    .

# 保留最近 7 天的备份
find $BACKUP_DIR -name "nexus_backup_*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/nexus_backup_$DATE.tar.gz"
```

## 紧急响应

### 发现可疑文件

```bash
# 1. 立即停止服务
docker-compose down

# 2. 隔离可疑文件
mv /path/to/suspicious/file /path/to/quarantine/

# 3. 检查系统日志
docker logs nexus-server > /tmp/nexus_logs.txt

# 4. 扫描恶意软件
clamscan -r /volume1/docker/nexus/uploads/

# 5. 恢复服务（确认安全后）
docker-compose up -d
```

### 更新安全补丁

```bash
# 拉取最新代码
git pull origin main

# 重建并重启
docker-compose down
docker-compose up -d --build
```

## 联系支持

- 安全问题报告：security@your-domain.com
- 项目 Issues：https://github.com/yourusername/nexus/issues
