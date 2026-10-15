# 素材清单（ASSETS）

所有素材放入 `public/assets/` 对应路径后即自动生效，无需改代码。
注册表与规格以 `src/config/assets.ts` 为准；本文件是给美术/音频制作者看的说明。

角色设定（麻衣）：粉色长发、狐耳、左眼蓝紫 / 右眼粉红的异瞳、白粉金色花纹服饰。
整体风格：明亮、可爱、游园会/庆典感；前段活泼，蛋糕房之后转为温柔。

## 一、场景背景（`images/bg/`，1920×1080，JPG 或 PNG）

| 资源 ID | 文件 | 场景 | 画面说明 |
| --- | --- | --- | --- |
| `bg_boot` | `boot.jpg` | 开场 | 深色星空/频道连接界面，紫色为主，可带信号波纹 |
| `bg_gate` | `gate.jpg` | 入园闸机 | 游园会大门与售票亭，粉白为主，晨光；左侧 120–580px 放闸机，中间为选项区，右侧为立绘 |
| `bg_map` | `map.jpg` | 地图（背景层） | 俯视卡通园区的**地面与远景**：草地、小路、彩旗；**不要画建筑**，建筑由单独图层叠加（见"一-b 地图分层"） |
| `bg_mint` | `mint.jpg` | 薄荷糖补给站 | 薄荷绿清凉小摊位，玻璃糖罐 |
| `bg_food` | `food.jpg` | 美食幻想屋 | 暖色餐厅，火锅蒸汽、水果，桌面留空放菜品 |
| `bg_exam` | `exam.jpg` | 认证考试 | 可爱考场/黑板风，粉笔画狐耳 |
| `bg_wish` | `wish.jpg` | 心愿收藏屋 | 夜空、灯笼、漂浮的心愿卡，深紫蓝 |
| `bg_cake` | `cake.jpg` | 蛋糕房 / 吹蜡烛 | 温馨室内，长桌中央留空放蛋糕，暖光 |
| `bg_music` | `music.jpg` | 音乐礼物 | 小舞台灯光或复古留声机，紫粉舞台光 |
| `bg_final` | `final.jpg` | 最终祝福 | 清晨天空、柔和光线、少量花瓣 |
| `bg_egg` | `egg.jpg` | 隐藏彩蛋 | 神秘但可爱的"后台控制室"，屏幕与线缆 |

> 背景中央区域会被卡片覆盖，重要元素请放在四周；右侧 1500–1920px 区域为角色立绘位置。

### 一-b、地图分层（`images/map/`，透明 PNG）

地图按 **背景层 → 建筑层 → 环境光层 → 特效层 → UI 层** 叠加，目前全部为 CSS 占位。建筑请按下表外框尺寸出图，程序只换图不改坐标：

| 资源 ID | 文件 | 外框（1920×1080 坐标 x, y, w, h） | 说明 |
| --- | --- | --- | --- |
| `map_building_mint` | `building_mint.png` | 150, 180, 440, 260 | 薄荷糖补给站，薄荷绿小摊 |
| `map_building_food` | `building_food.png` | 1330, 180, 440, 260 | 美食幻想屋，暖橙色餐馆，有蒸汽 |
| `map_building_exam` | `building_exam.png` | 150, 690, 440, 260 | 认证考试考场，蓝紫色校舍 |
| `map_building_wish` | `building_wish.png` | 1330, 690, 440, 260 | 心愿收藏屋，紫色小屋；建议提供"熄灭 / 发光"两态 |
| `map_building_cake` | `building_cake.png` | 660, 400, 600, 320 | 中央生日蛋糕房，门上留四个印章槽位置（槽中心 y≈648，x 为 858/926/994/1062） |
| `map_layer_night` | `layer_night.png` | 整屏 1920×1080 | 环境光层：夜色滤镜，程序按印章数 0–4 调整透明度（可用上深下浅的紫蓝渐变） |
| `map_layer_lanterns` | `layer_lanterns.png` | 整屏 1920×1080 | 环境光层：灯笼与窗户的暖光，叠加模式，仅集齐后显示 |

> 建筑图下方约 40px 为状态牌（进入 / 再玩一次 / 锁定条件）所占位置，请留白。印章托盘在蛋糕房正下方（x 772–1148，y 850–926）。

## 二、角色立绘（`images/char/`，透明 PNG，建议高 1400px 以上）

| 资源 ID | 文件 | 表情 | 用途 |
| --- | --- | --- | --- |
| `char_normal` | `mayi_normal.png` | 常态微笑 | 大多数场景 |
| `char_happy` | `mayi_happy.png` | 眯眼开心 | 获得印章、蛋糕点亮、最终祝福 |
| `char_think` | `mayi_think.png` | 托腮/歪头思考 | 认证、考试、彩蛋 |
| `char_surprise` | `mayi_surprise.png` | 睁大眼惊讶 | 隐藏料理出现、进入蛋糕房 |

> 四张立绘请保持同一站姿与尺寸，仅表情不同，便于切换不跳动。

### 二-b、Q 版麻衣（`images/char/chibi_mayi.png`，透明 PNG）

| 资源 ID | 文件 | 规格 | 说明 |
| --- | --- | --- | --- |
| `chibi_mayi` | `chibi_mayi.png` | 每帧 120×150，横向 8 格（或分 8 张） | 动作顺序固定：`idle` 待机 / `point` 指路 / `happy` 开心 / `surprise` 惊讶 / `peek` 探头 / `pray` 许愿 / `cheer` 欢呼 / `nod` 点头 |

> 当前为纯 CSS 占位（`ChibiMayi.tsx`），动作由类名 `chibi--{action}` 驱动；替换为图片时保持外框 120×150 与 8 个动作名即可。地图上她站在推荐场馆门口，闲置时会指向下一站。

## 三、印章图标（`images/stamps/`，透明 PNG，512×512 圆形）

| 资源 ID | 文件 | 名称 | 主题色 | 图案建议 |
| --- | --- | --- | --- | --- |
| `stamp_mint` | `mint.png` | 薄荷糖印章 | `#3fd1a8` | 薄荷叶 + 糖果 |
| `stamp_food` | `food.png` | 美食印章 | `#ff9a5c` | 火锅 / 碗筷 |
| `stamp_exam` | `exam.png` | 认证印章 | `#7c8cff` | 印章 + 对勾 |
| `stamp_wish` | `wish.png` | 心愿印章 | `#c77dff` | 星星 / 流星 |

> 另需一版"未获得"的灰色虚线轮廓（可由程序处理，若美术愿意提供更佳）。

## 四、道具（`images/items/`，透明 PNG）

| 资源 ID | 文件 | 说明 | 建议尺寸 |
| --- | --- | --- | --- |
| `item_mint` | `mint_candy.png` | 薄荷糖（单颗；第一关目标物、图鉴条目） | 400×400 |
| `item_candy_bonus` | `candy_bonus.png` | 奖励糖：金色包装、带闪光 | 400×400 |
| `item_junk_fengyoujing` | `junk_fengyoujing.png` | 干扰物：风油精小瓶 | 400×400 |
| `item_junk_soap` | `junk_soap.png` | 干扰物：肥皂 | 400×400 |
| `item_junk_eraser` | `junk_eraser.png` | 干扰物：橡皮擦 | 400×400 |
| `item_hotpot` | `hotpot.png` | 火锅成品（美食屋大厅图标） | 600×600 |
| `item_pot` | `pot.png` | 火锅锅体（空锅，程序叠加食材与蒸汽） | 800×500 |
| `item_fruit` | `fruit_bowl.png` | 水果捞成品（大厅图标） | 600×600 |
| `item_bowl` | `bowl.png` | 水果捞空碗（程序叠加水果） | 800×500 |
| `item_golden_dish` | `golden_dish.png` | 神秘料理：蛋黄焗窝瓜，金黄酥脆带光效 | 600×600 |
| `item_sauce_jar` | `sauce_jar.png` | 蛋黄沙司罐（隐藏线索配料） | 400×400 |
| `item_yunpiangao` | `yunpiangao.png` | 图鉴：云片糕 | 400×400 |
| `item_tangbing` | `tangbing.png` | 图鉴：糖饼 | 400×400 |
| `item_cake` | `cake.png` | 生日蛋糕，粉白主体 + 5 根蜡烛位 | 1000×600；建议熄灭/点亮两张或蜡烛火焰单独一张 |
| `item_wish_card` | `wish_card.png` | 心愿卡正面底图（可写字） | 500×700 |
| `img_wish_card_back` | `wish_card_back.png` | 心愿卡背面花纹（蓝紫渐变 + 樱花） | 500×700 |
| `img_sakura_tree` | `sakura_tree.png` | 心愿屋樱花树：建议提供树干 + 4 簇花冠分层（未亮/点亮），程序按簇点亮 | 1200×900 |

**第二关食材图（可选，当前用 emoji 占位）**：牛肉卷、毛肚、虾滑、土豆片、金针菇、嫩豆腐、宽粉、年糕、西瓜、冰淇淋、薄荷糖、奶茶；水果 8 种（芒果、西瓜、草莓、葡萄、猕猴桃、荔枝、蓝莓、火龙果）；底料 3 种（酸奶、椰奶、糖水）；配料 4 种（西米、芋圆、坚果碎、蛋黄沙司）。统一 256×256 透明 PNG，命名 `images/items/ingredients/<id>.png`（id 见 `src/config/food.ts`），待下一轮接入资源表。

## 五、界面（`images/ui/`）

| 资源 ID | 文件 | 说明 |
| --- | --- | --- |
| `ui_logo` | `logo.png` | 《麻衣生日奇妙游园会》标题 LOGO，透明 PNG，宽 1200px 左右 |

可选（尚未注册，后续按需加入）：按钮底图、卡片边框花纹、金色花纹分割线、彩带/星星粒子贴图、鼠标光标。

## 六、音频（`audio/`，MP3 或 OGG，44.1kHz）

| 资源 ID | 文件 | 类型 | 说明 |
| --- | --- | --- | --- |
| `bgm_park` | `bgm_park.mp3` | BGM 循环 | 游园会主题，轻快、俏皮，1.5–2.5 分钟可无缝循环 |
| `bgm_cake` | `bgm_cake.mp3` | BGM 循环 | 蛋糕房/祝福用，温柔、慢节奏，可无缝循环 |
| `music_hongdou` | `hongdou.mp3` | 单曲 | 音乐礼物《红豆》。**必须为自有翻唱或已获授权的版本**，直播公开播放请确认版权 |
| `sfx_click` | `sfx_click.mp3` | 音效 | 通用按钮点击，短促轻快 |
| `sfx_stamp` | `sfx_stamp.mp3` | 音效 | 盖印章"咚"的一声 |
| `sfx_success` | `sfx_success.mp3` | 音效 | 完成/通过提示音 |
| `sfx_candle` | `sfx_candle.mp3` | 音效 | 点燃蜡烛 |
| `sfx_blow` | `sfx_blow.mp3` | 音效 | 吹气 + 火焰熄灭 |
| `sfx_pop` | `sfx_pop.mp3` | 音效 | 第一关收集薄荷糖：轻快"啵" |
| `sfx_bonus` | `sfx_bonus.mp3` | 音效 | 第一关收集奖励糖：闪亮提示音 |
| `sfx_miss` | `sfx_miss.mp3` | 音效 | 第一关点到干扰物：低沉"咚" |
| `sfx_combo` | `sfx_combo.mp3` | 音效 | 第一关连击里程碑（5/10/15…） |
| `sfx_steam` | `sfx_steam.mp3` | 音效 | 第二关食材下锅：咕嘟 + 蒸汽 |
| `sfx_correct` | `sfx_correct.mp3` | 音效 | 第三关答对：叮 |
| `sfx_wrong` | `sfx_wrong.mp3` | 音效 | 第三关答错：温和的"哔"，不要刺耳 |
| `sfx_flip` | `sfx_flip.mp3` | 音效 | 第四关翻开心愿卡 |
| `sfx_sparkle` | `sfx_sparkle.mp3` | 音效 | 第四关樱花树点亮 / 隐藏料理出炉 |
| `sfx_unlock` | `sfx_unlock.mp3` | 音效 | 图鉴解锁 |

可选（尚未注册）：心愿封存、彩蛋出现、连接成功提示音、满树花开长音。

## 七、文件命名与交付

- 文件名全部小写，使用下划线；与上表完全一致。
- 图片优先 PNG（需透明）或 JPG（背景）；单张不超过 2MB。
- 音频建议 MP3 128–192kbps；BGM 请提供可无缝循环的版本。
- 交付后直接放入 `public/assets/` 对应子目录，运行 `npm run build` 即可。
