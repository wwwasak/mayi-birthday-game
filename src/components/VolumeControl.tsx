import { useEffect } from 'react';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { useAudioStatus } from '../hooks/useAudioStatus';
import { TEXTS } from '../config/texts';

/** 蛋糕房、吹蜡烛、最终祝福改播蛋糕房 BGM；音乐礼物页让出循环 BGM */
const CAKE_BGM_SCENES = new Set(['cake', 'candle', 'final']);

/**
 * 音量、静音和循环 BGM。
 * 没有历史选择时默认开启。浏览器拦住自动播放时，等第一次点击或按键再开始。
 * 玩家关掉之后写入存档，换场景不会再打开。《红豆》不走这里。
 */
export function VolumeControl() {
  const { scene, progress, setVolume, toggleMute, setBgmOn } = useGame();
  useAudioStatus();

  const bgmId = CAKE_BGM_SCENES.has(scene) ? 'bgm_cake' : 'bgm_park';
  const bgmOn = progress.audio.bgmOn;
  const bgmMissing = audio.getStatus(bgmId) === 'missing';
  const { volume, muted } = progress.audio;

  useEffect(() => {
    if (!bgmOn) return;
    if (scene === 'music') {
      audio.stopBgm();
      return;
    }
    const start = () => {
      if (!audio.isBgmEnabled()) return;
      audio.playBgm(bgmId);
    };
    start();
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, [bgmOn, scene, bgmId]);

  return (
    <div className="hud__pill" title="音量控制">
      <button
        className="hud__icon-btn"
        onClick={() => setBgmOn(!bgmOn)}
        title={bgmOn ? '停止背景音乐' : '播放背景音乐'}
        aria-label={bgmOn ? '停止背景音乐' : '播放背景音乐'}
        aria-pressed={bgmOn}
      >
        {bgmOn ? '⏸' : '🎵'}
      </button>
      {bgmMissing && <span style={{ fontSize: 14, color: '#a35b00' }}>{TEXTS.common.assetMissing}</span>}
      <button className="hud__icon-btn" onClick={toggleMute} title={muted ? '取消静音' : '静音'} aria-label="静音切换">
        {muted ? '🔇' : volume === 0 ? '🔈' : volume < 0.5 ? '🔉' : '🔊'}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(volume * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label="音量"
      />
      <span style={{ minWidth: 48, textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
    </div>
  );
}
