import { motion } from 'motion/react';
import { assetUrl } from '../../config/assets';
import { STAMPS, type StampId } from '../../config/stamps';
import { useAssetImageReady } from '../../hooks/useAssetImageReady';

/**
 * 印章图标：有正式图时显示 PNG，否则回退 emoji。
 */
export function StampIcon({ id, size }: { id: StampId; size: number }) {
  const def = STAMPS[id];
  const ready = useAssetImageReady(def.asset);
  if (!ready) return <>{def.emoji}</>;
  return (
    <img
      src={assetUrl(def.asset)}
      alt=""
      draggable={false}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', pointerEvents: 'none' }}
    />
  );
}

export interface StampBadgeProps {
  id: StampId;
  /** 是否已获得 */
  unlocked: boolean;
  /** 尺寸倍率 */
  scale?: number;
}

/**
 * 印章徽章：未获得为灰色虚线圆，获得后填充主题色并弹出动画
 */
export function StampBadge({ id, unlocked, scale = 1 }: StampBadgeProps) {
  const def = STAMPS[id];
  return (
    <div className="stamp">
      <motion.div
        className={`stamp__disc ${unlocked ? 'stamp__disc--on' : ''}`}
        style={{
          ['--stamp-color' as string]: def.color,
          width: 120 * scale,
          height: 120 * scale,
          fontSize: 56 * scale,
        }}
        initial={false}
        animate={unlocked ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        {unlocked ? <StampIcon id={id} size={Math.round(72 * scale)} /> : '?'}
      </motion.div>
      <span className={`stamp__name ${unlocked ? '' : 'stamp__name--off'}`} style={{ fontSize: Math.max(16, 22 * scale) }}>
        {def.name}
      </span>
    </div>
  );
}
