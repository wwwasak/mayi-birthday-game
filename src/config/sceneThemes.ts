import type { CSSProperties } from 'react';
import type { SceneId } from './scenes';

/** 只用系统里已经有的字体，离线包不请求在线字体。 */
const SANS = "'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', 'Segoe UI', sans-serif";
const KAI = `'KaiTi', 'STKaiti', ${SANS}`;

/**
 * 一间屋子的界面主题。
 * 颜色写在这里，场景组件和样式只引用 CSS 变量。
 * skin 为 custom 的场景已经单独调过，不再套这层通用皮肤。
 */
export interface SceneTheme {
  skin: 'themed' | 'custom';
  /** 标题字体 */
  fontTitle: string;
  /** 正文 */
  ink: string;
  /** 次级说明 */
  inkSoft: string;
  /** 标题字色 */
  title: string;
  /** 强调色，用于描边、重点数字 */
  accent: string;
  /** 更深的强调色 */
  accentDeep: string;
  /** 主按钮字色 */
  accentInk: string;
  /** 金色点缀 */
  gold: string;
  /** 标题和说明底下的小底板 */
  chip: string;
  /** 大面板 */
  panel: string;
  /** 卡片、选项等更实的底板 */
  panelStrong: string;
  /** 描边 */
  line: string;
  /** 面板内沿 */
  inset: string;
  /** 投影 */
  shadow: string;
  /** 主按钮底 */
  button: string;
  /** 主按钮底边 */
  buttonEdge: string;
  /** 次按钮底 */
  alt: string;
  /** 次按钮字 */
  altInk: string;
  /** 次按钮底边 */
  altEdge: string;
  /** 正确反馈底 */
  ok: string;
  /** 正确反馈字 */
  okInk: string;
  /** 错误反馈底 */
  bad: string;
  /** 错误反馈字 */
  badInk: string;
}

/**
 * 填一套主题。缺省值按暖色游园会来，各屋再改自己的颜色。
 * @param patch 这一屋要改的字段
 */
function room(patch: Partial<SceneTheme> & Pick<SceneTheme, 'ink' | 'title' | 'accent' | 'accentDeep'>): SceneTheme {
  return {
    skin: 'themed',
    fontTitle: KAI,
    inkSoft: '#6d5c62',
    accentInk: '#5c4316',
    gold: '#c9a45a',
    chip: 'rgba(255, 250, 244, 0.88)',
    panel: 'linear-gradient(180deg, rgba(255, 250, 244, 0.34), rgba(255, 244, 232, 0.16))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 252, 248, 0.94), rgba(255, 244, 232, 0.9))',
    line: 'rgba(201, 164, 90, 0.78)',
    inset: 'rgba(255, 252, 246, 0.42)',
    shadow: '0 16px 32px rgba(70, 40, 30, 0.14)',
    button: 'linear-gradient(180deg, #fff6d4 0%, #f0d48a 58%, #e4c06e 100%)',
    buttonEdge: '#c4a15a',
    alt: 'linear-gradient(180deg, #fffefb, #f7f1ea)',
    altInk: '#5c4638',
    altEdge: 'rgba(180, 150, 120, 0.55)',
    ok: '#e7f6ee',
    okInk: '#2f6a56',
    bad: '#fff0f2',
    badInk: '#a24a62',
    ...patch,
  };
}

/** 闸机、地图、薄荷糖已经单独调过，这里只留一份记录，不套通用皮肤。 */
const custom = room({
  skin: 'custom',
  ink: '#4a3b4d',
  title: '#4a3b4d',
  accent: '#e56b9a',
  accentDeep: '#b4234e',
});

/**
 * 各场景主题。
 * 颜色从对应背景里取：暖木、蓝金图书馆、夜色樱花、粉金礼堂、深夜后台。
 */
export const SCENE_THEMES: Record<SceneId, SceneTheme> = {
  boot: custom,
  gate: custom,
  auth: custom,
  notice: custom,
  map: custom,
  mint: custom,
  food: room({
    ink: '#5c4032',
    inkSoft: '#7a5b48',
    title: '#6a3e24',
    accent: '#c46a3a',
    accentDeep: '#8a4524',
    accentInk: '#5c3414',
    gold: '#d4a15a',
    chip: 'rgba(255, 248, 236, 0.9)',
    panel: 'linear-gradient(180deg, rgba(255, 246, 232, 0.4), rgba(255, 228, 196, 0.18))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 252, 246, 0.95), rgba(255, 236, 214, 0.92))',
    line: 'rgba(196, 132, 72, 0.72)',
    inset: 'rgba(255, 246, 230, 0.45)',
    shadow: '0 16px 32px rgba(110, 60, 24, 0.14)',
    button: 'linear-gradient(180deg, #ffe7c2 0%, #f0b56a 100%)',
    buttonEdge: '#c4843c',
    alt: 'linear-gradient(180deg, #fffaf4, #fff0e0)',
    altInk: '#6a4630',
    altEdge: 'rgba(196, 140, 80, 0.45)',
    ok: '#e8f6ea',
    okInk: '#3d6a40',
  }),
  exam: room({
    ink: '#2e3a55',
    inkSoft: '#5c6a84',
    title: '#2a3f6e',
    accent: '#3d5fbf',
    accentDeep: '#2a4588',
    accentInk: '#f7f4ea',
    gold: '#c6a15a',
    chip: 'rgba(255, 250, 240, 0.9)',
    panel: 'linear-gradient(180deg, rgba(244, 246, 255, 0.38), rgba(226, 232, 248, 0.16))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 252, 246, 0.96), rgba(236, 240, 252, 0.94))',
    line: 'rgba(70, 96, 160, 0.45)',
    inset: 'rgba(255, 252, 246, 0.5)',
    shadow: '0 16px 32px rgba(36, 48, 90, 0.14)',
    button: 'linear-gradient(180deg, #fff6d4 0%, #e7c56a 100%)',
    buttonEdge: '#b8923e',
    alt: 'linear-gradient(180deg, #f7f8ff, #e7ecf8)',
    altInk: '#2e3a55',
    altEdge: 'rgba(90, 110, 160, 0.4)',
    ok: '#e5f6ef',
    okInk: '#1f6b52',
    bad: '#fff1f3',
    badInk: '#9d3d55',
  }),
  wish: room({
    ink: '#4a3560',
    inkSoft: '#6e587c',
    title: '#5a3d68',
    accent: '#c46b92',
    accentDeep: '#8d4d78',
    gold: '#e0c27a',
    chip: 'rgba(255, 246, 250, 0.86)',
    panel: 'linear-gradient(180deg, rgba(255, 244, 250, 0.28), rgba(48, 28, 70, 0.12))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 250, 252, 0.94), rgba(255, 232, 244, 0.9))',
    line: 'rgba(210, 160, 190, 0.7)',
    inset: 'rgba(255, 246, 250, 0.35)',
    shadow: '0 16px 32px rgba(40, 20, 60, 0.16)',
    button: 'linear-gradient(180deg, #fff3c8 0%, #e8c56e 100%)',
    buttonEdge: '#c4a05a',
    alt: 'linear-gradient(180deg, #fff8fc, #f6e8f2)',
    altInk: '#5a3d68',
    altEdge: 'rgba(180, 130, 160, 0.45)',
  }),
  cake: room({
    ink: '#6a4458',
    inkSoft: '#8a6474',
    title: '#8a3d5c',
    accent: '#d46b90',
    accentDeep: '#a84870',
    gold: '#e0b45c',
    chip: 'rgba(255, 248, 250, 0.9)',
    panel: 'linear-gradient(180deg, rgba(255, 248, 250, 0.42), rgba(255, 228, 236, 0.18))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 252, 250, 0.9), rgba(255, 236, 242, 0.82))',
    line: 'rgba(214, 150, 170, 0.75)',
    inset: 'rgba(255, 250, 246, 0.48)',
    shadow: '0 16px 32px rgba(120, 50, 80, 0.12)',
    button: 'linear-gradient(180deg, #fff4c8 0%, #f0c56a 100%)',
    buttonEdge: '#d4a24a',
    alt: 'linear-gradient(180deg, #fffafb, #ffe8f0)',
    altInk: '#7a4460',
    altEdge: 'rgba(210, 140, 170, 0.45)',
  }),
  candle: room({
    ink: '#6a4458',
    inkSoft: '#8a6474',
    title: '#8a3d5c',
    accent: '#d46b90',
    accentDeep: '#a84870',
    gold: '#e0b45c',
    chip: 'rgba(255, 248, 250, 0.9)',
    panel: 'linear-gradient(180deg, rgba(255, 248, 250, 0.42), rgba(255, 228, 236, 0.18))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 252, 250, 0.9), rgba(255, 236, 242, 0.82))',
    line: 'rgba(214, 150, 170, 0.75)',
    inset: 'rgba(255, 250, 246, 0.48)',
    shadow: '0 16px 32px rgba(120, 50, 80, 0.12)',
    button: 'linear-gradient(180deg, #fff4c8 0%, #f0c56a 100%)',
    buttonEdge: '#d4a24a',
    alt: 'linear-gradient(180deg, #fffafb, #ffe8f0)',
    altInk: '#7a4460',
    altEdge: 'rgba(210, 140, 170, 0.45)',
  }),
  music: room({
    ink: '#3e3158',
    inkSoft: '#6a5c7c',
    title: '#4a3568',
    accent: '#c9a15a',
    accentDeep: '#8a6840',
    gold: '#e4c27a',
    chip: 'rgba(255, 248, 240, 0.86)',
    panel: 'linear-gradient(180deg, rgba(255, 246, 236, 0.28), rgba(48, 28, 72, 0.12))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 250, 244, 0.88), rgba(244, 232, 248, 0.78))',
    line: 'rgba(200, 160, 110, 0.65)',
    inset: 'rgba(255, 246, 236, 0.32)',
    shadow: '0 16px 32px rgba(40, 24, 64, 0.16)',
    button: 'linear-gradient(180deg, #fff3c4 0%, #e8c56e 100%)',
    buttonEdge: '#b89248',
    alt: 'linear-gradient(180deg, #fbf7ff, #efe6f6)',
    altInk: '#4a3568',
    altEdge: 'rgba(140, 110, 160, 0.4)',
  }),
  final: room({
    ink: '#4a3560',
    inkSoft: '#6e5878',
    title: '#fff6ea',
    accent: '#e0b45c',
    accentDeep: '#c48a4a',
    accentInk: '#4a3018',
    gold: '#e8c98a',
    chip: 'rgba(36, 22, 52, 0.42)',
    panel: 'linear-gradient(180deg, rgba(255, 246, 236, 0.2), rgba(36, 20, 56, 0.18))',
    panelStrong: 'linear-gradient(180deg, rgba(255, 250, 244, 0.94), rgba(255, 236, 246, 0.9))',
    line: 'rgba(232, 196, 140, 0.7)',
    inset: 'rgba(255, 244, 230, 0.28)',
    shadow: '0 16px 36px rgba(20, 10, 36, 0.22)',
    button: 'linear-gradient(180deg, #fff3c4 0%, #e8c56e 100%)',
    buttonEdge: '#b89248',
    alt: 'linear-gradient(180deg, rgba(255,248,252,0.92), rgba(244,232,246,0.88))',
    altInk: '#4a3568',
    altEdge: 'rgba(160, 120, 150, 0.4)',
  }),
  ticket: room({
    ink: '#5c3d58',
    inkSoft: '#7a5c72',
    title: '#7a4060',
    accent: '#c46b90',
    accentDeep: '#8d4d70',
    gold: '#d4ae62',
    chip: 'rgba(255, 248, 250, 0.9)',
    panel: 'linear-gradient(180deg, rgba(255, 248, 250, 0.3), rgba(40, 22, 48, 0.1))',
    panelStrong: 'linear-gradient(180deg, #fffdfb 0%, #fff0f6 100%)',
    line: 'rgba(212, 140, 170, 0.75)',
    inset: 'rgba(255, 248, 250, 0.5)',
    shadow: '0 18px 36px rgba(60, 24, 48, 0.16)',
    button: 'linear-gradient(180deg, #fff4c8 0%, #f0c56a 100%)',
    buttonEdge: '#c49848',
    alt: 'linear-gradient(180deg, #fffafb, #ffe8f0)',
    altInk: '#6a4458',
    altEdge: 'rgba(200, 140, 160, 0.4)',
  }),
  egg: room({
    fontTitle: SANS,
    ink: '#f4ecdf',
    inkSoft: '#d5c6b0',
    title: '#fff6e8',
    accent: '#e0b45c',
    accentDeep: '#c4924a',
    accentInk: '#3a2814',
    gold: '#e8c98a',
    chip: 'rgba(24, 18, 42, 0.72)',
    panel: 'linear-gradient(180deg, rgba(28, 22, 48, 0.35), rgba(16, 12, 32, 0.2))',
    panelStrong: 'linear-gradient(180deg, rgba(28, 22, 48, 0.88), rgba(18, 16, 36, 0.9))',
    line: 'rgba(212, 176, 110, 0.55)',
    inset: 'rgba(255, 236, 200, 0.08)',
    shadow: '0 16px 36px rgba(0, 0, 0, 0.28)',
    button: 'linear-gradient(180deg, #fff3c4 0%, #e4bc64 100%)',
    buttonEdge: '#a88440',
    alt: 'linear-gradient(180deg, rgba(255,248,240,0.92), rgba(236,228,216,0.9))',
    altInk: '#3a2818',
    altEdge: 'rgba(180, 150, 110, 0.45)',
    ok: '#24362e',
    okInk: '#d7f0e2',
    bad: '#3a2430',
    badInk: '#ffd0dc',
  }),
};

/**
 * 把主题写成场景根节点上的 CSS 变量。
 * @param theme 当前场景主题
 */
export function sceneThemeStyle(theme: SceneTheme): CSSProperties {
  const vars: Record<string, string> = {
    '--theme-font': theme.fontTitle,
    '--theme-ink': theme.ink,
    '--theme-ink-soft': theme.inkSoft,
    '--theme-title': theme.title,
    '--theme-accent': theme.accent,
    '--theme-accent-deep': theme.accentDeep,
    '--theme-accent-ink': theme.accentInk,
    '--theme-gold': theme.gold,
    '--theme-chip': theme.chip,
    '--theme-panel': theme.panel,
    '--theme-panel-strong': theme.panelStrong,
    '--theme-line': theme.line,
    '--theme-inset': theme.inset,
    '--theme-shadow': theme.shadow,
    '--theme-button': theme.button,
    '--theme-button-edge': theme.buttonEdge,
    '--theme-alt': theme.alt,
    '--theme-alt-ink': theme.altInk,
    '--theme-alt-edge': theme.altEdge,
    '--theme-ok': theme.ok,
    '--theme-ok-ink': theme.okInk,
    '--theme-bad': theme.bad,
    '--theme-bad-ink': theme.badInk,
  };
  return vars as CSSProperties;
}
