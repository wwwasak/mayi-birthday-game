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
 * 单栋建筑的视觉微调。点击热区仍是 `MAP_BUILDINGS`。
 * 有正式 PNG 时按 `artWidth` 和图片宽高比显示，底边锚在原矩形底边。
 * 换图时只改这一项，不必改组件。
 */
export interface BuildingTune {
  /** 显示宽度（逻辑像素）。高度 = 宽度 / artAspect，不拉伸 */
  artWidth: number;
  /** 图片像素宽 / 高 */
  artAspect: number;
  /** 相对原矩形底边中点的水平、垂直偏移。垂直正值表示再往下沉一点 */
  offsetX: number;
  offsetY: number;
}

/** 已导入正式图的建筑。其余场馆留空，继续用原矩形里的 CSS 房屋 */
export const BUILDING_TUNE: Partial<Record<BuildingId, BuildingTune>> = {
  mint: { artWidth: 560, artAspect: 1632 / 964, offsetX: -36, offsetY: 10, },
};

/**
 * 建筑视觉框。无正式图时等于原点击矩形。
 * @param id 建筑
 * @param hasArt 该建筑 PNG 是否已加载成功
 */
export function buildingFrame(id: BuildingId, hasArt: boolean): Rect {
  const hit = MAP_BUILDINGS[id];
  const tune = hasArt ? BUILDING_TUNE[id] : undefined;
  if (!tune) return hit;
  const w = tune.artWidth;
  const h = Math.round(w / tune.artAspect);
  const anchorX = hit.x + hit.w / 2 + tune.offsetX;
  const anchorY = hit.y + hit.h + tune.offsetY;
  return { x: Math.round(anchorX - w / 2), y: Math.round(anchorY - h), w, h };
}

/**
 * Q 版麻衣站在建筑朝向园区中心的一侧，脚底贴着视觉框底边。
 * 若会挡住蛋糕房点击区，则向外让开。
 * @param id 建筑
 * @param hasArt 该建筑是否正在显示正式图
 */
export function chibiSpot(id: BuildingId, hasArt = false): { x: number; y: number } {
  const frame = buildingFrame(id, hasArt);
  const hit = MAP_BUILDINGS[id];
  const onLeft = hit.x + hit.w / 2 < 960;
  let x = onLeft ? frame.x + frame.w - 48 : frame.x - CHIBI_SIZE.w + 48;
  const y = frame.y + frame.h - CHIBI_SIZE.h + 6;
  const cake = MAP_BUILDINGS.cake;
  const hitsCake = id !== 'cake' && x < cake.x + cake.w && x + CHIBI_SIZE.w > cake.x && y < cake.y + cake.h && y + CHIBI_SIZE.h > cake.y;
  if (hitsCake) x = onLeft ? cake.x - CHIBI_SIZE.w - 10 : cake.x + cake.w + 10;
  return { x: Math.round(x), y: Math.round(y) };
}
