import { motion } from 'motion/react';
import { STAMPS, type StampId } from '../../config/stamps';

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
        {unlocked ? def.emoji : '?'}
      </motion.div>
      <span className={`stamp__name ${unlocked ? '' : 'stamp__name--off'}`} style={{ fontSize: Math.max(16, 22 * scale) }}>
        {def.name}
      </span>
    </div>
  );
}
