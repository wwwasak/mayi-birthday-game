import type { CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';
import { assetUrl } from '../../config/assets';
import { GUIDE_ACTION_ASSET, GUIDE_ACTION_FALLBACK, GUIDE_ROLE_LABEL, type GuideAction } from '../../config/characters';
import { isDebugUiEnabled } from '../../config/debugUi';
import { getVoiceCaption, getVoiceCaptionSnapshot, subscribeVoiceCaption } from '../../core/characterVoice';
import { useAssetImageReady } from '../../hooks/useAssetImageReady';

/** Q 版向导的动作。peek / nod 复用已有正式图。 */
export type ChibiAction = GuideAction;

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
  /**
   * 为 true 时，向导正在说话就改用这句台词的表情。
   * 地图上的玩家标记和提示条里的小图标不要打开。
   */
  followVoice?: boolean;
}

export const CHIBI_W = 120;
export const CHIBI_H = 150;

/**
 * Q 版向导。正式图缺失时保留 CSS 身体，并标出「Q版向导」，不用普通立绘顶替。
 * @param followVoice 说话时改用台词对应的表情
 */
export function ChibiMayi({
  action = 'idle',
  scale = 1,
  facing = 'right',
  style,
  className,
  showLabel = false,
  followVoice = false,
}: ChibiMayiProps) {
  useSyncExternalStore(subscribeVoiceCaption, getVoiceCaptionSnapshot);
  const voice = followVoice ? getVoiceCaption() : null;
  const shown = voice?.action ?? action;
  const preferred = GUIDE_ACTION_ASSET[shown];
  const fallbackId = GUIDE_ACTION_FALLBACK[shown] ?? preferred;
  const preferredReady = useAssetImageReady(preferred);
  const fallbackReady = useAssetImageReady(fallbackId);
  const artId = preferredReady ? preferred : fallbackId;
  const ready = preferredReady || fallbackReady;
  const showRole = showLabel || !ready || isDebugUiEnabled();

  return (
    <div
      className={`chibi chibi--${shown} chibi--face-${facing} ${ready ? 'chibi--art' : ''} ${className ?? ''}`}
      style={{ width: CHIBI_W * scale, height: CHIBI_H * scale, ...style }}
      aria-hidden
      data-character-role="guide_mayi"
      data-chibi-action={shown}
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
      {showRole && <span className="chibi__role">{GUIDE_ROLE_LABEL}</span>}
    </div>
  );
}
