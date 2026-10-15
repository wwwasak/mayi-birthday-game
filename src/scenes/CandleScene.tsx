import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { useSceneHint } from '../hooks/useSceneHint';

const CANDLE_COUNT = 5;

/**
 * 场景 10b：吹蜡烛——点击按钮逐根吹灭
 */
export function CandleScene() {
  const { progress, patch, goTo } = useGame();
  const t = TEXTS.candle;
  const [blown, setBlown] = useState<number>(progress.candlesBlown ? CANDLE_COUNT : 0);
  const allOut = blown >= CANDLE_COUNT;
  useSceneHint('candle', { target: 'candle-action' });

  const blow = () => {
    if (allOut) return;
    audio.playSfx('sfx_blow');
    const n = Math.min(CANDLE_COUNT, blown + 2);
    setBlown(n);
    if (n >= CANDLE_COUNT) patch({ candlesBlown: true });
  };

  return (
    <SceneLayout
      scene="candle"
      title={t.title}
      subtitle={t.subtitle}
      mood={allOut ? 'happy' : 'normal'}
      actions={
        allOut ? (
          <Button variant="gold" data-hint-target="candle-action" onClick={() => goTo('music')}>
            {t.toMusic}
          </Button>
        ) : (
          <Button data-hint-target="candle-action" onClick={blow}>
            {t.blow}
          </Button>
        )
      }
    >
      <Card tag="占位 · 蜡烛交互" style={{ textAlign: 'center' }}>
        <div className="cake-base">
          <div className="candle-row" style={{ marginTop: -70 }}>
            {Array.from({ length: CANDLE_COUNT }, (_, i) => (
              <div className="candle" key={i}>
                <AnimatePresence>
                  {i >= blown && (
                    <motion.div
                      className="candle__flame"
                      exit={{ opacity: 0, scale: 0.2, y: -20, transition: { duration: 0.3, repeat: 0 } }}
                      animate={{ scaleX: [1, 0.85, 1.1, 1], scaleY: [1, 1.1, 0.9, 1] }}
                      transition={{ duration: 0.8 + i * 0.1, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        <p className="card__text" style={{ marginTop: 28, fontWeight: 700, color: 'var(--c-pink-deep)', minHeight: 40 }}>
          {allOut ? t.blown : `还剩 ${CANDLE_COUNT - blown} 根蜡烛`}
        </p>
      </Card>
    </SceneLayout>
  );
}
