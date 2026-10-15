import { useEffect } from 'react';
import type { SceneId } from '../config/scenes';
import { TEXTS } from '../config/texts';
import { useHints } from '../core/HintContext';

export interface UseSceneHintOptions {
  /** 覆盖默认目标句（默认取 TEXTS.hints.goals[scene]） */
  goal?: string | null;
  /** 闲置时高亮的 data-hint-target */
  target?: string | null;
  /** 是否启用闲置提示（例如小游戏游玩中传 false） */
  enabled?: boolean;
}

/**
 * 场景接入轻提示系统：挂载时注册目标句与推荐目标，卸载时注销
 * @param scene 当前场景 ID
 * @param opts 可选配置
 */
export function useSceneHint(scene: SceneId, opts: UseSceneHintOptions = {}): void {
  const { register } = useHints();
  const goal = opts.goal === undefined ? TEXTS.hints.goals[scene] ?? null : opts.goal;
  const target = opts.target ?? null;
  const enabled = opts.enabled ?? true;

  useEffect(() => {
    register({ scene, goal, target, enabled });
    return () => register(null);
  }, [register, scene, goal, target, enabled]);
}
