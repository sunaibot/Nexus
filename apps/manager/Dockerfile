# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY apps/manager/package.json apps/manager/package-lock.json ./

# 安装依赖
RUN npm ci

# 复制所有源代码文件
COPY apps/manager/index.html ./
COPY apps/manager/vite.config.ts ./
COPY apps/manager/tsconfig.json ./
# COPY apps/manager/tsconfig.node.json ./  # 文件不存在
COPY apps/manager/tailwind.config.js ./
COPY apps/manager/postcss.config.js ./
COPY apps/manager/vite-env.d.ts ./
COPY apps/manager/index.css ./
COPY apps/manager/App.tsx ./
COPY apps/manager/main.tsx ./

# 复制目录
COPY apps/manager/components ./components
COPY apps/manager/lib ./lib
COPY apps/manager/hooks ./hooks
COPY apps/manager/types ./types
COPY apps/manager/locales ./locales
COPY apps/manager/config ./config
COPY apps/manager/contexts ./contexts
COPY apps/manager/core ./core
COPY apps/manager/modules ./modules
COPY apps/manager/pages ./pages
COPY apps/manager/public ./public
COPY apps/manager/__tests__ ./__tests__

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
