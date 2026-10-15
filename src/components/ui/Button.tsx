import type { ButtonHTMLAttributes } from 'react';
import { audio } from '../../core/audio';

/** 按钮视觉变体 */
export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** 小尺寸 */
  small?: boolean;
  /** 是否播放点击音效（默认 true） */
  sfx?: boolean;
}

/**
 * 通用按钮：统一样式 + 点击音效
 */
export function Button({ variant = 'primary', small, sfx = true, className, onClick, ...rest }: ButtonProps) {
  const cls = ['btn', variant !== 'primary' ? `btn--${variant}` : '', small ? 'btn--sm' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      className={cls}
      onClick={(e) => {
        if (sfx) audio.playSfx('sfx_click');
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
