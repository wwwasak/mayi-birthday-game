import type { ImageAssetId } from './assets';
import type { SceneId } from './scenes';

/** 四枚生日印章的 ID */
export type StampId = 'mint' | 'food' | 'exam' | 'wish';

/** 印章定义 */
export interface StampDef {
  id: StampId;
  /** 显示名称 */
  name: string;
  /** 占位用 emoji（真实图标到位前使用） */
  emoji: string;
  /** 主题色 */
  color: string;
  /** 对应的关卡场景 */
  scene: SceneId;
  /** 对应的印章图标资源 */
  asset: ImageAssetId;
}

/** 印章顺序即地图展示顺序 */
export const STAMP_ORDER: StampId[] = ['mint', 'food', 'exam', 'wish'];

export const STAMPS: Record<StampId, StampDef> = {
  mint: {
    id: 'mint',
    name: '薄荷糖印章',
    emoji: '🍬',
    color: '#3fd1a8',
    scene: 'mint',
    asset: 'stamp_mint',
  },
  food: {
    id: 'food',
    name: '美食印章',
    emoji: '🍲',
    color: '#ff9a5c',
    scene: 'food',
    asset: 'stamp_food',
  },
  exam: {
    id: 'exam',
    name: '认证印章',
    emoji: '📝',
    color: '#7c8cff',
    scene: 'exam',
    asset: 'stamp_exam',
  },
  wish: {
    id: 'wish',
    name: '心愿印章',
    emoji: '🌟',
    color: '#c77dff',
    scene: 'wish',
    asset: 'stamp_wish',
  },
};
