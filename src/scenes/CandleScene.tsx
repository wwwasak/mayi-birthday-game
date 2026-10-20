import { useEffect, useState } from 'react';
import { CakeCandles } from '../components/cake/CakeCandles';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { assetUrl } from '../config/assets';
import { CANDLE_IDS } from '../config/candles';
import type { GuideAction } from '../config/characters';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useSceneHint } from '../hooks/useSceneHint';

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
  useSceneHint('candle', { target: 'candle-action' });

  useEffect(() => {
    if (progress.blownCandles.length > 0) return;
    playCharacterVoice('cake_make_wish');
  }, [progress.blownCandles.length]);

  const blow = () => {
    if (done) return;
    setWished(true);
    const wave = blowNextCandles();
    if (wave.length === 0) return;
    audio.playSfx('sfx_blow');
    if (wave.includes('mayi')) {
      audio.playSfx('sfx_sparkle');
      setCheering(true);
    }
  };

  const left = CANDLE_IDS.filter((id) => !progress.blownCandles.includes(id)).length;
  const guideAction: GuideAction = done || cheering ? 'cheer' : wished ? 'point' : 'pray';

  return (
    <SceneLayout
      scene="candle"
      title={t.title}
      subtitle={t.subtitle}
      mood={done ? 'happy' : wished ? 'normal' : 'wish'}
      guide={{ action: guideAction, scale: 0.9, followVoice: true }}
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
      <Card tag="占位 · 蜡烛交互" style={{ textAlign: 'center' }}>
        {cakeReady ? (
          <div className="cake-stage">
            <img className={`cake-stage__img ${done ? 'cake-stage__img--dim' : ''}`} src={assetUrl('item_cake')} alt="" draggable={false} />
            <CakeCandles lit={progress.candles} blown={progress.blownCandles} />
          </div>
        ) : (
          <div className={`cake-base ${done ? 'cake-base--dark' : ''}`}>
            <CakeCandles lit={progress.candles} blown={progress.blownCandles} />
          </div>
        )}
        <p className="card__text" style={{ marginTop: 18, fontWeight: 700, color: 'var(--c-pink-deep)', minHeight: 40 }} data-testid="candle-status">
          {done ? t.wishSent : wished ? t.left(left) : t.wishPrompt}
        </p>
        {done && <p className="card__text" style={{ marginTop: 6 }}>{t.blown}</p>}
        {done && cheering && <div className="cake-celebrate" data-testid="candle-celebrate" />}
      </Card>
    </SceneLayout>
  );
}
