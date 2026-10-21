import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import type { GuideAction } from '../../config/characters';
import { SCENES, type SceneId } from '../../config/scenes';
import { SCENE_THEMES, sceneThemeStyle } from '../../config/sceneThemes';
import { getVoiceCaption, getVoiceCaptionSnapshot, subscribeVoiceCaption } from '../../core/characterVoice';
import { ChibiMayi } from './ChibiMayi';
import { PlaceholderBackground } from './PlaceholderBackground';
import { PlaceholderCharacter, type CharacterMood } from './PlaceholderCharacter';

/** 场景侧栏里的 Q 版向导 */
export interface GuideSlot {
  action: GuideAction;
  scale?: number;
  /** 说话时改用台词表情。默认开。 */
  followVoice?: boolean;
  /** 只在她正在说话时出现，避免挡住小游戏操作区 */
  onlyWhileSpeaking?: boolean;
}

export interface SceneLayoutProps {
  /** 场景 ID（决定背景） */
  scene: SceneId;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** 底部操作区 */
  actions?: ReactNode;
  /** 右侧玩家立绘表情；传 null 则不显示玩家。这不是说话状态。 */
  mood?: CharacterMood | null;
  /** 右侧 Q 版向导。玩家更大，向导叠在立绘上方。 */
  guide?: GuideSlot | null;
  /** overlay 时侧栏不挤压操作区 */
  side?: 'flow' | 'overlay';
  /** 标题点击（用于彩蛋触发） */
  onTitleClick?: () => void;
  /** 紧凑模式：标题缩小、主体更高（小游戏使用） */
  compact?: boolean;
}

/**
 * 场景通用布局：背景 + 标题 + 主体 + 右侧角色 + 底部操作栏。
 * mood 只画玩家麻衣。guide 只画 Q 版向导。两者可以同时在，向导更小。
 */
export function SceneLayout({
  scene,
  title,
  subtitle,
  children,
  actions,
  mood = 'normal',
  guide = null,
  side = 'flow',
  onTitleClick,
  compact,
}: SceneLayoutProps) {
  useSyncExternalStore(subscribeVoiceCaption, getVoiceCaptionSnapshot);
  const speaking = getVoiceCaption() !== null;
  const showGuide = !!guide && (!guide.onlyWhileSpeaking || speaking);
  const showPlayer = mood !== null;
  const def = SCENES[scene];
  const theme = SCENE_THEMES[scene];
  const themed = theme.skin === 'themed';
  return (
    <div className={`scene scene--${scene}${themed ? ' scene--themed' : ''}`} style={themed ? sceneThemeStyle(theme) : undefined}>
      <div className="scene__bg">
        <PlaceholderBackground asset={def.bg} />
      </div>
      <div className="scene__content">
        <h1
          className="scene__title"
          onClick={onTitleClick}
          style={{ cursor: onTitleClick ? 'pointer' : undefined, fontSize: compact ? 44 : undefined }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="scene__subtitle" style={compact ? { fontSize: 22, marginTop: 6 } : undefined}>
            {subtitle}
          </p>
        )}
        <div className="scene__body" style={compact ? { marginTop: 18, alignItems: 'stretch' } : undefined}>
          <div className="scene__main">{children}</div>
          {(showPlayer || showGuide) && (
            <div className={`scene__side ${side === 'overlay' ? 'scene__side--overlay' : ''}`}>
              {showGuide && guide && (
                <div className="scene__guide">
                  <ChibiMayi action={guide.action} scale={guide.scale ?? 0.9} followVoice={guide.followVoice ?? true} />
                </div>
              )}
              {showPlayer && <PlaceholderCharacter mood={mood ?? 'normal'} />}
            </div>
          )}
        </div>
        {actions && <div className="scene__actions">{actions}</div>}
      </div>
    </div>
  );
}
