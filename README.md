# Fanbook 机器人工具

> 本仓库由 **云痕科技（yhkj-nb）** 在原项目 [Starlight-Dev-Team/fanbook-bot-tools](https://github.com/Starlight-Dev-Team/fanbook-bot-tools) 基础上修改维护：<https://github.com/yhkj-nb/fanbook-bot-tools-V2>

Fanbook 机器人管理工具，基于 Nuxt 3 + Vue 3 + Arco Design Vue 构建。

## 相对原仓库的改动

- **移除「发送消息」功能**（机器人消息分类及其页面）。官方已不再开放发送消息相关能力，故予以移除。
- **优化荣誉卡槽（勋章）**：
  - 新增 **「修改勋章」** 功能。输入服务器 ID 与用户短 ID（自动解析）即可**自动拉取该用户全部勋章并加载徽章图片**，点击徽章即可载入其配置进行覆盖修改（调用 `getGuildUserCredit` + `setGuildUserCredit`）。
  - **「删除荣誉」** 改为下拉选择：输入服务器 ID 与用户短 ID 后自动拉取该用户全部徽章，点击「自定义 ID」即可从下拉菜单中选择要删除的勋章，无需手动填写自定义 ID。
- 页尾新增仓库归属：原仓库（Starlight-Dev-Team）与「由云痕科技修改」。

## 云痕科技版本额外改动

- **WinUI 3 / Fluent Design 视觉主题**：全局替换为 Segoe UI 字体、Mica 浅色背景、Fluent 蓝强调色（`#0078D4`）、8px 圆角卡片与柔和投影（`assets/css/winui.css`，已在 `nuxt.config.ts` 注册）。
- **目标用户改为单框搜索**：荣誉卡槽相关页面（设置 / 修改 / 删除 / 列表）的「目标用户」只需一个输入框，可直接输入**用户名 / 昵称**搜索服务器成员（下拉带头像，选中后自动回填用户 ID），也可直接粘贴**完整用户 ID** 或**用户短 ID**；选中后显示已选用户信息条，输入过程中不再误报「本项必填」。
- **全局水印**：固定显示 `@云痕科技` 品牌水印（右下角，低透明度不遮挡页面内容，`app.vue`）。
- **版本与署名**：页脚、关于页与版本信息页统一展示「云痕科技（yhkj-nb）」。

## 功能一览

- 机器人：资料信息
- 荣誉卡槽：设置荣誉、删除荣誉、荣誉列表、修改勋章

## 原项目

- 原仓库：<https://github.com/Starlight-Dev-Team/fanbook-bot-tools>
- 许可证：MIT
