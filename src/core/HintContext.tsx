import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SceneId } from '../config/scenes';
import { TEXTS } from '../config/texts';
import { useGame } from './GameContext';

/** 闲置多久后主动提示（毫秒） */
export const IDLE_DELAY_MS = 9000;
/** 首次目标提示自动消失时间 */
const GOAL_SHOW_MS = 5000;
/** 闲置提示自动消失时间 */
const IDLE_SHOW_MS = 6000;
/** 两次主动提示的最小间隔 */
const IDLE_REPEAT_GAP_MS = 15000;
/** 同一场景（单次进入）最多主动提示次数 */
const MAX_IDLE_HINTS = 3;
/** 广播每条显示时长 */
const BROADCAST_MS = 2500;

/** 场景注册给提示系统的配置 */
export interface SceneHintConfig {
  /** 注册者所属场景（防止场景切换瞬间沿用上一场景的配置） */
  scene: SceneId;
  /** 一句目标提示；为空则本场景不显示提示 */
  goal?: string | null;
  /** 推荐操作的目标 ID（对应 DOM 上的 data-hint-target），闲置时脉冲高亮 */
  target?: string | null;
  /** 是否启用闲置提示（小游戏游玩中应关闭） */
  enabled?: boolean;
}

/** 当前可见的提示类型 */
export type HintMode = 'goal' | 'idle' | 'broadcast' | null;

export interface HintContextValue {
  /** 当前显示模式 */
  mode: HintMode;
  /** 当前显示文本 */
  text: string | null;
  /** 当前高亮目标 */
  activeTarget: string | null;
  /**
   * 场景注册/更新提示配置（由 useSceneHint 调用）
   * @param cfg 配置；传 null 清除
   */
  register: (cfg: SceneHintConfig | null) => void;
  /**
   * 游园会广播：按顺序显示多条短句，期间不显示其它提示
   * @param lines 文本数组
   */
  announce: (lines: readonly string[]) => void;
  /** 立即隐藏当前提示并重置闲置计时 */
  dismiss: () => void;
}

const HintContext = createContext<HintContextValue | null>(null);

/**
 * 轻量提示系统 Provider
 * - 场景首次进入显示一句目标（持久化到 hintsSeen，之后不再自动出现）；若此时正在广播，则广播结束后补显示
 * - 闲置 9 秒后主动提示（含目标高亮），每场景最多 3 次、间隔 ≥ 15 秒
 * - 页面隐藏时暂停计时；任何 pointerdown/keydown 立即收起提示，但不拦截事件
 * - 广播优先级最高；广播与所属场景绑定，切换场景时丢弃上一场景未播完的广播
 */
export function HintProvider({ children }: { children: ReactNode }) {
  const { scene, progress, markHintSeen } = useGame();
  const [cfg, setCfg] = useState<SceneHintConfig | null>(null);
  const [mode, setMode] = useState<HintMode>(null);
  const [text, setText] = useState<string | null>(null);

  const cfgRef = useRef<SceneHintConfig | null>(null);
  const modeRef = useRef<HintMode>(null);
  const idleTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const idleCount = useRef(0);
  /** 广播队列（每条绑定所属场景） */
  const broadcastQueue = useRef<{ scene: SceneId; text: string }[]>([]);
  const broadcastTimer = useRef<number | null>(null);
  /** 广播是否正在进行（同步标记，避免依赖异步的 state） */
  const broadcasting = useRef(false);
  /** 正在播放的广播所属场景 */
  const playingScene = useRef<SceneId | null>(null);
  /** 广播期间被推迟的目标提示 */
  const pendingGoal = useRef<{ scene: SceneId; goal: string } | null>(null);
  const sceneRef = useRef<SceneId>(scene);
  const hintsSeenRef = useRef(progress.hintsSeen);
  hintsSeenRef.current = progress.hintsSeen;
  cfgRef.current = cfg;
  modeRef.current = mode;
  // 渲染期即更新当前场景：Provider 先于子场景渲染，子场景 effect 中的 announce 才能绑定到正确场景
  sceneRef.current = scene;

  const clearTimer = (ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  };

  /** 显示一条提示 */
  const show = useCallback((m: Exclude<HintMode, null>, t: string, ms: number) => {
    clearTimer(hideTimer);
    setMode(m);
    setText(t);
    hideTimer.current = window.setTimeout(() => {
      setMode(null);
      setText(null);
    }, ms);
  }, []);

  /** 安排下一次闲置提示 */
  const scheduleIdle = useCallback(
    (delay: number) => {
      clearTimer(idleTimer);
      if (document.hidden) return;
      idleTimer.current = window.setTimeout(() => {
        const c = cfgRef.current;
        if (!c || c.scene !== sceneRef.current || c.enabled === false || !c.goal || idleCount.current >= MAX_IDLE_HINTS) return;
        if (broadcasting.current) {
          scheduleIdle(IDLE_DELAY_MS);
          return;
        }
        idleCount.current += 1;
        const tip = sceneRef.current === 'map' ? TEXTS.map.idleHint : c.goal;
        show('idle', tip, IDLE_SHOW_MS);
        scheduleIdle(IDLE_REPEAT_GAP_MS);
      }, delay);
    },
    [show],
  );

  /** 显示首次目标提示（若该场景尚未显示过） */
  const showGoalOnce = useCallback(
    (s: SceneId, goal: string) => {
      if (hintsSeenRef.current[s]) return false;
      show('goal', goal, GOAL_SHOW_MS);
      markHintSeen(s);
      return true;
    },
    [show, markHintSeen],
  );

  const dismiss = useCallback(() => {
    if (modeRef.current && modeRef.current !== 'broadcast') {
      clearTimer(hideTimer);
      setMode(null);
      setText(null);
    }
    scheduleIdle(IDLE_DELAY_MS);
  }, [scheduleIdle]);

  /** 广播队列推进 */
  const pumpBroadcast = useCallback(() => {
    clearTimer(broadcastTimer);
    const next = broadcastQueue.current.shift();
    if (next === undefined) {
      broadcasting.current = false;
      const pg = pendingGoal.current;
      pendingGoal.current = null;
      if (pg && pg.scene === sceneRef.current && showGoalOnce(pg.scene, pg.goal)) {
        scheduleIdle(IDLE_DELAY_MS);
        return;
      }
      setMode(null);
      setText(null);
      scheduleIdle(IDLE_DELAY_MS);
      return;
    }
    broadcasting.current = true;
    playingScene.current = next.scene;
    clearTimer(hideTimer);
    setMode('broadcast');
    setText(next.text);
    broadcastTimer.current = window.setTimeout(pumpBroadcast, BROADCAST_MS);
  }, [scheduleIdle, showGoalOnce]);

  const announce = useCallback(
    (lines: readonly string[]) => {
      const s = sceneRef.current;
      const clean = lines.filter((l) => l && l.trim().length > 0).map((l) => ({ scene: s, text: l }));
      if (clean.length === 0) return;
      broadcastQueue.current.push(...clean);
      if (!broadcasting.current) pumpBroadcast();
    },
    [pumpBroadcast],
  );

  const register = useCallback((c: SceneHintConfig | null) => {
    setCfg(c);
  }, []);

  // 场景切换：重置计数与可见提示；丢弃属于上一场景的广播，保留本场景刚发出的广播
  useEffect(() => {
    idleCount.current = 0;
    pendingGoal.current = null;
    clearTimer(hideTimer);
    clearTimer(idleTimer);
    broadcastQueue.current = broadcastQueue.current.filter((b) => b.scene === scene);
    if (broadcasting.current && playingScene.current !== scene) {
      // 正在播的是上一场景的广播：立即停止，转而播放本场景的队列（若有）
      clearTimer(broadcastTimer);
      broadcasting.current = false;
      if (broadcastQueue.current.length > 0) {
        pumpBroadcast();
        return;
      }
    }
    if (!broadcasting.current) {
      setMode(null);
      setText(null);
    }
    // pumpBroadcast 为稳定引用，仅需在场景变化时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // 配置到位后（场景已挂载并注册），决定是否显示首次目标提示，并启动闲置计时
  useEffect(() => {
    if (!cfg || !cfg.goal || cfg.scene !== scene) return;
    if (!hintsSeenRef.current[scene]) {
      if (broadcasting.current) pendingGoal.current = { scene, goal: cfg.goal };
      else showGoalOnce(scene, cfg.goal);
    }
    scheduleIdle(IDLE_DELAY_MS);
    return () => clearTimer(idleTimer);
    // 仅在目标文本/启用状态/场景变化时重新评估
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.goal, cfg?.enabled, cfg?.scene, scene]);

  // 用户操作：收起提示并重置闲置计时（capture 阶段监听，不阻止事件传播）
  useEffect(() => {
    const onAct = () => dismiss();
    window.addEventListener('pointerdown', onAct, true);
    window.addEventListener('keydown', onAct, true);
    return () => {
      window.removeEventListener('pointerdown', onAct, true);
      window.removeEventListener('keydown', onAct, true);
    };
  }, [dismiss]);

  // 页面隐藏时暂停计时，恢复时重新计时
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        clearTimer(idleTimer);
      } else {
        scheduleIdle(IDLE_DELAY_MS);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [scheduleIdle]);

  // 卸载时清理所有计时器
  useEffect(
    () => () => {
      clearTimer(idleTimer);
      clearTimer(hideTimer);
      clearTimer(broadcastTimer);
    },
    [],
  );

  // 高亮目标：给 DOM 上的 data-hint-target 元素加脉冲类
  const activeTarget = mode === 'idle' && cfg?.target ? cfg.target : null;
  useEffect(() => {
    if (!activeTarget) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-hint-target="${activeTarget}"]`));
    els.forEach((el) => el.classList.add('hint-pulse'));
    return () => els.forEach((el) => el.classList.remove('hint-pulse'));
  }, [activeTarget]);

  const value = useMemo<HintContextValue>(
    () => ({ mode, text, activeTarget, register, announce, dismiss }),
    [mode, text, activeTarget, register, announce, dismiss],
  );

  return <HintContext.Provider value={value}>{children}</HintContext.Provider>;
}

/**
 * 读取提示系统上下文
 * @throws 未包裹在 HintProvider 中时抛错
 */
export function useHints(): HintContextValue {
  const ctx = useContext(HintContext);
  if (!ctx) throw new Error('useHints 必须在 HintProvider 内使用');
  return ctx;
}
