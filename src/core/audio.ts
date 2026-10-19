import { Howl, Howler } from 'howler';
import { ASSETS, assetUrl, type AssetEntry, type AudioAssetId } from '../config/assets';
import type { VoicePriority } from '../config/voices';

/** 角色说话时，BGM 降到原音量的这个比例 */
const BGM_DUCK = 0.32;

/** 单条音频的加载状态 */
export type AudioStatus = 'idle' | 'loading' | 'ready' | 'missing';

/**
 * 音频管理器（基于 Howler）
 *
 * 设计要点：
 * - 懒加载：仅在首次 play 时创建 Howl，首次进入游戏绝不自动播放
 * - html5 模式：file:// 协议下 Web Audio 的 XHR 解码会被 CORS 拦截，HTML5 Audio 可直接播放
 * - 容错：素材缺失时标记为 missing，不抛错，UI 可据此提示“素材未就绪”
 */
class AudioManager {
  private howls = new Map<AudioAssetId, Howl>();
  private status = new Map<AudioAssetId, AudioStatus>();
  private currentBgm: AudioAssetId | null = null;
  /** 玩家是否主动打开了背景音乐。场景切换只在此为 true 时换曲。 */
  private bgmEnabled = false;
  private lastSfxAt = new Map<AudioAssetId, number>();
  private listeners = new Set<() => void>();
  private snapshot = 0;
  /** 正在说的角色语音。同一时间只留一句。 */
  private activeVoice: { id: AudioAssetId; priority: VoicePriority } | null = null;

  /** 订阅状态变化（供 useSyncExternalStore 使用） */
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** 获取版本快照（任何状态变化都会 +1） */
  getSnapshot = (): number => this.snapshot;

  private emit(): void {
    this.snapshot += 1;
    this.listeners.forEach((fn) => fn());
  }

  /**
   * 查询某条音频状态
   * @param id 音频资源 ID
   */
  getStatus(id: AudioAssetId): AudioStatus {
    return this.status.get(id) ?? 'idle';
  }

  /** 当前正在播放的 BGM */
  getCurrentBgm(): AudioAssetId | null {
    return this.currentBgm;
  }

  /** 正在播放的角色语音；没有时为 null */
  getActiveVoice(): { id: AudioAssetId; priority: VoicePriority } | null {
    return this.activeVoice;
  }

  /**
   * 判断某条音频是否正在播放
   * @param id 音频资源 ID
   */
  isPlaying(id: AudioAssetId): boolean {
    return this.howls.get(id)?.playing() ?? false;
  }

  /**
   * 设置主音量
   * @param v 0~1
   */
  setVolume(v: number): void {
    Howler.volume(Math.min(1, Math.max(0, v)));
  }

  /**
   * 设置静音
   * @param muted 是否静音
   */
  setMuted(muted: boolean): void {
    Howler.mute(muted);
  }

  private getOrCreate(id: AudioAssetId): Howl {
    const existing = this.howls.get(id);
    if (existing) return existing;

    const entry: AssetEntry = ASSETS[id];
    this.status.set(id, 'loading');
    this.emit();

    const howl = new Howl({
      src: [assetUrl(id)],
      html5: true,
      preload: true,
      loop: entry.loop ?? false,
      volume: entry.volume ?? 1,
      onload: () => {
        this.status.set(id, 'ready');
        this.emit();
      },
      onloaderror: () => {
        this.status.set(id, 'missing');
        this.emit();
      },
      onplayerror: () => {
        // 浏览器拦住自动播放时不要当成文件缺失。循环 BGM 和解锁后的角色语音各补播一次。
        if (entry.loop) {
          howl.once('unlock', () => {
            if (this.bgmEnabled && this.currentBgm === id) {
              try {
                howl.play();
              } catch {
                /* 仍被策略拦住时保持静默 */
              }
            }
          });
        } else if (entry.group === 'voice') {
          howl.once('unlock', () => {
            if (this.activeVoice?.id === id) {
              try {
                howl.play();
              } catch {
                /* 仍被策略拦住时保持静默 */
              }
            }
          });
        }
        this.emit();
      },
      onend: () => this.emit(),
      onstop: () => this.emit(),
      onplay: () => this.emit(),
    });
    this.howls.set(id, howl);
    return howl;
  }

  /**
   * 播放音效（一次性）
   * @param id 音频资源 ID
   */
  playSfx(id: AudioAssetId): void {
    if (this.status.get(id) === 'missing') return;
    if (id === 'sfx_click' && (this.isPlaying('sfx_success') || this.isPlaying('sfx_stamp') || this.isPlaying('sfx_unlock'))) return;
    const now = performance.now();
    const prev = this.lastSfxAt.get(id) ?? 0;
    if ((id === 'sfx_click' || id === 'sfx_pop') && now - prev < 70) return;
    this.lastSfxAt.set(id, now);
    try {
      const howl = this.getOrCreate(id);
      if (id === 'sfx_click' || id === 'sfx_pop') howl.stop();
      howl.play();
    } catch {
      this.status.set(id, 'missing');
      this.emit();
    }
  }

  /**
   * 播放 BGM（自动停止上一首）
   * @param id 音频资源 ID
   */
  /** 玩家是否打开了循环 BGM */
  isBgmEnabled(): boolean {
    return this.bgmEnabled;
  }

  /**
   * 打开或关闭循环 BGM。关闭时停止当前曲子。
   * @param on 是否开启
   */
  setBgmEnabled(on: boolean): void {
    this.bgmEnabled = on;
    if (!on) this.stopBgm();
    else this.emit();
  }

  playBgm(id: AudioAssetId): void {
    if (!this.bgmEnabled) return;
    if (this.currentBgm === id && this.isPlaying(id)) return;
    const prevId = this.currentBgm;
    if (prevId && prevId !== id) {
      const old = this.howls.get(prevId);
      try {
        if (old?.playing()) old.fade(old.volume(), 0, 380);
        window.setTimeout(() => {
          if (this.currentBgm !== prevId) old?.stop();
        }, 400);
      } catch {
        old?.stop();
      }
    }
    this.currentBgm = id;
    if (this.status.get(id) === 'missing') {
      this.emit();
      return;
    }
    try {
      const howl = this.getOrCreate(id);
      const base = ASSETS[id].volume ?? 0.32;
      const target = this.activeVoice ? base * BGM_DUCK : base;
      if (!howl.playing()) {
        howl.volume(0);
        howl.play();
      }
      howl.fade(howl.volume(), target, 480);
    } catch {
      this.status.set(id, 'missing');
    }
    this.emit();
  }

  /**
   * 播放一句角色语音。会停掉上一句，并压低正在播的 BGM。
   * 静音沿用 Howler 的总开关。文件缺失时调用 onDone，不抛错。
   * @param id 语音资源 ID
   * @param priority 优先级，供下一句决定能不能打断
   * @param onDone 播放结束、失败或被下一句替换时
   */
  playVoice(id: AudioAssetId, priority: VoicePriority, onDone?: () => void): void {
    this.stopVoicePlayback(false);
    this.activeVoice = { id, priority };
    this.duckBgm();
    if (this.status.get(id) === 'missing') {
      this.activeVoice = null;
      this.restoreBgm();
      onDone?.();
      this.emit();
      return;
    }
    try {
      const howl = this.getOrCreate(id);
      let settled = false;
      const finish = () => {
        if (settled || this.activeVoice?.id !== id) return;
        settled = true;
        this.activeVoice = null;
        this.restoreBgm();
        onDone?.();
        this.emit();
      };
      howl.once('end', finish);
      howl.once('loaderror', finish);
      howl.play();
    } catch {
      this.status.set(id, 'missing');
      this.activeVoice = null;
      this.restoreBgm();
      onDone?.();
    }
    this.emit();
  }

  /** 停掉角色语音并恢复 BGM */
  stopVoice(): void {
    this.stopVoicePlayback(true);
  }

  /**
   * @param restore 是否把 BGM 音量放回来
   */
  private stopVoicePlayback(restore: boolean): void {
    const current = this.activeVoice;
    this.activeVoice = null;
    if (current) {
      try {
        this.howls.get(current.id)?.stop();
      } catch {
        /* 忽略 */
      }
    }
    if (restore) this.restoreBgm();
    this.emit();
  }

  /** 说话时把当前 BGM 拉低 */
  private duckBgm(): void {
    if (!this.currentBgm) return;
    const howl = this.howls.get(this.currentBgm);
    if (!howl?.playing()) return;
    const base = ASSETS[this.currentBgm].volume ?? 0.32;
    try {
      howl.fade(howl.volume(), base * BGM_DUCK, 180);
    } catch {
      /* 忽略 */
    }
  }

  /** 话说完后把 BGM 放回登记音量 */
  private restoreBgm(): void {
    if (!this.currentBgm || !this.bgmEnabled) return;
    const howl = this.howls.get(this.currentBgm);
    if (!howl) return;
    const base = ASSETS[this.currentBgm].volume ?? 0.32;
    try {
      howl.fade(howl.volume(), base, 320);
    } catch {
      /* 忽略 */
    }
  }

  /** 停止当前 BGM */
  stopBgm(): void {
    if (!this.currentBgm) return;
    const howl = this.howls.get(this.currentBgm);
    try {
      howl?.stop();
    } catch {
      /* 忽略 */
    }
    this.currentBgm = null;
    this.emit();
  }

  /**
   * 播放一首单曲（非循环，如《红豆》）
   * @param id 音频资源 ID
   * @param onEnd 播放结束回调（素材缺失时立即回调）
   */
  playTrack(id: AudioAssetId, onEnd?: () => void): void {
    if (this.status.get(id) === 'missing') {
      onEnd?.();
      return;
    }
    try {
      const howl = this.getOrCreate(id);
      howl.once('end', () => onEnd?.());
      howl.once('loaderror', () => onEnd?.());
      howl.play();
      this.emit();
    } catch {
      this.status.set(id, 'missing');
      this.emit();
      onEnd?.();
    }
  }

  /**
   * 停止指定音频
   * @param id 音频资源 ID
   */
  stop(id: AudioAssetId): void {
    try {
      this.howls.get(id)?.stop();
    } catch {
      /* 忽略 */
    }
    if (this.currentBgm === id) this.currentBgm = null;
    this.emit();
  }

  /** 停止全部声音 */
  stopAll(): void {
    try {
      Howler.stop();
    } catch {
      /* 忽略 */
    }
    this.currentBgm = null;
    this.emit();
  }
}

/** 全局唯一音频管理器实例 */
export const audio = new AudioManager();
