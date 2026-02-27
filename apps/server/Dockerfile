# 构建阶段
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json turbo.json ./

# 复制所有 packages
COPY packages ./packages

# 复制 server 应用
COPY apps/server ./apps/server

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建共享包
RUN pnpm --filter @nowen/shared-types build

# 构建 server
RUN pnpm --filter @nowen/server build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# 创建数据目录
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=8787
ENV DB_PATH=/data/zen-garden.db

EXPOSE 8787

CMD ["node", "dist/index.js"]
