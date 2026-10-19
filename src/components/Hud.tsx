import { AnimatePresence, motion } from 'motion/react';
import { useSyncExternalStore } from 'react';
import { SCENES } from '../config/scenes';
import { TEXTS } from '../config/texts';
import { getVoiceCaption, getVoiceCaptionSnapshot, subscribeVoiceCaption } from '../core/characterVoice';
import { useGame } from '../core/GameContext';
import { useHints } from '../core/HintContext';
import { countStamps } from '../core/progress';
import { Button } from './ui/Button';
import { VolumeControl } from './VolumeControl';

/**
 * 常驻 HUD：左上场景名 + 返回地图；右上音量控制 + 存储状态；顶部中央提示
 */
export function Hud() {
  const { scene, progress, storageOk, toast, backToMap } = useGame();
  const { mode: hintMode } = useHints();
  useSyncExternalStore(subscribeVoiceCaption, getVoiceCaptionSnapshot);
  const voiceLine = getVoiceCaption();
  const def = SCENES[scene];
  const showStamps = scene !== 'boot' && scene !== 'gate' && scene !== 'auth' && scene !== 'notice';
  /** 提示槽可见时 toast 下移，避免重叠 */
  const toastTop = hintMode ? 170 : 110;

  return (
    <div className="hud">
      <div className="hud__top-left">
        <div className="hud__pill">
          <span style={{ fontWeight: 700 }}>{TEXTS.common.gameTitle}</span>
          <span style={{ color: 'var(--c-ink-soft)' }}>· {def.title}</span>
          {showStamps && <span style={{ color: 'var(--c-pink-deep)', fontWeight: 700 }}>印章 {countStamps(progress)}/4</span>}
        </div>
        {def.showBackToMap && (
          <Button variant="secondary" small onClick={backToMap}>
            {TEXTS.common.backToMap}
          </Button>
        )}
      </div>

      <div className="hud__top-right">
        {!storageOk && <div className="hud__pill hud__warn">{TEXTS.common.storageWarn}</div>}
        <VolumeControl />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            className="hud__toast"
            style={{ top: toastTop }}
            initial={{ opacity: 0, y: -30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ duration: 0.25 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voiceLine && (
          <motion.div
            key={voiceLine}
            className="hud__toast hud__voice"
            style={{ top: toast ? toastTop + 64 : toastTop }}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -12, x: '-50%' }}
            transition={{ duration: 0.2 }}
          >
            麻衣：{voiceLine}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
