import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { INITIAL_SCENE, SCENES, resolveLockedHint, type SceneId } from '../config/scenes';
import { STAMPS, type StampId } from '../config/stamps';
import { CANDLE_IDS, allCandlesLit, nextBlowWave, type CandleId } from '../config/candles';
import { TEXTS } from '../config/texts';
import { audio } from './audio';
import {
  clearProgress,
  createDefaultProgress,
  EXAM_FACT_TOTAL,
  EXAM_SET_VERSION,
  loadProgress,
  saveProgress,
  type CollectibleId,
  type GameProgress,
  type GameRecords,
  type GameSettings,
} from './progress';

/** 允许通过 patch 直接覆盖的顶层布尔字段 */
export type PatchableProgress = Partial<
  Omit<GameProgress, 'version' | 'stamps' | 'audio' | 'collectibles' | 'records' | 'candles' | 'hintsSeen' | 'settings'>
>;
import { isStorageAvailable } from './storage';

/** 游戏上下文暴露的能力 */
export interface GameContextValue {
  /** 当前进度（只读，使用 patch/awardStamp 修改） */
  progress: GameProgress;
  /** 当前场景 */
  scene: SceneId;
  /** 持久化存储是否可用 */
  storageOk: boolean;
  /** 当前提示消息 */
  toast: string | null;

  /**
   * 切换场景（受 canEnter 守卫保护，被拒绝时弹提示并留在原地）
   * @param next 目标场景
   * @returns 是否成功切换
   */
  goTo: (next: SceneId) => boolean;
  /** 返回地图 */
  backToMap: () => void;
  /**
   * 发放印章；仅首次有效
   * @param id 印章 ID
   * @returns true = 本次新获得；false = 之前已获得
   */
  awardStamp: (id: StampId) => boolean;
  /**
   * 关卡通关时调用：首次发放印章；重复通关静默忽略（不弹"已拿过"提示）
   * @param id 印章 ID
   * @returns 是否为本次新获得
   */
  ensureStamp: (id: StampId) => boolean;
  /**
   * 解锁图鉴收藏品；重复解锁静默忽略
   * @param id 收藏品 ID
   * @returns 是否为本次新解锁
   */
  unlockCollectible: (id: CollectibleId) => boolean;
  /**
   * 更新小游戏数值记录（只保留更高值）
   * @param partial 要比较并更新的数值字段
   */
  updateRecords: (partial: Partial<Pick<GameRecords, 'mintBest' | 'mintBestCombo' | 'examBestCorrect'>>) => void;
  /**
   * 直接写入非数值记录（火锅名、心愿等；以最新一次为准）
   * @param partial 要覆盖的记录字段
   */
  setRecords: (partial: Partial<Omit<GameRecords, 'mintBest' | 'mintBestCombo' | 'examBestCorrect' | 'examSet'>>) => void;
  /**
   * 记录一次新版考试的事实题成绩：题组版本不同则直接覆盖，相同则取更高值
   * @param factCorrect 本次事实题正确数
   */
  recordExam: (factCorrect: number) => void;
  /**
   * 局部更新进度（仅顶层标记字段）
   * @param partial 要合并的字段
   */
  patch: (partial: PatchableProgress) => void;
  /**
   * 点亮一根蜡烛。五根全亮时自动把蛋糕记为已点亮。
   * @param id 蜡烛 ID，不按位置判断
   */
  lightCandle: (id: CandleId) => void;
  /** 一键点亮全部蜡烛，包括正中的金色蜡烛 */
  lightAllCandles: () => void;
  /**
   * 按 2＋2＋1 吹灭下一波，金色最后。
   * @returns 这一波熄灭的蜡烛；已经吹完时返回空数组
   */
  blowNextCandles: () => CandleId[];
  /**
   * 标记某场景的首次目标提示已显示
   * @param scene 场景 ID
   */
  markHintSeen: (scene: SceneId) => void;
  /**
   * 更新游戏设置
   * @param partial 要合并的设置
   */
  updateSettings: (partial: Partial<GameSettings>) => void;
  /** 设置音量 0~1 */
  setVolume: (v: number) => void;
  /** 切换静音 */
  toggleMute: () => void;
  /** 重置全部进度并回到开场 */
  resetProgress: () => void;
  /**
   * 显示提示
   * @param msg 文案
   * @param ms 持续时间（毫秒）
   */
  showToast: (msg: string, ms?: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/**
 * 游戏全局 Provider：场景管理 + 进度状态 + 音频设置
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const [scene, setScene] = useState<SceneId>(INITIAL_SCENE);
  const [storageOk, setStorageOk] = useState<boolean>(() => isStorageAvailable());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // 进度变化 → 持久化
  useEffect(() => {
    const ok = saveProgress(progress);
    if (!ok && storageOk) setStorageOk(false);
  }, [progress, storageOk]);

  // 音频设置同步到 Howler（不会触发播放）
  useEffect(() => {
    audio.setVolume(progress.audio.volume);
    audio.setMuted(progress.audio.muted);
  }, [progress.audio.volume, progress.audio.muted]);

  const showToast = useCallback((msg: string, ms = 2200) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }, []);

  const goTo = useCallback(
    (next: SceneId): boolean => {
      const def = SCENES[next];
      if (def.canEnter && !def.canEnter(progress)) {
        showToast(resolveLockedHint(def, progress));
        return false;
      }
      setScene(next);
      return true;
    },
    [progress, showToast],
  );

  const backToMap = useCallback(() => setScene('map'), []);

  const awardStamp = useCallback(
    (id: StampId): boolean => {
      if (progress.stamps[id]) {
        showToast(TEXTS.common.alreadyStamp);
        return false;
      }
      setProgress((p) => ({ ...p, stamps: { ...p.stamps, [id]: true } }));
      audio.playSfx('sfx_stamp');
      showToast(TEXTS.common.gotStamp(STAMPS[id].name), 2600);
      return true;
    },
    [progress.stamps, showToast],
  );

  const ensureStamp = useCallback(
    (id: StampId): boolean => {
      if (progress.stamps[id]) return false;
      return awardStamp(id);
    },
    [progress.stamps, awardStamp],
  );

  const unlockCollectible = useCallback(
    (id: CollectibleId): boolean => {
      if (progress.collectibles[id]) return false;
      setProgress((p) => ({ ...p, collectibles: { ...p.collectibles, [id]: true } }));
      audio.playSfx('sfx_unlock');
      return true;
    },
    [progress.collectibles],
  );

  const updateRecords = useCallback<GameContextValue['updateRecords']>((partial) => {
    setProgress((p) => {
      const next = { ...p.records };
      (Object.keys(partial) as (keyof typeof partial)[]).forEach((k) => {
        const v = partial[k];
        if (typeof v === 'number' && Number.isFinite(v) && v > next[k]) next[k] = v;
      });
      return { ...p, records: next };
    });
  }, []);

  const setRecords = useCallback<GameContextValue['setRecords']>((partial) => {
    setProgress((p) => ({ ...p, records: { ...p.records, ...partial } }));
  }, []);

  const recordExam = useCallback((factCorrect: number) => {
    const v = Math.max(0, Math.min(EXAM_FACT_TOTAL, Math.floor(factCorrect)));
    setProgress((p) => {
      const sameSet = p.records.examSet === EXAM_SET_VERSION;
      const best = sameSet ? Math.max(p.records.examBestCorrect, v) : v;
      return { ...p, records: { ...p.records, examBestCorrect: best, examSet: EXAM_SET_VERSION } };
    });
  }, []);

  const patch = useCallback<GameContextValue['patch']>((partial) => {
    setProgress((p) => ({ ...p, ...partial }));
  }, []);

  const lightCandle = useCallback((id: CandleId) => {
    setProgress((p) => {
      if (p.candles[id]) return p;
      const candles = { ...p.candles, [id]: true };
      return { ...p, candles, cakeLit: p.cakeLit || allCandlesLit(candles) };
    });
  }, []);

  const lightAllCandles = useCallback(() => {
    setProgress((p) => ({
      ...p,
      candles: { mint: true, food: true, exam: true, wish: true, mayi: true },
      cakeLit: true,
    }));
  }, []);

  const blowNextCandles = useCallback((): CandleId[] => {
    const wave = nextBlowWave(progress.blownCandles);
    if (wave.length === 0 || progress.candlesBlown) return [];
    setProgress((p) => {
      if (p.candlesBlown) return p;
      const fresh = nextBlowWave(p.blownCandles);
      if (fresh.length === 0) return p;
      const blownCandles = [...p.blownCandles, ...fresh];
      const done = CANDLE_IDS.every((id) => blownCandles.includes(id));
      return { ...p, blownCandles, candlesBlown: done };
    });
    return wave;
  }, [progress.blownCandles, progress.candlesBlown]);

  const markHintSeen = useCallback((sceneId: SceneId) => {
    setProgress((p) => (p.hintsSeen[sceneId] ? p : { ...p, hintsSeen: { ...p.hintsSeen, [sceneId]: true } }));
  }, []);

  const updateSettings = useCallback((partial: Partial<GameSettings>) => {
    setProgress((p) => ({ ...p, settings: { ...p.settings, ...partial } }));
  }, []);

  const setVolume = useCallback((v: number) => {
    setProgress((p) => ({ ...p, audio: { ...p.audio, volume: Math.min(1, Math.max(0, v)) } }));
  }, []);

  const toggleMute = useCallback(() => {
    setProgress((p) => ({ ...p, audio: { ...p.audio, muted: !p.audio.muted } }));
  }, []);

  const resetProgress = useCallback(() => {
    audio.stopAll();
    clearProgress();
    setProgress((p) => ({ ...createDefaultProgress(), audio: p.audio }));
    setScene(INITIAL_SCENE);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      progress,
      scene,
      storageOk,
      toast,
      goTo,
      backToMap,
      awardStamp,
      ensureStamp,
      unlockCollectible,
      updateRecords,
      setRecords,
      recordExam,
      patch,
      lightCandle,
      lightAllCandles,
      blowNextCandles,
      markHintSeen,
      updateSettings,
      setVolume,
      toggleMute,
      resetProgress,
      showToast,
    }),
    [
      progress,
      scene,
      storageOk,
      toast,
      goTo,
      backToMap,
      awardStamp,
      ensureStamp,
      unlockCollectible,
      updateRecords,
      setRecords,
      recordExam,
      patch,
      lightCandle,
      lightAllCandles,
      blowNextCandles,
      markHintSeen,
      updateSettings,
      setVolume,
      toggleMute,
      resetProgress,
      showToast,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * 读取游戏上下文
 * @throws 未包裹在 GameProvider 中时抛错
 */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame 必须在 GameProvider 内使用');
  return ctx;
}
