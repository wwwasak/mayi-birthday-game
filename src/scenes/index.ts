import type { ComponentType } from 'react';
import type { SceneId } from '../config/scenes';
import { BootScene } from './BootScene';
import { CakeScene } from './CakeScene';
import { CandleScene } from './CandleScene';
import { EggScene } from './EggScene';
import { ExamScene } from './ExamScene';
import { FinalScene } from './FinalScene';
import { FoodScene } from './FoodScene';
import { GateScene } from './GateScene';
import { AuthRedirectScene, NoticeRedirectScene } from './LegacyScenes';
import { MapScene } from './MapScene';
import { MintScene } from './MintScene';
import { MusicScene } from './MusicScene';
import { TicketScene } from './TicketScene';
import { WishScene } from './WishScene';

/** 场景 ID → 组件 的注册表；新增场景需同时在 config/scenes.ts 注册元数据 */
export const SCENE_COMPONENTS: Record<SceneId, ComponentType> = {
  boot: BootScene,
  gate: GateScene,
  auth: AuthRedirectScene,
  notice: NoticeRedirectScene,
  map: MapScene,
  mint: MintScene,
  food: FoodScene,
  exam: ExamScene,
  wish: WishScene,
  cake: CakeScene,
  candle: CandleScene,
  music: MusicScene,
  final: FinalScene,
  ticket: TicketScene,
  egg: EggScene,
};
