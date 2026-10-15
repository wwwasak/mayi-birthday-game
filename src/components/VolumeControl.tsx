import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { useAudioStatus } from '../hooks/useAudioStatus';
import { TEXTS } from '../config/texts';

/**
 * 音量与静音控制 + BGM 开关（BGM 只能由用户手动开启，绝不自动播放）
 */
export function VolumeControl() {
  const { progress, setVolume, toggleMute } = useGame();
  useAudioStatus();

  const bgmId = 'bgm_park' as const;
  const bgmPlaying = audio.isPlaying(bgmId);
  const bgmMissing = audio.getStatus(bgmId) === 'missing';
  const { volume, muted } = progress.audio;

  return (
    <div className="hud__pill" title="音量控制">
      <button
        className="hud__icon-btn"
        onClick={() => {
          if (bgmPlaying) audio.stopBgm();
          else audio.playBgm(bgmId);
        }}
        title={bgmPlaying ? '停止背景音乐' : '播放背景音乐'}
        aria-label={bgmPlaying ? '停止背景音乐' : '播放背景音乐'}
      >
        {bgmPlaying ? '⏸' : '🎵'}
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
