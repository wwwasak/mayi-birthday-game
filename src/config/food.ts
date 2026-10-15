import type { CollectibleId } from '../core/progress';
import type { ImageAssetId } from './assets';

/** 火锅食材 */
export interface HotpotIngredient {
  id: string;
  name: string;
  emoji: string;
  /** 是否离谱食材（触发吐槽） */
  weird?: boolean;
  /** 下锅时的反馈台词 */
  line: string;
}

/** 火锅食材池（正常 8 + 离谱 4） */
export const HOTPOT_INGREDIENTS: HotpotIngredient[] = [
  { id: 'beef', name: '牛肉卷', emoji: '🥩', line: '牛肉卷下锅三秒就能捞，香气先一步到位。' },
  { id: 'tripe', name: '毛肚', emoji: '🫓', line: '七上八下，毛肚的仪式感拉满！' },
  { id: 'shrimp', name: '虾滑', emoji: '🍤', line: '虾滑在锅里慢慢浮起来，像小船一样。' },
  { id: 'potato', name: '土豆片', emoji: '🥔', line: '土豆片吸满汤汁，软糯担当。' },
  { id: 'mushroom', name: '金针菇', emoji: '🍄', line: '金针菇：永远捞不干净的那一个。' },
  { id: 'tofu', name: '嫩豆腐', emoji: '🧈', line: '嫩豆腐轻轻滑入，锅里安静了一秒。' },
  { id: 'noodle', name: '宽粉', emoji: '🍜', line: '宽粉入锅，饱腹感预警。' },
  { id: 'ricecake', name: '年糕', emoji: '🍡', line: '年糕咕嘟咕嘟，软到能拉丝。' },
  { id: 'watermelon', name: '西瓜', emoji: '🍉', weird: true, line: '等等——西瓜不是这么用的吧？！锅里现在是西瓜味的了。' },
  { id: 'icecream', name: '冰淇淋', emoji: '🍦', weird: true, line: '冰淇淋进锅三秒钟就不见了。它去了更好的地方。' },
  { id: 'mint', name: '薄荷糖', emoji: '🍬', weird: true, line: '薄荷味火锅……清凉又麻辣，这是新流派吗？' },
  { id: 'milktea', name: '奶茶', emoji: '🧋', weird: true, line: '奶茶当汤底？店长表示已经不想说话了。' },
];

/** 火锅成品评级（按离谱食材数量） */
export const HOTPOT_RATINGS: { maxWeird: number; title: string; line: string }[] = [
  { maxWeird: 0, title: '教科书级火锅', line: '一锅正经火锅！蒸汽都在鼓掌。' },
  { maxWeird: 1, title: '创意火锅', line: '有一点点出格，但意外地……有想法？' },
  { maxWeird: 2, title: '勇者火锅', line: '勇气可嘉，味道存疑。店长默默递上一杯水。' },
  { maxWeird: 4, title: '黑暗料理实验成功（？）', line: '这锅已经不是火锅了，是行为艺术。' },
];

/** 水果 */
export const FRUITS = [
  { id: 'mango', name: '芒果', emoji: '🥭' },
  { id: 'watermelon', name: '西瓜', emoji: '🍉' },
  { id: 'strawberry', name: '草莓', emoji: '🍓' },
  { id: 'grape', name: '葡萄', emoji: '🍇' },
  { id: 'kiwi', name: '猕猴桃', emoji: '🥝' },
  { id: 'lychee', name: '荔枝', emoji: '🍈' },
  { id: 'blueberry', name: '蓝莓', emoji: '🫐' },
  { id: 'dragon', name: '火龙果', emoji: '🩷' },
];

/** 底料 */
export const FRUIT_BASES = [
  { id: 'yogurt', name: '酸奶', emoji: '🥛' },
  { id: 'coconut', name: '椰奶', emoji: '🥥' },
  { id: 'syrup', name: '糖水', emoji: '🍯' },
];

/** 配料；salted_egg 为神秘料理线索（点击即解锁神秘料理台，不必做完水果捞） */
export const FRUIT_TOPPINGS = [
  { id: 'sago', name: '西米', emoji: '⚪' },
  { id: 'taro', name: '芋圆', emoji: '🟣' },
  { id: 'nuts', name: '坚果碎', emoji: '🥜' },
  { id: 'salted_egg', name: '蛋黄沙司（？）', emoji: '🥚', secret: true },
];

/** 隐藏料理线索配料 ID */
export const SECRET_TOPPING_ID = 'salted_egg';

/** 图鉴条目 */
export interface CollectibleDef {
  id: CollectibleId;
  name: string;
  emoji: string;
  asset: ImageAssetId;
  /** 如何获得（图鉴中未解锁时显示） */
  howTo: string;
  /** 解锁后的介绍 */
  desc: string;
  /** 是否隐藏条目 */
  secret?: boolean;
}

export const COLLECTIBLES: CollectibleDef[] = [
  {
    id: 'tangbing',
    name: '糖饼',
    emoji: '🥮',
    asset: 'item_tangbing',
    howTo: '完成一锅火锅后，店长会送一块。',
    desc: '外酥里糯的糖饼，火锅之后的甜蜜收尾。',
  },
  {
    id: 'yunpiangao',
    name: '云片糕',
    emoji: '🍘',
    asset: 'item_yunpiangao',
    howTo: '做好一碗水果捞后出现。',
    desc: '薄得像云片一样的糕点，一片一片慢慢撕着吃。',
  },
  {
    id: 'bohetang',
    name: '薄荷糖',
    emoji: '🍬',
    asset: 'item_mint',
    howTo: '美食屋柜台上好像放着一个糖罐……',
    desc: '游园会常备的薄荷糖，清凉提神，人手一颗。',
  },
  {
    id: 'danhuangnangua',
    name: '蛋黄焗窝瓜',
    emoji: '🎃',
    asset: 'item_golden_dish',
    howTo: '水果捞台的配料里混进了一个奇怪的东西，去点点看。',
    desc: '金黄酥脆的蛋黄焗窝瓜——美食屋的神秘招牌菜。',
    secret: true,
  },
];
