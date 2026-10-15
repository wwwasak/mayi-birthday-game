import { Howl, Howler } from 'howler';
import { ASSETS, assetUrl, type AssetEntry, type AudioAssetId } from '../config/assets';

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
  private listeners = new Set<() => void>();
  private snapshot = 0;

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
        this.status.set(id, 'missing');
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
    try {
      this.getOrCreate(id).play();
    } catch {
      this.status.set(id, 'missing');
      this.emit();
    }
  }

  /**
   * 播放 BGM（自动停止上一首）
   * @param id 音频资源 ID
   */
  playBgm(id: AudioAssetId): void {
    if (this.currentBgm && this.currentBgm !== id) this.stopBgm();
    this.currentBgm = id;
    if (this.status.get(id) === 'missing') {
      this.emit();
      return;
    }
    try {
      const howl = this.getOrCreate(id);
      if (!howl.playing()) howl.play();
    } catch {
      this.status.set(id, 'missing');
    }
    this.emit();
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
