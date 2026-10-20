import type { ImageAssetId } from './assets';

/**
 * 游戏里的两个角色。
 * player_mayi 是正在游玩的麻衣，只做视觉反应，不说预录台词。
 * guide_mayi 是游园会里的 Q 版向导，主持、提示和全部角色语音都属于她。
 */
export type CharacterRole = 'player_mayi' | 'guide_mayi';

/** 字幕说话者。全游戏保持这一句，不再写成「麻衣」。 */
export const GUIDE_SPEAKER_LABEL = 'Q版麻衣';

/** 缺图或开发预览时的身份标签 */
export const PLAYER_ROLE_LABEL = '玩家麻衣';
export const GUIDE_ROLE_LABEL = 'Q版向导';

/** 玩家普通立绘的表情。只表示画面，不代表她正在说话。 */
export type PlayerMood = 'normal' | 'happy' | 'think' | 'surprise' | 'wish' | 'listen';

/**
 * Q 版向导的动作。
 * peek 复用惊讶图，nod 复用开心图。
 * think / tease / hotpot / host / farewell / gate / dish 指向新图，缺图时退回旧 Q 版。
 */
export type GuideAction =
  | 'idle'
  | 'point'
  | 'happy'
  | 'surprise'
  | 'peek'
  | 'pray'
  | 'cheer'
  | 'nod'
  | 'think'
  | 'tease'
  | 'hotpot'
  | 'host'
  | 'farewell'
  | 'gate'
  | 'dish';

/** 玩家表情 → 资源 ID。wish / listen 缺图时退回旧全身。 */
export const PLAYER_MOOD_ASSET: Record<PlayerMood, ImageAssetId> = {
  normal: 'char_normal',
  happy: 'char_happy',
  think: 'char_think',
  surprise: 'char_surprise',
  wish: 'player_mayi_wish',
  listen: 'player_mayi_listen',
};

/** 新姿势加载失败时使用的旧图。仍然是同一身份，不会换成另一个角色。 */
export const PLAYER_MOOD_FALLBACK: Partial<Record<PlayerMood, ImageAssetId>> = {
  wish: 'char_normal',
  listen: 'char_happy',
};

/** 向导动作 → 资源 ID */
export const GUIDE_ACTION_ASSET: Record<GuideAction, ImageAssetId> = {
  idle: 'chibi_idle',
  point: 'chibi_point',
  happy: 'chibi_happy',
  surprise: 'chibi_surprise',
  peek: 'chibi_surprise',
  pray: 'chibi_pray',
  cheer: 'chibi_cheer',
  nod: 'chibi_happy',
  think: 'guide_mayi_think',
  tease: 'guide_mayi_tease',
  hotpot: 'guide_mayi_hotpot',
  host: 'guide_mayi_host',
  farewell: 'guide_mayi_farewell',
  gate: 'guide_mayi_gate',
  dish: 'guide_mayi_dish',
};

/** 新 Q 版图缺失时退回的旧动作图 */
export const GUIDE_ACTION_FALLBACK: Partial<Record<GuideAction, ImageAssetId>> = {
  think: 'chibi_pray',
  tease: 'chibi_point',
  hotpot: 'chibi_cheer',
  host: 'chibi_cheer',
  farewell: 'chibi_happy',
  gate: 'chibi_idle',
  dish: 'chibi_cheer',
};
