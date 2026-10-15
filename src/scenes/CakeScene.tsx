import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { StampBadge } from '../components/ui/StampBadge';
import { STAMP_ORDER } from '../config/stamps';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { useSceneHint } from '../hooks/useSceneHint';

/**
 * 场景 9/10a：生日蛋糕房——四枚印章集齐后开放，点亮蛋糕
 */
export function CakeScene() {
  const { progress, lightAllCandles, goTo } = useGame();
  const t = TEXTS.cake;
  const lit = progress.cakeLit;
  useSceneHint('cake', { target: lit ? 'cake-next' : 'cake-light' });

  /** 本阶段仍为一键点亮：同时写入四根蜡烛状态，保证新版存档一致 */
  const light = () => {
    audio.playSfx('sfx_candle');
    lightAllCandles();
  };

  return (
    <SceneLayout
      scene="cake"
      title={t.title}
      subtitle={t.subtitle}
      mood={lit ? 'happy' : 'surprise'}
      actions={
        lit ? (
          <Button variant="gold" data-hint-target="cake-next" onClick={() => goTo('candle')}>
            {t.toCandle}
          </Button>
        ) : (
          <Button data-hint-target="cake-light" onClick={light}>
            {t.light}
          </Button>
        )
      }
    >
      <Card tag="占位 · 蛋糕 images/items/cake.png" style={{ textAlign: 'center' }}>
        <div className="stamp-tray" style={{ marginTop: 0, marginBottom: 28 }}>
          {STAMP_ORDER.map((id) => (
            <StampBadge key={id} id={id} unlocked={progress.stamps[id]} scale={0.7} />
          ))}
        </div>
        <motion.div
          className={`cake-base ${lit ? '' : 'cake-base--dark'}`}
          animate={lit ? { scale: [1, 1.05, 1], filter: 'brightness(1)' } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="candle-row" style={{ marginTop: -70 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div className="candle" key={i}>
                {lit && (
                  <motion.div
                    className="candle__flame"
                    animate={{ scaleX: [1, 0.85, 1.1, 1], scaleY: [1, 1.1, 0.9, 1] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
        <p className="card__text" style={{ marginTop: 28, fontWeight: 700, color: 'var(--c-pink-deep)', minHeight: 40 }}>
          {lit ? t.lit : ''}
        </p>
      </Card>
    </SceneLayout>
  );
}
