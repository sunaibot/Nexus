# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY apps/manager/package.json apps/manager/package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY apps/manager ./

# 构建
RUN npm run build

# 生产阶段 - 使用 nginx 托管
FROM nginx:alpine AS production

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY apps/manager/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
