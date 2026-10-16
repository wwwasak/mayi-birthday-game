# 美术素材规格核查报告

核查日期：2026-10-16。只读代码、样式和磁盘文件，没有改玩法、布局、交互，也没有改 `asset_manifest.json` 或任何 PNG。

## 权威清单在哪里

全仓库只有一份清单：

`D:\MayiBirthday\asset_manifest.json`

没有第二份 `asset_manifest.json`。`dist/` 里也没有副本。

游戏运行时**不读取**这份 JSON。程序实际解析路径的地方是 `src/config/assets.ts` 的 `ASSETS`，再用 `assetUrl()` 拼成 `./assets/...`。已注册条目的路径与清单去掉 `public/assets/` 前缀后完全一致。

因此：

- 给生成工具用的美术清单，权威文件就是根目录这一份 JSON。
- 程序能不能加载某张图，看它是否写进 `assets.ts`，不看 JSON 里的 `registered`。

`ASSETS.md` 是更早的说明，不是运行配置。心愿卡在那里写成 500×700，和清单、和实机都不一致。

清单共 **81** 条，ID 全部唯一。其中图片 63 张、音频 18 条。`priority: "skip"` 有 4 条：`map_layer_night`、`map_layer_lanterns`、`chibi_mayi`、`music_hongdou`。

本地 `public/assets` 下现有图片 **25** 张，音频 **0** 条。63 张图减去 25 张已有文件、再减去 3 张放弃出图的图片，剩下 **35** 张待制作。音频 18 条里 `music_hongdou` 明确不重做，所以待制作音频是 **17** 条。这个分组和磁盘一致。

清单顶部的 `note` 仍写着「exists 全部为 false、public/assets 下没有任何图片或音频」。这句已经过时。当前 `exists: true` 只有 `bg_map` 和 `gate_arch`。

---

## A. 心愿卡专门报告

### 实际组件

四张固定卡在 `src/scenes/WishScene.tsx`，大约 527–572 行。

- 外层是 `motion.div`，class 为 `wish-card wish-card--v12`，再按状态加上 `wish-card--hung`、`wish-card--armed`、`wish-card--dragging`、`wish-card--main`。
- 正面是里面唯一的一层：`div.wish-card__face.wish-card__face--front`，并带内联 `style={{ transform: 'none' }}`。
- 标题、正文、拖拽提示、已挂上树徽章都是 HTML，class 为 `wish-card__title`、`wish-card__text`、`wish-card__drag`、`wish-card__badge`。
- **背面节点没有渲染。** 样式里虽然有 `.wish-card__face--back`，当前 JSX 没有使用它。
- 第五张「麻衣专属许愿卡」是另一个组件：`motion.button.wish-custom`，不是这两张 PNG 的卡框。它横跨右栏整列，`min-height: 82px`。

`img_wish_card_back` 和 `item_wish_card` 已在 `src/config/assets.ts` 注册，路径分别是 `images/items/wish_card_back.png`、`images/items/wish_card.png`。心愿屋场景没有 `assetUrl()`，也没有把它们设成 `background-image` 或 `<img>`。现在的正反面颜色是 CSS 渐变。

### 相关样式与层叠

| 选择器 | 文件 | 作用 |
| --- | --- | --- |
| `.wish-view` | `src/styles/minigames.css` 约 680 行 | `position: absolute; inset: 0`，网格 `1fr 560px`，间距 24，内边距 `24px 32px`。DOM 里树在前、卡在后，所以树在左栏，卡在右栏 560px |
| `.wish-card` | 同文件约 760 行 | `height: 225px`，`perspective: 1000px` |
| `.wish-card` | `src/styles/v11.css` 约 234 行 | **把高度改成 178px**。`main.tsx` 里 v11 在 minigames 之后引入，178 生效 |
| `.wish-cards` | `v11.css` 约 230 行 | 间距改为 14px |
| `.wish-card__face` | `minigames.css` 约 768 行 | `position: absolute; inset: 0`，圆角 `--radius-md`（18px），内边距，4px 边框 |
| `.wish-card__face--back` | 同文件约 783 行 | 紫蓝渐变。当前没有对应 DOM |
| `.wish-card__face--front` | 同文件约 790 行 | 奶白到浅粉渐变，金边，`transform: rotateY(180deg)` |
| `.wish-card--v12` | `src/styles/v12.css` 约 523 行 | `perspective: none` |
| `.wish-card--v12 .wish-card__face--front` | 同文件约 531 行 | `transform: none`，盖掉旋转 |

没有 `aspect-ratio`。没有 `object-fit`。没有 `background-size`。拖拽时 `motion` 会短暂 `scale: 1.08`，松手后回到 1，不改变素材规格。全局 `* { box-sizing: border-box }`，4px 边框算在卡片盒子里面。

### 三种尺寸不要混用

**CSS 逻辑尺寸（1920×1080 画布上的布局像素）**

心愿屋外壳 `.mg` 宽 100%，高 760，放在 `.scene__content` 里。右栏由网格写成固定 `560px`，不随左栏伸缩。两列间距 14px：

- 单卡宽度 = (560 − 14) / 2 = **273px**
- 单卡高度 = **178px**（v11 覆盖了 225）
- 长宽比 = 273 / 178 ≈ **1.534**，横向

舞台 `.stage` 是 1920×1080，再用 `transform: scale(min(窗口宽/1920, 窗口高/1080))` 等比缩小（`src/hooks/useStageScale.ts`）。卡片自己没有额外缩放。

**浏览器截图像素**

截图里的卡片像素 = 逻辑尺寸 × 舞台缩放。窗口正好能放下 1920×1080 时，缩放为 1，截图就是 273×178。窗口更小时整张舞台缩小，卡片截图也变小，CSS 逻辑尺寸不变。

**PNG 原始分辨率**

这两张文件现在不在磁盘上。清单写的是 640×450，比例 640/450 ≈ **1.422**，也是横向，但比实机卡更「高」一点。

### 640×450 放进现在的卡会怎样

当前代码根本不绘制这两张图，所以现在不会被拉伸或裁切。

以后如果铺进 `inset: 0` 的卡面：

- `background-size: 100% 100%` 或 `object-fit: fill`：会轻微拉宽。水平缩放 273/640，垂直缩放 178/450，两边倍率不一样。
- `object-fit: cover`：先铺满宽度，上下各裁掉大约 7 个逻辑像素。
- `object-fit: contain`：完整显示，左右各留大约 10 个逻辑像素的空。

### 翻转

实机没有翻卡。v12 关掉了 `perspective`，正面 `transform` 被设成 `none`，背面元素也不存在。现在的操作是拖到树上，或点树。`sfx_flip` 仍注册为「翻开心愿卡」，和当前交互不一致，但音效不在这次尺寸结论里。

旧样式确实按同一张卡的 `inset: 0` 准备了正反面，所以一旦以后做翻转，正反面必须共用同一个盒子、同一条外轮廓、同一个圆角。不要求现在就做翻转动画。

### 和文档的冲突

| 来源 | 说法 | 和实机 |
| --- | --- | --- |
| 运行代码 | 273×178，横向 | 判断依据 |
| `asset_manifest.json` | 640×450，横向 | 比例 1.422，对不上 1.534 |
| `ART_REQUIREMENTS.md` 心愿屋一节 | 「显示高 225」「竖向圆角卡片」 | 225 已被 v11 改成 178；在 560px 双列里即使高 225 也仍是横向 |
| `ASSETS.md` | 500×700 | 竖向，和实机相反 |

`VISUAL_STYLE_GUIDE.md` 第 8 节：角色、建筑、道具、幕布、门按**显示尺寸的 2 倍**导出。心愿卡在清单里类型是 `ui`，用法是卡面道具。按这条约，导出尺寸应是显示尺寸的 2 倍，而不是沿用 640×450 或 500×700。

### 推荐导出

背面 `img_wish_card_back` 和正面 `item_wish_card` 使用同一张画布：

**546×356 透明 PNG**（273×178 的正好 2 倍）。

- 横向，不要画成竖卡。
- 两张外轮廓、圆角和出血一致。CSS 圆角是 18 逻辑像素，2 倍图上约 36 像素。文字区域留白，字仍由 HTML 画。
- 背面不要文字。正面不要把标题和正文画死。
- 建议先不要改清单里的 640×450，等确认后再改。确认前按 546×356 生成即可，不要按 640×450 去硬铺。

判断依据：`WishScene.tsx` 的卡结构，`minigames.css` 的 225px 与 560px 栏，`v11.css` 的 178px，`v12.css` 取消翻转，`global.css` 的 1920×1080 舞台。

---

## B. 35 张待制作图片

「待制作」= 清单里的图片，磁盘上还没有文件，并且不是 `skip`。透明要求沿用清单：全部是透明 PNG。文字、按钮、进度、火候、刀光、搅拌、火苗摇曳仍用 HTML/CSS，不要画进这些图。

显示尺寸是 CSS 逻辑像素。建议导出按视觉规范的 2 倍，比例与显示框一致。

| ID | 路径 | 清单尺寸 | 实机显示 | 建议导出 | 透明 | 冲突 |
| --- | --- | --- | --- | --- | --- | --- |
| `char_normal` | `public/assets/images/char/mayi_normal.png` | 640×920 | `.pc` 320×460 | 保持 640×920 | 是 | 否 |
| `char_happy` | `public/assets/images/char/mayi_happy.png` | 640×920 | 同上 | 保持 640×920 | 是 | 否 |
| `char_think` | `public/assets/images/char/mayi_think.png` | 640×920 | 同上 | 保持 640×920 | 是 | 否 |
| `char_surprise` | `public/assets/images/char/mayi_surprise.png` | 640×920 | 同上 | 保持 640×920 | 是 | 否 |
| `chibi_idle` | `public/assets/images/char/chibi_idle.png` | 240×300 | `.chibi` 120×150 | 保持 240×300 | 是 | 否 |
| `chibi_point` | `public/assets/images/char/chibi_point.png` | 240×300 | 同上，朝右画，朝左用翻转 | 保持 240×300 | 是 | 否 |
| `chibi_happy` | `public/assets/images/char/chibi_happy.png` | 240×300 | 同上 | 保持 240×300 | 是 | 否 |
| `chibi_surprise` | `public/assets/images/char/chibi_surprise.png` | 240×300 | 同上 | 保持 240×300 | 是 | 否 |
| `chibi_pray` | `public/assets/images/char/chibi_pray.png` | 240×300 | 同上 | 保持 240×300 | 是 | 否 |
| `chibi_cheer` | `public/assets/images/char/chibi_cheer.png` | 240×300 | 同上 | 保持 240×300 | 是 | 否 |
| `stamp_mint` | `public/assets/images/stamps/mint.png` | 152×152 | 地图托盘直径 76；蛋糕房 `StampBadge` 为 120×0.7=84 | 见 D，建议 168×168 | 是 | 倍数不足，方向一致 |
| `stamp_food` | `public/assets/images/stamps/food.png` | 152×152 | 同上 | 建议 168×168 | 是 | 同上 |
| `stamp_exam` | `public/assets/images/stamps/exam.png` | 152×152 | 同上 | 建议 168×168 | 是 | 同上 |
| `stamp_wish` | `public/assets/images/stamps/wish.png` | 152×152 | 同上 | 建议 168×168 | 是 | 同上 |
| `item_mint` | `public/assets/images/items/mint_candy.png` | 220×220 | `.candy` 110×110 | 保持 220×220 | 是 | 否 |
| `item_candy_bonus` | `public/assets/images/items/candy_bonus.png` | 220×220 | 同上 | 保持 220×220 | 是 | 否 |
| `item_junk_fengyoujing` | `public/assets/images/items/junk_fengyoujing.png` | 220×220 | 同上 | 保持 220×220 | 是 | 否 |
| `item_junk_soap` | `public/assets/images/items/junk_soap.png` | 220×220 | 同上 | 保持 220×220 | 是 | 否 |
| `item_junk_eraser` | `public/assets/images/items/junk_eraser.png` | 220×220 | 同上 | 保持 220×220 | 是 | 否 |
| `item_pot` | `public/assets/images/items/pot.png` | 760×400 | `.pot` 380×200 | 保持 760×400 | 是 | 否 |
| `item_hotpot` | `public/assets/images/items/hotpot.png` | 320×320 | 图鉴图标 `.gallery-item__icon` 120×120 | 保持 320×320 | 是 | 否。正方形，高于 2 倍，`contain` 不会变形 |
| `item_bowl` | `public/assets/images/items/bowl.png` | 720×400 | 水果捞碗 360×200 | 保持 720×400 | 是 | 否 |
| `item_fruit` | `public/assets/images/items/fruit_bowl.png` | 320×320 | 图鉴 120×120 | 保持 320×320 | 是 | 否 |
| `item_sauce_jar` | `public/assets/images/items/sauce_jar.png` | 200×240 | 没有独立图片框。水果捞里是配料格里的 emoji，格子为四列自适应 | 先保持 200×240 | 是 | 无固定框，见 D。不要画进文字按钮 |
| `item_yunpiangao` | `public/assets/images/items/yunpiangao.png` | 320×320 | 图鉴 120×120 | 保持 320×320 | 是 | 否 |
| `item_tangbing` | `public/assets/images/items/tangbing.png` | 320×320 | 图鉴 120×120 | 保持 320×320 | 是 | 否 |
| `item_pumpkin` | `public/assets/images/items/pumpkin.png` | 880×600 | `.hd-pumpkin` 440×300 | 保持 880×600 | 是 | 否 |
| `item_pumpkin_stem` | `public/assets/images/items/pumpkin_stem.png` | 160×160 | `.hd-stem` 26×42，叶片伸出后外接约 46×42 | **92×84** | 是 | **是** |
| `item_oven` | `public/assets/images/items/oven.png` | 400×320 | 烤箱正面 200×160 | 保持 400×320 | 是 | 否 |
| `item_golden_dish` | `public/assets/images/items/golden_dish.png` | 480×480 | 出炉圆盘 240×240 | 保持 480×480 | 是 | 否 |
| `img_wish_card_back` | `public/assets/images/items/wish_card_back.png` | 640×450 | 273×178 横向 | **546×356** | 是 | **是** |
| `item_wish_card` | `public/assets/images/items/wish_card.png` | 640×450 | 273×178 横向 | **546×356** | 是 | **是** |
| `item_cake` | `public/assets/images/items/cake.png` | 1120×440 | `.cake-base` 560×220 | 保持 1120×440 | 是 | 否 |
| `item_flame` | `public/assets/images/items/flame.png` | 52×80 | 火苗 26×40 | 保持 52×80 | 是 | 否 |
| `ui_logo` | `public/assets/images/ui/logo.png` | 1720×320 | 代码仍是 HTML 标题。需求写显示约 860×160 | 保持 1720×320 | 是 | 否。只给开场用，其他标题继续 HTML |

Q 版在闸机等处会再乘 `scale`（例如 0.8）。那是摆放缩放，素材仍按 120×150 的组件基准出 240×300。

2 倍规则适用于上表里的角色、道具和这张 LOGO。它不要求把背景画成 3840×2160；背景的正文规格仍是 1920×1080，4K 只是可选母版。

---

## C. 已完成的 25 张图片

25 张文件都在清单路径上，没有多出来的图片（`public/assets/README.md` 不是素材）。下表「程序读取」指当前场景是否已经用 `assetUrl` / 背景组件去加载。文件都在，不代表画面已经换成这张图。

| ID | 实测像素 | 清单尺寸 | 程序是否读取 | 显示方式 | 备注 |
| --- | --- | --- | --- | --- | --- |
| `bg_boot` | 1672×941 | 1920×1080，exists false | 是，开场背景 | `object-fit: cover` 铺满舞台 | 比例接近 16:9，分辨率低于目标 |
| `bg_gate` | 1672×941 | 同上 | 是 | cover | 同上 |
| `bg_map` | 1672×941 | 1920×1080，exists **true** | 是 | cover | 唯一一份 exists 正确的背景 |
| `bg_mint` | 1672×941 | exists false | 是 | cover | 同上 |
| `bg_food` | 1672×941 | exists false | 是 | cover | 同上 |
| `bg_exam` | 1672×941 | exists false | 是 | cover | 同上 |
| `bg_wish` | 1672×941 | exists false | 是 | cover | 同上 |
| `bg_cake` | 1672×941 | exists false | 是 | cover | 同上 |
| `bg_music` | 1672×941 | exists false | 是 | cover | 同上 |
| `bg_final` | 1672×941 | exists false | 是 | cover | 同上 |
| `bg_egg` | 1672×941 | exists false | 是 | cover | 同上 |
| `map_building_mint` | 1632×964 | 880×520，exists false | 是 | 逻辑框 680×402，`object-fit: contain`，底边对齐 | 比例与代码 `1632/964` 一致，不会拉变形 |
| `map_building_food` | 1635×962 | 880×520 | 是 | 680×400，contain | 与 `1635/962` 一致 |
| `map_building_exam` | 1635×962 | 880×520 | 是 | 660×388，contain | 同上 |
| `map_building_wish` | 1635×962 | 880×520 | 是 | 660×388，contain | 同上 |
| `map_building_cake` | 1632×964 | 1200×640 | 是 | 800×473，contain | 与 `1632/964` 一致 |
| `gate_arch` | 1536×1024 | 1536×1024，exists true，已注册 | 是 | 宽 1080、高 720、顶边 y=70、水平居中 | 文件比例和显示比例都是 1.5 |
| `gate_door_l` | 1068×1472 | 900×1240，exists false，未注册 | 否，仍是 CSS 门 450×620 | 文件比例约 0.726，与 450/620 一致 | 分辨率高于 2 倍目标 |
| `gate_door_r` | 1068×1472 | 同上 | 否 | 同上 | 同上 |
| `img_sakura_tree` | 1122×1402 | 800×900，exists false，已注册 | 否。心愿屋仍画 CSS 树干 60×300 | 没有图片框 | 文件比例 0.80，清单 0.89 |
| `item_sakura_cluster` | 1448×1086 | 400×320，未注册 | 否。花冠仍是 CSS 200×160 椭圆 | — | 文件比例 1.333，显示 1.25 |
| `item_sakura_cluster_lit` | 1448×1086 | 400×320，未注册 | 否 | — | 同上 |
| `theater_curtain_l` | 1251×1257 | 2150×2160，未注册 | 否。幕布仍是 CSS，宽 56%（1075×1080），打开时平移自身宽度的 92% | — | 比例接近，分辨率低于 2 倍目标 |
| `theater_curtain_r` | 1251×1257 | 同上 | 否 | — | 同上 |
| `theater_valance` | 2172×724 | 3840×192，未注册 | 否。檐幕 CSS 为 1920×96 | — | 文件比例约 3.0，显示比例 20。若铺满会严重拉扁 |

这 25 张都没有在本次改动。背景和五栋建筑、拱门可以被现有代码读到。门、幕布、檐幕、两张花冠还没进 `assets.ts`，所以场景不会请求它们。樱花树已经注册，但心愿屋没有使用这张图。

---

## D. 建议修正，尚未写入清单

### 待制作图里需要改尺寸的

1. `img_wish_card_back`、`item_wish_card`：`width/height` 从 640×450 改为 **546×356**。理由见 A。`usage` 应写成横向卡框，显示 273×178，不要再写竖卡或高 225。
2. `item_pumpkin_stem`：从 160×160 改为 **92×84**。`.hd-stem` 是 26×42 的竖茎，叶片向右伸出，外接约 46×42。正方形图放进这个框会留空或被裁切。
3. 四枚印章：方向没有冲突。若严格按最大实机直径 84 的 2 倍，导出改为 **168×168**。若接受地图 76 的 2 倍，可以维持 152×152，蛋糕房会略低于 2 倍。等确认后再改。

`item_sauce_jar` 不建议现在改像素。代码没有 200×240 的框，它活在配料格子的 emoji 位置。保持竖向透明罐，接入时用 `contain`，不要把它画成 `.food-jar` 那颗文字胶囊的背景。

### 已有文件：只建议改 `exists`，先不改目标宽高

下列 23 条文件已在磁盘上，但 `exists` 仍是 false：

`bg_boot`、`bg_gate`、`bg_mint`、`bg_food`、`bg_exam`、`bg_wish`、`bg_cake`、`bg_music`、`bg_final`、`bg_egg`、`map_building_mint`、`map_building_food`、`map_building_exam`、`map_building_wish`、`map_building_cake`、`gate_door_l`、`gate_door_r`、`img_sakura_tree`、`item_sakura_cluster`、`item_sakura_cluster_lit`、`theater_curtain_l`、`theater_curtain_r`、`theater_valance`。

`bg_map` 和 `gate_arch` 的 `exists` 已经是 true。

不要把清单宽高改成这些文件的实测像素来「迎合成品」。背景目标仍应是 1920×1080；现文件 1672×941 只是分辨率偏低，比例几乎是 16:9。门的目标 900×1240 与 450×620 的显示比例一致。幕布目标 2150×2160 与 1075×1080 一致。

需要单独记住、但不要靠改清单去修图的成品：

- 檐幕文件 2172×724，和 1920×96 的横条不是一个比例。
- 花冠文件 1448×1086（约 4:3），显示框是 200×160（5:4）。
- 樱花树文件 1122×1402，清单 800×900，代码又只有 60×300 的树干占位。
- 五栋建筑的清单仍写显示 440×260 / 蛋糕 600×320、导出 880×520 / 1200×640。锁定后的逻辑框已是薄荷与美食 680 宽、考试与心愿 660 宽、蛋糕 800 宽。成品像素约 1632×964 或 1635×962，和代码里的 `artAspect` 一致，`contain` 不会拉变形。清单的旧显示尺寸是文档滞后，不是要再改布局。

`registered: false` 对还没写进 `assets.ts` 的 ID 是对的。门、幕布、檐幕、花冠的文件虽然在，注册表里没有 ID，所以这个字段先保持 false，等以后接入代码再改。

清单 `note` 和 `updated`（仍是 2026-10-15）应在下次导出时改掉。`ART_REQUIREMENTS.md` 开头仍写资源目录里没有图片，也已经过时；本次按要求没有改那份文档。

音频 18 条都不在磁盘上。除 `music_hongdou` 明确跳过外，其余 17 条 `exists: false` 是对的。

---

## 批准之后如何导出新清单

游戏代码继续以 `src/config/assets.ts` 为准。新的 JSON 只作为给生成工具的规格表。

批准后建议只做这些事：

1. 仍以 `D:\MayiBirthday\asset_manifest.json` 为底稿，不要另起一份并行清单。
2. 用磁盘扫描重写全部 `exists`。有文件为 true，没有为 false。
3. 只按你点头的条目改 `width`、`height`、`usage`。本次建议至少包括两张心愿卡 546×356，以及你是否接受的瓜蒂 92×84、印章 168×168。
4. 建筑、门、幕布、背景的目标宽高维持「显示尺寸的 2 倍或 1920×1080」，不要改成实测的意外像素。可以在 `usage` 里加一句实测像素，避免和目标规格混在一起。
5. `registered` 只反映 `assets.ts` 里有没有这个 ID。不要为了清单把未接入的门和幕布标成已注册。
6. 更新 `updated` 和开头的 `note`。路径、ID、`skip` 条目保持不动。
7. 导出前再数一次：81 条、ID 唯一、图片 63、音频 18。

未批准前，生成心愿卡请直接按 **546×356**，不要按清单里的 640×450，也不要按 `ASSETS.md` 的 500×700。
