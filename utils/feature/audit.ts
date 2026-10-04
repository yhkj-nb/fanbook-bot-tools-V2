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

/** 权限中文文案（键为 Permissions 枚举成员名）。 */
export const PermissionText: Record<Permissions, string> = {
  [Permissions.CREATE_INSTANT_INVITE]: '创建邀请',
  [Permissions.KICK_MEMBERS]: '移除和拉黑成员',
  [Permissions.BAN_MEMBERS]: '封禁成员',
  [Permissions.ADMINISTRATOR]: '超级管理员',
  [Permissions.MANAGE_CHANNELS]: '管理频道',
  [Permissions.MANAGE_GUILD]: '管理服务器',
  [Permissions.ADD_REACTIONS]: '消息表态',
  [Permissions.VIEW_AUDIT_LOG]: '查看审计日志',
  [Permissions.PRIORITY_SPEAKER]: '优先发言',
  [Permissions.STREAM]: '发起直播',
  [Permissions.VIEW_CHANNEL]: '查看频道',
  [Permissions.SEND_MESSAGES]: '发言',
  [Permissions.SEND_TTS_MESSAGES]: '发送 TTS 消息',
  [Permissions.MANAGE_MESSAGES]: '管理消息',
  [Permissions.EMBED_LINKS]: '嵌入链接',
  [Permissions.ATTACH_FILES]: '发送附件',
  [Permissions.READ_MESSAGE_HISTORY]: '查看历史消息',
  [Permissions.MENTION_EVERYONE]: '@ 所有人和身份组',
  [Permissions.USE_EXTERNAL_EMOJIS]: '使用外部表情',
  [Permissions.VIEW_GUILD_INSIGHTS]: '查看服务器洞察',
  [Permissions.CONNECT]: '进入语音频道',
  [Permissions.SPEAK]: '语音频道开麦',
  [Permissions.MUTE_MEMBERS]: '控场',
  [Permissions.DEAFEN_MEMBERS]: '语音禁听',
  [Permissions.MOVE_MEMBERS]: '语音频道踢人',
  [Permissions.USE_VAD]: '使用语音活动检测',
  [Permissions.CHANGE_NICKNAME]: '修改昵称',
  [Permissions.MANAGE_NICKNAMES]: '管理昵称',
  [Permissions.MANAGE_ROLES]: '管理身份组',
  [Permissions.MANAGE_WEBHOOKS]: '管理 Webhook',
  [Permissions.MANAGE_EMOJIS_AND_STICKERS]: '管理表情',
  [Permissions.MANAGE_CIRCLE]: '管理圈子',
  [Permissions.REQUEST_TO_SPEAK]: '申请发言',
  [Permissions.MANAGE_THREADS]: '管理话题',
  [Permissions.USE_PUBLIC_THREADS]: '使用公开话题',
  [Permissions.USE_PRIVATE_THREADS]: '使用私密话题',
  [Permissions.USE_EXTERNAL_STICKERS]: '使用外部贴纸',
};

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

  const perm = BigInt(role.permissions);
  const permissions: string[] = [];
  for (const key of Object.keys(PermissionText) as (keyof typeof PermissionText)[]) {
    const value = Permissions[key];
    if (value && (perm & BigInt(value))) {
      permissions.push(PermissionText[key]);
    }
  }

  let level = CheckResultLevel.SAFE;
  const cause: string[] = [];
  const low = permissionLevel.low.filter((v) => perm & BigInt(v));
  const high = permissionLevel.high.filter((v) => perm & BigInt(v));
  if (low.length) level = CheckResultLevel.LOW;
  if (high.length) level = CheckResultLevel.HIGH;
  cause.push(...low.map((v) => `拥有权限"${PermissionText[v]}"`));
  cause.push(...high.map((v) => `拥有高危权限"${PermissionText[v]}"`));

  return { name: role.name, permissions, level, cause };
}
