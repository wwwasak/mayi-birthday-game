import { AnimatePresence, motion } from 'motion/react';
import { assetUrl } from '../../config/assets';
import { CANDLE_LAYOUT, CANDLE_WICK, CANDLES, type CandleId } from '../../config/candles';
import { useAssetImageReady } from '../../hooks/useAssetImageReady';

export interface CakeCandlesProps {
  /** 已点亮的蜡烛 */
  lit: Record<CandleId, boolean>;
  /** 已熄灭的蜡烛。熄灭优先于火苗 */
  blown: readonly CandleId[];
  /** 为 true 时，未点亮的蜡烛可以点击 */
  interactive?: boolean;
  /** 刚刚点亮金色蜡烛，播放一次围绕火焰的光晕 */
  goldBurst?: boolean;
  /** 这一次刚熄灭的蜡烛。只有它们冒烟，避免再次进入时重播 */
  justBlown?: readonly CandleId[];
  /** 点击一根未点亮的蜡烛 */
  onLight?: (id: CandleId) => void;
}

/**
 * 蛋糕上的五根蜡烛。
 * 蜡身已经画在蛋糕图里。这里只在每个烛芯上放火焰和点击区，不再另画一根蜡烛。
 * 外层负责把火焰底部钉在烛芯上，内层只做轻微摇曳，避免动画把定位 transform 盖掉。
 */
export function CakeCandles({ lit, blown, interactive = false, goldBurst = false, justBlown = [], onLight }: CakeCandlesProps) {
  const blownSet = new Set(blown);
  const smokeSet = new Set(justBlown);
  const flameReady = useAssetImageReady('item_flame');

  return (
    <div className="candle-row" data-testid="candle-row">
      {CANDLE_LAYOUT.map((id, index) => {
        const def = CANDLES[id];
        const wick = CANDLE_WICK[id];
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <span className="candle__flame-sway" style={{ animationDelay: `${index * -0.18}s` }}>
                  {flameReady && <img src={assetUrl('item_flame')} alt="" draggable={false} />}
                </span>
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
          smokeSet.has(id) ? 'candle--just-out' : '',
          goldBurst && def.gold && isLit ? 'candle--burst' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const slotStyle = { left: `${wick.x * 100}%`, top: `${wick.y * 100}%` };

        return (
          <div className="candle-slot" key={id} style={slotStyle}>
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
