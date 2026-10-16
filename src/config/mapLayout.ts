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
  const frame = buildingFrame('cake', true);
  return { x: frame.x + frame.w / 2 + (i - 1.5) * 68, y: frame.y + frame.h - 96 };
}

/** Q 版麻衣的尺寸（用于定位） */
const CHIBI_W = 120;
const CHIBI_H = 150;

/**
 * 单栋建筑的视觉参数。只改这里即可微调大小和位置。
 * 底边中点锚在草地上；宽高比来自 PNG，不会被拉变形。
 */
export interface BuildingTune {
  /** 显示宽度（逻辑像素）。高度 = 宽度 / artAspect */
  artWidth: number;
  /** 图片像素宽 / 高 */
  artAspect: number;
  /** 底边中点 */
  anchorX: number;
  anchorY: number;
  /** Q 版左上角相对底边中点的偏移 */
  characterDx: number;
  characterDy: number;
  /** 名称标签相对建筑底边再往下（像素） */
  labelOffset: number;
}

/**
 * 五栋正式建筑。四角约比原先 560 宽放大 25%～30%，蛋糕房更大。
 * 锚点按地图草地和道路留白摆放，允许轻微交叠，近景建筑叠在上面。
 */
export const BUILDING_TUNE: Record<BuildingId, BuildingTune> = {
  mint: { artWidth: 680, artAspect: 1632 / 964, anchorX: 350, anchorY: 540, characterDx: -330, characterDy: -132, labelOffset: 6 },
  food: { artWidth: 680, artAspect: 1635 / 962, anchorX: 1570, anchorY: 540, characterDx: 210, characterDy: -132, labelOffset: 6 },
  exam: { artWidth: 660, artAspect: 1635 / 962, anchorX: 360, anchorY: 1006, characterDx: 330, characterDy: -128, labelOffset: 4 },
  wish: { artWidth: 660, artAspect: 1635 / 962, anchorX: 1560, anchorY: 1006, characterDx: 200, characterDy: -132, labelOffset: 4 },
  cake: { artWidth: 800, artAspect: 1632 / 964, anchorX: 960, anchorY: 736, characterDx: 150, characterDy: -128, labelOffset: 6 },
};

/**
 * 建筑视觉框。无正式图时退回原来的点击矩形。
 * @param id 建筑
 * @param hasArt 该建筑 PNG 是否已加载成功
 */
export function buildingFrame(id: BuildingId, hasArt: boolean): Rect {
  const hit = MAP_BUILDINGS[id];
  if (!hasArt) return hit;
  const tune = BUILDING_TUNE[id];
  const w = tune.artWidth;
  const h = Math.round(w / tune.artAspect);
  return {
    x: Math.round(tune.anchorX - w / 2),
    y: Math.round(tune.anchorY - h),
    w,
    h,
  };
}

/**
 * 名称标签相对视觉框底边的下移量
 * @param id 建筑
 * @param hasArt 是否正在显示正式图
 */
export function buildingLabelOffset(id: BuildingId, hasArt: boolean): number {
  return hasArt ? BUILDING_TUNE[id].labelOffset : 8;
}

/**
 * Q 版麻衣站在该建筑配置的入口旁，脚底贴近建筑底边。
 * @param id 建筑
 * @param hasArt 该建筑是否正在显示正式图
 */
export function chibiSpot(id: BuildingId, hasArt = false): { x: number; y: number } {
  if (!hasArt) {
    const r = MAP_BUILDINGS[id];
    const onLeft = r.x + r.w / 2 < 960;
    const x = onLeft ? r.x + r.w - 48 : r.x - CHIBI_W + 48;
    return { x, y: r.y + r.h - CHIBI_H + 6 };
  }
  const tune = BUILDING_TUNE[id];
  return {
    x: Math.round(tune.anchorX + tune.characterDx),
    y: Math.round(tune.anchorY + tune.characterDy),
  };
}
