# NOWEN 安全部署指南

本文档介绍如何安全地部署 NOWEN，避免常见的安全风险。

## 🚨 关键安全警告

### 1. 默认密码风险

**问题**: 早期版本使用默认密码 `admin123`

**解决方案**:
- ✅ 新版本已改为随机生成密码
- ✅ 首次登录强制要求修改密码
- ⚠️ 如果忘记密码，使用 `reset-admin.ts` 工具重置

### 2. 环境变量安全

**必须修改的变量**:

```bash
# 生成强随机密钥
openssl rand -base64 32

# .env 文件
JWT_SECRET=your-random-key-here
SESSION_SECRET=your-different-random-key-here
```

**风险**: 使用默认密钥会导致会话劫持和未授权访问

### 3. 端口暴露风险

**建议**: 修改默认端口映射

```yaml
# docker-compose.yml
ports:
  - "9876:8787"  # 使用非标准端口
  - "8080:80"    # 前端
  - "8081:80"    # 管理后台
```

## 🔒 安全加固步骤

### 1. 环境准备

```bash
# 1. 克隆代码
git clone https://github.com/cropflre/NOWEN.git
cd NOWEN

# 2. 创建环境变量文件
cp .env.example .env

# 3. 生成安全密钥
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# 4. 更新 .env 文件
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
```

### 2. 配置防火墙

```bash
# 飞牛 NAS 防火墙配置示例
# 只开放必要端口

# 允许前端访问
iptables -A INPUT -p tcp --dport 5173 -j ACCEPT

# 允许管理后台访问（建议限制 IP）
iptables -A INPUT -p tcp --dport 5174 -s 192.168.1.0/24 -j ACCEPT

# 后端 API 不需要直接暴露（通过前端代理）
# iptables -A INPUT -p tcp --dport 8787 -j DROP
```

### 3. 启用 HTTPS

**使用反向代理（推荐）**:

```nginx
# /etc/nginx/conf.d/nowen.conf
server {
    listen 443 ssl http2;
    server_name nav.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 管理后台（限制访问）
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    # IP 白名单
    allow 192.168.1.0/24;
    deny all;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 数据备份

```bash
#!/bin/bash
# backup.sh - 自动备份脚本

BACKUP_DIR="/vol1/backups/nowen"
DATA_DIR="/vol1/docker/nowen/data"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份
mkdir -p $BACKUP_DIR
tar czf "$BACKUP_DIR/nowen_backup_$DATE.tar.gz" -C $DATA_DIR .

# 保留最近 7 个备份
ls -t $BACKUP_DIR/nowen_backup_*.tar.gz | tail -n +8 | xargs rm -f

echo "备份完成: $BACKUP_DIR/nowen_backup_$DATE.tar.gz"
```

## 🛡️ 安全功能说明

### 已实施的安全措施

1. **密码安全**
   - ✅ bcrypt 密码哈希
   - ✅ 随机初始密码
   - ✅ 强制密码修改
   - ✅ 密码复杂度检查

2. **会话安全**
   - ✅ HttpOnly Cookie
   - ✅ Secure Cookie（生产环境）
   - ✅ SameSite 保护
   - ✅ 会话过期

3. **访问控制**
   - ✅ JWT 认证
   - ✅ 角色权限检查
   - ✅ API 速率限制
   - ✅ IP 过滤

4. **输入验证**
   - ✅ SQL 注入检测
   - ✅ XSS 防护
   - ✅ CSRF 防护
   - ✅ 内容类型验证

5. **容器安全**
   - ✅ 只读根文件系统
   - ✅ 资源限制
   - ✅ 健康检查
   - ✅ 非 root 用户运行

## ⚠️ 已知限制

1. **SQLite 数据库**: 不适合高并发场景
2. **文件上传**: 默认限制 10MB
3. **会话存储**: 内存存储（重启后失效）

## 🆘 安全事件响应

### 如果怀疑被入侵

1. **立即停止服务**
   ```bash
   docker-compose down
   ```

2. **检查日志**
   ```bash
   docker-compose logs > security_audit.log
   ```

3. **重置所有密码**
   ```bash
   cd apps/server && npx tsx reset-admin.ts
   ```

4. **更新密钥**
   ```bash
   # 生成新密钥
   openssl rand -base64 32
   
   # 更新 .env
   # 重启服务
   docker-compose up -d
   ```

5. **检查数据完整性**
   ```bash
   # 检查数据库
   sqlite3 data/zen-garden.db ".tables"
   sqlite3 data/zen-garden.db "SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 50"
   ```

## 📞 安全反馈

发现安全漏洞请通过以下方式报告：

- GitHub Security Advisories: https://github.com/cropflre/NOWEN/security
- 邮件: security@example.com（请替换为实际邮箱）

**请不要在公开 issue 中披露安全漏洞**
