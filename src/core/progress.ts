import type { SceneId } from '../config/scenes';
import type { StampId } from '../config/stamps';
import { loadJSON, removeKey, saveJSON } from './storage';

/**
 * 存储键
 * 刻意沿用 v1 的键名：旧存档能被读到并迁移，而不是被当作“另一份数据”忽略。
 * 数据内部用 `version` 字段标识结构版本。
 */
export const PROGRESS_KEY = 'mayi-birthday-park:progress:v1';

/** 当前存档结构版本（v4：多选心愿数组、心愿扩容权限、6 题考试题组、顺序闯关） */
export const PROGRESS_VERSION = 4 as const;

/**
 * 当前考试题组版本；旧题组的成绩不能当作新题组成绩
 * - 1：V1.0 旧题组（3 题，狐耳/异瞳）
 * - 2：V1.1 题组（5 题，2 道事实题）
 * - 3：V1.2 题组（6 题，3 道事实题：食物 / 星座 / 专业）
 */
export const EXAM_SET_VERSION = 3;
/** 新版考试事实题数量 */
export const EXAM_FACT_TOTAL = 3;
/** 心愿卡总数（四张固定卡 + 麻衣专属许愿卡） */
export const WISH_CARD_TOTAL = 5;
/** 自定义心愿最大字数（按 Unicode 码点计） */
export const CUSTOM_WISH_MAX = 80;

/** 音频设置 */
export interface AudioSettings {
  /** 主音量 0~1 */
  volume: number;
  /** 是否静音 */
  muted: boolean;
}

/** 游戏设置 */
export interface GameSettings {
  /** 认证考试：弹幕倒计时开关（默认关） */
  danmuTimer: boolean;
}

/** 美食屋图鉴收藏品 ID */
export type CollectibleId = 'yunpiangao' | 'tangbing' | 'bohetang' | 'danhuangnangua';

/** 心愿卡 ID：四张固定卡 + 麻衣专属许愿卡 */
export type WishCardId = 'fortune' | 'love' | 'stage' | 'ease' | 'custom';

/** 小游戏记录 */
export interface GameRecords {
  /** 薄荷糖补给站最高分 */
  mintBest: number;
  /** 薄荷糖补给站最高连击 */
  mintBestCombo: number;
  /** 认证考试事实题最佳正确数（0~EXAM_FACT_TOTAL，仅对 examSet === EXAM_SET_VERSION 有效） */
  examBestCorrect: number;
  /** 产生成绩的题组版本；0 = 从未交卷；小于 EXAM_SET_VERSION = 旧题组（成绩已清零，仅作标记） */
  examSet: number;
  /** 火锅名称（未开锅为 null） */
  hotpotName: string | null;
  /** 水果捞名称（未开做为 null） */
  fruitName: string | null;
  /**
   * 今年想收下的心愿（v4：数组，替代 v3 的单值 mainWish）
   * - 未解锁扩容时最多 1 个；解锁后 1~5 个
   * - 空数组 = 未选择或已跳过
   */
  selectedWishIds: WishCardId[];
  /** 心愿选择被玩家跳过（系统代为保管全部） */
  mainWishBySystem: boolean;
  /** 麻衣专属许愿卡内容（仅本地保存；空为 null） */
  customWish: string | null;
  /** 是否同意在闭园票根上显示自定义心愿（默认不显示） */
  customWishPublic: boolean;
}

/** 游戏进度 */
export interface GameProgress {
  version: typeof PROGRESS_VERSION;
  /** 已通过入园闸机（旧版：身份认证） */
  authDone: boolean;
  /** 旧版“已阅读游客须知”；新版闸机通过时同时置 true，仅为兼容保留 */
  noticeDone: boolean;
  /** 四枚印章 */
  stamps: Record<StampId, boolean>;
  /** 心愿屋解锁动画已播放 */
  wishUnlockSeen: boolean;
  /** 印章汇聚演出已播放 */
  convergenceSeen: boolean;
  /** 四根蜡烛各自点亮状态 */
  candles: Record<StampId, boolean>;
  /** 蛋糕已点亮（四根全亮时同步为 true） */
  cakeLit: boolean;
  /** 蜡烛已吹灭 */
  candlesBlown: boolean;
  /** 音乐礼物环节已结束（播放或跳过） */
  musicDone: boolean;
  /** 已看到最终祝福 */
  finalSeen: boolean;
  /** 闭园票根已展示 */
  ticketSeen: boolean;
  /** 已发现隐藏彩蛋 */
  eggFound: boolean;
  /** 美食屋神秘料理台已解锁（在水果捞台点过蛋黄沙司） */
  hiddenDishUnlocked: boolean;
  /** 美食屋神秘料理已制作 */
  hiddenDishFound: boolean;
  /** 心愿屋“好信号卡”已查看 */
  signalCardSeen: boolean;
  /** 心愿扩容权限已通过小鬼特批（密码验证成功；刷新后不必重复输入） */
  multiWishUnlocked: boolean;
  /** 美食屋图鉴 */
  collectibles: Record<CollectibleId, boolean>;
  /** 小游戏记录 */
  records: GameRecords;
  /** 各场景首次目标提示已显示 */
  hintsSeen: Partial<Record<SceneId, boolean>>;
  /** 游戏设置 */
  settings: GameSettings;
  /** 音频设置 */
  audio: AudioSettings;
}

const STAMP_IDS: StampId[] = ['mint', 'food', 'exam', 'wish'];
const COLLECTIBLE_IDS: CollectibleId[] = ['yunpiangao', 'tangbing', 'bohetang', 'danhuangnangua'];
const WISH_CARD_IDS: WishCardId[] = ['fortune', 'love', 'stage', 'ease', 'custom'];

/**
 * 创建默认进度
 * @returns 全新进度对象
 */
export function createDefaultProgress(): GameProgress {
  return {
    version: PROGRESS_VERSION,
    authDone: false,
    noticeDone: false,
    stamps: { mint: false, food: false, exam: false, wish: false },
    wishUnlockSeen: false,
    convergenceSeen: false,
    candles: { mint: false, food: false, exam: false, wish: false },
    cakeLit: false,
    candlesBlown: false,
    musicDone: false,
    finalSeen: false,
    ticketSeen: false,
    eggFound: false,
    hiddenDishUnlocked: false,
    hiddenDishFound: false,
    signalCardSeen: false,
    multiWishUnlocked: false,
    collectibles: { yunpiangao: false, tangbing: false, bohetang: false, danhuangnangua: false },
    records: {
      mintBest: 0,
      mintBestCombo: 0,
      examBestCorrect: 0,
      examSet: 0,
      hotpotName: null,
      fruitName: null,
      selectedWishIds: [],
      mainWishBySystem: false,
      customWish: null,
      customWishPublic: false,
    },
    hintsSeen: {},
    settings: { danmuTimer: false },
    audio: { volume: 0.7, muted: false },
  };
}

// ---------- 校验工具 ----------

type Dict = Record<string, unknown>;

/** 是否为普通对象（非数组、非 null） */
function isDict(v: unknown): v is Dict {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 读取布尔；非布尔一律回退默认 */
function bool(v: unknown, def: boolean): boolean {
  return typeof v === 'boolean' ? v : def;
}

/** 读取有限非负整数；NaN/负数/非数字回退默认，并限制上限防止异常值 */
function count(v: unknown, def: number, max = 1_000_000): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return def;
  return Math.min(max, Math.floor(v));
}

/** 读取 0~1 的小数 */
function unit(v: unknown, def: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return def;
  return Math.min(1, Math.max(0, v));
}

/** 读取非空短字符串，否则 null（防止把 undefined / 对象写进票根） */
function shortText(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > 0 && s.length <= 60 ? s : null;
}

/**
 * 规范化玩家自定义文字：去除控制字符、折叠多余换行、按码点截断
 * 仅做安全与长度处理，不改变正常中文/emoji 内容
 * @param v 任意值
 * @param max 最大码点数
 * @returns 合法文本或 null
 */
export function sanitizeUserText(v: unknown, max = CUSTOM_WISH_MAX): string | null {
  if (typeof v !== 'string') return null;
  // 去掉控制字符（保留换行），再把 3 个以上连续换行折叠为 2 个
  const cleaned = v
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (cleaned.length === 0) return null;
  const points = Array.from(cleaned);
  return points.length > max ? points.slice(0, max).join('') : cleaned;
}

/** 读取固定键集合的布尔表；缺失/非法键按默认补齐，多余键丢弃 */
function boolTable<K extends string>(v: unknown, keys: K[], def: Record<K, boolean>): Record<K, boolean> {
  const src = isDict(v) ? v : {};
  const out = { ...def };
  keys.forEach((k) => {
    out[k] = bool(src[k], def[k]);
  });
  return out;
}

/**
 * 把任意来源的数据规范化为合法的 GameProgress
 * - 每个字段独立校验，非法值回退默认，而不是整份丢弃
 * - 嵌套对象逐键补齐，旧存档缺少的新字段自动获得默认值
 * - 对 v1 结构做迁移（蜡烛状态、演出标记）
 * @param raw 存储中读到的任意值
 * @returns 合法进度
 */
export function normalizeProgress(raw: unknown): GameProgress {
  const def = createDefaultProgress();
  if (!isDict(raw)) return def;

  const legacyVersion = typeof raw.version === 'number' ? raw.version : 0;
  const recSrc = isDict(raw.records) ? raw.records : {};
  const audioSrc = isDict(raw.audio) ? raw.audio : {};
  const settingsSrc = isDict(raw.settings) ? raw.settings : {};
  const hintsSrc = isDict(raw.hintsSeen) ? raw.hintsSeen : {};

  const stamps = boolTable(raw.stamps, STAMP_IDS, def.stamps);
  const cakeLitRaw = bool(raw.cakeLit, false);
  let candles = boolTable(raw.candles, STAMP_IDS, def.candles);

  // v1 没有 candles：旧存档“蛋糕已点亮”视为四根全亮
  if (legacyVersion < 2 && cakeLitRaw) {
    candles = { mint: true, food: true, exam: true, wish: true };
  }
  const allCandles = STAMP_IDS.every((k) => candles[k]);
  // 一致性：四根全亮 ⇒ cakeLit；cakeLit 但有未亮的蜡烛 ⇒ 以蜡烛为准（新版逐根点亮）
  const cakeLit = allCandles || (cakeLitRaw && legacyVersion < 2);

  const allStamps = STAMP_IDS.every((k) => stamps[k]);
  const ceremonyStarted = cakeLit || bool(raw.candlesBlown, false) || bool(raw.musicDone, false) || bool(raw.finalSeen, false);

  const customWish = sanitizeUserText(recSrc.customWish);
  const multiWishUnlocked = bool(raw.multiWishUnlocked, false);
  // v4：selectedWishIds 数组；v3 及以前：单值 mainWish → 迁移为单元素数组
  // 旧版心愿卡 ID（free/joy/song/tomorrow）不在新集合内 → 丢弃；选了自定义但正文为空也丢弃
  const wishSrc: unknown[] = Array.isArray(recSrc.selectedWishIds)
    ? recSrc.selectedWishIds
    : typeof recSrc.mainWish === 'string'
      ? [recSrc.mainWish]
      : [];
  let selectedWishIds = WISH_CARD_IDS.filter((id) => wishSrc.includes(id));
  if (customWish === null) selectedWishIds = selectedWishIds.filter((id) => id !== 'custom');
  // 未解锁扩容却存了多个 ⇒ 只保留第一个，避免越权
  if (!multiWishUnlocked && selectedWishIds.length > 1) selectedWishIds = selectedWishIds.slice(0, 1);

  // 考试成绩只在同一题组下有效：旧题组的成绩不迁移为新题组成绩
  const examSetRaw = count(recSrc.examSet, 0, 99);
  const examScoreRaw = count(recSrc.examBestCorrect, 0, 99);
  // 没有 examSet 字段却有成绩 ⇒ v1/v2 的旧题组（记为 1），票根上标注"旧版成绩不计"
  const examSet = examSetRaw > 0 ? examSetRaw : examScoreRaw > 0 ? 1 : 0;
  const examBestCorrect = examSet === EXAM_SET_VERSION ? Math.min(examScoreRaw, EXAM_FACT_TOTAL) : 0;

  const hiddenDishFound = bool(raw.hiddenDishFound, false);

  const hintsSeen: Partial<Record<SceneId, boolean>> = {};
  Object.keys(hintsSrc).forEach((k) => {
    if (hintsSrc[k] === true) hintsSeen[k as SceneId] = true;
  });

  return {
    version: PROGRESS_VERSION,
    authDone: bool(raw.authDone, false),
    noticeDone: bool(raw.noticeDone, false),
    stamps,
    // 旧存档已拿到心愿印章 ⇒ 解锁动画无需再播
    wishUnlockSeen: bool(raw.wishUnlockSeen, false) || stamps.wish,
    // 旧存档已进入仪式环节 ⇒ 汇聚演出无需再播；仅集齐但未进蛋糕房的，保留首次演出
    convergenceSeen: bool(raw.convergenceSeen, false) || (allStamps && ceremonyStarted),
    candles,
    cakeLit,
    candlesBlown: bool(raw.candlesBlown, false),
    musicDone: bool(raw.musicDone, false),
    finalSeen: bool(raw.finalSeen, false),
    ticketSeen: bool(raw.ticketSeen, false),
    eggFound: bool(raw.eggFound, false),
    // 已做过神秘料理 ⇒ 料理台必然已解锁
    hiddenDishUnlocked: bool(raw.hiddenDishUnlocked, false) || hiddenDishFound,
    hiddenDishFound,
    signalCardSeen: bool(raw.signalCardSeen, false),
    multiWishUnlocked,
    collectibles: boolTable(raw.collectibles, COLLECTIBLE_IDS, def.collectibles),
    records: {
      mintBest: count(recSrc.mintBest, 0),
      mintBestCombo: count(recSrc.mintBestCombo, 0),
      examBestCorrect,
      examSet,
      hotpotName: shortText(recSrc.hotpotName),
      fruitName: shortText(recSrc.fruitName),
      selectedWishIds,
      // 跳过选择 ⇒ 数组为空且 bySystem 为 true；已选具体卡时该标记无意义，归 false
      mainWishBySystem: selectedWishIds.length === 0 && bool(recSrc.mainWishBySystem, false),
      customWish,
      customWishPublic: customWish !== null && bool(recSrc.customWishPublic, false),
    },
    hintsSeen,
    settings: { danmuTimer: bool(settingsSrc.danmuTimer, false) },
    audio: { volume: unit(audioSrc.volume, def.audio.volume), muted: bool(audioSrc.muted, false) },
  };
}

/**
 * 读取进度；任何损坏、缺字段、旧版本都会被规范化，不会抛错
 * @returns 进度对象
 */
export function loadProgress(): GameProgress {
  const raw = loadJSON<unknown>(PROGRESS_KEY, null);
  return normalizeProgress(raw);
}

/**
 * 保存进度
 * @param p 进度
 * @returns 是否成功写入持久存储
 */
export function saveProgress(p: GameProgress): boolean {
  return saveJSON(PROGRESS_KEY, p);
}

/** 清除进度 */
export function clearProgress(): void {
  removeKey(PROGRESS_KEY);
}

/**
 * 统计已获得印章数量
 * @param p 进度
 * @returns 0~4
 */
export function countStamps(p: GameProgress): number {
  return STAMP_IDS.filter((k) => p.stamps[k]).length;
}

/**
 * 统计心愿屋之外的三枚印章数量（心愿屋开放条件）
 * @param p 进度
 * @returns 0~3
 */
export function countPreWishStamps(p: GameProgress): number {
  return (p.stamps.mint ? 1 : 0) + (p.stamps.food ? 1 : 0) + (p.stamps.exam ? 1 : 0);
}

/**
 * 是否存在任何有效进度（用于开场“继续”按钮）
 * @param p 进度
 */
export function hasAnyProgress(p: GameProgress): boolean {
  return p.authDone || p.noticeDone || countStamps(p) > 0;
}

/** 严格闯关顺序：薄荷糖 → 美食 → 考试 → 心愿屋（之后是蛋糕房） */
export const STRICT_ORDER: StampId[] = ['mint', 'food', 'exam', 'wish'];

/**
 * 当前应前往的场馆：顺序中第一个尚未盖章的；四枚集齐返回 null（代表蛋糕房）
 * 旧存档若有乱序印章，仍以“第一个未盖章”为当前站，已盖章的可自由重玩
 * @param p 进度
 */
export function currentStage(p: GameProgress): StampId | null {
  return STRICT_ORDER.find((id) => !p.stamps[id]) ?? null;
}

/**
 * 某场馆当前是否可进入：已盖章（重玩）或恰好是当前站
 * @param p 进度
 * @param id 场馆
 */
export function canEnterStage(p: GameProgress, id: StampId): boolean {
  return p.stamps[id] || currentStage(p) === id;
}
