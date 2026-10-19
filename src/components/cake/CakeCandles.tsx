import { AnimatePresence, motion } from 'motion/react';
import { assetUrl } from '../../config/assets';
import { CANDLE_LAYOUT, CANDLES, type CandleId } from '../../config/candles';
import { useAssetImageReady } from '../../hooks/useAssetImageReady';

export interface CakeCandlesProps {
  /** 已点亮的蜡烛 */
  lit: Record<CandleId, boolean>;
  /** 已熄灭的蜡烛。熄灭优先于火苗 */
  blown: readonly CandleId[];
  /** 为 true 时，未点亮的蜡烛可以点击 */
  interactive?: boolean;
  /** 刚刚点亮金色蜡烛，播放一次金色光效 */
  goldBurst?: boolean;
  /** 点击一根未点亮的蜡烛 */
  onLight?: (id: CandleId) => void;
}

/**
 * 蛋糕上的五根蜡烛。
 * 从左到右是薄荷糖、美食、麻衣的心愿、认证考试、心愿屋。正中为金色。
 */
export function CakeCandles({ lit, blown, interactive = false, goldBurst = false, onLight }: CakeCandlesProps) {
  const blownSet = new Set(blown);
  const flameReady = useAssetImageReady('item_flame');

  return (
    <div className="candle-row" data-testid="candle-row">
      {CANDLE_LAYOUT.map((id) => {
        const def = CANDLES[id];
        const isLit = lit[id] && !blownSet.has(id);
        const isBlown = blownSet.has(id);
        const canLight = interactive && !lit[id] && !isBlown;
        const body = (
          <AnimatePresence>
            {isLit && (
              <motion.span
                key="flame"
                className={`candle__flame ${def.gold ? 'candle__flame--gold' : ''} ${flameReady ? 'candle__flame--art' : ''}`}
                data-testid={`flame-${id}`}
                initial={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                animate={{ x: '-50%', scaleX: [1, 0.85, 1.1, 1], scaleY: [1, 1.1, 0.9, 1] }}
                exit={{ x: '-50%', opacity: 0, scale: 0.2, y: -20, transition: { duration: 0.35, repeat: 0 } }}
                transition={{ duration: def.gold ? 0.7 : 0.85, repeat: Infinity }}
              >
                {flameReady && <img src={assetUrl('item_flame')} alt="" draggable={false} />}
              </motion.span>
            )}
          </AnimatePresence>
        );
        const className = [
          'candle',
          `candle--${id}`,
          def.gold ? 'candle--gold' : '',
          isLit ? 'candle--lit' : '',
          isBlown ? 'candle--out' : '',
          goldBurst && def.gold && isLit ? 'candle--burst' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div className="candle-slot" key={id}>
            {canLight ? (
              <button
                type="button"
                className={className}
                data-testid={`candle-${id}`}
                data-candle={id}
                data-lit="0"
                data-blown="0"
                aria-label={`点亮${def.name}蜡烛`}
                onClick={() => onLight?.(id)}
              >
                {body}
              </button>
            ) : (
              <div
                className={className}
                data-testid={`candle-${id}`}
                data-candle={id}
                data-lit={isLit ? '1' : '0'}
                data-blown={isBlown ? '1' : '0'}
                aria-hidden
              >
                {body}
              </div>
            )}
            <span className="candle__name">{def.name}</span>
          </div>
        );
      })}
    </div>
  );
}
