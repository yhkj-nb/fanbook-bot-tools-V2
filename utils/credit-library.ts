/**
 * 勋章库（浏览器本地缓存）。
 *
 * 把配置过 / 从服务器拉取到的完整勋章配置缓存在 localStorage，供「勋章列表」页
 * 集中管理与快捷复用。数据只存在当前浏览器，不会上传，也不依赖任何后端接口。
 */
import type { GuildCredit } from '@starlight-dev-team/fanbook-api-sdk/dist/types';

/** 缓存中的一条勋章记录。 */
export interface CachedCredit {
  /** 勋章自定义 ID（唯一键）。 */
  id: string;
  /** 完整勋章配置，可直接传给 setGuildUserCredit。 */
  credit: GuildCredit;
  /** 更新时间（毫秒时间戳）。 */
  updatedAt: number;
}

/** localStorage 键名。 */
const STORAGE_KEY = 'fanbook-tools:credit-library:v1';
/** 缓存上限，避免无限膨胀。 */
const MAX_ITEMS = 200;

/** 读取原始缓存，自动过滤损坏数据。 */
function read(): CachedCredit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CachedCredit =>
        !!item && typeof item.id === 'string' && !!item.credit,
    );
  } catch (e) {
    console.error('[credit-library] 读取缓存失败', e);
    return [];
  }
}

/** 写回缓存。 */
function write(list: CachedCredit[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_ITEMS)),
    );
  } catch (e) {
    console.error('[credit-library] 写入缓存失败', e);
  }
}

/**
 * 把一条勋章配置规范化为可缓存的深拷贝，避免外部后续修改污染缓存。
 */
function normalize(credit: GuildCredit): GuildCredit {
  const source = credit as GuildCredit;
  return {
    id: source.id,
    authority: {
      icon: source.authority?.icon ?? '',
      name: source.authority?.name ?? '',
    },
    title: {
      icon: source.title?.icon ?? '',
    },
    slots: (source.slots ?? []).map(row =>
      (row ?? []).map(slot => ({
        image: (slot as any)?.image ?? '',
        value: (slot as any)?.value ?? '',
      })),
    ),
  } as GuildCredit;
}

/**
 * 列出全部缓存勋章，按更新时间倒序。
 */
export function listCredits(): CachedCredit[] {
  return read().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/**
 * 保存（新增或覆盖）一条勋章配置。
 * @param credit 勋章配置
 * @returns 是否写入成功
 */
export function saveCredit(credit: GuildCredit): boolean {
  if (!credit?.id) return false;
  const item: CachedCredit = {
    id: credit.id,
    credit: normalize(credit),
    updatedAt: Date.now(),
  };
  const list = read().filter(x => x.id !== item.id);
  list.unshift(item);
  write(list);
  return true;
}

/**
 * 批量保存勋章配置。
 * @returns 实际写入的条数
 */
export function saveCredits(credits: GuildCredit[]): number {
  let count = 0;
  const now = Date.now();
  const list = read();
  const index = new Map(list.map((item, i) => [item.id, i]));
  for (const credit of credits) {
    if (!credit?.id) continue;
    const item: CachedCredit = {
      id: credit.id,
      credit: normalize(credit),
      updatedAt: now,
    };
    const at = index.get(item.id);
    if (at === undefined) {
      index.set(item.id, list.length);
      list.push(item);
    } else {
      list[at] = item;
    }
    count++;
  }
  // 按时间倒序后截断
  list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  write(list);
  return count;
}

/**
 * 读取单条缓存。
 */
export function getCredit(id: string): CachedCredit | undefined {
  return read().find(item => item.id === id);
}

/**
 * 覆盖更新一条缓存（用于列表页内联编辑）。
 */
export function updateCredit(id: string, credit: GuildCredit): boolean {
  const list = read();
  const at = list.findIndex(item => item.id === id);
  if (at < 0) return false;
  const next: CachedCredit = {
    id: credit.id,
    credit: normalize(credit),
    updatedAt: Date.now(),
  };
  // ID 可能被编辑掉，先移除同 ID 的其它项再写回
  const rest = list.filter((item, i) => i !== at && item.id !== next.id);
  rest.unshift(next);
  write(rest);
  return true;
}

/**
 * 从缓存中移除一条（仅删除本地记录，不影响服务器上的勋章）。
 */
export function removeCredit(id: string): void {
  write(read().filter(item => item.id !== id));
}

/**
 * 清空全部缓存。
 */
export function clearCredits(): void {
  write([]);
}
