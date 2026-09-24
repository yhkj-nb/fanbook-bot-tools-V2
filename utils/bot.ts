import { Bot } from '@starlight-dev-team/fanbook-api-sdk';

import useAccountStore from '~~/stores/account';

let currentBot: Bot | undefined;
export function getCurrentBot(): Bot {
  const token = useAccountStore().activeBotToken;
  if (!currentBot) {
    if (!token) { // 无机器人
      console.warn('No active bot given');
      return new Bot('0'); // 兜底方案
    }
    currentBot = new Bot(token);
  }
  return currentBot;
}

/** 机器人 API 错误码信息。 */
export enum BotErrorCode {
  '参数错误，请检查消息是否有特殊内容' = 1001,
  '机器人没有在该服务器，请先添加' = 1008,
  '服务器不存在' = 1011,
  '没有权限' = 1012,
  '频道不存在' = 1021,
  '用户已关闭私信' = 1037,
  '机器人已被用户屏蔽' = 1038,
  '机器人不在发消息 API 白名单中' = 10002,
  '用户荣誉卡槽已满' = 2010,
};

/** 搜索到的用户简要信息。 */
export interface SearchedUser {
  /** 完整用户 ID（雪崩 ID）。 */
  id: string;
  /** 显示名（first_name）。 */
  name: string;
  /** 用户名（username）。 */
  username: string;
  /** 头像地址。 */
  avatar: string;
}

/**
 * 按用户名 / 昵称搜索服务器成员。
 * 同时调用 Fanbook 的 searchGuildMemberByName（按用户名数组）与
 * searchGuildMember（按关键词），合并去重后以 {id,name,username,avatar} 返回。
 * 与「FB 用户搜索工具」后端逻辑一致，但改为浏览器端直连（使用当前机器人 token）。
 */
export async function searchGuildMembers(
  guild: bigint,
  query: string,
): Promise<SearchedUser[]> {
  const token = useAccountStore().activeBotToken;
  if (!token) return [];
  const base = `https://a1.fanbook.cn/api/bot/${token}`;
  const post = async (path: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`${base}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return null;
    }
  };

  const [byName, byQuery] = await Promise.all([
    post('searchGuildMemberByName', { guild_id: guild, username: [query] }),
    post('searchGuildMember', { guild_id: guild, query }),
  ]);

  const map = new Map<string, SearchedUser>();
  for (const src of [byName, byQuery]) {
    if (src?.ok && Array.isArray(src.result)) {
      for (const item of src.result) {
        const u = item?.user;
        if (!u?.id) continue;
        map.set(String(u.id), {
          id: String(u.id),
          name: u.first_name || u.username || '未知用户',
          username: u.username || '',
          avatar: u.avatar || '',
        });
      }
    }
  }
  return [...map.values()];
}
