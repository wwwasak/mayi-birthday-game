import { useCallback, useState } from 'react';
import type { MinigamePhase } from '../components/minigame/MinigameShell';
import type { StampId } from '../config/stamps';
import { useGame } from '../core/GameContext';
import { useSceneHint } from './useSceneHint';

/**
 * 小游戏阶段管理 + 印章发放 + 轻提示接入的通用逻辑
 * @param stamp 本关对应印章（与场景 ID 同名）
 * @param onReset 重开时重置关卡内部状态的回调
 */
export function useMinigamePhase(stamp: StampId, onReset: () => void) {
  const { ensureStamp, backToMap } = useGame();
  const [phase, setPhase] = useState<MinigamePhase>('intro');

  // 提示：开始面板高亮“开始游戏”，结算面板高亮“完成”；限时关卡游玩中不打扰；暂停时不计时
  useSceneHint(stamp, {
    target: phase === 'intro' ? 'mg-start' : phase === 'result' ? 'mg-finish' : null,
    enabled: phase !== 'paused' && !(stamp === 'mint' && phase === 'playing'),
  });

  const start = useCallback(() => {
    onReset();
    setPhase('playing');
  }, [onReset]);

  const pause = useCallback(() => setPhase((p) => (p === 'playing' ? 'paused' : p)), []);
  const resume = useCallback(() => setPhase((p) => (p === 'paused' ? 'playing' : p)), []);

  const restart = useCallback(() => {
    onReset();
    setPhase('playing');
  }, [onReset]);

  /** 进入结算：首次通关发印章（重复通关静默） */
  const finishToResult = useCallback(() => {
    ensureStamp(stamp);
    setPhase('result');
  }, [ensureStamp, stamp]);

  /** 跳过：视为通关，发印章并返回地图 */
  const skip = useCallback(() => {
    ensureStamp(stamp);
    backToMap();
  }, [ensureStamp, stamp, backToMap]);

  /** 结算面板的"完成"：返回地图 */
  const finish = useCallback(() => {
    ensureStamp(stamp);
    backToMap();
  }, [ensureStamp, stamp, backToMap]);

  return { phase, setPhase, start, pause, resume, restart, finishToResult, skip, finish };
}
