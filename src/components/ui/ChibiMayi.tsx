import type { CSSProperties } from 'react';
import { assetUrl, type ImageAssetId } from '../../config/assets';
import { useAssetImageReady } from '../../hooks/useAssetImageReady';

/** Q 版麻衣的 8 个关键动作（peek / nod 复用已有正式图） */
export type ChibiAction = 'idle' | 'point' | 'happy' | 'surprise' | 'peek' | 'pray' | 'cheer' | 'nod';

export interface ChibiMayiProps {
  action?: ChibiAction;
  /** 缩放倍率（基础尺寸 120×150） */
  scale?: number;
  /** 朝向：默认图朝右，朝左时水平镜像 */
  facing?: 'left' | 'right';
  style?: CSSProperties;
  className?: string;
  /** 是否显示占位标签 */
  showLabel?: boolean;
}

export const CHIBI_W = 120;
export const CHIBI_H = 150;

const CHIBI_ART: Record<ChibiAction, ImageAssetId> = {
  idle: 'chibi_idle',
  point: 'chibi_point',
  happy: 'chibi_happy',
  surprise: 'chibi_surprise',
  peek: 'chibi_surprise',
  pray: 'chibi_pray',
  cheer: 'chibi_cheer',
  nod: 'chibi_happy',
};

/**
 * Q 版麻衣：正式 PNG 到位后替换 CSS 身体，外层尺寸与轻跳动画保留。
 */
export function ChibiMayi({ action = 'idle', scale = 1, facing = 'right', style, className, showLabel = false }: ChibiMayiProps) {
  const artId = CHIBI_ART[action];
  const ready = useAssetImageReady(artId);

  return (
    <div
      className={`chibi chibi--${action} chibi--face-${facing} ${ready ? 'chibi--art' : ''} ${className ?? ''}`}
      style={{ width: CHIBI_W * scale, height: CHIBI_H * scale, ...style }}
      aria-hidden
      data-chibi-action={action}
    >
      <div className="chibi__scale" style={{ transform: `scale(${scale})` }}>
        {ready ? (
          <div className="chibi__art-wrap">
            <img
              className="chibi__art"
              src={assetUrl(artId)}
              alt=""
              draggable={false}
              style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
            />
          </div>
        ) : (
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
        )}
      </div>
      {showLabel && !ready && <span className="chibi__label">占位 Q 版</span>}
    </div>
  );
}
