<div align="center">

# 🤖 Fanbook 机器人工具

<p><em>一个纯前端的 Fanbook 机器人管理面板：在浏览器里管理服务器勋章（增删改查）、查询用户勋章、查看机器人信息、发送消息，无需后端服务器。</em></p>

<p>基于 <strong>Nuxt 3 + Vue 3 + Arco Design Vue</strong> 构建，机器人令牌仅保存在本地浏览器（localStorage），操作直接调用 Fanbook OpenAPI。</p>

<p>本项目是 <a href="https://github.com/Starlight-Dev-Team/fanbook-bot-tools">Starlight-Dev-Team/fanbook-bot-tools</a> 的 fork（原仓库 / 上游项目）。</p>

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyhkj-nb%2Ffanbook-bot-tools-V2"><img src="https://vercel.com/button" alt="Deploy with Vercel" /></a>
<a href="https://github.com/yhkj-nb/fanbook-bot-tools-V2/blob/main/LICENSE"><img src="https://img.shields.io/github/license/yhkj-nb/fanbook-bot-tools-V2" alt="License" /></a>
<a href="https://github.com/yhkj-nb/fanbook-bot-tools-V2"><img src="https://img.shields.io/badge/node-20.x-339933" alt="Node" /></a>
<a href="https://github.com/yhkj-nb/fanbook-bot-tools-V2"><img src="https://img.shields.io/badge/packageManager-pnpm-ff0000" alt="pnpm" /></a>
<a href="https://github.com/Starlight-Dev-Team/fanbook-bot-tools"><img src="https://img.shields.io/badge/原仓库-Starlight--Dev--Team%2Ffanbook--bot--tools-1f6feb?logo=github&logoColor=white" alt="原仓库 Starlight-Dev-Team" /></a>

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

> 所有功能均为**纯静态 SPA**（服务端渲染已关闭），可直接托管在 Vercel、Cloudflare Pages、Netlify、腾讯云 EdgeOne、阿里云 ESA、Cloudflare Workers 等任意静态 / 边缘平台，也可用 Docker + Node 自托管。

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

点击下方任意按钮，直接把本仓库克隆并部署到对应平台。构建命令、输出目录、Node 版本、SPA 回退等已在本仓库的 [`vercel.json`](./vercel.json)、[`netlify.toml`](./netlify.toml)、[`edgeone.json`](./edgeone.json)、[`esa.jsonc`](./esa.jsonc) 与 [`Dockerfile`](./Dockerfile) 中配置好，无需手动填写。

<div align="center">

| 腾讯云 EdgeOne · 国际站 | 腾讯云 EdgeOne · 中国站 | Cloudflare Pages |
| :---: | :---: | :---: |
| [![使用 EdgeOne 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?project-name=fanbook-bot-tools-V2&repository-url=https://github.com/yhkj-nb/fanbook-bot-tools-V2&install-command=pnpm%20install&build-command=pnpm%20run%20build&output-directory=.output%2Fpublic) | [![使用 EdgeOne 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/makers/new?project-name=fanbook-bot-tools-V2&repository-url=https://github.com/yhkj-nb/fanbook-bot-tools-V2&install-command=pnpm%20install&build-command=pnpm%20run%20build&output-directory=.output%2Fpublic) | [![Deploy to Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/pages/new) |

| Cloudflare Workers | Vercel | Netlify |
| :---: | :---: | :---: |
| [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yhkj-nb/fanbook-bot-tools-V2) | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyhkj-nb%2Ffanbook-bot-tools-V2) | [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yhkj-nb/fanbook-bot-tools-V2) |

| 阿里云 ESA |
| :---: |
| [![Deploy to 阿里云 ESA](https://img.shields.io/badge/%E9%98%BF%E9%87%8C%E4%BA%91%20ESA-FF6A00?logo=alibabacloud&logoColor=white)](https://esa.console.aliyun.com/) |

</div>

> 本项目是纯前端 SPA，**无需任何后端或环境变量**。部署完成后，在浏览器打开站点，填入你的 Fanbook Bot Token 即可使用。
> 若某平台提示「无法获取存储库内容」，先 [Fork](https://github.com/yhkj-nb/fanbook-bot-tools-V2/fork) 本仓库，再用「连接到 Git 仓库」的方式部署即可。

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

## ⚡ 部署到 Cloudflare Workers

> 本项目是纯静态 SPA，**推荐优先用上面的 [Cloudflare Pages](#☁️-部署到-cloudflare-pages)** 托管（配置最简单、自动 SPA 回退）。Workers 入口适用于「想在 Worker 运行时里托管静态资源」的场景。

如果你希望以 Cloudflare Workers 形式托管（例如想用 `*.workers.dev` 域名或在 Worker 里加自定义逻辑），把构建产物 `.output/public` 作为静态资源即可：

1. 在 Cloudflare 控制台 **Workers & Pages → 创建 → Pages → 直接上传**，上传 `.output/public` 目录；或在 Worker 项目中用 **Workers Assets** 绑定该目录（`assets.directory = .output/public`），并开启 SPA 回退（未匹配路径返回 `index.html`）。
2. 点击上方 **Deploy to Cloudflare Workers** 按钮可快速拉起部署向导。

```bash
# 本地构建后直接上传静态产物到 Cloudflare Pages（最省事）
pnpm install
pnpm run build
npx wrangler pages deploy .output/public
```

---

## 🌏 部署到腾讯云 EdgeOne（Makers）

腾讯云 EdgeOne 国际站与中国站均支持，构建配置已写在 [`edgeone.json`](./edgeone.json)（构建命令、输出目录、Node 版本、SPA 回退都已配好）。

- 国际站：<https://edgeone.ai/pages/new>
- 中国站：<https://console.cloud.tencent.com/edgeone/makers/new>

### 方式一：一键部署按钮

点击上方 🚀 一键部署 中的 **EdgeOne** 按钮，平台会自动读取 `edgeone.json` 完成构建与发布。

### 方式二：控制台导入 Git 仓库

1. 在 EdgeOne 控制台 **Pages → 创建项目 → 连接到 Git**，选择本仓库。
2. 构建设置会自动读取 `edgeone.json`：

   | 配置项 | 值 |
   | :--- | :--- |
   | 安装命令 | `pnpm install` |
   | 构建命令 | `pnpm run build` |
   | 输出目录 | `.output/public` |
   | Node 版本 | `20.18.0` |

3. 点击 **部署**。客户端路由由 `edgeone.json` 里的 `rewrites`（`/* → /index.html`）做 SPA 回退，不会 404。

> EdgeOne 预装 Node 版本建议用列表内的 `20.18.0`（或 `22.11.0`），`edgeone.json` 已固定为 `20.18.0`，填其他版本可能构建失败。

---

## 🟢 部署到 Netlify

项目根目录的 [`netlify.toml`](./netlify.toml) 已写好构建命令、发布目录与 SPA 回退（`/* → /index.html`）。

- **一键部署**：点击上方 **Deploy to Netlify** 按钮。
- **控制台**：在 Netlify **Add new project → Import an existing project** 导入本仓库，构建设置会自动读取 `netlify.toml`。
- **命令行**：

```bash
npx netlify login
pnpm install && pnpm run build
npx netlify deploy --prod --dir .output/public
```

Netlify 没有平台级存储，但本项目是纯前端 SPA，所有状态都在浏览器 localStorage，因此无需任何外部数据库或环境变量。

---

## ☁️ 部署到阿里云 ESA（Pages）

阿里云 ESA 边缘计算的「函数和 Pages」支持静态托管。构建配置写在 [`esa.jsonc`](./esa.jsonc)：输出目录 `.output/public`，并启用 SPA 回退（`notFoundStrategy: singlePageApplication`）。

1. 在 ESA 控制台 **边缘计算 → 函数和 Pages** 创建项目，导入 GitHub 仓库。
2. 构建命令填 `pnpm run build`，静态资源目录填 `.output/public`（或让平台直接读取 `esa.jsonc`）。
3. 点击 **部署**。`esa.jsonc` 的 `notFoundStrategy` 保证 `/feature/*`、`/login` 等前端路由不会 404。

> 本项目为纯静态 SPA，无需 ESA 的函数入口（`entry`）；只用 `assets` 静态资源配置即可。

---

## 🐳 部署到 Node / Docker（自托管）

适合私有化部署或放到自己的服务器 / 容器里。仓库根目录的 [`Dockerfile`](./Dockerfile) 已做好多阶段构建：先 `pnpm run build`，再用 `serve` 以静态服务器托管 `.output/public`（自带 SPA 回退）。

```bash
# 方式一：直接用 Docker 构建并运行
docker build -t fanbook-bot-tools .
docker run -d -p 3000:3000 --name fanbook-bot-tools fanbook-bot-tools
# 浏览器访问 http://localhost:3000

# 方式二：本地用 Node 直接托管静态产物
pnpm install
pnpm run build
npx serve -s .output/public -l 3000
```

> 本项目纯前端，无需任何服务端环境变量；Bot Token 仍在浏览器 localStorage 中保存。

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
