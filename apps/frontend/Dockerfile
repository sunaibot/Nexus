# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY apps/frontend/package.json apps/frontend/package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源代码（排除已复制的 package.json）
COPY apps/frontend/index.html apps/frontend/vite.config.ts apps/frontend/tsconfig.json apps/frontend/tailwind.config.js apps/frontend/postcss.config.js ./
COPY apps/frontend/src ./src
COPY apps/frontend/public ./public
COPY apps/frontend/components ./components
COPY apps/frontend/lib ./lib
COPY apps/frontend/hooks ./hooks
COPY apps/frontend/stores ./stores
COPY apps/frontend/types ./types
COPY apps/frontend/locales ./locales
COPY apps/frontend/config ./config
COPY apps/frontend/plugins ./plugins
COPY apps/frontend/routes ./routes
COPY apps/frontend/pages ./pages
COPY apps/frontend/contexts ./contexts
COPY apps/frontend/providers ./providers

# 构建
RUN npm run build

# 生产阶段 - 使用 nginx 托管
FROM nginx:alpine AS production

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
