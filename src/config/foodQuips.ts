/**
 * 美食屋组合专属吐槽引擎
 *
 * 火锅 / 水果捞「端上桌」后，根据玩家实际选择生成 1~2 句针对性吐槽：
 * 1. 先匹配「特殊组合规则」（命中优先，按 priority 高者在前）
 * 2. 再按食材属性（口感 / 温度 / 酸甜 / 颜色 / 名字谐音）生成模板句
 * 3. 兜底句保证任何组合都至少有 1 句
 *
 * 规则与模板集中在本文件，新增食材 / 组合只需追加条目。
 * 写作红线：不以体重或健康问题作为笑点。
 */

import { FRUIT_BASES, FRUIT_TOPPINGS, FRUITS, HOTPOT_INGREDIENTS, SECRET_TOPPING_ID } from './food';

/** 食材口感 / 温度属性标签 */
export type Trait = 'meat' | 'soft' | 'chewy' | 'veg' | 'cold' | 'sweet' | 'drink' | 'mint' | 'melt' | 'slippery' | 'thin';

/** 火锅食材属性表（与 HOTPOT_INGREDIENTS 的 id 对应） */
const HOTPOT_TRAITS: Record<string, Trait[]> = {
  beef: ['meat', 'thin'],
  tripe: ['meat', 'chewy'],
  shrimp: ['meat', 'soft'],
  potato: ['veg', 'soft'],
  mushroom: ['veg', 'slippery'],
  tofu: ['soft', 'slippery'],
  noodle: ['chewy', 'slippery'],
  ricecake: ['chewy', 'soft'],
  watermelon: ['cold', 'sweet'],
  icecream: ['cold', 'sweet', 'melt'],
  mint: ['mint', 'sweet'],
  milktea: ['drink', 'sweet'],
};

interface ComboRule {
  /** 命中所需的全部 id */
  all: string[];
  /** 优先级（越大越先） */
  priority: number;
  lines: string[];
}

/** 火锅特殊组合规则 */
const HOTPOT_COMBOS: ComboRule[] = [
  {
    all: ['watermelon', 'icecream'],
    priority: 10,
    lines: ['西瓜还没想明白自己是甜品还是配菜，冰淇淋已经在锅里选择了融化。'],
  },
  {
    all: ['mint', 'milktea'],
    priority: 9,
    lines: ['薄荷奶茶火锅：清凉、丝滑、麻辣三位一体，店长决定给它单独开一张菜单，然后藏起来。'],
  },
  {
    all: ['icecream', 'milktea'],
    priority: 8,
    lines: ['冰淇淋和奶茶在锅里会合，场面像一家甜品店搬进了火锅店——而且没有人同意。'],
  },
  {
    all: ['watermelon', 'mint'],
    priority: 8,
    lines: ['西瓜配薄荷糖，本来是夏天的味道，现在是夏天掉进火锅的味道。'],
  },
  {
    all: ['beef', 'tripe'],
    priority: 6,
    lines: ['牛肉卷三秒、毛肚七上八下——这锅的计时员今天很忙。'],
  },
  {
    all: ['noodle', 'ricecake'],
    priority: 6,
    lines: ['宽粉和年糕同锅，筷子还没下去，饱腹感先替你举手了。'],
  },
  {
    all: ['tofu', 'shrimp'],
    priority: 5,
    lines: ['嫩豆腐和虾滑都软软的，这锅的口感像在排队做 SPA。'],
  },
  {
    all: ['mushroom', 'noodle'],
    priority: 5,
    lines: ['金针菇和宽粉：这锅里两个最难捞干净的选手凑齐了，筷子表示压力很大。'],
  },
  {
    all: ['potato', 'ricecake'],
    priority: 4,
    lines: ['土豆片和年糕，一个吸汤一个拉丝，这锅很快就要变成一锅浓情糊糊。'],
  },
];

/** 火锅属性模板（按命中的属性组合） */
function hotpotTraitLines(ids: string[], names: string[]): string[] {
  const traits = ids.flatMap((id) => HOTPOT_TRAITS[id] ?? []);
  const has = (tr: Trait) => traits.includes(tr);
  const cnt = (tr: Trait) => traits.filter((x) => x === tr).length;
  const nameOf = (tr: Trait) => names[ids.findIndex((id) => (HOTPOT_TRAITS[id] ?? []).includes(tr))];
  const out: string[] = [];

  if (cnt('cold') >= 2) out.push('两样冰的东西下锅，锅底沸腾的声音像是在问：你们确定吗？');
  else if (has('cold') && has('meat')) out.push(`${nameOf('cold')}和${nameOf('meat')}同锅，一个在降温一个在加热，锅里正在进行一场气候谈判。`);
  else if (has('cold')) out.push(`${nameOf('cold')}下锅的那一刻，整锅汤都安静了一秒，然后决定装作没看见。`);

  if (has('drink') && !has('cold')) out.push(`${nameOf('drink')}进了锅，现在分不清是火锅加了饮料，还是饮料加了火锅。`);
  if (has('mint') && !has('cold')) out.push(`${nameOf('mint')}在红汤里化开，麻、辣、凉三种感觉同时上线，舌头申请加班费。`);

  if (cnt('meat') >= 3) out.push('三样荤菜齐下，这锅的目标很明确：今天谁也别想吃到蔬菜。');
  else if (cnt('veg') >= 2 && !has('meat')) out.push('一锅全素，清爽到店长怀疑你是来养生的，但汤底表示不服。');
  if (cnt('soft') >= 3) out.push('全是软乎乎的食材，这锅端上桌时请不要晃，它们会一起跳舞。');
  if (cnt('chewy') >= 2) out.push(`${nameOf('chewy')}带头的弹牙组合，这锅需要多嚼几下，建议聊天时别急着发言。`);
  if (cnt('slippery') >= 2) out.push('两样滑溜溜的食材，筷子今天的 KPI 是「夹得住」。');
  if (has('thin') && has('chewy')) out.push('薄切配弹牙，一个三秒就熟一个慢慢煮，这锅在教你什么叫节奏感。');

  return out;
}

/** 火锅兜底句（按离谱食材数量） */
const HOTPOT_FALLBACK = (weird: number, names: string[]) =>
  weird === 0
    ? `${names[0]}打头阵的正经火锅，蒸汽都在鼓掌。`
    : weird >= 3
      ? '这锅已经不是火锅了，是一场行为艺术，店长正在找人写展览说明。'
      : `正经食材和离谱食材各占一半，这锅的味道取决于你先捞到哪一边。`;

/**
 * 生成火锅组合专属吐槽（1~2 句）
 * @param ids 实际下锅的食材 id
 */
export function hotpotQuips(ids: string[]): string[] {
  const items = ids.map((id) => HOTPOT_INGREDIENTS.find((i) => i.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
  const names = items.map((i) => i.name);
  const weird = items.filter((i) => i.weird).length;
  const lines: string[] = [];

  HOTPOT_COMBOS.filter((r) => r.all.every((id) => ids.includes(id)))
    .sort((a, b) => b.priority - a.priority)
    .forEach((r) => lines.push(...r.lines));
  hotpotTraitLines(ids, names).forEach((l) => lines.push(l));
  if (lines.length === 0) lines.push(HOTPOT_FALLBACK(weird, names));
  return dedupe(lines).slice(0, 2);
}

// ---------- 水果捞 ----------

/** 水果属性：酸 / 甜 / 颜色 */
interface FruitTrait {
  sour: number; // 0~2
  sweet: number; // 0~2
  color: string;
}

const FRUIT_TRAITS: Record<string, FruitTrait> = {
  mango: { sour: 0, sweet: 2, color: '黄' },
  watermelon: { sour: 0, sweet: 1, color: '红' },
  strawberry: { sour: 1, sweet: 1, color: '红' },
  grape: { sour: 1, sweet: 1, color: '紫' },
  kiwi: { sour: 2, sweet: 0, color: '绿' },
  lychee: { sour: 0, sweet: 2, color: '白' },
  blueberry: { sour: 1, sweet: 1, color: '紫' },
  dragon: { sour: 0, sweet: 1, color: '粉' },
};

/** 水果捞特殊组合规则（可同时匹配水果 / 底料 / 配料 id） */
const FRUIT_COMBOS: ComboRule[] = [
  {
    all: ['kiwi', 'strawberry', 'grape'],
    priority: 10,
    lines: ['酸味三巨头集体开会，议题只有一个：谁来负责甜。'],
  },
  {
    all: ['kiwi', 'blueberry', 'strawberry'],
    priority: 10,
    lines: ['猕猴桃、蓝莓、草莓——酸味选手凑齐了一个战队，底料是唯一的和平使者。'],
  },
  {
    all: ['mango', 'lychee'],
    priority: 7,
    lines: ['芒果加荔枝，甜度直接拉满，碗边的糖水都觉得自己多余。'],
  },
  {
    all: ['grape', 'blueberry'],
    priority: 7,
    lines: ['葡萄和蓝莓挤在一个碗里，紫色浓度过高，碗底疑似在调色。'],
  },
  {
    all: ['watermelon', 'dragon'],
    priority: 6,
    lines: ['西瓜和火龙果，一个红一个粉，这碗水果捞自带滤镜。'],
  },
  {
    all: ['kiwi', 'yogurt'],
    priority: 5,
    lines: ['猕猴桃配酸奶，酸和酸握了个手，然后一起看向你。'],
  },
  {
    all: ['mango', 'coconut', 'sago'],
    priority: 8,
    lines: ['芒果椰奶西米——这就是教科书级杨枝甘露的开头，店长默默点了个赞。'],
  },
  {
    all: ['taro', 'coconut'],
    priority: 5,
    lines: ['芋圆泡在椰奶里，Q 弹和丝滑达成了和解。'],
  },
  {
    all: ['nuts', 'syrup'],
    priority: 4,
    lines: ['坚果碎遇上糖水，咔嚓一声，甜味有了节奏。'],
  },
  {
    all: [SECRET_TOPPING_ID],
    priority: 20,
    lines: ['蛋黄沙司淋在水果上……店长盯着这碗看了三秒，然后指了指隔壁的神秘料理台。'],
  },
];

/**
 * 水果捞属性模板
 * @param fruitIds 水果 id
 * @param baseId 底料 id
 * @param toppingId 配料 id
 */
function fruitTraitLines(fruitIds: string[], baseId: string | null, toppingId: string | null): string[] {
  const traits = fruitIds.map((id) => FRUIT_TRAITS[id]).filter(Boolean);
  const names = fruitIds.map((id) => FRUITS.find((f) => f.id === id)?.name ?? id);
  const sour = traits.reduce((n, t) => n + t.sour, 0);
  const sweet = traits.reduce((n, t) => n + t.sweet, 0);
  const colors = new Set(traits.map((t) => t.color));
  const baseName = FRUIT_BASES.find((b) => b.id === baseId)?.name ?? '底料';
  const toppingName = FRUIT_TOPPINGS.find((t) => t.id === toppingId)?.name ?? '配料';
  const out: string[] = [];

  if (sour >= 4) out.push(`${names.join('、')}一起上阵，这碗的酸度足以让${baseName}当场辞职。`);
  else if (sour === 0 && sweet >= 4) out.push(`${names.join('、')}全是甜口，吃到一半记得抬头看看窗外，提醒自己今天还有别的味道。`);
  else if (sour >= 2 && sweet >= 3) out.push('酸甜比例刚好，像一首前奏略皮、副歌很甜的歌。');

  if (colors.size === 1) out.push(`三种水果一个颜色，这碗水果捞的主题色是「${[...colors][0]}」，设计师表示很统一。`);
  else if (colors.size === 3) out.push('红的黄的紫的凑在一起，这碗先用眼睛吃，再用嘴吃。');

  if (baseId === 'yogurt' && sour >= 3) out.push('酸奶遇上酸水果，店长建议配一块云片糕中和一下人生。');
  if (baseId === 'syrup' && sweet >= 4) out.push('糖水底加高甜水果，这碗甜得很诚实，一点都不装。');
  if (baseId === 'coconut' && colors.has('紫')) out.push('椰奶白配紫色水果，碗里像落了一片傍晚的天空。');

  if (toppingId === 'nuts') out.push(`${toppingName}撒在上面，每一口都带着「咔嚓」的掌声。`);
  if (toppingId === 'sago' && fruitIds.includes('watermelon')) out.push('西米和西瓜，名字只差一个字，味道差了整个夏天。');
  if (toppingId === 'taro' && sour >= 3) out.push('芋圆在酸味里 Q 弹地蹦跶，像是在给这碗水果捞打气。');

  return out;
}

/**
 * 生成水果捞组合专属吐槽（1~2 句）
 * @param fruitIds 水果 id
 * @param baseId 底料 id
 * @param toppingId 配料 id
 */
export function fruitQuips(fruitIds: string[], baseId: string | null, toppingId: string | null): string[] {
  const all = [...fruitIds, baseId, toppingId].filter((x): x is string => !!x);
  const lines: string[] = [];
  FRUIT_COMBOS.filter((r) => r.all.every((id) => all.includes(id)))
    .sort((a, b) => b.priority - a.priority)
    .forEach((r) => lines.push(...r.lines));
  fruitTraitLines(fruitIds, baseId, toppingId).forEach((l) => lines.push(l));
  if (lines.length === 0) lines.push('冰凉清甜，水果们在碗里开起了派对，底料负责放音乐。');
  return dedupe(lines).slice(0, 2);
}

/** 去重保持顺序 */
function dedupe(lines: string[]): string[] {
  return lines.filter((l, i) => lines.indexOf(l) === i);
}
