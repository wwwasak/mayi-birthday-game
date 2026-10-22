import { AnimatePresence, motion } from 'motion/react';
import { memo, useSyncExternalStore } from 'react';
import { ChibiMayi } from '../ui/ChibiMayi';
import { PlaceholderCharacter } from '../ui/PlaceholderCharacter';
import { GUIDE_SPEAKER_LABEL, type PlayerMood } from '../../config/characters';
import { getVoiceCaption, getVoiceCaptionSnapshot, subscribeVoiceCaption } from '../../core/characterVoice';

/**
 * 蛋糕房的两位麻衣。
 * 普通立绘站在画面左下，只露出上半身。Q 版只在她说出引导或祝福时出现，气泡跟着她。
 */
export const CakeRoomCast = memo(function CakeRoomCast({ mood }: { mood: PlayerMood }) {
  useSyncExternalStore(subscribeVoiceCaption, getVoiceCaptionSnapshot);
  const voice = getVoiceCaption();

  return (
    <>
      <div className="cake-player" aria-hidden>
        <PlaceholderCharacter mood={mood} frame="full" scale={2.15} />
      </div>
      <div className="cake-guide">
        <AnimatePresence>
          {voice && (
            <motion.div
              key={voice.line}
              className="cake-guide__cast"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <div className="cake-guide__bubble" role="status">
                <span className="cake-guide__who">{GUIDE_SPEAKER_LABEL}</span>
                <span className="cake-guide__line">{voice.line}</span>
              </div>
              <ChibiMayi action={voice.action} scale={1.75} facing="left" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});
