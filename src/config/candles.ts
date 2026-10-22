import type { StampId } from './stamps';

/**
 * 蛋糕上的蜡烛。
 * 前四根对应四枚印章；`mayi` 是正中的金色蜡烛，代表麻衣自己的心愿，不需要额外闯关。
 */
export type CandleId = StampId | 'mayi';

/** 一根蜡烛的显示规格 */
export interface CandleDef {
  id: CandleId;
  /** 短名称，显示在蜡烛下方 */
  name: string;
  /** 蜡身条纹色 */
  color: string;
  /** 是否为中央金色蜡烛 */
  gold: boolean;
}

/** 全部蜡烛。身份只认 id，不认数组下标 */
export const CANDLES: Record<CandleId, CandleDef> = {
  mint: { id: 'mint', name: '薄荷糖', color: '#3fd1a8', gold: false },
  food: { id: 'food', name: '美食', color: '#ff9a5c', gold: false },
  exam: { id: 'exam', name: '认证考试', color: '#7c8cff', gold: false },
  wish: { id: 'wish', name: '心愿屋', color: '#ff8fc2', gold: false },
  mayi: { id: 'mayi', name: '麻衣的心愿', color: '#f3c54b', gold: true },
};

/** 存档与判定用的固定名单 */
export const CANDLE_IDS: readonly CandleId[] = ['mint', 'food', 'exam', 'wish', 'mayi'];

/**
 * 从左到右的摆放。金色在正中，其余四根左右对称。
 * 显示尺寸：蜡身 36×120，槽位宽 88，间距 16，蛋糕底 560×220。
 */
export const CANDLE_LAYOUT: readonly CandleId[] = ['mint', 'food', 'mayi', 'exam', 'wish'];

/**
 * 烛芯在蛋糕图里的位置，相对整张图（含透明边），不是相对屏幕。
 * 数值来自 cake.png 里五根已绘蜡烛的尖端：左起绿、橙、金、蓝、粉。
 */
export const CANDLE_WICK: Record<CandleId, { x: number; y: number }> = {
  mint: { x: 0.3233, y: 0.0216 },
  food: { x: 0.4113, y: 0.0216 },
  mayi: { x: 0.4998, y: 0 },
  exam: { x: 0.5877, y: 0.0216 },
  wish: { x: 0.6762, y: 0.0216 },
};

/**
 * 吹灭波次。每次最多两根，按 2＋2＋1，金色最后。
 * 先灭最外侧两根，再灭金色旁边两根，最后灭正中。
 */
export const BLOW_WAVES: readonly (readonly CandleId[])[] = [
  ['mint', 'wish'],
  ['food', 'exam'],
  ['mayi'],
];

/**
 * 判断一个值是不是蜡烛 ID
 * @param value 任意值
 */
export function isCandleId(value: unknown): value is CandleId {
  return typeof value === 'string' && (CANDLE_IDS as readonly string[]).includes(value);
}

/**
 * 五根是否都已点亮
 * @param candles 点亮表
 */
export function allCandlesLit(candles: Record<CandleId, boolean>): boolean {
  return CANDLE_IDS.every((id) => candles[id]);
}

/**
 * 下一波要吹灭的蜡烛。已灭的不会重复计入，因此每次最多两根。
 * @param blown 已经熄灭的 ID
 */
export function nextBlowWave(blown: readonly CandleId[]): CandleId[] {
  const done = new Set(blown);
  for (const wave of BLOW_WAVES) {
    const left = wave.filter((id) => !done.has(id));
    if (left.length > 0) return [...left];
  }
  return [];
}

/**
 * 把存档里的熄灭列表整理成合法波次前缀。
 * 不允许只灭金色、或灭了内圈却留着外圈，避免旧数据把顺序打乱。
 * @param raw 存档中的数组
 * @param fullyBlown 是否已经整段吹完
 */
export function sanitizeBlownCandles(raw: unknown, fullyBlown: boolean): CandleId[] {
  if (fullyBlown) return [...CANDLE_IDS];
  const got = new Set(Array.isArray(raw) ? raw.filter(isCandleId) : []);
  const out: CandleId[] = [];
  for (const wave of BLOW_WAVES) {
    if (!wave.every((id) => got.has(id))) break;
    out.push(...wave);
  }
  return out;
}
