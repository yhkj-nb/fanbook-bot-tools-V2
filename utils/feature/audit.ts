/**
 * 服务器风险检测（运营风险审查）。
 *
 * 参考 DevOpen-Club/bot-tools 的 utils/feature/audit.ts，
 * 适配本项目使用的 @starlight-dev-team/fanbook-api-sdk
 * （Permissions 枚举 + GuildRole 类型）。
 *
 * 核心思路：遍历服务器全部身份组，按身份组拥有的权限位判断风险等级，
 * 跳过 @everyone 与固定/隐藏角色。
 */

import { Permissions } from '@starlight-dev-team/fanbook-api-sdk/dist/interface';
import type { GuildRole } from '@starlight-dev-team/fanbook-api-sdk/dist/types';

/**
 * 权限位 → 中文文案（静态数组）。
 *
 * 注意：不能遍历 TS 数字枚举的 Object.keys 来做位运算——
 * 数字枚举带有反向映射（Permissions['1'] === 'CREATE_INSTANT_INVITE'），
 * 拿到的是字符串名，再 BigInt(字符串名) 会抛
 * "Cannot convert CREATE_INSTANT_INVITE to a BigInt"。
 * 故这里用静态数组保存 {bit, text}，遍历时直接按位与判断。
 */
export const PERMISSION_DEFS: { bit: Permissions; text: string }[] = [
  { bit: Permissions.CREATE_INSTANT_INVITE, text: '创建邀请' },
  { bit: Permissions.KICK_MEMBERS, text: '移除和拉黑成员' },
  { bit: Permissions.BAN_MEMBERS, text: '封禁成员' },
  { bit: Permissions.ADMINISTRATOR, text: '超级管理员' },
  { bit: Permissions.MANAGE_CHANNELS, text: '管理频道' },
  { bit: Permissions.MANAGE_GUILD, text: '管理服务器' },
  { bit: Permissions.ADD_REACTIONS, text: '消息表态' },
  { bit: Permissions.VIEW_AUDIT_LOG, text: '查看审计日志' },
  { bit: Permissions.PRIORITY_SPEAKER, text: '优先发言' },
  { bit: Permissions.STREAM, text: '发起直播' },
  { bit: Permissions.VIEW_CHANNEL, text: '查看频道' },
  { bit: Permissions.SEND_MESSAGES, text: '发言' },
  { bit: Permissions.SEND_TTS_MESSAGES, text: '发送 TTS 消息' },
  { bit: Permissions.MANAGE_MESSAGES, text: '管理消息' },
  { bit: Permissions.EMBED_LINKS, text: '嵌入链接' },
  { bit: Permissions.ATTACH_FILES, text: '发送附件' },
  { bit: Permissions.READ_MESSAGE_HISTORY, text: '查看历史消息' },
  { bit: Permissions.MENTION_EVERYONE, text: '@ 所有人和身份组' },
  { bit: Permissions.USE_EXTERNAL_EMOJIS, text: '使用外部表情' },
  { bit: Permissions.VIEW_GUILD_INSIGHTS, text: '查看服务器洞察' },
  { bit: Permissions.CONNECT, text: '进入语音频道' },
  { bit: Permissions.SPEAK, text: '语音频道开麦' },
  { bit: Permissions.MUTE_MEMBERS, text: '控场' },
  { bit: Permissions.DEAFEN_MEMBERS, text: '语音禁听' },
  { bit: Permissions.MOVE_MEMBERS, text: '语音频道踢人' },
  { bit: Permissions.USE_VAD, text: '使用语音活动检测' },
  { bit: Permissions.CHANGE_NICKNAME, text: '修改昵称' },
  { bit: Permissions.MANAGE_NICKNAMES, text: '管理昵称' },
  { bit: Permissions.MANAGE_ROLES, text: '管理身份组' },
  { bit: Permissions.MANAGE_WEBHOOKS, text: '管理 Webhook' },
  { bit: Permissions.MANAGE_EMOJIS_AND_STICKERS, text: '管理表情' },
  { bit: Permissions.MANAGE_CIRCLE, text: '管理圈子' },
  { bit: Permissions.REQUEST_TO_SPEAK, text: '申请发言' },
  { bit: Permissions.MANAGE_THREADS, text: '管理话题' },
  { bit: Permissions.USE_PUBLIC_THREADS, text: '使用公开话题' },
  { bit: Permissions.USE_PRIVATE_THREADS, text: '使用私密话题' },
  { bit: Permissions.USE_EXTERNAL_STICKERS, text: '使用外部贴纸' },
];

/** 权限中文文案（按位查表，供风险等级原因展示）。 */
export const PermissionText: Record<Permissions, string> = Object.fromEntries(
  PERMISSION_DEFS.map((d) => [d.bit, d.text]),
) as Record<Permissions, string>;

/** 检测点风险等级。 */
export enum CheckResultLevel {
  SAFE,
  LOW,
  HIGH,
}

/** 检测结果。 */
export interface CheckResult {
  /** 检测对象名称。 */
  name: string;
  /** 风险等级。 */
  level: CheckResultLevel;
  /** 原因。 */
  cause: string[];
}

/** 身份组权限检测结果。 */
export interface CheckRolePermissionsResult extends CheckResult {
  /** 身份组拥有的权限。 */
  permissions: string[];
}

/** 高危 / 低风险权限。 */
const permissionLevel = {
  high: [
    Permissions.ADMINISTRATOR,
    Permissions.KICK_MEMBERS,
  ],
  low: [
    Permissions.MANAGE_GUILD,
    Permissions.MANAGE_MESSAGES,
    Permissions.MANAGE_ROLES,
    Permissions.MANAGE_CIRCLE,
  ],
};

/**
 * 检测身份组权限风险。
 * @param role 身份组
 * @returns 检测结果（@everyone 与固定角色直接跳过返回 undefined）
 */
export function checkRolePermissions(role: GuildRole): CheckRolePermissionsResult | undefined {
  // 跳过 @everyone（position 0）与固定 / 隐藏角色（position 以 99 开头）
  if (role.position === 0) return;
  if (String(role.position).startsWith('99')) return;

  // 权限可能是 number / string / bigint，统一转 BigInt 做位运算（避免 32 位精度截断）
  const perm = BigInt(role.permissions as any);

  const permissions: string[] = [];
  for (const { bit, text } of PERMISSION_DEFS) {
    if ((perm & BigInt(bit)) !== 0n) {
      permissions.push(text);
    }
  }

  let level = CheckResultLevel.SAFE;
  const cause: string[] = [];
  const low = permissionLevel.low.filter((v) => (perm & BigInt(v)) !== 0n);
  const high = permissionLevel.high.filter((v) => (perm & BigInt(v)) !== 0n);
  if (low.length) level = CheckResultLevel.LOW;
  if (high.length) level = CheckResultLevel.HIGH;
  cause.push(...low.map((v) => `拥有权限"${PermissionText[v]}"`));
  cause.push(...high.map((v) => `拥有高危权限"${PermissionText[v]}"`));

  return { name: role.name, permissions, level, cause };
}
