import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PlaceholderBackground } from '../components/ui/PlaceholderBackground';
import { assetUrl } from '../config/assets';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { hasAnyProgress } from '../core/progress';
import { useAssetImageReady } from '../hooks/useAssetImageReady';

/** 连接动画总时长（毫秒） */
const CONNECT_MS = 2400;

/**
 * 场景 1：开场动画——正在连接麻衣专属生日频道
 * 不自动播放任何声音；连接完成后由用户点击进入
 */
export function BootScene() {
  const { goTo, progress } = useGame();
  const logoReady = useAssetImageReady('ui_logo');
  const [pct, setPct] = useState(0);
  const steps = TEXTS.boot.steps;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / CONNECT_MS));
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const done = pct >= 1;
  const stepIdx = Math.min(steps.length - 1, Math.floor(pct * steps.length));
  const canResume = hasAnyProgress(progress);

  /** 根据进度决定进入哪一幕：未过闸机 → 闸机；否则直达地图 */
  const enter = () => {
    if (!progress.authDone) goTo('gate');
    else goTo('map');
  };

  return (
    <div className="scene">
      <div className="scene__bg">
        <PlaceholderBackground asset="bg_boot" />
      </div>
      <div className="scene__content" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ width: 900 }}
        >
          <Card tag={logoReady ? undefined : '占位标题 LOGO · images/ui/logo.png'}>
            {logoReady ? (
              <img className="boot-logo" src={assetUrl('ui_logo')} alt={TEXTS.common.gameTitle} draggable={false} />
            ) : (
              <h1 className="scene__title" style={{ fontSize: 72, textAlign: 'center' }}>
                {TEXTS.common.gameTitle}
              </h1>
            )}
            <p className="scene__subtitle" style={{ textAlign: 'center', marginTop: 24 }}>
              {done ? steps[steps.length - 1] : TEXTS.boot.connecting}
            </p>
            <div className="progress-bar" style={{ marginTop: 32 }}>
              <motion.div className="progress-bar__fill" style={{ width: `${Math.round(pct * 100)}%` }} />
            </div>
            <p style={{ textAlign: 'center', fontSize: 22, color: 'var(--c-ink-soft)', marginTop: 12 }}>
              {Math.round(pct * 100)}% · {steps[stepIdx]}
            </p>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
              <Button disabled={!done} data-hint-target="boot-enter" onClick={() => (canResume ? goTo('gate') : enter())}>
                {canResume ? '重新从开头体验' : TEXTS.boot.enter}
              </Button>
              {canResume && (
                <Button variant="gold" disabled={!done} onClick={enter}>
                  {TEXTS.boot.resume}
                </Button>
              )}
            </div>
            <p style={{ textAlign: 'center', fontSize: 18, color: 'var(--c-ink-soft)', marginTop: 24 }}>
              {TEXTS.boot.hint}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
