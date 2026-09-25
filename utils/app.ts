/**
 * 应用信息相关通用工具。
 */

export const GITHUB_REPOSITORY_NAME = 'Starlight-Dev-Team/fanbook-bot-tools';
export const GITHUB_REPOSITORY_URL = 'https://github.com/Starlight-Dev-Team/fanbook-bot-tools';

/** 仓库 Fork（由 yhkj-nb 修改维护）名称。 */
export const GITHUB_FORK_REPOSITORY_NAME = 'yhkj-nb/fanbook-bot-tools-V2';
/** 仓库 Fork（由 yhkj-nb 修改维护）地址。 */
export const GITHUB_FORK_REPOSITORY_URL = 'https://github.com/yhkj-nb/fanbook-bot-tools-V2';

/** 版本信息数据模型。 */
export interface VersionInfo {
  /** 版本 ID 。 */
  id: string;
  /** 版本贡献者。 */
  author: string;
  /** 是否已认证。 */
  verified: boolean;
  /** 版本更新时间。 */
  time: Date;
  /** 更新说明。 */
  message: string;
}

/** 维护者展示名（GitHub 登录名 → 展示名）。 */
const AUTHOR_DISPLAY_NAME: Record<string, string> = {
  'yhkj-nb': '云痕科技（yhkj-nb）',
};

/** 默认维护者展示名。 */
export const MAINTAINER_NAME = '云痕科技';

/**
 * 获取版本信息。
 * @returns 当前版本信息
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  const url = `https://api.github.com/repos/${GITHUB_FORK_REPOSITORY_NAME}/branches/main`;
  const res: any = (await useFetch(url, {
    method: 'get',
    mode: 'cors',
  })).data.value;
  const login = res.commit.author.login as string;
  return {
    id: (res.commit.sha as string).slice(0, 7),
    author: AUTHOR_DISPLAY_NAME[login] ?? login,
    verified: res.commit.commit.verification.verified === true,
    time: new Date(res.commit.commit.author.date as string),
    message: res.commit.commit.message,
  };
}

/**
 * 获取 GitHub 最新版本信息（main 分支最新 commit）。
 * 使用原生 fetch，可在任意时机（如按钮点击）调用，不依赖 Nuxt useFetch 的 setup 上下文。
 */
export async function getLatestVersion(): Promise<VersionInfo> {
  const url = `https://api.github.com/repos/${GITHUB_FORK_REPOSITORY_NAME}/branches/main`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  const data = await res.json();
  const login = data.commit.author.login as string;
  return {
    id: (data.commit.sha as string).slice(0, 7),
    author: AUTHOR_DISPLAY_NAME[login] ?? login,
    verified: data.commit.commit.verification.verified === true,
    time: new Date(data.commit.commit.author.date as string),
    message: data.commit.commit.message,
  };
}

/** 更新检查状态。 */
export interface UpdateStatus {
  /** 当前部署的 commit 短哈希（构建时注入）。 */
  current: string;
  /** GitHub main 最新 commit 短哈希。 */
  latest: string;
  /** 是否存在未部署的更新（当前 != 最新）。 */
  hasUpdate: boolean;
  /** 最新版本详情（检查失败时为空）。 */
  info?: VersionInfo;
}

/**
 * 检查是否有未部署的更新：对比当前构建版本与 GitHub main 最新提交。
 * 若两者 commit 不一致，说明 GitHub 已有新提交但尚未部署。
 */
export async function checkUpdate(): Promise<UpdateStatus> {
  const current = useRuntimeConfig().public.buildCommit || '';
  try {
    const info = await getLatestVersion();
    return {
      current,
      latest: info.id,
      hasUpdate: !!current && current !== info.id,
      info,
    };
  } catch {
    return { current, latest: '', hasUpdate: false };
  }
}
