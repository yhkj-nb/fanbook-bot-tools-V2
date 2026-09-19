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
  return {
    id: (res.commit.sha as string).slice(0, 7),
    author: res.commit.author.login as string,
    verified: res.commit.commit.verification.verified === true,
    time: new Date(res.commit.commit.author.date as string),
    message: res.commit.commit.message,
  };
}
