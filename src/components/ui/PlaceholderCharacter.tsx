import { motion } from 'motion/react';
import { assetUrl, type ImageAssetId } from '../../config/assets';
import { useAssetImageReady } from '../../hooks/useAssetImageReady';

/** 角色表情 */
export type CharacterMood = 'normal' | 'happy' | 'think' | 'surprise';

export interface PlaceholderCharacterProps {
  mood?: CharacterMood;
  /**
   * 缩放倍率。
   * bust 以 300×460 为基准；full 以 320×460 为基准。
   */
  scale?: number;
  /**
   * bust：半身裁切，优先露出狐耳、脸和上半身。
   * full：整张图 contain，留给闸机和剧场自己控制构图。
   */
  frame?: 'bust' | 'full';
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
 * 普通麻衣立绘。默认半身入镜，保持原图比例；加载失败时回退 CSS 占位。
 * @param frame bust 用容器裁上头肩，full 按原容器完整包含
 */
export function PlaceholderCharacter({ mood = 'normal', scale = 1, frame = 'bust' }: PlaceholderCharacterProps) {
  const asset = MOOD_ASSET[mood];
  const ready = useAssetImageReady(asset);
  const bust = frame === 'bust';
  const eyeCls = mood === 'happy' ? 'pc__eye--happy' : '';
  const mouthCls = mood === 'surprise' ? 'pc__mouth--open' : mood === 'think' ? 'pc__mouth--flat' : '';

  return (
    <motion.div
      className={bust ? 'pc-bust' : 'pc-full'}
      style={{ ['--pc-scale' as string]: scale, width: bust ? undefined : BASE_W * scale, height: bust ? undefined : BASE_H * scale, position: 'relative' }}
      animate={{ y: [0, -8 * scale, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {ready ? (
        <img
          className="pc__art"
          src={assetUrl(asset)}
          alt=""
          draggable={false}
          style={bust ? undefined : { width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', pointerEvents: 'none' }}
        />
      ) : (
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
        </div>
      )}
    </motion.div>
  );
}
