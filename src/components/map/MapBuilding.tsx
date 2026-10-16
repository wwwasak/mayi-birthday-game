import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ASSETS, assetUrl, type ImageAssetId } from '../../config/assets';
import { isDebugUiEnabled } from '../../config/debugUi';
import { buildingFrame, CAKE_SLOT_SIZE, type BuildingId } from '../../config/mapLayout';
import { STAMPS, STAMP_ORDER } from '../../config/stamps';
import { useAssetImageReady } from '../../hooks/useAssetImageReady';

/** 建筑显示状态 */
export type BuildingState = 'open' | 'done' | 'locked';

export interface MapBuildingProps {
  id: BuildingId;
  title: string;
  /** 悬停时才出现的介绍或解锁条件 */
  hint: string;
  state: BuildingState;
  /** 当前可进入时，建筑下方的进入按钮文案。锁定和已完成不显示这条 */
  enterLabel?: ReactNode;
  /** 灯笼亮度 0（灭）/ 1（微亮）/ 2（全亮） */
  lanternLevel: 0 | 1 | 2;
  /** 被点击但锁定：抖一下 */
  shaking?: boolean;
  /** 解锁瞬间 / 可进入强调：发光 */
  glowing?: boolean;
  /** 蛋糕房：门上四槽是否点亮（仅 CSS 占位房屋） */
  slotsLit?: boolean;
  onClick: () => void;
}

const BUILDING_ASSET: Record<BuildingId, ImageAssetId> = {
  mint: 'map_building_mint',
  food: 'map_building_food',
  exam: 'map_building_exam',
  wish: 'map_building_wish',
  cake: 'map_building_cake',
};

const BUILDING_EMOJI: Record<BuildingId, string> = { mint: '🍬', food: '🍲', exam: '📝', wish: '🌟', cake: '🎂' };

/**
 * 地图上的一栋建筑。
 * 正式 PNG 按底边锚点、保持宽高比铺在视觉框里；名称和按钮在框的下方，不盖住建筑。
 * 没有 PNG 时，视觉框退回原来的点击矩形，里面仍是 CSS 房屋。
 */
export function MapBuilding({ id, title, hint, state, enterLabel, lanternLevel, shaking, glowing, slotsLit, onClick }: MapBuildingProps) {
  const isCake = id === 'cake';
  const color = isCake ? '#ffb3d2' : STAMPS[id].color;
  const assetId = BUILDING_ASSET[id];
  const hasArt = useAssetImageReady(assetId);
  const frame = buildingFrame(id, hasArt);
  const showDebug = isDebugUiEnabled();

  const cls = [
    'bld',
    `bld--${id}`,
    `bld--${state}`,
    `bld--lv${lanternLevel}`,
    isCake ? 'bld--cake' : '',
    hasArt ? 'bld--has-art' : '',
    shaking ? 'bld--shake' : '',
    glowing ? 'bld--glow' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      className={cls}
      style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h, ['--bld-color' as string]: color }}
      data-has-art={hasArt ? '1' : '0'}
      whileHover={{ y: -6 }}
    >
      <button
        type="button"
        className="bld__hit"
        data-building={id}
        data-hint-target={`bld-${id}`}
        aria-label={`${title}（${state === 'locked' ? '锁定' : state === 'done' ? '已盖章' : '可进入'}）`}
        title={hint}
        onClick={onClick}
      >
        <span className="bld__shadow" />
        {hasArt ? (
          <img className="bld__art" src={assetUrl(assetId)} alt="" decoding="async" draggable={false} />
        ) : (
          <span className="bld__css">
            <span className="bld__roof" />
            <span className={`bld__lantern bld__lantern--l bld__lantern--lv${lanternLevel}`} />
            <span className={`bld__lantern bld__lantern--r bld__lantern--lv${lanternLevel}`} />
            <span className="bld__wall">
              <span className={`bld__window ${state === 'done' ? 'bld__window--lit' : ''}`} />
              <span className={`bld__window bld__window--2 ${state === 'done' ? 'bld__window--lit' : ''}`} />
              {isCake ? (
                <span className="bld__door bld__door--cake">
                  <span className="bld__slots">
                    {STAMP_ORDER.map((sid) => (
                      <span
                        key={sid}
                        className={`bld__slot ${slotsLit ? 'bld__slot--lit' : ''}`}
                        data-slot={sid}
                        style={{ width: CAKE_SLOT_SIZE, height: CAKE_SLOT_SIZE, ['--slot-color' as string]: STAMPS[sid].color }}
                      >
                        {slotsLit ? STAMPS[sid].emoji : ''}
                      </span>
                    ))}
                  </span>
                </span>
              ) : (
                <span className="bld__door" />
              )}
            </span>
          </span>
        )}
      </button>

      <div className="bld__meta">
        <div className="bld__name" title={hint}>
          <span className="bld__sign-emoji" aria-hidden>
            {BUILDING_EMOJI[id]}
          </span>
          <span className="bld__sign-title">{title}</span>
          {state === 'locked' && (
            <span className="bld__lock" aria-hidden>
              🔒
            </span>
          )}
          {state === 'done' && !isCake && <span className="bld__stamp">{STAMPS[id].emoji} 已盖章</span>}
        </div>
        {state === 'open' && enterLabel && (
          <button type="button" className="bld__enter" onClick={onClick}>
            {enterLabel}
          </button>
        )}
      </div>
      {showDebug && <span className="bld__asset-label">{ASSETS[assetId].path}</span>}
    </motion.div>
  );
}
