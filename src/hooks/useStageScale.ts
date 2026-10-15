import { useEffect, useState } from 'react';

/** 逻辑画布尺寸 */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

/**
 * 计算 1920x1080 画布按窗口等比缩放的比例（contain 模式，留黑边）
 * @returns 缩放比例
 */
export function useStageScale(): number {
  const [scale, setScale] = useState(() => computeScale());

  useEffect(() => {
    const onResize = () => setScale(computeScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return scale;
}

function computeScale(): number {
  const w = window.innerWidth || STAGE_WIDTH;
  const h = window.innerHeight || STAGE_HEIGHT;
  return Math.min(w / STAGE_WIDTH, h / STAGE_HEIGHT);
}
