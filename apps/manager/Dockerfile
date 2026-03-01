# 构建阶段
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json turbo.json ./

# 复制所有 packages
COPY packages ./packages

# 复制 manager 应用
COPY apps/manager ./apps/manager

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建共享包
RUN pnpm --filter @nowen/shared-types build

# 构建 manager
RUN pnpm --filter @nowen/manager build

# 生产阶段 - 使用 nginx 托管
FROM nginx:alpine AS production

# 复制构建产物
COPY --from=builder /app/apps/manager/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY apps/manager/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
