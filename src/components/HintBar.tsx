import { AnimatePresence, motion } from 'motion/react';
import { useHints } from '../core/HintContext';
import { ChibiMayi } from './ui/ChibiMayi';

/**
 * 提示槽：HUD 下方右侧的一句话提示 / 广播横幅
 * - pointer-events: none，绝不拦截玩家点击
 * - 广播用“📢”样式，目标提示用“💡”，闲置提示附带指路的 Q 版麻衣
 */
export function HintBar() {
  const { mode, text } = useHints();
  return (
    <div className="hint-slot" aria-live="polite">
      <AnimatePresence>
        {mode && text && (
          <motion.div
            key={`${mode}-${text}`}
            className={`hint-pill hint-pill--${mode}`}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {mode === 'idle' && <ChibiMayi action="point" facing="left" scale={0.42} className="hint-pill__chibi" />}
            <span className="hint-pill__icon">{mode === 'broadcast' ? '📢' : '💡'}</span>
            <span className="hint-pill__text">{text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
