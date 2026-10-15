import type { StampId } from './stamps';

/** 矩形区域（1920×1080 逻辑坐标） */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 地图上的建筑 ID：四个场馆 + 中央蛋糕房 */
export type BuildingId = StampId | 'cake';

/** 建筑布局：位置固定，未来替换为正式建筑图时保持同一外框即可 */
export const MAP_BUILDINGS: Record<BuildingId, Rect> = {
  mint: { x: 150, y: 180, w: 440, h: 260 },
  food: { x: 1330, y: 180, w: 440, h: 260 },
  exam: { x: 150, y: 690, w: 440, h: 260 },
  wish: { x: 1330, y: 690, w: 440, h: 260 },
  cake: { x: 660, y: 400, w: 600, h: 320 },
};

/** 推荐游玩顺序（Q 版麻衣的引导顺序） */
export const RECOMMENDED_ORDER: StampId[] = ['mint', 'food', 'exam', 'wish'];

/** 印章托盘（蛋糕房正下方居中，不与场馆按钮重叠） */
export const STAMP_TRAY = { x: 772, y: 850, gap: 100, disc: 76 };

/**
 * 托盘上第 i 枚印章的中心坐标
 * @param i 印章序号 0~3
 */
export function trayCenter(i: number): { x: number; y: number } {
  return { x: STAMP_TRAY.x + STAMP_TRAY.disc / 2 + i * STAMP_TRAY.gap, y: STAMP_TRAY.y + STAMP_TRAY.disc / 2 };
}

/** 蛋糕房门上四个印章槽的直径 */
export const CAKE_SLOT_SIZE = 52;

/**
 * 蛋糕房门上第 i 个印章槽的中心坐标
 * @param i 槽序号 0~3
 */
export function cakeSlotCenter(i: number): { x: number; y: number } {
  const c = MAP_BUILDINGS.cake;
  return { x: c.x + c.w / 2 + (i - 1.5) * 68, y: c.y + c.h - 72 };
}

/** Q 版麻衣的尺寸（用于定位） */
const CHIBI_SIZE = { w: 120, h: 150 };

/**
 * Q 版麻衣站在某栋建筑门口的位置（左侧建筑站右边，右侧建筑站左边）
 * @param id 建筑 ID
 */
export function chibiSpot(id: BuildingId): { x: number; y: number } {
  const r = MAP_BUILDINGS[id];
  const onLeft = r.x + r.w / 2 < 960;
  if (id === 'cake') return { x: r.x + r.w + 12, y: r.y + r.h - CHIBI_SIZE.h - 10 };
  return onLeft ? { x: r.x + r.w + 12, y: r.y + r.h - CHIBI_SIZE.h - 10 } : { x: r.x - CHIBI_SIZE.w - 12, y: r.y + r.h - CHIBI_SIZE.h - 10 };
}
