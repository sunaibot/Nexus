# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY apps/server/package.json apps/server/package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY apps/server/src ./src
COPY apps/server/tsconfig.json ./

# 构建
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# 复制脚本和文档（如果需要）
COPY apps/server/scripts ./scripts
COPY apps/server/docs ./docs

# 创建数据目录
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=8787
ENV DB_PATH=/data/zen-garden.db

EXPOSE 8787

CMD ["node", "dist/index.js"]
