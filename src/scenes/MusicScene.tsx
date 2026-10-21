import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { stopCharacterVoice } from '../core/characterVoice';
import { useAudioStatus } from '../hooks/useAudioStatus';
import { useSceneHint } from '../hooks/useSceneHint';

const TRACK = 'music_hongdou' as const;

/**
 * 场景 11：音乐礼物《红豆》——用户手动播放或跳过；素材缺失时优雅提示
 */
export function MusicScene() {
  const { patch, goTo } = useGame();
  const t = TEXTS.music;
  useAudioStatus();
  const [ended, setEnded] = useState(false);
  useSceneHint('music');

  const playing = audio.isPlaying(TRACK);
  const missing = audio.getStatus(TRACK) === 'missing';

  // 离开场景时停止单曲，避免跨场景残留
  useEffect(() => () => audio.stop(TRACK), []);

  const play = () => {
    audio.stopBgm();
    stopCharacterVoice();
    setEnded(false);
    audio.playTrack(TRACK, () => {
      setEnded(true);
      patch({ musicDone: true });
    });
  };

  const stop = () => {
    audio.stop(TRACK);
    setEnded(true);
    patch({ musicDone: true });
  };

  const skip = () => {
    audio.stop(TRACK);
    patch({ musicDone: true });
    goTo('final');
  };

  return (
    <SceneLayout
      scene="music"
      title={t.title}
      subtitle={t.subtitle}
      mood={playing ? 'listen' : 'normal'}
      actions={
        <>
          <Button variant="ghost" onClick={skip}>
            {t.skip}
          </Button>
          {playing ? (
            <Button variant="secondary" onClick={stop}>
              {t.stop}
            </Button>
          ) : (
            <Button onClick={play}>{t.play}</Button>
          )}
          <Button variant="gold" disabled={!ended && !missing} onClick={() => goTo('final')}>
            {t.toFinal}
          </Button>
        </>
      }
    >
      <Card tag="占位 · 唱片机" style={{ textAlign: 'center', padding: 48 }}>
        <motion.div
          className="music-disc"
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={playing ? { duration: 4, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
        />
        <h3 className="card__title" style={{ marginTop: 28 }}>
          《红豆》
        </h3>
        <p className="card__text">
          {missing
            ? `${TEXTS.common.assetMissing} 可直接前往最终祝福。`
            : playing
              ? t.playing
              : ended
                ? '播放结束。'
                : '点击“播放”开始；也可以随时跳过。'}
        </p>
      </Card>
    </SceneLayout>
  );
}
