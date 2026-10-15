import type { ImageAssetId } from './assets';
import { canEnterStage, countPreWishStamps, currentStage, type GameProgress } from '../core/progress';
import type { StampId } from './stamps';

/**
 * 全部场景 ID
 * - `gate`：新版入园闸机（身份认证 + 游客须知合并）
 * - `auth` / `notice`：旧版场景 ID，仅为兼容保留，进入即重定向
 */
export type SceneId =
  | 'boot'
  | 'gate'
  | 'auth'
  | 'notice'
  | 'map'
  | 'mint'
  | 'food'
  | 'exam'
  | 'wish'
  | 'cake'
  | 'candle'
  | 'music'
  | 'final'
  | 'ticket'
  | 'egg';

/** 场景元数据 */
export interface SceneDef {
  id: SceneId;
  /** 场景标题（HUD 显示） */
  title: string;
  /** 背景资源 */
  bg: ImageAssetId;
  /** 是否在 HUD 显示“返回地图” */
  showBackToMap: boolean;
  /**
   * 进入条件；返回 false 时拒绝进入并提示 lockedHint
   * @param p 当前进度
   */
  canEnter?: (p: GameProgress) => boolean;
  /** 被拒绝进入时的提示（可根据进度动态生成） */
  lockedHint?: string | ((p: GameProgress) => string);
}

/** 判断四枚印章是否集齐 */
export function hasAllStamps(p: GameProgress): boolean {
  return p.stamps.mint && p.stamps.food && p.stamps.exam && p.stamps.wish;
}

/**
 * 心愿收藏屋开放条件：其余三枚印章齐；已拿到心愿印章的旧存档始终可进（避免死锁）
 * @param p 当前进度
 */
export function canEnterWish(p: GameProgress): boolean {
  return p.stamps.wish || countPreWishStamps(p) >= 3;
}

/** 场馆中文名（用于顺序闯关的锁定提示） */
const STAGE_NAMES: Record<StampId, string> = { mint: '薄荷糖补给站', food: '美食幻想屋', exam: '认证考试', wish: '心愿收藏屋' };

/**
 * 严格顺序闯关的锁定提示：告诉玩家现在该去哪
 * @param p 当前进度
 */
export function strictOrderHint(p: GameProgress): string {
  const cur = currentStage(p);
  if (cur === null) return '四枚印章已集齐，去中央蛋糕房吧！';
  return `这里还没开放，先去「${STAGE_NAMES[cur]}」拿到印章～`;
}

/**
 * 生成严格顺序闯关的场景守卫（已盖章可重玩，否则只有当前站可进）
 * @param id 场馆
 */
const strictGuard = (id: StampId) => ({ canEnter: (p: GameProgress) => canEnterStage(p, id), lockedHint: strictOrderHint });

/**
 * 解析锁定提示文案
 * @param def 场景定义
 * @param p 当前进度
 */
export function resolveLockedHint(def: SceneDef, p: GameProgress): string {
  if (typeof def.lockedHint === 'function') return def.lockedHint(p);
  return def.lockedHint ?? '暂时无法进入。';
}

const CAKE_LOCKED = (p: GameProgress) => {
  const n = 4 - (Number(p.stamps.mint) + Number(p.stamps.food) + Number(p.stamps.exam) + Number(p.stamps.wish));
  return `蛋糕房还锁着呢，还差 ${n} 枚生日印章～`;
};

export const SCENES: Record<SceneId, SceneDef> = {
  boot: { id: 'boot', title: '连接中', bg: 'bg_boot', showBackToMap: false },
  gate: { id: 'gate', title: '入园闸机', bg: 'bg_gate', showBackToMap: false },
  auth: { id: 'auth', title: '入园闸机', bg: 'bg_gate', showBackToMap: false },
  notice: { id: 'notice', title: '入园闸机', bg: 'bg_gate', showBackToMap: false },
  map: { id: 'map', title: '游园会地图', bg: 'bg_map', showBackToMap: false },
  mint: { id: 'mint', title: '薄荷糖补给站', bg: 'bg_mint', showBackToMap: true, ...strictGuard('mint') },
  food: { id: 'food', title: '麻衣的美食幻想屋', bg: 'bg_food', showBackToMap: true, ...strictGuard('food') },
  exam: { id: 'exam', title: '麻衣本人认证考试', bg: 'bg_exam', showBackToMap: true, ...strictGuard('exam') },
  wish: { id: 'wish', title: '心愿收藏屋', bg: 'bg_wish', showBackToMap: true, ...strictGuard('wish') },
  cake: { id: 'cake', title: '生日蛋糕房', bg: 'bg_cake', showBackToMap: true, canEnter: hasAllStamps, lockedHint: CAKE_LOCKED },
  candle: { id: 'candle', title: '吹蜡烛', bg: 'bg_cake', showBackToMap: true, canEnter: hasAllStamps, lockedHint: CAKE_LOCKED },
  music: { id: 'music', title: '音乐礼物', bg: 'bg_music', showBackToMap: true, canEnter: hasAllStamps, lockedHint: '先去蛋糕房吧！' },
  final: { id: 'final', title: '生日特别演出', bg: 'bg_final', showBackToMap: true, canEnter: hasAllStamps, lockedHint: '先去蛋糕房吧！' },
  ticket: { id: 'ticket', title: '闭园纪念票根', bg: 'bg_final', showBackToMap: true, canEnter: hasAllStamps, lockedHint: '先去蛋糕房吧！' },
  egg: { id: 'egg', title: '？？？', bg: 'bg_egg', showBackToMap: true },
};

/** 初始场景 */
export const INITIAL_SCENE: SceneId = 'boot';
