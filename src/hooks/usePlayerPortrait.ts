import { useEffect, useMemo, useState } from 'react';
import { assetUrl, type ImageAssetId } from '../config/assets';
import { playerPortraitChain, type MayiAppearance, type PlayerPortraitId } from '../config/mayiAppearances';
import { useGame } from '../core/GameContext';

/**
 * 按回退链加载一张普通立绘。
 * 只请求当前这一张；加载失败才换成链上的下一张，不会预先探测不存在的文件。
 * @param portrait 表情或地图半身
 * @param appearance 指定造型；省略时用存档里的当前造型
 */
export function usePlayerPortrait(portrait: PlayerPortraitId, appearance?: MayiAppearance): ImageAssetId | null {
  const { progress } = useGame();
  const look = appearance ?? progress.mayiAppearance;
  const chain = useMemo(() => playerPortraitChain(portrait, look), [portrait, look]);
  const chainKey = chain.join('|');
  const [slot, setSlot] = useState({ key: chainKey, index: 0, ready: false });
  if (slot.key !== chainKey) setSlot({ key: chainKey, index: 0, ready: false });
  const index = slot.key === chainKey ? slot.index : 0;
  const ready = slot.key === chainKey && slot.ready;
  const id = chain[index] ?? null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setSlot((current) => (current.key === chainKey && current.index === index ? { ...current, ready: true } : current));
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      setSlot((current) => {
        if (current.key !== chainKey || current.index !== index) return current;
        if (current.index + 1 >= chain.length) return { ...current, ready: false };
        return { key: chainKey, index: current.index + 1, ready: false };
      });
    };
    img.src = assetUrl(id);
    return () => {
      cancelled = true;
    };
  }, [id, chainKey, chain.length, index]);

  return ready ? id : null;
}
