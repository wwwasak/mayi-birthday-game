import { motion } from 'motion/react';
import { ASSETS, type ImageAssetId } from '../../config/assets';

/** 角色表情 */
export type CharacterMood = 'normal' | 'happy' | 'think' | 'surprise';

export interface PlaceholderCharacterProps {
  mood?: CharacterMood;
  /** 缩放倍率（基础尺寸 320x460，缩放后占位尺寸同步变化） */
  scale?: number;
}

const MOOD_ASSET: Record<CharacterMood, ImageAssetId> = {
  normal: 'char_normal',
  happy: 'char_happy',
  think: 'char_think',
  surprise: 'char_surprise',
};

const BASE_W = 320;
const BASE_H = 460;

/**
 * 占位角色：纯 CSS 绘制的简化麻衣
 * 特征：粉色长发、狐耳、左眼蓝紫 / 右眼粉红异瞳、白粉金花纹服饰
 */
export function PlaceholderCharacter({ mood = 'normal', scale = 1 }: PlaceholderCharacterProps) {
  const eyeCls = mood === 'happy' ? 'pc__eye--happy' : '';
  const mouthCls = mood === 'surprise' ? 'pc__mouth--open' : mood === 'think' ? 'pc__mouth--flat' : '';
  const label = ASSETS[MOOD_ASSET[mood]].path;

  return (
    <motion.div
      style={{ width: BASE_W * scale, height: BASE_H * scale, position: 'relative' }}
      animate={{ y: [0, -10 * scale, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="pc" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div className="pc__ear pc__ear--l" />
        <div className="pc__ear pc__ear--r" />
        <div className="pc__hair" />
        <div className="pc__body" />
        <div className="pc__face">
          <div className={`pc__eye pc__eye--l ${eyeCls}`} />
          <div className={`pc__eye pc__eye--r ${eyeCls}`} />
          <div className="pc__blush pc__blush--l" />
          <div className="pc__blush pc__blush--r" />
          <div className={`pc__mouth ${mouthCls}`} />
        </div>
        <span className="pc__label">占位立绘 · {label}</span>
      </div>
    </motion.div>
  );
}
