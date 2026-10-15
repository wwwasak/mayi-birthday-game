import type { ReactNode } from 'react';
import { SCENES, type SceneId } from '../../config/scenes';
import { PlaceholderBackground } from './PlaceholderBackground';
import { PlaceholderCharacter, type CharacterMood } from './PlaceholderCharacter';

export interface SceneLayoutProps {
  /** 场景 ID（决定背景） */
  scene: SceneId;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** 底部操作区 */
  actions?: ReactNode;
  /** 右侧角色表情；传 null 则不显示角色 */
  mood?: CharacterMood | null;
  /** 标题点击（用于彩蛋触发） */
  onTitleClick?: () => void;
  /** 紧凑模式：标题缩小、主体更高（小游戏使用） */
  compact?: boolean;
}

/**
 * 场景通用布局：背景 + 标题 + 主体 + 右侧角色 + 底部操作栏
 */
export function SceneLayout({
  scene,
  title,
  subtitle,
  children,
  actions,
  mood = 'normal',
  onTitleClick,
  compact,
}: SceneLayoutProps) {
  const def = SCENES[scene];
  return (
    <div className="scene">
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
          {mood && (
            <div className="scene__side">
              <PlaceholderCharacter mood={mood} />
            </div>
          )}
        </div>
        {actions && <div className="scene__actions">{actions}</div>}
      </div>
    </div>
  );
}
