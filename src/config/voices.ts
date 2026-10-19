import type { AudioAssetId } from './assets';

/** 角色语音优先级。moment 可以打断正在说的 line。 */
export type VoicePriority = 'line' | 'moment';

/** 一条可播放的角色语音事件 */
export interface VoiceEventSpec {
  /** 资源 ID，对应 assets.ts */
  assetId: AudioAssetId;
  /** 字幕，必须和录音台词一致 */
  line: string;
  /** WAV 文件名，方便对照制作目录 */
  file: string;
  priority: VoicePriority;
  /** 同一事件两次播放的最短间隔 */
  cooldownMs: number;
  /** 本次打开页面只说一次 */
  once?: boolean;
}

/**
 * 游戏事件 → 语音。
 * 场景只调用事件名，不写文件路径。
 */
export const VOICE_EVENTS = {
  /** 闸机：选了「路过的狐狸」 */
  gate_confused: {
    assetId: 'voice_mayi_surprised',
    line: '诶？什么东西？',
    file: 'mayi_01.wav',
    priority: 'line',
    cooldownMs: 4000,
  },
  /** 第一次进入空地图 */
  park_welcome: {
    assetId: 'voice_mayi_welcome',
    line: '嘿嘿，欢迎光临！',
    file: 'mayi_02.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
  },
  /** 认证考试：第一次答对事实题 */
  exam_proud: {
    assetId: 'voice_mayi_proud',
    line: '哼哼，那当然！',
    file: 'mayi_03.wav',
    priority: 'line',
    cooldownMs: 45000,
  },
  /** 火锅：煮进了离谱食材 */
  food_weird: {
    assetId: 'voice_mayi_unbelievable',
    line: '啊？这也行？！',
    file: 'mayi_04.wav',
    priority: 'moment',
    cooldownMs: 12000,
  },
  /** 拿到第四枚印章 */
  park_complete: {
    assetId: 'voice_mayi_hooray',
    line: '好耶！',
    file: 'mayi_05.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
  },
  /** 薄荷糖结算后再玩一次 */
  mint_retry: {
    assetId: 'voice_mayi_again',
    line: '不对不对！重来！',
    file: 'mayi_06.wav',
    priority: 'line',
    cooldownMs: 8000,
  },
  /** 认证考试事实题答错。游戏没有失败重开，这句用来提示换一个答案。 */
  exam_wrong: {
    assetId: 'voice_mayi_again',
    line: '不对不对！重来！',
    file: 'mayi_06.wav',
    priority: 'line',
    cooldownMs: 8000,
  },
  /** 这一局第一次点中薄荷糖 */
  mint_first_candy: {
    assetId: 'voice_mayi_mint',
    line: '哇！是薄荷糖！',
    file: 'mayi_07.wav',
    priority: 'line',
    cooldownMs: 1500,
  },
  /** 打开火锅料理台 */
  hotpot_enter: {
    assetId: 'voice_mayi_hotpot',
    line: '火锅！我要吃火锅！',
    file: 'mayi_08.wav',
    priority: 'line',
    cooldownMs: 20000,
  },
  /** 认证考试按下开始 */
  exam_think: {
    assetId: 'voice_mayi_think',
    line: '让我想想……',
    file: 'mayi_09.wav',
    priority: 'line',
    cooldownMs: 20000,
  },
  /** 第一次点到蛋黄沙司 */
  secret_found: {
    assetId: 'voice_mayi_really',
    line: '真的假的？',
    file: 'mayi_10.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
  },
  /** 闸机：选了「我不知道我是谁」并且扫描通过 */
  gate_spare: {
    assetId: 'voice_mayi_spare',
    line: '今天就放过你啦！',
    file: 'mayi_11.wav',
    priority: 'line',
    cooldownMs: 0,
    once: true,
  },
  /** 五根蜡烛都点亮，且还没进入《红豆》 */
  cake_birthday: {
    assetId: 'voice_mayi_birthday',
    line: '生日快乐！嘿嘿！',
    file: 'mayi_12.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
  },
} as const satisfies Record<string, VoiceEventSpec>;

/** 角色语音事件名 */
export type VoiceEvent = keyof typeof VOICE_EVENTS;

const PRIORITY_RANK: Record<VoicePriority, number> = { line: 1, moment: 2 };

/**
 * 比较两条语音谁更该留下。
 * @param next 将要播放的优先级
 * @param current 正在播放的优先级
 */
export function voiceCanInterrupt(next: VoicePriority, current: VoicePriority): boolean {
  return PRIORITY_RANK[next] > PRIORITY_RANK[current];
}
