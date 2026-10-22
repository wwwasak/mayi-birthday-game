/**
 * 统一资源配置表
 *
 * 所有图片与音频都在这里注册，代码中禁止散落写死路径。
 * 资源文件放在 public/assets 下，构建后位于 dist/assets，通过相对路径访问，
 * 保证 file:// 直接打开可用。
 *
 * 当前阶段资源尚未制作，所有条目都附带 placeholder（CSS 颜色/渐变）供占位组件使用。
 */

/** 资源类型 */
export type AssetKind = 'image' | 'audio';

/** 单条资源注册信息 */
export interface AssetEntry {
  /** 资源类型 */
  kind: AssetKind;
  /** 相对于 public/assets 的路径 */
  path: string;
  /** 给美术/音频制作者看的说明 */
  description: string;
  /** 资源未就绪时使用的 CSS 占位（颜色或渐变） */
  placeholder?: string;
  /** 音频：是否循环（BGM） */
  loop?: boolean;
  /**
   * 单个音源的校准系数 0~1。
   * 玩家听到的响度还要再乘总音量和分类音量。
   * 循环 BGM 与《红豆》保持 1，避免和分类滑块叠成两次衰减。
   */
  volume?: number;
  /** 音频分组。gift 是《红豆》，不参与 BGM 压低。 */
  group?: 'bgm' | 'sfx' | 'voice' | 'gift';
}

/** 资源根目录（相对路径，不可写成绝对路径） */
export const ASSET_BASE = './assets';

export const ASSETS = {
  // ---------- 背景 ----------
  bg_boot: {
    kind: 'image',
    path: 'images/bg/boot.jpg',
    description: '开场：信号连接中的深色星空/频道界面背景',
    placeholder: 'linear-gradient(160deg, #2b1d3f 0%, #4a2d6b 60%, #7a4a8f 100%)',
  },
  bg_gate: {
    kind: 'image',
    path: 'images/bg/gate.jpg',
    description: '游园会大门：身份认证与游客须知共用',
    placeholder: 'linear-gradient(160deg, #ffe4f1 0%, #ffd0e6 50%, #e9dcff 100%)',
  },
  bg_map: {
    kind: 'image',
    path: 'images/bg/map.jpg',
    description: '游园会地图总览：俯视卡通园区，四个场馆 + 中央蛋糕房',
    placeholder: 'linear-gradient(160deg, #e7f6ff 0%, #ffe9f4 50%, #fff6d9 100%)',
  },
  bg_mint: {
    kind: 'image',
    path: 'images/bg/mint.jpg',
    description: '薄荷糖补给站：清凉薄荷绿色调小摊位',
    placeholder: 'linear-gradient(160deg, #d9fff2 0%, #b7f3e3 50%, #e8fff8 100%)',
  },
  bg_food: {
    kind: 'image',
    path: 'images/bg/food.jpg',
    description: '美食幻想屋：暖色餐厅，火锅蒸汽与水果',
    placeholder: 'linear-gradient(160deg, #ffe9d6 0%, #ffd6c2 50%, #fff3e0 100%)',
  },
  bg_exam: {
    kind: 'image',
    path: 'images/bg/exam.jpg',
    description: '本人认证考试：可爱考场/黑板风格',
    placeholder: 'linear-gradient(160deg, #e6ecff 0%, #d7dcff 50%, #f0f2ff 100%)',
  },
  bg_wish: {
    kind: 'image',
    path: 'images/bg/wish.jpg',
    description: '心愿收藏屋：夜空、灯笼、漂浮的心愿卡',
    placeholder: 'linear-gradient(160deg, #2f2a5a 0%, #5a4a8a 60%, #8a6ab0 100%)',
  },
  bg_cake: {
    kind: 'image',
    path: 'images/bg/cake.jpg',
    description: '生日蛋糕房：温馨室内，桌上放大蛋糕',
    placeholder: 'linear-gradient(160deg, #fff0f6 0%, #ffdcec 50%, #fff7e6 100%)',
  },
  bg_music: {
    kind: 'image',
    path: 'images/bg/music.jpg',
    description: '音乐礼物：舞台灯光/留声机',
    placeholder: 'linear-gradient(160deg, #3a2550 0%, #6a3a7a 50%, #a05a9a 100%)',
  },
  bg_final: {
    kind: 'image',
    path: 'images/bg/final.jpg',
    description: '最终祝福：清晨天空、柔和光线',
    placeholder: 'linear-gradient(160deg, #fff8f0 0%, #ffe6f0 50%, #e8f0ff 100%)',
  },
  bg_egg: {
    kind: 'image',
    path: 'images/bg/egg.jpg',
    description: '隐藏彩蛋：神秘但可爱的后台/控制室',
    placeholder: 'linear-gradient(160deg, #1b1b2f 0%, #2f2f55 60%, #4a3a7a 100%)',
  },

  // ---------- 地图分层（背景层之上依次叠加） ----------
  map_building_mint: {
    kind: 'image',
    path: 'images/map/building_mint.png',
    description: '地图建筑：薄荷糖补给站（透明底，440×260）',
    placeholder: '#b7f3e3',
  },
  map_building_food: {
    kind: 'image',
    path: 'images/map/building_food.png',
    description: '地图建筑：美食幻想屋（透明底，440×260）',
    placeholder: '#ffd6c2',
  },
  map_building_exam: {
    kind: 'image',
    path: 'images/map/building_exam.png',
    description: '地图建筑：认证考试考场（透明底，440×260）',
    placeholder: '#d7dcff',
  },
  map_building_wish: {
    kind: 'image',
    path: 'images/map/building_wish.png',
    description: '地图建筑：心愿收藏屋（透明底，440×260，含熄灭/发光两态）',
    placeholder: '#e3d3ff',
  },
  map_building_cake: {
    kind: 'image',
    path: 'images/map/building_cake.png',
    description: '地图建筑：中央生日蛋糕房（透明底，600×320，门上四个印章槽）',
    placeholder: '#ffdcec',
  },
  map_layer_night: {
    kind: 'image',
    path: 'images/map/layer_night.png',
    description: '地图环境光层：夜色滤镜（整屏，透明度随印章数变化）',
    placeholder: 'linear-gradient(180deg, rgba(40,30,80,0.85) 0%, rgba(70,40,110,0.7) 100%)',
  },
  map_layer_lanterns: {
    kind: 'image',
    path: 'images/map/layer_lanterns.png',
    description: '地图环境光层：灯笼与窗户光（整屏透明底，叠加模式）',
    placeholder: 'transparent',
  },

  // ---------- 闸机分层 ----------
  gate_arch: {
    kind: 'image',
    path: 'images/gate/arch.png',
    description: '闸机拱门（透明底，含立柱）。显示宽 1080、顶边 y=70、水平居中。门扇单独一层，不画进这张图。',
    placeholder: 'linear-gradient(180deg, #ff9fcb 0%, #f0609f 100%)',
  },
  gate_door_l: {
    kind: 'image',
    path: 'images/gate/door_l.png',
    description: '闸机左门扇（透明底，不含门柱）',
    placeholder: 'transparent',
  },
  gate_door_r: {
    kind: 'image',
    path: 'images/gate/door_r.png',
    description: '闸机右门扇（透明底，不含门柱）',
    placeholder: 'transparent',
  },

  // ---------- Q 版向导 guide_mayi。保留旧资源 ID，避免改路径。 ----------
  chibi_idle: {
    kind: 'image',
    path: 'images/char/chibi_idle.png',
    description: 'Q版向导：常态',
    placeholder: '#ffb8d9',
  },
  chibi_point: {
    kind: 'image',
    path: 'images/char/chibi_point.png',
    description: 'Q版向导：指路',
    placeholder: '#ffb8d9',
  },
  chibi_happy: {
    kind: 'image',
    path: 'images/char/chibi_happy.png',
    description: 'Q版向导：开心',
    placeholder: '#ffb8d9',
  },
  chibi_surprise: {
    kind: 'image',
    path: 'images/char/chibi_surprise.png',
    description: 'Q版向导：惊讶',
    placeholder: '#ffb8d9',
  },
  chibi_pray: {
    kind: 'image',
    path: 'images/char/chibi_pray.png',
    description: 'Q版向导：双手合十，用于吹蜡烛前的许愿',
    placeholder: '#ffb8d9',
  },
  chibi_cheer: {
    kind: 'image',
    path: 'images/char/chibi_cheer.png',
    description: 'Q版向导：欢呼',
    placeholder: '#ffb8d9',
  },
  chibi_mayi: {
    kind: 'image',
    path: 'images/char/chibi_mayi.png',
    description: 'Q 版麻衣序列图：idle / point / happy / surprise / peek / pray / cheer / nod 八个动作（120×150 每帧）',
    placeholder: '#ffb8d9',
  },
  guide_mayi_think: {
    kind: 'image',
    path: 'images/char/guide_mayi_think.png',
    description: 'Q版向导：考试思考。缺图时退回双手合十',
    placeholder: '#ffb8d9',
  },
  guide_mayi_tease: {
    kind: 'image',
    path: 'images/char/guide_mayi_tease.png',
    description: 'Q版向导：考官改错。缺图时退回路指',
    placeholder: '#ffb8d9',
  },
  guide_mayi_hotpot: {
    kind: 'image',
    path: 'images/char/guide_mayi_hotpot.png',
    description: 'Q版向导：自己想吃火锅。缺图时退回欢呼',
    placeholder: '#ffb8d9',
  },
  guide_mayi_host: {
    kind: 'image',
    path: 'images/char/guide_mayi_host.png',
    description: 'Q版向导：蛋糕房主持祝福。缺图时退回欢呼',
    placeholder: '#ffb8d9',
  },
  guide_mayi_farewell: {
    kind: 'image',
    path: 'images/char/guide_mayi_farewell.png',
    description: 'Q版向导：最终道别。缺图时退回开心',
    placeholder: '#ffb8d9',
  },
  guide_mayi_gate: {
    kind: 'image',
    path: 'images/char/guide_mayi_gate.png',
    description: 'Q版向导：闸机请人入内。缺图时退回待机',
    placeholder: '#ffb8d9',
  },
  guide_mayi_dish: {
    kind: 'image',
    path: 'images/char/guide_mayi_dish.png',
    description: 'Q版向导：端出神秘料理。缺图时退回欢呼',
    placeholder: '#ffb8d9',
  },

  // ---------- 玩家普通立绘 player_mayi。不承担 NPC 台词。 ----------
  char_normal: {
    kind: 'image',
    path: 'images/char/mayi_normal.png',
    description: '玩家麻衣：常态全身。粉色长发、狐耳、蓝紫与粉红异瞳、白粉金花纹服饰',
    placeholder: '#ffb8d9',
  },
  char_happy: {
    kind: 'image',
    path: 'images/char/mayi_happy.png',
    description: '玩家麻衣：开心。只是视觉反应，不代表她在说话',
    placeholder: '#ffb8d9',
  },
  char_think: {
    kind: 'image',
    path: 'images/char/mayi_think.png',
    description: '玩家麻衣：思考。只是视觉反应，不代表她在说话',
    placeholder: '#ffb8d9',
  },
  char_surprise: {
    kind: 'image',
    path: 'images/char/mayi_surprise.png',
    description: '玩家麻衣：惊讶。只是视觉反应，不代表她在说话',
    placeholder: '#ffb8d9',
  },
  /**
   * 地图用的半身。文件还没有时，地图继续裁切 char_normal，不会出现裂图。
   */
  player_mayi_map: {
    kind: 'image',
    path: 'images/char/player_mayi_map.png',
    description: '玩家麻衣：地图标记半身。未提供时继续裁切常态全身',
    placeholder: '#ffb8d9',
  },
  player_mayi_wish: {
    kind: 'image',
    path: 'images/char/player_mayi_wish.png',
    description: '玩家麻衣：闭眼许愿。只在吹蜡烛前使用，不配台词',
    placeholder: '#ffb8d9',
  },
  player_mayi_listen: {
    kind: 'image',
    path: 'images/char/player_mayi_listen.png',
    description: '玩家麻衣：听音乐。不配台词，向导不插话',
    placeholder: '#ffb8d9',
  },
  char_normal_purple: {
    kind: 'image',
    path: 'images/char/mayi_normal_purple.png',
    description: '玩家麻衣：常态全身，紫色造型',
    placeholder: '#c7b6ef',
  },
  char_happy_purple: {
    kind: 'image',
    path: 'images/char/mayi_happy_purple.png',
    description: '玩家麻衣：开心，紫色造型',
    placeholder: '#c7b6ef',
  },
  char_think_purple: {
    kind: 'image',
    path: 'images/char/mayi_think_purple.png',
    description: '玩家麻衣：思考，紫色造型',
    placeholder: '#c7b6ef',
  },
  char_surprise_purple: {
    kind: 'image',
    path: 'images/char/mayi_surprise_purple.png',
    description: '玩家麻衣：惊讶，紫色造型',
    placeholder: '#c7b6ef',
  },
  player_mayi_map_purple: {
    kind: 'image',
    path: 'images/char/player_mayi_map_purple.png',
    description: '玩家麻衣：地图半身，紫色造型',
    placeholder: '#c7b6ef',
  },
  player_mayi_wish_purple: {
    kind: 'image',
    path: 'images/char/player_mayi_wish_purple.png',
    description: '玩家麻衣：许愿，紫色造型',
    placeholder: '#c7b6ef',
  },
  player_mayi_listen_purple: {
    kind: 'image',
    path: 'images/char/player_mayi_listen_purple.png',
    description: '玩家麻衣：聆听，紫色造型',
    placeholder: '#c7b6ef',
  },
  char_normal_golden: {
    kind: 'image',
    path: 'images/char/mayi_normal_golden.png',
    description: '玩家麻衣：常态全身，金色造型',
    placeholder: '#e4c56a',
  },
  char_happy_golden: {
    kind: 'image',
    path: 'images/char/mayi_happy_golden.png',
    description: '玩家麻衣：开心，金色造型',
    placeholder: '#e4c56a',
  },
  char_think_golden: {
    kind: 'image',
    path: 'images/char/mayi_think_golden.png',
    description: '玩家麻衣：思考，金色造型',
    placeholder: '#e4c56a',
  },
  char_surprise_golden: {
    kind: 'image',
    path: 'images/char/mayi_surprise_golden.png',
    description: '玩家麻衣：惊讶，金色造型',
    placeholder: '#e4c56a',
  },
  player_mayi_map_golden: {
    kind: 'image',
    path: 'images/char/player_mayi_map_golden.png',
    description: '玩家麻衣：地图半身，金色造型',
    placeholder: '#e4c56a',
  },
  player_mayi_wish_golden: {
    kind: 'image',
    path: 'images/char/player_mayi_wish_golden.png',
    description: '玩家麻衣：许愿，金色造型',
    placeholder: '#e4c56a',
  },
  player_mayi_listen_golden: {
    kind: 'image',
    path: 'images/char/player_mayi_listen_golden.png',
    description: '玩家麻衣：聆听，金色造型',
    placeholder: '#e4c56a',
  },

  // ---------- 印章 ----------
  stamp_mint: {
    kind: 'image',
    path: 'images/stamps/mint.png',
    description: '薄荷糖印章图标（圆形）',
    placeholder: '#3fd1a8',
  },
  stamp_food: {
    kind: 'image',
    path: 'images/stamps/food.png',
    description: '美食印章图标（圆形）',
    placeholder: '#ff9a5c',
  },
  stamp_exam: {
    kind: 'image',
    path: 'images/stamps/exam.png',
    description: '认证考试印章图标（圆形）',
    placeholder: '#7c8cff',
  },
  stamp_wish: {
    kind: 'image',
    path: 'images/stamps/wish.png',
    description: '心愿印章图标（圆形）',
    placeholder: '#c77dff',
  },

  // ---------- 道具 ----------
  item_mint: {
    kind: 'image',
    path: 'images/items/mint_candy.png',
    description: '薄荷糖',
    placeholder: '#b7f3e3',
  },
  item_hotpot: {
    kind: 'image',
    path: 'images/items/hotpot.png',
    description: '火锅',
    placeholder: '#ff7a5c',
  },
  item_fruit: {
    kind: 'image',
    path: 'images/items/fruit_bowl.png',
    description: '水果捞',
    placeholder: '#ffc45c',
  },
  item_golden_dish: {
    kind: 'image',
    path: 'images/items/golden_dish.png',
    description: '神秘料理：蛋黄焗窝瓜（金黄色，带光效）',
    placeholder: 'linear-gradient(135deg, #ffe58a, #f3c54b)',
  },
  item_pumpkin: {
    kind: 'image',
    path: 'images/items/pumpkin.png',
    description: '神秘料理：整颗窝瓜，划切分块',
    placeholder: '#f0942e',
  },
  item_pumpkin_stem: {
    kind: 'image',
    path: 'images/items/pumpkin_stem.png',
    description: '窝瓜瓜蒂',
    placeholder: '#3d9a45',
  },
  item_oven: {
    kind: 'image',
    path: 'images/items/oven.png',
    description: '烤箱，不遮挡火候指针',
    placeholder: '#7a3b2e',
  },
  item_flame: {
    kind: 'image',
    path: 'images/items/flame.png',
    description: '蜡烛火苗',
    placeholder: '#ffb73b',
  },
  item_candy_bonus: {
    kind: 'image',
    path: 'images/items/candy_bonus.png',
    description: '奖励糖（金色包装、闪光）',
    placeholder: 'linear-gradient(135deg, #ffe58a, #f3c54b)',
  },
  item_junk_fengyoujing: {
    kind: 'image',
    path: 'images/items/junk_fengyoujing.png',
    description: '干扰物：风油精小瓶',
    placeholder: '#9fd08a',
  },
  item_junk_soap: {
    kind: 'image',
    path: 'images/items/junk_soap.png',
    description: '干扰物：肥皂',
    placeholder: '#c9d6ff',
  },
  item_junk_eraser: {
    kind: 'image',
    path: 'images/items/junk_eraser.png',
    description: '干扰物：橡皮擦',
    placeholder: '#ffd6d6',
  },
  item_pot: {
    kind: 'image',
    path: 'images/items/pot.png',
    description: '火锅锅体（俯视/侧视，可叠加蒸汽）',
    placeholder: '#ff7a5c',
  },
  item_bowl: {
    kind: 'image',
    path: 'images/items/bowl.png',
    description: '水果捞空碗',
    placeholder: '#fff',
  },
  item_yunpiangao: {
    kind: 'image',
    path: 'images/items/yunpiangao.png',
    description: '图鉴：云片糕',
    placeholder: '#fff6e8',
  },
  item_tangbing: {
    kind: 'image',
    path: 'images/items/tangbing.png',
    description: '图鉴：糖饼',
    placeholder: '#f3c54b',
  },
  item_sauce_jar: {
    kind: 'image',
    path: 'images/items/sauce_jar.png',
    description: '蛋黄沙司罐（隐藏料理线索）',
    placeholder: '#ffd977',
  },
  img_sakura_tree: {
    kind: 'image',
    path: 'images/items/sakura_tree.png',
    description: '心愿屋樱花树干与树枝（透明底，不含花冠）',
    placeholder: '#ffb8d9',
  },
  item_sakura_cluster: {
    kind: 'image',
    path: 'images/items/sakura_cluster.png',
    description: '心愿屋樱花花冠（未点亮），显示 200×160，同图贴四次',
    placeholder: '#ffd3e8',
  },
  item_sakura_cluster_lit: {
    kind: 'image',
    path: 'images/items/sakura_cluster_lit.png',
    description: '心愿屋樱花花冠（点亮），与暗花冠同位置',
    placeholder: '#ff9fcb',
  },
  img_wish_card_back: {
    kind: 'image',
    path: 'images/items/wish_card_back.png',
    description: '心愿卡背面花纹',
    placeholder: 'linear-gradient(135deg, #8c7cff, #6fa8ff)',
  },
  item_cake: {
    kind: 'image',
    path: 'images/items/cake.png',
    description: '生日蛋糕（熄灭/点亮两种状态或分层）',
    placeholder: '#ffd1e5',
  },
  item_wish_card: {
    kind: 'image',
    path: 'images/items/wish_card.png',
    description: '心愿卡片底图',
    placeholder: '#fff',
  },
  ui_logo: {
    kind: 'image',
    path: 'images/ui/logo.png',
    description: '《麻衣生日奇妙游园会》标题 LOGO',
    placeholder: 'transparent',
  },
  theater_curtain_l: {
    kind: 'image',
    path: 'images/theater/curtain_l.png',
    description: '舞台左幕布',
    placeholder: '#8a1b2e',
  },
  theater_curtain_r: {
    kind: 'image',
    path: 'images/theater/curtain_r.png',
    description: '舞台右幕布',
    placeholder: '#8a1b2e',
  },
  theater_valance: {
    kind: 'image',
    path: 'images/theater/valance.png',
    description: '舞台顶部檐幕',
    placeholder: '#8a1b2e',
  },

  // ---------- 音频 ----------
  bgm_park: {
    kind: 'audio',
    path: 'audio/bgm_park.mp3',
    description: '游园会主 BGM（轻快、可循环）',
    loop: true,
    volume: 1,
    group: 'bgm',
  },
  bgm_cake: {
    kind: 'audio',
    path: 'audio/bgm_cake.mp3',
    description: '蛋糕房 BGM（温柔、可循环）',
    loop: true,
    volume: 1,
    group: 'bgm',
  },
  music_hongdou: {
    kind: 'audio',
    path: 'audio/hongdou.mp3',
    description: '音乐礼物《红豆》（需为自有翻唱或已授权版本）',
    loop: false,
    volume: 1,
    group: 'gift',
  },
  sfx_click: {
    kind: 'audio',
    path: 'audio/sfx_click.mp3',
    description: '通用按钮点击音效',
    volume: 0.6,
  },
  sfx_stamp: {
    kind: 'audio',
    path: 'audio/sfx_stamp.mp3',
    description: '盖印章音效',
    volume: 0.8,
  },
  sfx_success: {
    kind: 'audio',
    path: 'audio/sfx_success.mp3',
    description: '完成/通过提示音',
    volume: 0.7,
  },
  sfx_candle: {
    kind: 'audio',
    path: 'audio/sfx_candle.mp3',
    description: '点燃蜡烛音效',
    volume: 0.7,
  },
  sfx_blow: {
    kind: 'audio',
    path: 'audio/sfx_blow.mp3',
    description: '吹灭蜡烛音效',
    volume: 0.7,
  },
  // ---------- 小游戏音效 ----------
  sfx_pop: {
    kind: 'audio',
    path: 'audio/sfx_pop.mp3',
    description: '收集薄荷糖：轻快"啵"声',
    volume: 0.6,
  },
  sfx_bonus: {
    kind: 'audio',
    path: 'audio/sfx_bonus.mp3',
    description: '收集奖励糖：闪亮提示音',
    volume: 0.7,
  },
  sfx_miss: {
    kind: 'audio',
    path: 'audio/sfx_miss.mp3',
    description: '点到干扰物：低沉"咚"',
    volume: 0.6,
  },
  sfx_combo: {
    kind: 'audio',
    path: 'audio/sfx_combo.mp3',
    description: '连击里程碑提示音',
    volume: 0.7,
  },
  sfx_steam: {
    kind: 'audio',
    path: 'audio/sfx_steam.mp3',
    description: '食材下锅：咕嘟 + 蒸汽',
    volume: 0.6,
  },
  sfx_correct: {
    kind: 'audio',
    path: 'audio/sfx_correct.mp3',
    description: '答对：叮',
    volume: 0.7,
  },
  sfx_wrong: {
    kind: 'audio',
    path: 'audio/sfx_wrong.mp3',
    description: '答错：温和的"哔"',
    volume: 0.6,
  },
  sfx_flip: {
    kind: 'audio',
    path: 'audio/sfx_flip.mp3',
    description: '翻开心愿卡',
    volume: 0.6,
  },
  sfx_sparkle: {
    kind: 'audio',
    path: 'audio/sfx_sparkle.mp3',
    description: '樱花树点亮 / 魔法闪光',
    volume: 0.7,
  },
  sfx_unlock: {
    kind: 'audio',
    path: 'audio/sfx_unlock.mp3',
    description: '图鉴解锁',
    volume: 0.7,
  },

  // ---------- Q版向导语音（WAV，缺文件时只显示字幕，不阻断通关） ----------
  voice_mayi_surprised: {
    kind: 'audio',
    path: 'audio/voices/mayi_01.wav',
    description: '诶？什么东西？',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_welcome: {
    kind: 'audio',
    path: 'audio/voices/mayi_02.wav',
    description: '嘿嘿，欢迎光临！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_proud: {
    kind: 'audio',
    path: 'audio/voices/mayi_03.wav',
    description: '哼哼，那当然！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_unbelievable: {
    kind: 'audio',
    path: 'audio/voices/mayi_04.wav',
    description: '啊？这也行？！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_hooray: {
    kind: 'audio',
    path: 'audio/voices/mayi_05.wav',
    description: '好耶！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_again: {
    kind: 'audio',
    path: 'audio/voices/mayi_06.wav',
    description: '不对不对！重来！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_mint: {
    kind: 'audio',
    path: 'audio/voices/mayi_07.wav',
    description: '哇！是薄荷糖！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_hotpot: {
    kind: 'audio',
    path: 'audio/voices/mayi_08.wav',
    description: '火锅！我要吃火锅！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_think: {
    kind: 'audio',
    path: 'audio/voices/mayi_09.wav',
    description: '让我想想……',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_really: {
    kind: 'audio',
    path: 'audio/voices/mayi_10.wav',
    description: '真的假的？',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_spare: {
    kind: 'audio',
    path: 'audio/voices/mayi_11.wav',
    description: '今天就放过你啦！',
    volume: 1,
    group: 'voice',
  },
  voice_mayi_birthday: {
    kind: 'audio',
    path: 'audio/voices/mayi_12.wav',
    description: '生日快乐！嘿嘿！',
    volume: 1,
    group: 'voice',
  },
  voice_guide_dish: {
    kind: 'audio',
    path: 'audio/voices/mayi_14.wav',
    description: '出炉啦。金黄金黄的。',
    volume: 1,
    group: 'voice',
  },
  voice_guide_wish_bloom: {
    kind: 'audio',
    path: 'audio/voices/mayi_15.wav',
    description: '你看，树亮起来了。',
    volume: 1,
    group: 'voice',
  },
  voice_guide_fruit: {
    kind: 'audio',
    path: 'audio/voices/mayi_16.wav',
    description: '水果捞要装得好看一点哦。',
    volume: 1,
    group: 'voice',
  },
  voice_guide_overload: {
    kind: 'audio',
    path: 'audio/voices/mayi_17.wav',
    description: '等等，系统你冷静一点！',
    volume: 1,
    group: 'voice',
  },
  /** 向导在吹蜡烛前请玩家许愿。 */
  voice_guide_wish: {
    kind: 'audio',
    path: 'audio/voices/mayi_18.wav',
    description: '好，闭上眼，许愿吧。',
    volume: 1,
    group: 'voice',
  },
  /** 向导在最终舞台道别，不是寿星道谢。 */
  voice_guide_farewell: {
    kind: 'audio',
    path: 'audio/voices/mayi_13.wav',
    description: '游园会到这里就结束啦。希望你今天玩得开心！',
    volume: 1,
    group: 'voice',
  },
  voice_guide_egg: {
    kind: 'audio',
    path: 'audio/voices/mayi_19.wav',
    description: '……这条功能，真的下线了。',
    volume: 1,
    group: 'voice',
  },
  voice_guide_bonus: {
    kind: 'audio',
    path: 'audio/voices/mayi_20.wav',
    description: '金色的，快拿！',
    volume: 1,
    group: 'voice',
  },
  voice_guide_ticket: {
    kind: 'audio',
    path: 'audio/voices/mayi_21.wav',
    description: '票根收好，下次还能进来。',
    volume: 1,
    group: 'voice',
  },
} as const satisfies Record<string, AssetEntry>;

/** 资源 ID 联合类型 */
export type AssetId = keyof typeof ASSETS;

/** 仅音频资源的 ID */
export type AudioAssetId = {
  [K in AssetId]: (typeof ASSETS)[K]['kind'] extends 'audio' ? K : never;
}[AssetId];

/** 仅图片资源的 ID */
export type ImageAssetId = {
  [K in AssetId]: (typeof ASSETS)[K]['kind'] extends 'image' ? K : never;
}[AssetId];

/**
 * 获取资源的相对 URL
 * @param id 资源 ID
 * @returns 形如 ./assets/images/bg/map.jpg 的相对路径
 */
export function assetUrl(id: AssetId): string {
  return `${ASSET_BASE}/${ASSETS[id].path}`;
}

/**
 * 获取资源的占位样式
 * @param id 资源 ID
 * @returns CSS background 值
 */
export function assetPlaceholder(id: AssetId): string {
  const entry: AssetEntry = ASSETS[id];
  return entry.placeholder ?? '#ddd';
}
