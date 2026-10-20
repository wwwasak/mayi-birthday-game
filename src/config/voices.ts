import type { AudioAssetId } from './assets';
import type { GuideAction } from './characters';

/** 角色语音优先级。moment 可以打断正在说的 line。 */
export type VoicePriority = 'line' | 'moment';

/** 一条可播放的角色语音事件。说话者一律是 Q 版向导。 */
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
  /** 说这句话时 Q 版向导的表情。玩家立绘不跟着改成说话状态。 */
  guideAction: GuideAction;
}

/**
 * 游戏事件 → Q 版向导的语音。
 * 场景只调用事件名，不写文件路径。
 * 已录好的 12 句不改台词和文件编号。对不上向导身份的触发会停用，不硬塞。
 */
export const VOICE_EVENTS = {
  /** 闸机工作人员听到「路过的狐狸」 */
  gate_confused: {
    assetId: 'voice_mayi_surprised',
    line: '诶？什么东西？',
    file: 'mayi_01.wav',
    priority: 'line',
    cooldownMs: 4000,
    guideAction: 'surprise',
  },
  /** 第一次进入空地图，向导欢迎玩家 */
  park_welcome: {
    assetId: 'voice_mayi_welcome',
    line: '嘿嘿，欢迎光临！',
    file: 'mayi_02.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
    guideAction: 'happy',
  },
  /** 考官看见玩家答对事实题，得意地确认答案，不是玩家自夸 */
  exam_proud: {
    assetId: 'voice_mayi_proud',
    line: '哼哼，那当然！',
    file: 'mayi_03.wav',
    priority: 'line',
    cooldownMs: 45000,
    guideAction: 'happy',
  },
  /** 料理向导看见锅里有离谱食材 */
  food_weird: {
    assetId: 'voice_mayi_unbelievable',
    line: '啊？这也行？！',
    file: 'mayi_04.wav',
    priority: 'moment',
    cooldownMs: 12000,
    guideAction: 'surprise',
  },
  /** 向导为玩家集齐四枚印章喝彩 */
  park_complete: {
    assetId: 'voice_mayi_hooray',
    line: '好耶！',
    file: 'mayi_05.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
    guideAction: 'cheer',
  },
  /**
   * 考官让玩家改事实题。
   * 不用于薄荷糖「再玩一次」：那是玩家主动重玩，不是失败。
   */
  exam_wrong: {
    assetId: 'voice_mayi_again',
    line: '不对不对！重来！',
    file: 'mayi_06.wav',
    priority: 'line',
    cooldownMs: 8000,
    guideAction: 'tease',
  },
  /** 向导看见这一局第一颗薄荷糖 */
  mint_first_candy: {
    assetId: 'voice_mayi_mint',
    line: '哇！是薄荷糖！',
    file: 'mayi_07.wav',
    priority: 'line',
    cooldownMs: 1500,
    guideAction: 'happy',
  },
  /** 向导自己想吃火锅。画面上必须是 Q 版，不能看成玩家的愿望。 */
  hotpot_enter: {
    assetId: 'voice_mayi_hotpot',
    line: '火锅！我要吃火锅！',
    file: 'mayi_08.wav',
    priority: 'line',
    cooldownMs: 20000,
    guideAction: 'hotpot',
  },
  /** 考官出题前整理题目。不是考生的内心独白。 */
  exam_think: {
    assetId: 'voice_mayi_think',
    line: '让我想想……',
    file: 'mayi_09.wav',
    priority: 'line',
    cooldownMs: 20000,
    guideAction: 'think',
  },
  /** 向导第一次看见蛋黄沙司 */
  secret_found: {
    assetId: 'voice_mayi_really',
    line: '真的假的？',
    file: 'mayi_10.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
    guideAction: 'surprise',
  },
  /** 闸机工作人员放行「我不知道我是谁」 */
  gate_spare: {
    assetId: 'voice_mayi_spare',
    line: '今天就放过你啦！',
    file: 'mayi_11.wav',
    priority: 'line',
    cooldownMs: 0,
    once: true,
    guideAction: 'happy',
  },
  /** 五根蜡烛点亮后，向导祝玩家生日快乐。不在吹蜡烛之后再说。 */
  cake_birthday: {
    assetId: 'voice_mayi_birthday',
    line: '生日快乐！嘿嘿！',
    file: 'mayi_12.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
    guideAction: 'host',
  },
  /**
   * 吹蜡烛之前，向导请玩家许愿。
   * 优先级是 line，而且发生在换场之后，不会把 mayi_12 打断。
   */
  cake_make_wish: {
    assetId: 'voice_guide_wish',
    line: '好，闭上眼，许愿吧。',
    file: 'mayi_18.wav',
    priority: 'line',
    cooldownMs: 0,
    once: true,
    guideAction: 'pray',
  },
  /** 最终舞台落幕时，向导向玩家道别。她不是收下礼物的寿星。 */
  guide_farewell: {
    assetId: 'voice_guide_farewell',
    line: '游园会到这里就结束啦。希望你今天玩得开心！',
    file: 'mayi_13.wav',
    priority: 'line',
    cooldownMs: 0,
    once: true,
    guideAction: 'farewell',
  },
  /** 神秘料理出炉。向导把菜端给玩家。 */
  dish_reveal: {
    assetId: 'voice_guide_dish',
    line: '出炉啦。金黄金黄的。',
    file: 'mayi_14.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
    guideAction: 'dish',
  },
  /** 第四簇樱花点亮。向导指给玩家看。 */
  wish_bloom: {
    assetId: 'voice_guide_wish_bloom',
    line: '你看，树亮起来了。',
    file: 'mayi_15.wav',
    priority: 'line',
    cooldownMs: 0,
    once: true,
    guideAction: 'point',
  },
  /** 第一次打开水果捞。向导叮嘱摆盘。 */
  fruit_enter: {
    assetId: 'voice_guide_fruit',
    line: '水果捞要装得好看一点哦。',
    file: 'mayi_16.wav',
    priority: 'line',
    cooldownMs: 20000,
    once: true,
    guideAction: 'point',
  },
  /** 判定器第一次过载。向导对系统说话，不是玩家答错。 */
  exam_overload: {
    assetId: 'voice_guide_overload',
    line: '等等，系统你冷静一点！',
    file: 'mayi_17.wav',
    priority: 'moment',
    cooldownMs: 0,
    once: true,
    guideAction: 'surprise',
  },
  /** 彩蛋页。向导看见下线说明，音量仍走总开关。 */
  egg_quiet: {
    assetId: 'voice_guide_egg',
    line: '……这条功能，真的下线了。',
    file: 'mayi_19.wav',
    priority: 'line',
    cooldownMs: 0,
    once: true,
    guideAction: 'peek',
  },
  /** 奖励糖。和第一颗薄荷糖错开：正在说别的句子时这次会跳过。 */
  mint_bonus: {
    assetId: 'voice_guide_bonus',
    line: '金色的，快拿！',
    file: 'mayi_20.wav',
    priority: 'line',
    cooldownMs: 8000,
    guideAction: 'point',
  },
  /** 第一次打开票根。向导把票递给玩家。 */
  ticket_keep: {
    assetId: 'voice_guide_ticket',
    line: '票根收好，下次还能进来。',
    file: 'mayi_21.wav',
    priority: 'line',
    cooldownMs: 0,
    once: true,
    guideAction: 'point',
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
