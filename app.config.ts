import { execSync } from 'node:child_process';

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
  /** 当前部署版本的提交时间（ISO 字符串）。 */
  buildTime: string;
  /** Vercel 部署页地址（用于「查看部署」），为空则不显示。 */
  vercelProjectUrl: string;
}

declare module 'nuxt/schema' {
  type AppConfigInput = AppConfig;
}

/**
 * 解析构建时注入的 commit 短哈希。
 * 优先使用 CI 注入的环境变量（Vercel 的 VERCEL_GIT_COMMIT_SHA / GitHub Actions 的 GITHUB_SHA），
 * 回退到本地 git 命令。仅用于构建时计算，不会进入客户端运行时。
 */
function resolveBuildCommit(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (sha) return sha.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

/** 解析构建时注入的提交时间（ISO 字符串）。 */
function resolveBuildTime(): string {
  try {
    const out = execSync('git show -s --format=%cI HEAD').toString().trim();
    return out ? new Date(out).toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
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
