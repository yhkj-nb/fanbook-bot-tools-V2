# Fanbook 机器人工具

> 本仓库由 **yhkj-nb** 在原项目 [Starlight-Dev-Team/fanbook-bot-tools](https://github.com/Starlight-Dev-Team/fanbook-bot-tools) 基础上修改维护。

Fanbook 机器人管理工具，基于 Nuxt 3 + Vue 3 + Arco Design Vue 构建。

## 相对原仓库的改动

- **移除「发送消息」功能**（机器人消息分类及其页面）。官方已不再开放发送消息相关能力，故予以移除。
- **优化荣誉卡槽（勋章）**：
  - 新增 **「修改勋章」** 功能。输入服务器 ID 与用户短 ID（自动解析）即可**自动拉取该用户全部勋章并加载徽章图片**，点击徽章即可载入其配置进行覆盖修改（调用 `getGuildUserCredit` + `setGuildUserCredit`）。
  - **「删除荣誉」** 改为下拉选择：输入服务器 ID 与用户短 ID 后自动拉取该用户全部徽章，点击「自定义 ID」即可从下拉菜单中选择要删除的勋章，无需手动填写自定义 ID。
- 页尾新增仓库归属：原仓库（Starlight-Dev-Team）与「由 yhkj-nb 修改」（yhkj-nb）。

## 功能一览

- 机器人：资料信息
- 荣誉卡槽：设置荣誉、删除荣誉、荣誉列表、修改勋章

## 原项目

- 原仓库：<https://github.com/Starlight-Dev-Team/fanbook-bot-tools>
- 许可证：MIT
