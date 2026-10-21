import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AUDIO_DEFAULTS } from '../core/progress';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { useAudioStatus } from '../hooks/useAudioStatus';
import { TEXTS } from '../config/texts';

/** 蛋糕房、吹蜡烛、最终祝福改播蛋糕房 BGM；音乐礼物页停掉循环 BGM */
const CAKE_BGM_SCENES = new Set(['cake', 'candle', 'final']);

const ROWS = [
  { key: 'volume', label: '总音量' },
  { key: 'bgm', label: '背景音乐' },
  { key: 'voice', label: '麻衣语音' },
  { key: 'sfx', label: '游戏音效' },
  { key: 'gift', label: '礼物音乐' },
] as const;

/**
 * 右上角声音入口。点击后在视口中央打开设置弹窗（Portal），不随舞台裁切。
 * 循环 BGM 只在场景或开关变化时请求一次。
 */
export function VolumeControl() {
  const { scene, progress, setAudio, setBgmOn } = useGame();
  useAudioStatus();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const bgmId = CAKE_BGM_SCENES.has(scene) ? 'bgm_cake' : 'bgm_park';
  const bgmOn = progress.audio.bgmOn;
  const bgmMissing = audio.getStatus(bgmId) === 'missing';
  const { muted, volume } = progress.audio;

  useEffect(() => {
    if (!bgmOn) return;
    if (scene === 'music') {
      audio.stopBgm();
      return;
    }
    audio.playBgm(bgmId);
  }, [bgmOn, scene, bgmId]);

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openDialog = useCallback(() => {
    if (open) return;
    setOpen(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  const icon = muted || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊';

  const modal =
    open &&
    createPortal(
      <div className="audio-modal-overlay" aria-hidden={false}>
        <div
          className="audio-modal"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-modal-title"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="audio-modal__card">
            <button
              type="button"
              ref={closeRef}
              className="audio-modal__close"
              aria-label="关闭声音设置"
              onClick={close}
            >
              ×
            </button>
            <h2 id="audio-modal-title" className="audio-modal__title">声音设置</h2>
            <div className="audio-modal__body">
              {ROWS.map((row) => {
                const value = Math.round(progress.audio[row.key] * 100);
                return (
                  <label key={row.key} className="audio-modal__row">
                    <span className="audio-modal__label">{row.label}</span>
                    <input
                      className="audio-modal__slider"
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      aria-label={row.label}
                      onChange={(e) => {
                        const next = Number(e.target.value) / 100;
                        if (row.key === 'bgm' && next > 0 && !bgmOn) setBgmOn(true);
                        setAudio({ [row.key]: next });
                      }}
                    />
                    <em className="audio-modal__pct">{value}%</em>
                  </label>
                );
              })}
              {bgmMissing && <p className="audio-modal__warn">{TEXTS.common.assetMissing}</p>}
              {!bgmOn && (
                <button type="button" className="audio-modal__link" onClick={() => setBgmOn(true)}>
                  继续播放背景音乐
                </button>
              )}
              <div className="audio-modal__actions">
                <button type="button" className="audio-modal__btn" onClick={() => setAudio({ muted: !muted })}>
                  {muted ? '取消静音' : '全部静音'}
                </button>
                <button type="button" className="audio-modal__btn" onClick={() => setAudio({ ...AUDIO_DEFAULTS })}>
                  恢复默认
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <div className="hud__pill hud-audio" title="声音设置">
        <button
          ref={triggerRef}
          type="button"
          className="hud__icon-btn"
          aria-label="打开声音设置"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={openDialog}
        >
          {icon}
        </button>
      </div>
      {modal}
    </>
  );
}
