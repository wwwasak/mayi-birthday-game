import { Howl, Howler } from 'howler';
import { ASSETS, assetUrl, type AssetEntry, type AudioAssetId } from '../config/assets';
import type { VoicePriority } from '../config/voices';
import type { AudioSettings } from './progress';

/** 角色说话时，BGM 降到玩家设定音量的这个比例。 */
const BGM_DUCK = 0.3;
/** 换曲淡出、淡入的时长。 */
const FADE_OUT_MS = 320;
const FADE_IN_MS = 420;
const BGM_IDS = ['bgm_park', 'bgm_cake'] as const;

/** 总音量 × 分类音量 × 资源校准 × 临时压低，结果限制在 0~1。 */
export type AudioBus = 'bgm' | 'voice' | 'sfx' | 'gift';

/** 开发调试用的 BGM 快照。正式构建不会显示。 */
export interface AudioDebugState {
  bgmId: AudioAssetId | null;
  soundId: number | null;
  state: 'stopped' | 'starting' | 'playing';
  ducking: boolean;
  /** 当前 BGM 实际增益，已含总音量、分类音量和压低。 */
  volume: number;
  /** 两个 BGM 资源里，未暂停且未结束的播放实例数。 */
  sounding: number;
  instances: Record<string, number>;
  logs: string[];
}

interface HowlSound {
  _id: number;
  _paused: boolean;
  _ended: boolean;
}

/** 单条音频的加载状态 */
export type AudioStatus = 'idle' | 'loading' | 'ready' | 'missing';

/**
 * 把任意音量收进 0~1。
 * @param v 原始数值
 */
function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

/**
 * 音频管理器（全游戏只有这一份）。
 *
 * BGM 同时记下资源 ID 和 Howler 播放实例 ID。
 * html5 模式下每次 `play()` 都会新开一个会出声的实例，所以同一首曲子
 * 只要已经有实例在响，就只改音量，不再调用 `play()`。
 */
class AudioManager {
  private howls = new Map<AudioAssetId, Howl>();
  private status = new Map<AudioAssetId, AudioStatus>();
  private currentBgm: AudioAssetId | null = null;
  /** 当前这一条 BGM 的 Howler 播放实例。不能只用 Howl 对象判断是否在响。 */
  private bgmSound: number | null = null;
  /** 场景希望播放的曲子。浏览器还没允许出声时先记住，解锁后只补这一条。 */
  private wantedBgm: AudioAssetId | null = null;
  /** 正在创建播放实例，避免同一次挂载里再 play 一次。 */
  private bgmStarting = false;
  /** 换曲代数。过期的淡出回调看到代数变了就直接放弃。 */
  private bgmGen = 0;
  private fadeTimer: number | null = null;
  private bgmEnabled = false;
  private ducking = false;
  private bgmApplied = 0;
  private mix: AudioSettings = {
    volume: 1,
    muted: false,
    bgmOn: true,
    bgm: 0.15,
    voice: 0.99,
    sfx: 0.55,
    gift: 0.8,
  };
  private lastSfxAt = new Map<AudioAssetId, number>();
  private listeners = new Set<() => void>();
  private snapshot = 0;
  private activeVoice: { id: AudioAssetId; priority: VoicePriority } | null = null;
  private voiceSound: number | null = null;
  private voiceToken = 0;
  private giftId: AudioAssetId | null = null;
  private giftSound: number | null = null;
  private giftToken = 0;
  /** 《红豆》从点击播放到停止或自然结束都算进行中，用来挡住角色语音。 */
  private giftActive = false;
  private logs: string[] = [];

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
   * 开发日志。正式构建里这段不会留下输出。
   * @param msg 一行说明
   */
  private trace(msg: string): void {
    this.logs = [...this.logs.slice(-11), msg];
    if (import.meta.env.DEV) console.info(`[audio] ${msg}`);
  }

  /**
   * 查询某条音频状态
   * @param id 音频资源 ID
   */
  getStatus(id: AudioAssetId): AudioStatus {
    return this.status.get(id) ?? 'idle';
  }

  /** 当前正在播放的 BGM 资源 */
  getCurrentBgm(): AudioAssetId | null {
    return this.currentBgm;
  }

  /** 正在播放的角色语音；没有时为 null */
  getActiveVoice(): { id: AudioAssetId; priority: VoicePriority } | null {
    return this.activeVoice;
  }

  /**
   * 判断某条音频是否有任意实例在播放。
   * BGM 是否叠声请看 `getDebug().sounding`，不要只看这个布尔值。
   * @param id 音频资源 ID
   */
  isPlaying(id: AudioAssetId): boolean {
    return this.howls.get(id)?.playing() ?? false;
  }

  /**
   * 读取调试快照。
   * @returns 当前 BGM 实例、音量和最近的切换记录
   */
  getDebug(): AudioDebugState {
    const instances: Record<string, number> = {};
    for (const id of [...BGM_IDS, 'music_hongdou' as const]) {
      instances[id] = this.liveIds(id).length;
    }
    const sounding = BGM_IDS.reduce((sum, id) => sum + this.liveIds(id).length, 0);
    let state: AudioDebugState['state'] = 'stopped';
    if (this.bgmStarting) state = 'starting';
    else if (this.currentBgm && this.bgmSound !== null && this.liveIds(this.currentBgm).includes(this.bgmSound)) state = 'playing';
    return {
      bgmId: this.currentBgm,
      soundId: this.bgmSound,
      state,
      ducking: this.ducking,
      volume: this.currentBgm ? this.gain('bgm', this.currentBgm, this.ducking ? BGM_DUCK : 1) : 0,
      sounding,
      instances,
      logs: [...this.logs],
    };
  }

  /**
   * 先把音量数字放进播放器，不启动或停止曲子。
   * 渲染阶段调用，保证随后的播放用的是当前存档，而不是上一轮的默认值。
   * @param settings 存档里的音频设置
   */
  holdMix(settings: AudioSettings): void {
    this.mix = {
      volume: clamp01(settings.volume),
      muted: settings.muted,
      bgmOn: settings.bgmOn,
      bgm: clamp01(settings.bgm),
      voice: clamp01(settings.voice),
      sfx: clamp01(settings.sfx),
      gift: clamp01(settings.gift),
    };
    Howler.volume(1);
    Howler.mute(this.mix.muted);
  }

  /**
   * 同步玩家的音量设置。总音量写在每条声音上，不再乘到 Howler 全局，避免算两次。
   * @param settings 存档里的音频设置
   */
  setMix(settings: AudioSettings): void {
    this.holdMix(settings);
    this.setBgmEnabled(settings.bgmOn);
    this.pushBgmVolume(false);
    this.pushVoiceVolume();
    this.pushGiftVolume();
  }

  /**
   * 设置主音量。保留给旧调用；新界面请走 `setMix`。
   * @param v 0~1
   */
  setVolume(v: number): void {
    this.setMix({ ...this.mix, volume: v });
  }

  /**
   * 设置静音
   * @param muted 是否静音
   */
  setMuted(muted: boolean): void {
    this.setMix({ ...this.mix, muted });
  }

  /**
   * 最终增益：总音量 × 分类音量 × 资源校准 × 临时压低。
   * @param bus 声音分类
   * @param id 资源 ID
   * @param duck 临时压低，1 表示不压
   */
  private gain(bus: AudioBus, id: AudioAssetId, duck = 1): number {
    const calib = ASSETS[id].volume ?? 1;
    return clamp01(this.mix.volume * this.mix[bus] * calib * duck);
  }

  /**
   * 一条 Howl 里真正还在出声的实例 ID。
   * @param id 资源 ID
   */
  private liveIds(id: AudioAssetId): number[] {
    const howl = this.howls.get(id);
    if (!howl) return [];
    const sounds = (howl as unknown as { _sounds?: HowlSound[] })._sounds ?? [];
    return sounds.filter((s) => !s._paused && !s._ended).map((s) => s._id);
  }

  /**
   * 停掉不该继续响的 BGM 实例。
   * @param keepId 要保留的资源
   * @param keepSound 要保留的实例；null 表示这个资源也全部停掉
   */
  private stopOtherBgms(keepId: AudioAssetId | null, keepSound: number | null): void {
    for (const id of BGM_IDS) {
      const howl = this.howls.get(id);
      if (!howl) continue;
      if (id !== keepId || keepSound === null) {
        howl.stop();
        continue;
      }
      for (const sid of this.liveIds(id)) {
        if (sid !== keepSound) howl.stop(sid);
      }
    }
  }

  private clearFade(): void {
    if (this.fadeTimer !== null) {
      window.clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
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
      volume: 1,
      onload: () => {
        this.status.set(id, 'ready');
        this.emit();
      },
      onloaderror: () => {
        this.status.set(id, 'missing');
        this.emit();
      },
      onplayerror: (_soundId: unknown) => {
        const soundId = typeof _soundId === 'number' ? _soundId : this.bgmSound;
        // 只恢复已经记下的那一个实例，不能再 play() 出一个新的。
        if (entry.loop && soundId !== null) {
          howl.once('unlock', () => {
            if (!this.bgmEnabled || this.currentBgm !== id || this.bgmSound !== soundId) return;
            if (howl.playing(soundId)) return;
            try {
              howl.play(soundId);
              this.trace(`unlock resume ${id}#${soundId}`);
            } catch {
              /* 仍被策略拦住时保持静默 */
            }
          });
        } else if (entry.group === 'voice' && soundId !== null) {
          howl.once('unlock', () => {
            if (this.activeVoice?.id !== id || this.voiceSound !== soundId) return;
            if (howl.playing(soundId)) return;
            try {
              howl.play(soundId);
            } catch {
              /* 仍被策略拦住时保持静默 */
            }
          });
        }
        if (entry.loop) this.bgmStarting = false;
        this.emit();
      },
      onplay: (soundId: number) => {
        if (this.currentBgm === id && this.bgmSound === soundId) {
          this.bgmStarting = false;
          this.latchBgmVolume(soundId, FADE_IN_MS);
        }
        this.emit();
      },
      onend: () => this.emit(),
      onstop: () => this.emit(),
    });
    this.howls.set(id, howl);
    return howl;
  }

  /**
   * 播放音效（一次性）。音量只走音效总线，不跟 BGM 一起被压低。
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
      howl.volume(this.gain('sfx', id));
      if (id === 'sfx_click' || id === 'sfx_pop') howl.stop();
      howl.play();
    } catch {
      this.status.set(id, 'missing');
      this.emit();
    }
  }

  /** 玩家是否打开了循环 BGM */
  isBgmEnabled(): boolean {
    return this.bgmEnabled;
  }

  /**
   * 打开或关闭循环 BGM。关闭时停止当前曲子。
   * 打开时如果场景已经请求过曲子，只补播一条。
   * @param on 是否开启
   */
  setBgmEnabled(on: boolean): void {
    if (this.bgmEnabled === on) return;
    this.bgmEnabled = on;
    if (!on) this.stopBgm();
    else this.kick();
  }

  /**
   * 请求播放一首循环 BGM。同一首已经在响就复用，不会再创建实例。
   * @param id 音频资源 ID
   */
  playBgm(id: AudioAssetId): void {
    this.wantedBgm = id;
    this.kick();
  }

  /** 在允许播放时，把场景请求的那一首落到唯一实例上。 */
  private kick(): void {
    if (!this.bgmEnabled || !this.wantedBgm) return;
    this.startBgm(this.wantedBgm);
  }

  /**
   * @param id 要播放的 BGM
   */
  private startBgm(id: AudioAssetId): void {
    const live = this.liveIds(id);
    if (this.currentBgm === id && this.bgmSound !== null && live.includes(this.bgmSound)) {
      this.stopOtherBgms(id, this.bgmSound);
      this.pushBgmVolume(true);
      this.trace(`reuse ${id}#${this.bgmSound} live=${this.liveIds(id).length}`);
      return;
    }
    if (this.currentBgm === id && this.bgmStarting) {
      this.trace(`ignore duplicate start ${id}`);
      return;
    }

    const gen = ++this.bgmGen;
    this.clearFade();
    const prev = this.currentBgm;
    const prevSound = this.bgmSound;

    const begin = () => {
      if (gen !== this.bgmGen || !this.bgmEnabled || this.wantedBgm !== id) return;
      this.currentBgm = id;
      this.stopOtherBgms(null, null);
      if (this.status.get(id) === 'missing') {
        this.bgmSound = null;
        this.emit();
        return;
      }
      try {
        const howl = this.getOrCreate(id);
        const target = this.gain('bgm', id, this.ducking ? BGM_DUCK : 1);
        // 新实例会继承 Howl 的音量。先设成 0，等 play 事件再淡入，避免在播放锁里把淡入请求弄丢。
        howl.volume(0);
        this.bgmApplied = 0;
        this.bgmStarting = true;
        const sid = howl.play() as number;
        this.bgmSound = sid;
        window.setTimeout(() => {
          if (this.bgmSound === sid) this.bgmStarting = false;
        }, 800);
        this.trace(`start ${id}#${sid} vol=${target.toFixed(3)} sounding=${this.liveIds('bgm_park').length + this.liveIds('bgm_cake').length}`);
      } catch {
        this.bgmStarting = false;
        this.status.set(id, 'missing');
      }
      this.emit();
    };

    const old = prev && prev !== id ? this.howls.get(prev) : undefined;
    if (old && prevSound !== null && old.playing(prevSound)) {
      old.fade(this.bgmApplied, 0, FADE_OUT_MS, prevSound);
      this.trace(`fade-out ${prev}#${prevSound}`);
      this.fadeTimer = window.setTimeout(() => {
        this.fadeTimer = null;
        if (gen !== this.bgmGen) {
          this.trace(`drop stale fade ${prev}`);
          return;
        }
        old.stop();
        begin();
      }, FADE_OUT_MS + 40);
      this.emit();
      return;
    }
    begin();
  }

  /**
   * 把当前 BGM 实例调到计算后的音量。静音时 Howler 总开关负责不出声，这里不把增益偷偷改回。
   * 播放承诺还没完成时先不调，等 play 回调按当时的设置写入。
   * @param immediate 为 true 时跳过淡变
   */
  private pushBgmVolume(immediate: boolean): void {
    if (!this.currentBgm || this.bgmSound === null || this.bgmStarting) return;
    this.latchBgmVolume(this.bgmSound, immediate ? 0 : 240);
  }

  /**
   * 把某一条 BGM 实例设到当前应有的增益。
   * @param sid 播放实例 ID
   * @param fadeMs 淡变时长，0 表示立刻
   */
  private latchBgmVolume(sid: number, fadeMs: number): void {
    if (!this.currentBgm || this.bgmSound !== sid) return;
    const howl = this.howls.get(this.currentBgm);
    if (!howl) return;
    const target = this.gain('bgm', this.currentBgm, this.ducking ? BGM_DUCK : 1);
    const from = this.bgmApplied;
    this.bgmApplied = target;
    if (fadeMs <= 0 || Math.abs(from - target) < 0.004) {
      howl.volume(target, sid);
      return;
    }
    howl.fade(from, target, fadeMs, sid);
  }

  /** 说话中途改了语音滑块时，更新这一句的音量。 */
  private pushVoiceVolume(): void {
    if (!this.activeVoice || this.voiceSound === null) return;
    this.howls.get(this.activeVoice.id)?.volume(this.gain('voice', this.activeVoice.id), this.voiceSound);
  }

  /** 《红豆》使用自己的分类音量，不吃 BGM 压低。 */
  private pushGiftVolume(): void {
    if (!this.giftId || this.giftSound === null) return;
    const howl = this.howls.get(this.giftId);
    if (!howl?.playing(this.giftSound)) return;
    howl.volume(this.gain('gift', this.giftId), this.giftSound);
  }

  /**
   * 播放一句角色语音。会停掉上一句，并把 BGM 平滑降到设定音量的 30%。
   * 下一句立刻接上时不先恢复再压低。静音不会被这段逻辑重新打开。
   * @param id 语音资源 ID
   * @param priority 优先级，供下一句决定能不能打断
   * @param onDone 播放结束、失败或被下一句替换时
   */
  playVoice(id: AudioAssetId, priority: VoicePriority, onDone?: () => void): void {
    if (this.giftActive) {
      onDone?.();
      return;
    }
    const token = ++this.voiceToken;
    this.haltVoiceHowl();
    this.ducking = true;
    this.activeVoice = { id, priority };
    this.pushBgmVolume(false);
    if (this.status.get(id) === 'missing') {
      this.finishVoice(token, onDone);
      return;
    }
    try {
      const howl = this.getOrCreate(id);
      const level = this.gain('voice', id);
      howl.volume(level);
      const sid = howl.play() as number;
      this.voiceSound = sid;
      const finish = () => this.finishVoice(token, onDone);
      howl.once('end', finish);
      howl.once('loaderror', finish);
    } catch {
      this.status.set(id, 'missing');
      this.finishVoice(token, onDone);
    }
    this.emit();
  }

  /**
   * 这句语音结束。若期间又来了新的一句，旧回调直接退出，避免 BGM 弹回去。
   * @param token 开始这句时的序号
   * @param onDone 结束回调
   */
  private finishVoice(token: number, onDone?: () => void): void {
    if (this.voiceToken !== token) return;
    this.voiceToken += 1;
    this.ducking = false;
    this.activeVoice = null;
    this.voiceSound = null;
    this.pushBgmVolume(false);
    onDone?.();
    this.emit();
  }

  /** 停掉角色语音并恢复 BGM */
  stopVoice(): void {
    this.voiceToken += 1;
    this.haltVoiceHowl();
    this.ducking = false;
    this.pushBgmVolume(false);
    this.emit();
  }

  /** 只停掉语音实例，不改 BGM 压低状态。 */
  private haltVoiceHowl(): void {
    const current = this.activeVoice;
    this.activeVoice = null;
    this.voiceSound = null;
    if (!current) return;
    try {
      this.howls.get(current.id)?.stop();
    } catch {
      /* 忽略 */
    }
  }

  /**
   * 停止当前 BGM，并忘掉场景请求，避免淡出回调把旧曲子放回来。
   */
  stopBgm(): void {
    this.wantedBgm = null;
    this.clearFade();
    this.bgmGen += 1;
    this.bgmStarting = false;
    this.stopOtherBgms(null, null);
    if (this.currentBgm) this.trace(`stop ${this.currentBgm}#${this.bgmSound ?? '-'}`);
    this.currentBgm = null;
    this.bgmSound = null;
    this.bgmApplied = 0;
    this.emit();
  }

  /**
   * 播放一首单曲（非循环，如《红豆》）。先停掉这条上的旧实例，再只开一个。
   * @param id 音频资源 ID
   * @param onEnd 自然播放结束回调；主动停止或被下一轮替换时不调用
   */
  playTrack(id: AudioAssetId, onEnd?: () => void): void {
    if (id === 'music_hongdou') {
      this.stopBgm();
      this.voiceToken += 1;
      this.haltVoiceHowl();
      this.ducking = false;
    }
    this.giftActive = true;
    const token = ++this.giftToken;
    if (this.status.get(id) === 'missing') {
      this.giftActive = false;
      onEnd?.();
      return;
    }
    try {
      const howl = this.getOrCreate(id);
      const level = this.gain('gift', id);
      howl.stop();
      howl.volume(level);
      const sid = howl.play() as number;
      this.giftId = id;
      this.giftSound = sid;
      howl.volume(level, sid);
      this.trace(`gift ${id}#${sid} vol=${level.toFixed(3)}`);
      const finish = () => {
        if (this.giftToken !== token) return;
        this.giftSound = null;
        this.giftActive = false;
        onEnd?.();
        this.emit();
      };
      howl.once('end', finish);
      howl.once('loaderror', finish);
      this.emit();
    } catch {
      this.giftActive = false;
      this.status.set(id, 'missing');
      this.emit();
      onEnd?.();
    }
  }

  /**
   * 停止指定音频。停《红豆》或语音时作废未完成的结束回调。
   * @param id 音频资源 ID
   */
  stop(id: AudioAssetId): void {
    if (this.giftId === id) {
      this.giftToken += 1;
      this.giftSound = null;
      this.giftActive = false;
    }
    if (this.activeVoice?.id === id) {
      this.voiceToken += 1;
      this.activeVoice = null;
      this.voiceSound = null;
      this.ducking = false;
      this.pushBgmVolume(false);
    }
    try {
      this.howls.get(id)?.stop();
    } catch {
      /* 忽略 */
    }
    if (this.currentBgm === id) {
      this.currentBgm = null;
      this.bgmSound = null;
      this.bgmStarting = false;
    }
    this.emit();
  }

  /** 停止全部声音 */
  stopAll(): void {
    this.clearFade();
    this.bgmGen += 1;
    this.voiceToken += 1;
    this.giftToken += 1;
    this.wantedBgm = null;
    this.bgmStarting = false;
    this.ducking = false;
    try {
      Howler.stop();
    } catch {
      /* 忽略 */
    }
    this.currentBgm = null;
    this.bgmSound = null;
    this.activeVoice = null;
    this.voiceSound = null;
    this.giftSound = null;
    this.giftActive = false;
    this.bgmApplied = 0;
    this.emit();
  }
}

/** 全局唯一音频管理器实例 */
export const audio = new AudioManager();

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __mayiAudio?: AudioManager }).__mayiAudio = audio;
}
