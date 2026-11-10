/**
 * Fanbook 消息相关 API（浏览器端直连）。
 *
 * SDK 只封装了 sendMessage / subscribeMessages 等，未覆盖「获取消息」「消息详情」
 * 「消息表态」，故此处按开放平台文档直连 HTTP 接口：
 * @see https://open.fanbook.mobi/document/manage/doc/
 *
 * 注意点：
 * 1. 雪崩 ID 为 18 位十进制，超过 JS 安全整数，响应必须用 json-bigint 解析；
 *    请求体里要求 Integer 的 ID 字段需以裸数字（BigInt.toString()）拼入 JSON，
 *    否则 Number 会丢精度、BigInt 又无法被 JSON.stringify 序列化。
 * 2. 文档 URL 为 a1.fanbook.cn，SDK 使用 a1.fanbook.mobi，两个域名互为兜底。
 */
import jsonBigint from 'json-bigint';

import useAccountStore from '~~/stores/account';

const bigintParser = jsonBigint({ useNativeBigInt: true });

/** 开放平台 API 域名（按优先级尝试）。 */
const API_HOSTS = [
  'https://a1.fanbook.cn',
  'https://a1.fanbook.mobi',
];

/** 官方支持的表态表情名称。 */
export const REACTION_EMOJIS = [
  '赞', '掌声', '好的', '+1', '爱心', '比心', '完成', '微笑', '可爱', '憨笑',
  '呲牙', '色', '汗颜', '斜眼笑', '暗中观察', '酷', '大哭', '害羞', '飞吻',
  '瞌睡', '尴尬', '666', '碰拳', '握手', '抱拳', '玫瑰', '加油干', '奥力给',
  '厉害哦', '庆祝', '干杯', '惊喜', '灵光一闪', '可怜', '鼓掌', '再见', '恶心',
  '叹气', '快哭了', '耶', '哈欠', '爱意', '倒笑脸', '裂开', '衰', '小恶魔',
  '猪头', '生病', '委屈', '闭嘴', '捂脸哭', '不看', '不听', '嘿哈', '挖鼻孔',
  '不说', '烦躁', '拥抱', '捂嘴笑', '吃瓜', '疑惑', '幽灵', '扶额', '举手',
  '拜托', '拒绝', '生气', '勾', '不', '对', '叉',
  '1', '2', '3', '4', 'A', 'B', 'C', 'D',
] as const;

/** 接口返回的统一包装。 */
export interface BotApiResult<T = unknown> {
  ok?: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  [key: string]: unknown;
}

/** 获取 token，未登录时抛错。 */
function botToken(): string {
  const token = useAccountStore().activeBotToken;
  if (!token) throw new Error('未选择机器人，请先添加机器人');
  return token;
}

/**
 * 手工拼装 JSON 请求体。
 * @param payload 普通字段（值会被 JSON.stringify）
 * @param numericFields 需要以裸数字写入的字段（大整数 ID）
 */
function buildBody(
  payload: Record<string, unknown>,
  numericFields: string[] = [],
): string {
  const fields: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue;
    if (numericFields.includes(key)) {
      // 校验为纯数字，避免拼出非法 JSON
      const raw = String(value);
      if (!/^\d+$/.test(raw)) {
        throw new Error(`${key} 必须是数字，收到：${raw}`);
      }
      fields.push(`${JSON.stringify(key)}:${raw}`);
    } else {
      fields.push(`${JSON.stringify(key)}:${JSON.stringify(value)}`);
    }
  }
  return `{${fields.join(',')}}`;
}

/** 解析响应文本，优先保留大整数精度。 */
function parseResponse(text: string): any {
  try {
    return bigintParser.parse(text);
  } catch {
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, description: text.slice(0, 300) || '响应解析失败' };
    }
  }
}

/**
 * 调用开放平台 Bot API（POST）。
 * @param path 接口路径，如 `v2/getUpdates`
 * @param payload 请求字段
 * @param numericFields 需以裸数字写入的字段名
 */
export async function callBotApi<T = unknown>(
  path: string,
  payload: Record<string, unknown> = {},
  numericFields: string[] = [],
): Promise<BotApiResult<T>> {
  const token = botToken();
  const body = buildBody(payload, numericFields);
  let lastError: unknown;
  for (const host of API_HOSTS) {
    try {
      const res = await fetch(`${host}/api/bot/${token}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = parseResponse(await res.text());
      // HTTP 层错误也转成统一结构，便于页面展示
      if (!res.ok && !data?.description) {
        data.description = `HTTP ${res.status}`;
      }
      return data as BotApiResult<T>;
    } catch (e) {
      lastError = e;
      // 换下一个域名重试
    }
  }
  throw new Error(
    `无法连接 Fanbook 接口：${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

/** 获取消息（简易版 / 长轮询）参数。 */
export interface GetUpdatesOptions {
  /** true 使用 v2/getUpdates（不阻塞，推荐）；false 使用长轮询 getUpdates。 */
  simple?: boolean;
  /** 圈子相关消息，需开启全量开关并加白。 */
  msgType?: string;
  /** 长轮询版：返回的最大条目数（1~100）。 */
  limit?: number;
  /** 长轮询版：等待时长（秒）。 */
  timeout?: number;
  /** 长轮询版：偏移量。 */
  offset?: number;
}

/**
 * 获取批量消息（Update 列表）。
 * 默认使用简易版，不阻塞且支持多实例并发。
 */
export async function getUpdates(
  options: GetUpdatesOptions = {},
): Promise<BotApiResult> {
  const { simple = true, msgType, limit, timeout, offset } = options;
  const payload: Record<string, unknown> = { msg_type: msgType };
  if (!simple) {
    payload.limit = limit;
    payload.timeout = timeout;
    payload.offset = offset;
  }
  return callBotApi(simple ? 'v2/getUpdates' : 'getUpdates', payload);
}

/**
 * 获取单条消息详情。
 * @param chatId 频道 ID（文档说明此接口仅支持 channel_id）
 * @param messageId 消息 ID
 */
export async function getMessage(
  chatId: bigint | string,
  messageId: bigint | string,
): Promise<BotApiResult> {
  return callBotApi(
    'getMessage',
    { chat_id: chatId, message_id: messageId },
    ['chat_id', 'message_id'],
  );
}

/** 表态参数。 */
export interface SendReactionOptions {
  /** 表态用户 ID（通常为机器人自身 ID，可用 getMe 获取）。 */
  userId: bigint | string;
  /** 被表态的消息 ID。 */
  messageId: bigint | string;
  /** 消息所在频道 ID。 */
  channelId: bigint | string;
  /** 官方表情名称。 */
  emoji?: string;
  /** 自定义表情（图片地址）。 */
  avatar?: string;
  /** 是否对 emoji 做 URL 编码（文档注明需要 url encode）。 */
  encodeEmoji?: boolean;
}

/**
 * 对某条消息进行表态。
 */
export async function sendReaction(
  options: SendReactionOptions,
): Promise<BotApiResult> {
  const {
    userId,
    messageId,
    channelId,
    emoji,
    avatar,
    encodeEmoji = false,
  } = options;
  const payload: Record<string, unknown> = {
    user_id: String(userId),
    message_id: String(messageId),
    channel_id: String(channelId),
  };
  if (emoji) payload.emoji = encodeEmoji ? encodeURIComponent(emoji) : emoji;
  if (avatar) payload.avatar = avatar;
  return callBotApi('sendReaction', payload);
}

/**
 * 获取机器人自身的用户 ID（表态时的 user_id 常用）。
 */
export async function getBotUserId(): Promise<string> {
  const token = botToken();
  let lastError: unknown;
  for (const host of API_HOSTS) {
    try {
      const res = await fetch(`${host}/api/bot/${token}/getMe`);
      const data = parseResponse(await res.text());
      if (data?.result?.id !== undefined) return String(data.result.id);
      if (data?.description) throw new Error(String(data.description));
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    `获取机器人 ID 失败：${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

/** 把任意值安全地转成可展示字符串（兼容 BigInt / 对象）。 */
export function toDisplay(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'bigint' || typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, (_k, v) =>
      typeof v === 'bigint' ? String(v) : v,
    );
  } catch {
    return String(value);
  }
}
