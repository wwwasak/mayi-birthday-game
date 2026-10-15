import type { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  /** 卡片标题 */
  title?: ReactNode;
  /** 左上角小标签（如“占位”） */
  tag?: string;
  children?: ReactNode;
  /** 占位样式（虚线边框） */
  placeholder?: boolean;
  /** 可点击态 */
  clickable?: boolean;
  /** 选中态 */
  selected?: boolean;
  /** 完成态 */
  done?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  /** 测试/提示系统使用的 data-testid */
  testId?: string;
}

/**
 * 通用卡片容器
 */
export function Card({
  title,
  tag,
  children,
  placeholder,
  clickable,
  selected,
  done,
  onClick,
  style,
  className,
  testId,
}: CardProps) {
  const cls = [
    'card',
    placeholder ? 'card--placeholder' : '',
    clickable ? 'card--clickable' : '',
    selected ? 'card--selected' : '',
    done ? 'card--done' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={cls}
      style={style}
      data-testid={testId}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {tag && <span className="card__tag">{tag}</span>}
      {title && <h3 className="card__title">{title}</h3>}
      {children}
    </div>
  );
}
