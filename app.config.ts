export type AnnouncementType =
  | 'info'
  | 'danger';

export interface Announcement {
  type: AnnouncementType;
  title: string;
  link: string;
}

/**
 * 部署元信息（buildCommit / buildTime / vercelProjectUrl）已迁移到 nuxt.config.ts 的
 * runtimeConfig.public，由 Nuxt 在构建期读取 process.env 并安全注入客户端。
 *
 * 注意：app.config.ts 会被打包进客户端产物并在浏览器运行时执行，此时 process.env 为
 * undefined，因此【不能】在这里读取 VERCEL_GIT_COMMIT_SHA 等构建期环境变量
 * （之前在此读取会永远回退成 'local'）。
 *
 * 也不要用 `declare module 'nuxt/schema' { type AppConfigInput = ... }` 自行扩展，
 * 会与 Nuxt 自带的声明冲突（Duplicate identifier 'AppConfigInput'）。让 defineAppConfig
 * 自动推断类型即可。
 */
export default defineAppConfig({
  announcements: [{
    type: 'info',
    title: '欢迎加入机器人工具 Fanbook 服务器',
    link: 'https://in.fanbook.cn/iWeiaF4B',
  }],
});
