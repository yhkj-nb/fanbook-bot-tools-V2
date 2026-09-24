import { Bot } from '@starlight-dev-team/fanbook-api-sdk';

import jsonBigint from 'json-bigint';

import useAccountStore from '~~/stores/account';

/**
 * 与 SDK 一致的 JSON 解析器（保留大整数精度）。
 * 雪崩 ID 是 18 位十进制，超过 JS 安全整数 2^53，浏览器原生 JSON.parse 会丢失精度
 * （如 798431668825604096 -> 798431668825604100），导致拿到的用户长 ID 错误、
 * 进而 getGuildUserCredit 等接口查不到用户。故搜索结果必须用 json-bigint 解析。
 */
const bigintParser = jsonBigint({ useNativeBigInt: true });

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
  /**
   * 手动拼 JSON 发请求。
   * 关键：Fanbook 要求 guild_id 为 JSON 数字（传字符串会返回 "Body contents error"），
   * 而雪崩 ID 超过 2^53，用 Number 会丢精度、BigInt 又无法被 JSON.stringify 直接序列化。
   * 故把 guild_id 以 BigInt.toString()（精确十进制）作为裸数字拼入，其余字段正常 JSON 序列化。
   */
  const post = async (path: string, extra: Record<string, unknown>) => {
    const fields = [`"guild_id":${guild.toString()}`];
    for (const [k, v] of Object.entries(extra)) {
      fields.push(`${JSON.stringify(k)}:${JSON.stringify(v)}`);
    }
    const body = `{${fields.join(',')}}`;
    try {
      const res = await fetch(`${base}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const text = await res.text();
      try {
        return bigintParser.parse(text);
      } catch {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      }
    } catch {
      return null;
    }
  };

  const [byName, byQuery] = await Promise.all([
    post('searchGuildMemberByName', { username: [query] }),
    post('searchGuildMember', { query }),
  ]);

  // 兼容两种返回结构：{ result: [{ user: {...} }] } 或 { result: [{...}] }（user 本身）
  const map = new Map<string, SearchedUser>();
  for (const src of [byName, byQuery]) {
    const result = src?.result;
    if (!Array.isArray(result)) continue;
    for (const item of result) {
      const u = item?.user ?? item;
      if (!u?.id) continue;
      map.set(String(u.id), {
        id: String(u.id),
        name: u.first_name || u.username || '未知用户',
        username: u.username || '',
        avatar: u.avatar || '',
      });
    }
  }
  return [...map.values()];
}
