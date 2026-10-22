import { useEffect, useSyncExternalStore } from 'react';
import { Button } from '../components/ui/Button';
import { ChibiMayi } from '../components/ui/ChibiMayi';
import { PlaceholderCharacter } from '../components/ui/PlaceholderCharacter';
import { SceneLayout } from '../components/ui/SceneLayout';
import { GUIDE_SPEAKER_LABEL } from '../config/characters';
import { TEXTS } from '../config/texts';
import { getVoiceCaption, getVoiceCaptionSnapshot, playCharacterVoice, subscribeVoiceCaption } from '../core/characterVoice';
import { useGame } from '../core/GameContext';

/**
 * 场景：隐藏彩蛋。后台控制室里，被下线的功能只留下一句。
 * 台词、触发和「找到过」的记录都沿用原来的规则，这里只排演出。
 */
export function EggScene() {
  const { patch, backToMap } = useGame();
  const t = TEXTS.egg;
  useSyncExternalStore(subscribeVoiceCaption, getVoiceCaptionSnapshot);
  const voice = getVoiceCaption();

  useEffect(() => {
    patch({ eggFound: true });
  }, [patch]);

  useEffect(() => {
    const id = window.setTimeout(() => playCharacterVoice('egg_quiet'), 500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <SceneLayout
      scene="egg"
      title={t.title}
      mood={null}
      actions={
        <Button variant="secondary" onClick={backToMap} data-testid="egg-back">
          {t.back}
        </Button>
      }
    >
      <div className="egg-room">
        <div className="egg-veil" aria-hidden />
        <div className="egg-spot" aria-hidden />
        <div className="egg-screen" data-testid="egg-screen">
          {t.lines.map((line, i) => (
            <p key={line} className="egg-line" style={{ animationDelay: `${0.45 + i * 0.7}s` }}>
              {line}
            </p>
          ))}
          <p className="egg-quote" data-testid="egg-quote">
            {t.quote}
          </p>
        </div>
        <div className="egg-player" aria-hidden>
          <PlaceholderCharacter mood="listen" frame="full" scale={1.72} />
        </div>
        {voice && (
          <div className="egg-host">
            <div className="egg-host__bubble" role="status">
              <span className="egg-host__who">{GUIDE_SPEAKER_LABEL}</span>
              <span className="egg-host__line">{voice.line}</span>
            </div>
            <div className="egg-host__cast">
              <ChibiMayi action={voice.action} scale={1.65} facing="left" />
            </div>
          </div>
        )}
      </div>
    </SceneLayout>
  );
}
