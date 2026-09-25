export type AnnouncementType =
  | 'info'
  | 'danger';

export interface Announcement {
  type: AnnouncementType;
  title: string;
  link: string;
}

interface AppConfig {
  announcements: Announcement[];
  /** 当前部署版本（构建时注入的 commit 短哈希）。 */
  buildCommit: string;
  /** 当前部署版本的构建时间（ISO 字符串）。 */
  buildTime: string;
  /** Vercel 部署页地址（用于「查看部署」），为空则不显示。 */
  vercelProjectUrl: string;
}

declare module 'nuxt/schema' {
  type AppConfigInput = AppConfig;
}

/**
 * 解析构建时注入的 commit 短哈希。
 * 直接使用 CI 注入的环境变量（Vercel 的 VERCEL_GIT_COMMIT_SHA / GitHub Actions 的 GITHUB_SHA）。
 *
 * 注意：app.config.ts 会被打包进客户端产物，因此【禁止】引入 node:child_process 等
 * Node 内置模块（否则 Vite 在浏览器构建时会报
 * "execSync is not exported by __vite-browser-external"）。
 * app.config.ts 在构建期（服务端）求值，下面的函数只返回字符串，不会进入客户端运行时。
 * 本地开发无上述环境变量时回退为 'local'。
 */
function resolveBuildCommit(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
  return sha ? sha.slice(0, 7) : 'local';
}

/** 解析构建时间（ISO 字符串）。 */
function resolveBuildTime(): string {
  return new Date().toISOString();
}

const config: AppConfig = {
  announcements: [{
    type: 'info',
    title: '欢迎加入机器人工具 Fanbook 服务器',
    link: 'https://in.fanbook.cn/iWeiaF4B',
  }],
  buildCommit: resolveBuildCommit(),
  buildTime: resolveBuildTime(),
  vercelProjectUrl: process.env.VERCEL_DEPLOY_URL ?? '',
};

export default defineAppConfig(config);
