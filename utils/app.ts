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

/** 维护者展示名（GitHub 登录名 / git 提交名 → 展示名）。 */
const AUTHOR_DISPLAY_NAME: Record<string, string> = {
  'yhkj-nb': '云痕科技（yhkj-nb）',
  'bot': '云痕科技（yhkj-nb）',
};

/** 默认维护者展示名。 */
export const MAINTAINER_NAME = '云痕科技';

/**
 * 将 GitHub `repos/{owner}/{repo}/branches/{branch}` 接口返回体解析为版本信息。
 *
 * 注意：返回体里的 `commit.author` / `commit.committer` 是「GitHub 用户对象」，
 * 当提交使用的邮箱未关联任何 GitHub 账号时（例如本仓库的 `bot <bot@local>` 提交），
 * 该字段会是 `null`。此处先取 GitHub 用户对象，取不到时回退到 git 原始提交信息
 * `commit.commit.author`，避免直接读取 `null` 抛错导致整个版本信息无法显示。
 *
 * @param data 接口返回体
 * @returns 解析后的版本信息
 */
function parseVersionInfo(data: any): VersionInfo {
  const commit = data?.commit;
  const sha = (commit?.sha as string | undefined) ?? '';
  if (!sha) {
    throw new Error('GitHub 返回数据异常（缺少提交信息）');
  }

  const githubUser = commit?.author as { login?: string } | null | undefined;
  const rawAuthor = commit?.commit?.author as
    | { name?: string; email?: string; date?: string }
    | null
    | undefined;
  const rawCommitter = commit?.commit?.committer as
    | { date?: string }
    | null
    | undefined;

  const login = githubUser?.login?.trim();
  const rawName = rawAuthor?.name?.trim();
  const rawEmail = rawAuthor?.email?.trim();

  const author
    = AUTHOR_DISPLAY_NAME[login ?? '']
      ?? login
      ?? AUTHOR_DISPLAY_NAME[rawName ?? '']
      ?? rawName
      ?? rawEmail
      ?? MAINTAINER_NAME;

  return {
    id: sha.slice(0, 7),
    author,
    verified: (commit?.commit?.verification?.verified as boolean | undefined) === true,
    time: new Date((rawAuthor?.date ?? rawCommitter?.date) as string),
    message: (commit?.commit?.message as string | undefined) ?? '',
  };
}

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
  return parseVersionInfo(res);
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
  if (!res.ok) {
    throw new Error(`GitHub 接口请求失败（HTTP ${res.status}）`);
  }
  return parseVersionInfo(await res.json());
}

/** 更新检查状态。 */
export interface UpdateStatus {
  /** 是否成功获取到 GitHub 最新提交信息。 */
  ok: boolean;
  /** 当前部署的 commit 短哈希（构建时注入）。 */
  current: string;
  /** GitHub main 最新 commit 短哈希。 */
  latest: string;
  /** 是否存在未部署的更新（当前 != 最新）。 */
  hasUpdate: boolean;
  /** 最新版本详情（检查失败时为空）。 */
  info?: VersionInfo;
  /** 检查失败原因（ok 为 false 时提供）。 */
  error?: string;
}

/**
 * 检查是否有未部署的更新：对比当前构建版本与 GitHub main 最新提交。
 * 若两者 commit 不一致，说明 GitHub 已有新提交但尚未部署。
 *
 * 本函数不会抛错，失败时返回 `ok: false` 并附带 `error`，以便调用方
 * 如实区分「已是最新」与「检查失败」，不再把失败伪装成最新。
 */
export async function checkUpdate(): Promise<UpdateStatus> {
  const current = useRuntimeConfig().public.buildCommit || '';
  try {
    const info = await getLatestVersion();
    return {
      ok: true,
      current,
      latest: info.id,
      hasUpdate: !!current && current !== info.id,
      info,
    };
  } catch (e) {
    return {
      ok: false,
      current,
      latest: '',
      hasUpdate: false,
      error: e instanceof Error ? e.message : '未知错误',
    };
  }
}
