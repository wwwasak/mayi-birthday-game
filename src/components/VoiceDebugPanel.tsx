import { useSyncExternalStore } from 'react';
import { ASSETS, type AssetId, type AudioAssetId } from '../config/assets';
import { isDebugUiEnabled } from '../config/debugUi';
import { audio } from '../core/audio';
import { previewCharacterVoice } from '../core/characterVoice';

/**
 * 只在开发地址加 `?debug=1` 时出现的语音试听条。
 * 正式构建不会渲染。
 */
export function VoiceDebugPanel() {
  useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  if (!isDebugUiEnabled()) return null;

  const voices = (Object.keys(ASSETS) as AssetId[]).filter((id) => {
    const entry = ASSETS[id];
    return 'group' in entry && entry.group === 'voice';
  }) as AudioAssetId[];

  const debug = audio.getDebug();

  return (
    <aside className="voice-debug" aria-label="角色语音试听">
      <strong>音频调试</strong>
      <p>
        BGM {debug.bgmId ?? '无'} #{debug.soundId ?? '-'} · {debug.state}
        {debug.ducking ? ' · 压低中' : ''} · 增益 {debug.volume.toFixed(3)} · 在响 {debug.sounding}
      </p>
      <p>
        实例 park {debug.instances.bgm_park ?? 0} / cake {debug.instances.bgm_cake ?? 0} / 红豆 {debug.instances.music_hongdou ?? 0}
      </p>
      {debug.logs.length > 0 && <p>{debug.logs[debug.logs.length - 1]}</p>}
      <strong>角色语音试听</strong>
      <ul>
        {voices.map((id) => {
          const status = audio.getStatus(id);
          return (
            <li key={id}>
              <button type="button" onClick={() => previewCharacterVoice(id)}>
                试听
              </button>
              <span>
                {ASSETS[id].description}
                <em>
                  {id} · {status === 'idle' ? '未加载' : status === 'ready' ? '可播放' : status === 'missing' ? '文件缺失' : '加载中'}
                </em>
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
