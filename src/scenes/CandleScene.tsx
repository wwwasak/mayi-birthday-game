import { useEffect, useState } from 'react';
import { CakeCandles } from '../components/cake/CakeCandles';
import { CakeRoomCast } from '../components/cake/CakeRoomCast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { assetUrl } from '../config/assets';
import { CANDLE_IDS, type CandleId } from '../config/candles';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useSceneHint } from '../hooks/useSceneHint';

/** 最后一根熄灭后，从烛火一带散开的小星光。坐标相对蛋糕图。 */
const FINALE_SPARKS: { x: number; y: number; dx: number; dy: number; delay: number; pink?: boolean }[] = [
  { x: 30, y: 2, dx: -86, dy: -36, delay: 0 },
  { x: 38, y: 0, dx: -28, dy: -64, delay: 0.08 },
  { x: 50, y: -2, dx: 0, dy: -78, delay: 0.04, pink: true },
  { x: 62, y: 0, dx: 34, dy: -60, delay: 0.12 },
  { x: 70, y: 2, dx: 88, dy: -32, delay: 0.06, pink: true },
  { x: 34, y: 8, dx: -110, dy: -8, delay: 0.16 },
  { x: 66, y: 8, dx: 112, dy: -6, delay: 0.14, pink: true },
  { x: 46, y: 4, dx: -18, dy: -48, delay: 0.2 },
  { x: 54, y: 4, dx: 20, dy: -52, delay: 0.18, pink: true },
  { x: 42, y: 12, dx: -64, dy: 10, delay: 0.22 },
  { x: 58, y: 12, dx: 66, dy: 8, delay: 0.24, pink: true },
  { x: 50, y: 6, dx: 8, dy: -40, delay: 0.1 },
];

/**
 * 全部吹灭后的一次星光。挂在蛋糕图内部，跟着蛋糕走，不另开一层矩形光框。
 */
function CakeFinale() {
  return (
    <div className="cake-finale" data-testid="candle-celebrate" aria-hidden>
      {FINALE_SPARKS.map((spark, index) => (
        <span
          key={index}
          className={`cake-finale__spark ${spark.pink ? 'cake-finale__spark--pink' : ''}`}
          style={{
            ['--x' as string]: `${spark.x}%`,
            ['--y' as string]: `${spark.y}%`,
            ['--dx' as string]: `${spark.dx}px`,
            ['--dy' as string]: `${spark.dy}px`,
            animationDelay: `${spark.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * 吹蜡烛。
 * 先由 Q 版向导请玩家许愿，玩家可以确认，也可以直接吹。
 * 每次点击最多熄灭两根，顺序是外侧两根、内侧两根、最后正中金色。
 * 金色熄灭后仍去音乐礼物。生日快乐已经在点亮时说过，这里不再播。
 */
export function CandleScene() {
  const { progress, blowNextCandles, goTo } = useGame();
  const t = TEXTS.candle;
  const cakeReady = useAssetImageReady('item_cake');
  const done = progress.blownCandles.length >= CANDLE_IDS.length;
  const [cheering, setCheering] = useState(false);
  const [wished, setWished] = useState(progress.blownCandles.length > 0);
  const [justBlown, setJustBlown] = useState<readonly CandleId[]>([]);
  useSceneHint('candle', { target: 'candle-action' });

  useEffect(() => {
    if (progress.blownCandles.length > 0) return;
    playCharacterVoice('cake_make_wish');
  }, [progress.blownCandles.length]);

  const blow = () => {
    if (done) return;
    setWished(true);
    const wave = blowNextCandles();
    setJustBlown(wave);
    if (wave.length === 0) return;
    audio.playSfx('sfx_blow');
    if (wave.includes('mayi')) {
      audio.playSfx('sfx_sparkle');
      setCheering(true);
    }
  };

  const left = CANDLE_IDS.filter((id) => !progress.blownCandles.includes(id)).length;

  return (
    <SceneLayout
      scene="candle"
      title={t.title}
      subtitle={t.subtitle}
      mood={null}
      actions={
        done ? (
          <Button variant="gold" data-hint-target="candle-action" data-testid="candle-to-music" onClick={() => goTo('music')}>
            {t.toMusic}
          </Button>
        ) : (
          <>
            {!wished && (
              <Button variant="secondary" data-testid="candle-wish" onClick={() => { audio.playSfx('sfx_click'); setWished(true); }}>
                {t.wished}
              </Button>
            )}
            <Button data-hint-target="candle-action" data-testid="candle-blow" onClick={blow}>
              {t.blow}
            </Button>
          </>
        )
      }
    >
      <Card className="cake-card" tag={cakeReady ? undefined : '占位 · 蜡烛交互'}>
        <div className="cake-room">
          {cakeReady ? (
            <div className="cake-stage">
              <div className="cake-visual">
                <img className={`cake-stage__img ${done ? 'cake-stage__img--dim' : ''}`} src={assetUrl('item_cake')} alt="" draggable={false} />
                {cheering && <CakeFinale />}
                <CakeCandles lit={progress.candles} blown={progress.blownCandles} justBlown={justBlown} />
              </div>
            </div>
          ) : (
            <div className={`cake-base ${done ? 'cake-base--dark' : ''}`}>
              <CakeCandles lit={progress.candles} blown={progress.blownCandles} />
            </div>
          )}
          <p className="cake-status" data-testid="candle-status">
            {done ? t.wishSent : wished ? t.left(left) : t.wishPrompt}
          </p>
          {done && <p className="cake-status cake-status--sub">{t.blown}</p>}
          <CakeRoomCast mood={done ? 'happy' : 'wish'} />
        </div>
      </Card>
    </SceneLayout>
  );
}
