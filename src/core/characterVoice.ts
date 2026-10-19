import { ASSETS, type AudioAssetId } from '../config/assets';
import { VOICE_EVENTS, voiceCanInterrupt, type VoiceEvent, type VoicePriority } from '../config/voices';
import { audio } from './audio';

/** 字幕订阅者 */
const listeners = new Set<() => void>();
let caption: string | null = null;
let captionToken = 0;
let snapshot = 0;

const lastAt = new Map<VoiceEvent, number>();
const playedOnce = new Set<VoiceEvent>();

function emit(): void {
  snapshot += 1;
  listeners.forEach((fn) => fn());
}

/**
 * 当前角色台词。没有在说话时为 null。
 */
export function getVoiceCaption(): string | null {
  return caption;
}

/** 供 useSyncExternalStore 使用 */
export function subscribeVoiceCaption(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 字幕版本 */
export function getVoiceCaptionSnapshot(): number {
  return snapshot;
}

/**
 * 清掉字幕。换场景或语音被停掉时调用。
 */
export function clearVoiceCaption(): void {
  captionToken += 1;
  if (caption === null) return;
  caption = null;
  emit();
}

function showCaption(line: string): number {
  const token = ++captionToken;
  caption = line;
  emit();
  return token;
}

function hideCaptionLater(token: number, delayMs: number): void {
  window.setTimeout(() => {
    if (captionToken !== token) return;
    caption = null;
    emit();
  }, delayMs);
}

/**
 * 按事件播放麻衣的一句台词。
 * 冷却中、已经说过、或优先级不够时直接跳过。
 * 文件缺失时仍显示字幕，不抛错。
 * @param event 语音事件名
 * @returns 是否真正开始了这一句
 */
export function playCharacterVoice(event: VoiceEvent): boolean {
  const spec = VOICE_EVENTS[event];
  const now = performance.now();
  const prev = lastAt.get(event) ?? -Infinity;
  if (now - prev < spec.cooldownMs) return false;
  const once = 'once' in spec && spec.once;
  if (once && playedOnce.has(event)) return false;

  const current = audio.getActiveVoice();
  if (current && !voiceCanInterrupt(spec.priority, current.priority)) return false;

  lastAt.set(event, now);
  if (once) playedOnce.add(event);

  const token = showCaption(spec.line);
  const started = performance.now();
  audio.playVoice(spec.assetId, spec.priority, () => {
    const remain = Math.max(0, 2200 - (performance.now() - started));
    hideCaptionLater(token, remain);
  });
  // 文件一直不回调时，字幕也不会停在屏幕上
  hideCaptionLater(token, 6000);
  return true;
}

/**
 * 停掉角色语音并清字幕。场景切换时调用。
 */
export function stopCharacterVoice(): void {
  audio.stopVoice();
  clearVoiceCaption();
}

/**
 * 开发试听：忽略冷却和优先级，直接播某一条资源。
 * @param id 语音资源 ID
 */
export function previewCharacterVoice(id: AudioAssetId): void {
  const line = ASSETS[id].description;
  const token = showCaption(line);
  const started = performance.now();
  audio.playVoice(id, 'moment', () => {
    const remain = Math.max(0, 1800 - (performance.now() - started));
    hideCaptionLater(token, remain);
  });
}

export type { VoicePriority };
