# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY apps/manager/package.json apps/manager/package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源代码（排除已复制的 package.json）
COPY apps/manager/index.html apps/manager/vite.config.ts apps/manager/tsconfig.json apps/manager/tailwind.config.js apps/manager/postcss.config.js ./
COPY apps/manager/src ./src
COPY apps/manager/public ./public
COPY apps/manager/components ./components
COPY apps/manager/lib ./lib
COPY apps/manager/hooks ./hooks
COPY apps/manager/stores ./stores
COPY apps/manager/types ./types
COPY apps/manager/locales ./locales
COPY apps/manager/config ./config
COPY apps/manager/plugins ./plugins
COPY apps/manager/routes ./routes
COPY apps/manager/pages ./pages
COPY apps/manager/contexts ./contexts
COPY apps/manager/core ./core

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
