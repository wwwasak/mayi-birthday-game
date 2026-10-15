import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ASSETS, type ImageAssetId } from '../../config/assets';
import { CAKE_SLOT_SIZE, MAP_BUILDINGS, type BuildingId } from '../../config/mapLayout';
import { STAMPS, STAMP_ORDER } from '../../config/stamps';

/** 建筑显示状态 */
export type BuildingState = 'open' | 'done' | 'locked';

export interface MapBuildingProps {
  id: BuildingId;
  title: string;
  desc: string;
  state: BuildingState;
  /** 状态条文字（进入 / 再玩一次 / 锁定条件…） */
  statusText: ReactNode;
  /** 灯笼亮度 0（灭）/ 1（微亮）/ 2（全亮） */
  lanternLevel: 0 | 1 | 2;
  /** 被点击但锁定：抖一下 */
  shaking?: boolean;
  /** 解锁瞬间 / 可进入强调：发光 */
  glowing?: boolean;
  /** 蛋糕房：门上四槽是否点亮 */
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
 * 地图建筑（CSS 占位）：整栋可点击；屋顶 / 墙体 / 窗户 / 灯笼 / 招牌 / 状态条
 * 正式美术到位后可用一张透明底建筑图替换屋顶与墙体，保持同一外框与可点区域
 */
export function MapBuilding({ id, title, desc, state, statusText, lanternLevel, shaking, glowing, slotsLit, onClick }: MapBuildingProps) {
  const r = MAP_BUILDINGS[id];
  const isCake = id === 'cake';
  const color = isCake ? '#ffb3d2' : STAMPS[id].color;
  const cls = [
    'bld',
    `bld--${id}`,
    `bld--${state}`,
    isCake ? 'bld--cake' : '',
    shaking ? 'bld--shake' : '',
    glowing ? 'bld--glow' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.button
      type="button"
      className={cls}
      style={{ left: r.x, top: r.y, width: r.w, height: r.h, ['--bld-color' as string]: color }}
      data-building={id}
      data-hint-target={`bld-${id}`}
      aria-label={`${title}（${state === 'locked' ? '锁定' : state === 'done' ? '已盖章' : '可进入'}）`}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="bld__roof" />
      <div className={`bld__lantern bld__lantern--l bld__lantern--lv${lanternLevel}`} />
      <div className={`bld__lantern bld__lantern--r bld__lantern--lv${lanternLevel}`} />
      <div className="bld__wall">
        <div className={`bld__window ${state === 'done' ? 'bld__window--lit' : ''}`} />
        <div className={`bld__window bld__window--2 ${state === 'done' ? 'bld__window--lit' : ''}`} />
        {isCake ? (
          <div className="bld__door bld__door--cake">
            <div className="bld__slots">
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
            </div>
          </div>
        ) : (
          <div className="bld__door" />
        )}
      </div>
      <div className="bld__sign">
        <span className="bld__sign-emoji">{BUILDING_EMOJI[id]}</span>
        <span className="bld__sign-title">{title}</span>
      </div>
      <div className="bld__desc">{desc}</div>
      <div className={`bld__status bld__status--${state}`}>{statusText}</div>
      {state === 'done' && !isCake && <div className="bld__stamp">{STAMPS[id].emoji} 已盖章</div>}
      {state === 'locked' && <div className="bld__lock">🔒</div>}
      <span className="bld__asset-label">{ASSETS[BUILDING_ASSET[id]].path}</span>
    </motion.button>
  );
}
