import type { CSSProperties } from 'react';
import { ASSETS } from '../../config/assets';

/** Q 版麻衣的 8 个关键动作（与 DESIGN_DECISIONS.md §9 一致） */
export type ChibiAction = 'idle' | 'point' | 'happy' | 'surprise' | 'peek' | 'pray' | 'cheer' | 'nod';

export interface ChibiMayiProps {
  action?: ChibiAction;
  /** 缩放倍率（基础尺寸 120×150） */
  scale?: number;
  /** 朝向：指路时手指向哪边 */
  facing?: 'left' | 'right';
  style?: CSSProperties;
  className?: string;
  /** 是否显示占位标签 */
  showLabel?: boolean;
}

export const CHIBI_W = 120;
export const CHIBI_H = 150;

/**
 * 占位 Q 版麻衣：纯 CSS 绘制，动作由类名驱动
 * 未来替换为 PNG/序列帧时，只需保留外层尺寸与 action 类名约定
 */
export function ChibiMayi({ action = 'idle', scale = 1, facing = 'right', style, className, showLabel = false }: ChibiMayiProps) {
  return (
    <div
      className={`chibi chibi--${action} chibi--face-${facing} ${className ?? ''}`}
      style={{ width: CHIBI_W * scale, height: CHIBI_H * scale, ...style }}
      aria-hidden
      data-chibi-action={action}
    >
      {/* 缩放层与动作动画层分离，避免动画 transform 覆盖缩放 */}
      <div className="chibi__scale" style={{ transform: `scale(${scale})` }}>
        <div className="chibi__inner">
          <div className="chibi__ear chibi__ear--l" />
          <div className="chibi__ear chibi__ear--r" />
          <div className="chibi__hair" />
          <div className="chibi__face">
            <div className="chibi__eye chibi__eye--l" />
            <div className="chibi__eye chibi__eye--r" />
            <div className="chibi__mouth" />
          </div>
          <div className="chibi__body" />
          <div className="chibi__arm chibi__arm--l" />
          <div className="chibi__arm chibi__arm--r" />
          <div className="chibi__sign">!</div>
        </div>
      </div>
      {showLabel && <span className="chibi__label">占位 Q 版 · {ASSETS.chibi_mayi.path}</span>}
    </div>
  );
}
