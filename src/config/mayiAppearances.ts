import type { ImageAssetId } from './assets';
import { PLAYER_MOOD_ASSET, type PlayerMood } from './characters';

/** 普通立绘的三套造型。粉色沿用原始文件名。 */
export type MayiAppearance = 'pink' | 'purple' | 'golden';

/** 入场选择的固定顺序。 */
export const MAYI_APPEARANCE_ORDER: readonly MayiAppearance[] = ['pink', 'purple', 'golden'];

/**
 * 普通立绘的姿势。
 * map 只给游园会地图的头肩像用，不属于表情。
 */
export type PlayerPortraitId = PlayerMood | 'map';

/**
 * 已核对磁盘后的显式映射。
 * 粉色用原资源 ID；紫色、金色在扩展名前插入后缀，并单独注册，避免运行时拼路径。
 * Q 版、语音、背景不在这张表里。
 */
const PORTRAIT_ASSET: Record<PlayerPortraitId, Record<MayiAppearance, ImageAssetId>> = {
  normal: { pink: PLAYER_MOOD_ASSET.normal, purple: 'char_normal_purple', golden: 'char_normal_golden' },
  happy: { pink: PLAYER_MOOD_ASSET.happy, purple: 'char_happy_purple', golden: 'char_happy_golden' },
  think: { pink: PLAYER_MOOD_ASSET.think, purple: 'char_think_purple', golden: 'char_think_golden' },
  surprise: { pink: PLAYER_MOOD_ASSET.surprise, purple: 'char_surprise_purple', golden: 'char_surprise_golden' },
  wish: { pink: PLAYER_MOOD_ASSET.wish, purple: 'player_mayi_wish_purple', golden: 'player_mayi_wish_golden' },
  listen: { pink: PLAYER_MOOD_ASSET.listen, purple: 'player_mayi_listen_purple', golden: 'player_mayi_listen_golden' },
  map: { pink: 'player_mayi_map', purple: 'player_mayi_map_purple', golden: 'player_mayi_map_golden' },
};

/** 地图半身图。回退到全身时，地图要改用头肩裁切，不能把全身直接撑开。 */
const MAP_PORTRAIT_ASSETS = new Set<ImageAssetId>(['player_mayi_map', 'player_mayi_map_purple', 'player_mayi_map_golden']);

/**
 * 把存档里的外观字段收成合法值。
 * 缺字段或旧存档一律回到粉色，不因此丢弃其他进度。
 * @param value 任意存档值
 */
export function sanitizeMayiAppearance(value: unknown): MayiAppearance {
  return value === 'purple' || value === 'golden' || value === 'pink' ? value : 'pink';
}

/**
 * 取某一套造型、某一个姿势的资源 ID。
 * @param portrait 表情或地图半身
 * @param appearance 当前造型
 */
export function getPlayerMayiAsset(portrait: PlayerPortraitId, appearance: MayiAppearance): ImageAssetId {
  return PORTRAIT_ASSET[portrait][appearance];
}

/**
 * 解析顺序：同风格对应姿势 → 同风格常态 → 粉色对应姿势 → 粉色常态。
 * 表里只放已经存在的文件，调用方按顺序加载，上一张失败才请求下一张。
 * @param portrait 表情或地图半身
 * @param appearance 当前造型
 */
export function playerPortraitChain(portrait: PlayerPortraitId, appearance: MayiAppearance): ImageAssetId[] {
  const chain: ImageAssetId[] = [];
  const push = (id: ImageAssetId) => {
    if (!chain.includes(id)) chain.push(id);
  };
  push(getPlayerMayiAsset(portrait, appearance));
  if (portrait !== 'normal') push(getPlayerMayiAsset('normal', appearance));
  if (appearance !== 'pink') {
    push(getPlayerMayiAsset(portrait, 'pink'));
    push(getPlayerMayiAsset('normal', 'pink'));
  }
  return chain;
}

/**
 * 这张图是不是地图专用半身。
 * @param id 已经解析出的资源 ID
 */
export function isMapPortraitAsset(id: ImageAssetId): boolean {
  return MAP_PORTRAIT_ASSETS.has(id);
}
