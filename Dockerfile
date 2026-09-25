# ---- 构建阶段：在容器内完成 pnpm 安装与 Nuxt 静态构建 ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ---- 运行阶段：用轻量 Node 静态服务器托管 .output/public ----
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/.output/public /app/public
EXPOSE 3000
# -s 开启 SPA 回退：未匹配路径返回 index.html
CMD ["serve", "-s", "/app/public", "-l", "3000"]
