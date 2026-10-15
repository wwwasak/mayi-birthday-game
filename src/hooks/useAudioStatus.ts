import { useSyncExternalStore } from 'react';
import { audio } from '../core/audio';

/**
 * 订阅音频管理器的状态变化；返回值每次变化都会递增，用于触发重渲染
 * @returns 状态版本号
 */
export function useAudioStatus(): number {
  return useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
}
