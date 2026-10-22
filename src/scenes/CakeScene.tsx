import { useEffect, useState } from 'react';
import { CakeCandles } from '../components/cake/CakeCandles';
import { CakeRoomCast } from '../components/cake/CakeRoomCast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { StampBadge } from '../components/ui/StampBadge';
import { assetUrl } from '../config/assets';
import { CANDLE_IDS, type CandleId } from '../config/candles';
import { STAMP_ORDER } from '../config/stamps';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useSceneHint } from '../hooks/useSceneHint';

/**
 * 生日蛋糕房。
 * 可以逐根点亮，也可以一键点亮。五根都亮之后才能去吹蜡烛。
 * 正中的金色蜡烛代表麻衣自己的心愿，点亮时有单独的金色光效。
 */
export function CakeScene() {
  const { progress, lightCandle, lightAllCandles, goTo } = useGame();
  const t = TEXTS.cake;
  const cakeReady = useAssetImageReady('item_cake');
  const lit = progress.cakeLit;
  const [goldBurst, setGoldBurst] = useState(false);
  useSceneHint('cake', { target: lit ? 'cake-next' : 'cake-light' });

  useEffect(() => {
    if (!goldBurst) return;
    const id = window.setTimeout(() => setGoldBurst(false), 1200);
    return () => window.clearTimeout(id);
  }, [goldBurst]);

  /** 点亮一根。金色蜡烛额外给一次闪光 */
  const lightOne = (id: CandleId) => {
    if (progress.candles[id]) return;
    const willFinish = CANDLE_IDS.every((cid) => cid === id || progress.candles[cid]);
    audio.playSfx('sfx_candle');
    if (id === 'mayi') {
      audio.playSfx('sfx_sparkle');
      setGoldBurst(true);
    }
    if (willFinish) playCharacterVoice('cake_birthday');
    lightCandle(id);
  };

  /** 一键点亮五根。若金色还没亮，同样播放金色光效 */
  const lightAll = () => {
    const goldWasDark = !progress.candles.mayi;
    if (!progress.cakeLit) playCharacterVoice('cake_birthday');
    audio.playSfx('sfx_candle');
    if (goldWasDark) {
      audio.playSfx('sfx_sparkle');
      setGoldBurst(true);
    }
    lightAllCandles();
  };

  return (
    <SceneLayout
      scene="cake"
      title={t.title}
      subtitle={t.subtitle}
      mood={null}
      actions={
        lit ? (
          <Button variant="gold" data-hint-target="cake-next" onClick={() => goTo('candle')}>
            {t.toCandle}
          </Button>
        ) : (
          <Button data-hint-target="cake-light" onClick={lightAll}>
            {t.light}
          </Button>
        )
      }
    >
      <Card className="cake-card" tag={cakeReady ? undefined : '占位 · 蛋糕 images/items/cake.png'}>
        <div className="cake-room">
          <div className="cake-stamps stamp-tray">
            {STAMP_ORDER.map((id) => (
              <StampBadge key={id} id={id} unlocked={progress.stamps[id]} scale={0.62} />
            ))}
          </div>
          {cakeReady ? (
            <div className="cake-stage">
              <div className="cake-visual">
                <img className={`cake-stage__img ${lit ? '' : 'cake-stage__img--dim'}`} src={assetUrl('item_cake')} alt="" draggable={false} />
                <CakeCandles lit={progress.candles} blown={[]} interactive={!lit} goldBurst={goldBurst} onLight={lightOne} />
              </div>
            </div>
          ) : (
            <div className={`cake-base ${lit ? '' : 'cake-base--dark'}`}>
              <CakeCandles lit={progress.candles} blown={[]} interactive={!lit} goldBurst={goldBurst} onLight={lightOne} />
            </div>
          )}
          <p className="cake-status">{lit ? t.lit : t.progress(Object.values(progress.candles).filter(Boolean).length)}</p>
          <CakeRoomCast mood={lit ? 'happy' : 'normal'} />
        </div>
      </Card>
    </SceneLayout>
  );
}
