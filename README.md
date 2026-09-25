<div align="center">

# 🤖 Fanbook 机器人工具

<p><em>一个纯前端的 Fanbook 机器人管理面板：在浏览器里管理服务器勋章（增删改查）、查询用户勋章、查看机器人信息、发送消息，无需后端服务器。</em></p>

<p>基于 <strong>Nuxt 3 + Vue 3 + Arco Design Vue</strong> 构建，机器人令牌仅保存在本地浏览器（localStorage），操作直接调用 Fanbook OpenAPI。</p>

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyhkj-nb%2Ffanbook-bot-tools-V2"><img src="https://vercel.com/button" alt="Deploy with Vercel" /></a>
<a href="https://github.com/yhkj-nb/fanbook-bot-tools-V2/blob/main/LICENSE"><img src="https://img.shields.io/github/license/yhkj-nb/fanbook-bot-tools-V2" alt="License" /></a>
<a href="https://github.com/yhkj-nb/fanbook-bot-tools-V2"><img src="https://img.shields.io/badge/node-20.x-339933" alt="Node" /></a>
<a href="https://github.com/yhkj-nb/fanbook-bot-tools-V2"><img src="https://img.shields.io/badge/packageManager-pnpm-ff0000" alt="pnpm" /></a>

</div>

---

## ✨ 功能特性

| 模块 | 说明 |
| :--- | :--- |
| 🏅 **勋章管理** | 查询 / 设置 / 修改 / 删除服务器勋章，支持图标、标题栏、卡槽预览 |
| 👤 **用户勋章查询** | 按用户 ID 或昵称搜索用户，查看其已拥有的勋章列表 |
| 🤖 **机器人信息** | 查看当前机器人（Bot）的基本资料与权限 |
| ✉️ **消息发送** | 向指定频道或用户发送消息 |
| 🔐 **本地令牌** | Bot Token 仅存于浏览器 localStorage，不上传任何服务器 |
| 📱 **响应式界面** | 桌面与移动端自适应，勋章预览区实时反映编辑结果 |

> 所有功能均为**纯静态 SPA**（服务端渲染已关闭），可直接托管在 Vercel、Cloudflare Pages 等任意静态平台。

---

## 🧱 技术栈

- **框架**：[Nuxt 3](https://nuxt.com/)（`ssr: false`，纯客户端 SPA）
- **UI**：[Vue 3](https://vuejs.org/) + [Arco Design Vue](https://arco.design/vue)
- **状态管理**：[Pinia](https://pinia.vuejs.org/)
- **样式**：[Tailwind CSS](https://tailwindcss.com/)
- **SDK**：`@starlight-dev-team/fanbook-api-sdk`
- **语言**：TypeScript
- **包管理**：pnpm（`packageManager: pnpm@8.15.5`）

---

## 🚀 一键部署

点击下方按钮，直接将本仓库克隆并部署到 Vercel（构建命令、输出目录等已在仓库的 [`vercel.json`](./vercel.json) 中配置好）：

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyhkj-nb%2Ffanbook-bot-tools-V2)

</div>

部署完成后，在浏览器打开站点，填入你的 Fanbook Bot Token 即可开始使用。

---

## 📦 部署到 Vercel

### 方式一：导入 Git 仓库（推荐）

1. 在 Vercel 控制台点击 **Add New → Project**，导入 `yhkj-nb/fanbook-bot-tools-V2`。
2. **框架预设**选 **Other**（构建配置已写在 `vercel.json` 中，无需手动填）。
3. 确认以下构建设置（一般会自动读取，无需改动）：

   | 配置项 | 值 |
   | :--- | :--- |
   | 构建命令 (Build Command) | `pnpm run build` |
   | 安装命令 (Install Command) | `pnpm install` |
   | 输出目录 (Output Directory) | `.output/public` |
   | Node.js 版本 | `20.x` |

4. 点击 **Deploy**。Vercel 会自动构建并将 `.output/public` 作为静态站点发布。
5. 未预渲染的客户端路由会自动回退到 `200.html`（SPA 回退）。

### 方式二：命令行部署

```bash
# 登录 Vercel
npx vercel login

# 首次部署（预览环境）
npx vercel

# 生产环境部署
npx vercel --prod
```

> 推送到 `main` 分支后，Vercel 会通过 Git 集成自动重新构建并发布。

---

## ☁️ 部署到 Cloudflare Pages

本项目是纯静态站点，同样适合托管在 Cloudflare Pages。

### 方式一：连接 Git 仓库

1. 在 Cloudflare 控制台 **Workers & Pages → 创建 → Pages → 连接到 Git**。
2. 选择本仓库，构建设置如下：

   | 配置项 | 值 |
   | :--- | :--- |
   | 构建命令 | `pnpm run build` |
   | 构建输出目录 | `.output/public` |
   | 环境变量 `NODE_VERSION` | `20` |

3. 点击 **保存并部署**。

### 方式二：Wrangler 命令行

```bash
# 安装 CLI（如未安装）
npm install -g wrangler

# 登录
npx wrangler login

# 本地构建
pnpm install
pnpm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy .output/public
```

### SPA 路由回退

仓库已在 `public/_routes.json` 中声明了路由规则：静态资源（`/_nuxt/*`、图片、JS/CSS 等）走 CDN 缓存，其余路径回退到 SPA 入口，保证 `/feature/*`、`/login` 等客户端路由不会 404。

---

## 💻 本地开发

### 环境要求

- **Node.js** `20.x`
- **pnpm** `8.15.5`（通过 corepack 启用）

```bash
# 启用 pnpm（若未启用）
corepack enable
corepack prepare pnpm@8.15.5 --activate
```

### 启动

```bash
# 克隆仓库
git clone https://github.com/yhkj-nb/fanbook-bot-tools-V2.git
cd fanbook-bot-tools-V2

# 安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:5443）
pnpm run start

# 生产构建（产物输出到 .output/public）
pnpm run build
```

> 本项目仅依赖浏览器端 localStorage 存储 Bot Token，本地开发无需配置任何服务端环境变量。

---

## ⚙️ 环境变量

本项目为纯前端应用，**无需任何服务端环境变量**。

Bot Token、服务器 ID 等敏感信息均在浏览器端通过 `localStorage` 保存，不会被发送到除 Fanbook API 以外的任何地方。请妥善保管你的 Bot Token，不要在公共设备上勾选「记住」。

---

## ❓ 常见问题

| 现象 | 原因与处理 |
| :--- | :--- |
| 打开站点后提示未授权 / 跳登录 | 尚未填入 Bot Token。在登录页填入有效的 Fanbook Bot Token 即可。 |
| 搜索用户无结果 | 确认已填写 **18 位服务器 ID**（Guild ID），且 Bot 对该服务器有相应权限。 |
| 点击勋章卡片后页面报错 | 已修复：旧版在响应式重渲染时触发了 Arco 运行时的 `insertBefore` 崩溃，当前 `main` 已通过 `v-show` 规避。若仍遇到，请更新到最新构建。 |
| 部署后部分路由 404 | 确认部署平台已启用 SPA 回退（Vercel 用 `200.html`，Cloudflare Pages 用 `_routes.json`，均已配置）。 |
| 构建报 `searchGuildMembers is not exported` | 依赖未完整安装，执行 `pnpm install` 后重试 `pnpm run build`。 |

---

## 📄 开源许可

本项目基于 [MIT](./LICENSE) 许可证发布。

---

<div align="center">

Made with ❤️ for Fanbook bot admins

</div>
