# 麻衣生日奇妙游园会 · 项目文档

> 送给虚拟主播麻衣的生日礼物，面向直播间公开体验的离线网页小游戏。
> 基调：前段幽默有趣，结尾温柔收尾（"开心就好"）。

## 1. 技术栈

| 用途 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | React 18 + TypeScript + Vite 6 | 严格模式，`noUnusedLocals` 等全部开启 |
| UI 动画 | `motion`（`motion/react`） | 场景切换、卡片弹出、火焰抖动等 |
| 声音 | `howler` | 懒加载 + `html5: true`（兼容 file://） |
| 单文件构建 | `vite-plugin-singlefile` | JS/CSS 全部内联进 `dist/index.html` |
| PixiJS | 未引入 | 当前场景均为 DOM/CSS 实现，必要时再评估 |

运行目标：Windows 上的 Chrome / Edge，通过 `file://` 直接打开 `dist/index.html`，不依赖 HTTP 服务器、CDN 与远程 API。

## 2. 命令

```powershell
npm install          # 安装依赖
npm run dev          # 开发服务器 http://127.0.0.1:5173/
npm run typecheck    # 仅类型检查
npm run build        # 类型检查 + 构建 → dist/index.html（单文件）
npm run preview      # 用本地服务器预览 dist（可选，file:// 直开也可以）
```

> 注意：如果 `localhost:5173` 被旧的开发服务器占用，Vite 会自动换端口；请以终端打印的地址为准。

## 3. 目录结构

```
MayiBirthday/
├─ index.html                 # 入口 HTML（仅挂载点）
├─ vite.config.ts             # base './' + singlefile 插件
├─ tsconfig.json
├─ public/
│  └─ assets/                 # 大型图片/音频，构建时原样复制到 dist/assets
│     ├─ images/{bg,char,stamps,items,ui}/
│     └─ audio/
└─ src/
   ├─ main.tsx                # ReactDOM 挂载
   ├─ App.tsx                 # GameProvider → HintProvider → Stage → SceneRouter + Hud + HintBar
   ├─ styles/global.css       # 全局样式、占位组件样式、1920x1080 舞台
   ├─ styles/minigames.css    # 小游戏外壳与四个关卡的样式
   ├─ styles/park.css         # 闸机、分层地图、建筑、轻提示、Q 版麻衣的样式
   ├─ styles/v11.css          # V1.1：演出 / 票根 / 心愿浮层等样式
   ├─ styles/v12.css          # V1.2：吐槽框、神秘料理三步、考试导航、心愿拖拽 / 扩容浮层、全屏闸机
   ├─ config/                 # ★ 所有"数据"集中在此
   │  ├─ assets.ts            # 统一资源注册表（路径、说明、占位色、音量）
   │  ├─ scenes.ts            # 场景 ID、标题、背景、进入守卫（V1.2：四站严格顺序 strictGuard）
   │  ├─ stamps.ts            # 四枚印章定义
   │  ├─ mapLayout.ts         # 地图建筑外框、推荐顺序、印章托盘/蛋糕房印章槽坐标
   │  ├─ texts.ts             # 全部中文文案
   │  ├─ food.ts              # 美食屋数据：火锅食材/评级、水果/底料/配料、图鉴条目
   │  ├─ foodQuips.ts         # V1.2 组合专属吐槽引擎（特殊组合规则 → 属性模板 → 兜底）
   │  ├─ secrets.ts           # V1.2 心愿扩容口令（集中配置，不导出明文；verifyWishExpandCode）
   │  └─ exam.ts              # 考试题库（V1.2 六题：3 事实 + 2 娱乐 + 1 荒谬）与结算评语
   ├─ core/
   │  ├─ GameContext.tsx      # ★ 场景管理器 + 进度状态 + 音频设置（唯一全局状态）
   │  ├─ HintContext.tsx      # 轻提示系统：首次目标 / 闲置提示 / 园区广播
   │  ├─ progress.ts          # 进度数据结构 v4、校验归一化、迁移、读写、严格顺序推导（currentStage / canEnterStage）
   │  ├─ storage.ts           # localStorage 安全封装，不可用时降级到内存
   │  └─ audio.ts             # Howler 封装：懒加载、容错、BGM/音效/单曲
   ├─ hooks/
   │  ├─ useStageScale.ts     # 计算 1920x1080 → 窗口 的等比缩放
   │  ├─ useAudioStatus.ts    # 订阅音频状态（useSyncExternalStore）
   │  ├─ useCountdown.ts      # 可暂停倒计时（薄荷糖关卡）
   │  ├─ useSceneHint.ts      # 场景向提示系统注册目标句与高亮目标
   │  └─ useMinigamePhase.ts  # 小游戏阶段机 + 印章发放（开始/暂停/重开/跳过/结算）
   ├─ components/
   │  ├─ minigame/
   │  │  └─ MinigameShell.tsx # 小游戏外壳：开始面板、暂停面板、结算面板、顶部 HUD
   │  ├─ map/
   │  │  └─ MapBuilding.tsx   # 纯 CSS 建筑（屋顶/墙/窗/灯笼/门/印章槽/状态牌）
   │  ├─ food/
   │  │  └─ HiddenDishGame.tsx # V1.2 神秘料理三步互动（切窝瓜 / 裹酱 / 火候指针）
   │  ├─ Stage.tsx            # 舞台容器（居中 + 缩放 + 黑边）
   │  ├─ SceneRouter.tsx      # 按当前场景渲染组件，带淡入淡出与错误边界
   │  ├─ Hud.tsx              # 常驻 HUD：场景名/印章数/返回地图/音量/提示
   │  ├─ HintBar.tsx          # 提示槽（HUD 下方右侧，pointer-events: none）
   │  ├─ VolumeControl.tsx    # 音量滑块、静音、BGM 开关
   │  ├─ ErrorBoundary.tsx    # 场景崩溃时显示可恢复界面（防空白页）
   │  └─ ui/
   │     ├─ Button.tsx        # 统一按钮（带点击音效）
   │     ├─ Card.tsx          # 卡片容器（占位/可点击/选中/完成态）
   │     ├─ SceneLayout.tsx   # 场景通用布局：背景+标题+主体+角色+操作栏
   │     ├─ PlaceholderBackground.tsx
   │     ├─ PlaceholderCharacter.tsx  # 纯 CSS 麻衣立绘占位（狐耳、异瞳）
   │     ├─ ChibiMayi.tsx     # 纯 CSS Q 版麻衣占位，8 个动作由类名驱动
   │     └─ StampBadge.tsx    # 印章徽章
   └─ scenes/
      ├─ index.ts             # SceneId → 组件 注册表
      ├─ BootScene.tsx        # 1  开场：连接生日频道
      ├─ GateScene.tsx        # 2  入园闸机（V1.2 全屏：bg / gate / content / char 四层 + 开门演出）
      ├─ LegacyScenes.tsx     #    旧场景 ID auth / notice 的兼容重定向
      ├─ MapScene.tsx         # 3  游园会地图（分层 + 严格顺序 + Q 版站位移动 + 两段自动演出）
      ├─ MintScene.tsx        # 5  薄荷糖补给站（20 秒点击收集）
      ├─ FoodScene.tsx        # 6  美食幻想屋（大厅 + 糖罐气泡 + 火锅/水果捞(端上桌后吐槽) + 神秘料理台 + 图鉴）
      ├─ ExamScene.tsx        # 7  本人认证考试（6 题，上一题/下一题/改选，交卷按最终选择计分）
      ├─ WishScene.tsx        # 8  心愿收藏屋（拖拽挂树 + 第五张许愿卡 + 单选/小鬼扩容多选 + 封存）
      ├─ CakeScene.tsx        # 9/10 蛋糕房 + 点亮蛋糕
      ├─ CandleScene.tsx      # 10 吹蜡烛
      ├─ MusicScene.tsx       # 11 音乐礼物《红豆》
      ├─ FinalScene.tsx       # 12 生日特别演出（愿望审批系统 × 话剧 7 幕，分层 DOM）
      ├─ TicketScene.tsx      # 13 闭园纪念票根（主线结束；🦊 彩蛋入口）
      └─ EggScene.tsx         # 14 隐藏彩蛋
```

## 4. 核心机制

### 4.1 场景管理器（`core/GameContext.tsx`）

- 当前场景保存在 React state 中，**不使用 URL / History**，`file://` 下完全可用。
- `goTo(scene)`：若 `SCENES[scene].canEnter(progress)` 返回 false，则弹出 `lockedHint` 并留在原地。
- `backToMap()`：任何关卡都可随时返回地图（HUD 左上常驻按钮 + 错误边界恢复按钮）。
- 场景切换通过 `AnimatePresence mode="wait"` 做淡入淡出。

### 4.2 进度与印章（`core/progress.ts`，存档 v4）

```ts
interface GameProgress {
  version: 4;
  authDone; noticeDone;                 // 闸机通过（兼容旧字段，闸机一次写两个）
  stamps: { mint, food, exam, wish };   // 四枚印章
  wishUnlockSeen; convergenceSeen;      // 心愿屋解锁演出 / 四章汇聚演出 是否已看
  candles: { mint, food, exam, wish };  // 四支蜡烛逐支点亮
  cakeLit; candlesBlown; musicDone; finalSeen; ticketSeen; eggFound;
  hiddenDishUnlocked; hiddenDishFound; signalCardSeen;   // 神秘料理台 已解锁 / 已制作
  multiWishUnlocked;                    // V1.2：小鬼特批心愿扩容（口令验证成功后持久为 true）
  collectibles: { yunpiangao, tangbing, bohetang, danhuangnangua }; // 美食图鉴（永久）
  records: { mintBest, mintBestCombo, examBestCorrect, examSet,   // examSet: 0 未交卷 / 1 V1.0 / 2 V1.1 / 3 V1.2 当前题组；上限 EXAM_FACT_TOTAL=3
             hotpotName, fruitName,
             selectedWishIds, mainWishBySystem,                    // V1.2：selectedWishIds: WishCardId[]（替代 v3 单值 mainWish；未解锁最多 1 个）
             customWish, customWishPublic };                       // 麻衣专属许愿卡：仅本地；默认不公开
  hintsSeen: Partial<Record<SceneId, boolean>>;                     // 各场景首次目标提示是否已显示
  settings: { danmuTimer };
  audio: { volume; muted };
}
```

- `awardStamp(id)` **仅首次有效**；`ensureStamp(id)` 供小游戏通关/跳过使用，重复时静默。
- `unlockCollectible` / `updateRecords`（数值取更高）/ `setRecords`（票根文字记录）/ `lightCandle` / `lightAllCandles` / `markHintSeen` / `updateSettings`。
- **读档一律经过 `normalizeProgress(raw)`**：逐字段校验类型与范围，缺失补默认值，非法值回退默认值；嵌套对象（stamps / candles / collectibles / records / hintsSeen / settings / audio）逐键归一化，彻底消除旧版"浅合并覆盖嵌套对象"的风险。存档 key 不变，v1 / v2 / v3 存档自动升级为 v4。
- 迁移推断：v1 的 `cakeLit=true` → 四支蜡烛全亮；已持有心愿章 → `wishUnlockSeen=true`；四章齐且已开始蛋糕流程 → `convergenceSeen=true`；`hiddenDishFound` → `hiddenDishUnlocked`；**旧题组考试成绩不迁移**（`examSet !== 3` 时 `examBestCorrect` 清零，有成绩无 examSet 的旧档记 `examSet=1`）；旧心愿卡 ID 丢弃；**v3 `mainWish` → `selectedWishIds=[mainWish]`**，非法 ID 过滤，`customWish` 为空时移除 `'custom'`，`multiWishUnlocked=false` 且长度 > 1 时只保留第一个；`customWish` 经 `sanitizeUserText`（去控制字符、80 码点截断）。`recordExam(n)`：不同题组覆盖、同题组取 max。
- 解锁规则（`config/scenes.ts` + `progress.ts`）：**V1.2 严格顺序** `STRICT_ORDER = ['mint','food','exam','wish']`；`currentStage(p)` = 第一个未盖章；`canEnterStage(p, id) = p.stamps[id] || currentStage(p) === id`（已盖章可重玩，不重复盖章）；`strictGuard(id)` 生成 `canEnter` + `lockedHint`（「这里还没开放，先去「X」拿到印章～」）；旧存档乱序印章保留。蛋糕房、吹蜡烛、音乐、祝福、票根 `hasAllStamps`。
- 心愿扩容口令：`config/secrets.ts` 内 `WISH_EXPAND_CODE`（不导出），`verifyWishExpandCode(input)` 去首尾空格 + 全角数字归一化后比较；仅趣味解锁，正确值不出现在界面文案与文档中。
- 地图蛋糕房入口集齐后根据进度直达对应环节（点亮→吹蜡烛→音乐→演出→票根）：`ticketSeen || finalSeen` → ticket；`musicDone` → final。
- 每个小游戏都有"跳过这关"按钮，失败/不玩也能拿印章并通关；跳过不会阻塞后续解锁。

### 4.2b 地图演出（`scenes/MapScene.tsx`）

- 第 3 枚（薄荷/美食/考试）到手回到地图：心愿屋解锁演出（Q 版麻衣指路、建筑发光、广播"心愿收藏屋现在开放"，4 秒，可跳过，演出中直接点心愿屋也可进入）→ 写 `wishUnlockSeen`。
- 第 4 枚到手回到地图：汇聚演出（天色入夜 → 灯笼依次亮 → 托盘印章飞向蛋糕房四槽 → 槽位点亮 + 烟花 + 广播 → 蛋糕房开放，8 秒，可跳过）→ 写 `convergenceSeen`。跳过与自然播完走同一条 `finishShow`，都写进度，只播一次。
- 地图 DOM 分五层：`park__layer--bg / --buildings / --ambient / --fx / --ui`；天色由 `data-ambient="0..4"` 驱动（印章数或演出阶段）。建筑外框在 `config/mapLayout.ts`，未来替换正式建筑图保持同一外框即可。

### 4.2c 轻提示系统（`core/HintContext.tsx` + `hooks/useSceneHint.ts`）

- 场景首次进入显示一句目标（5 秒，持久化到 `hintsSeen`，之后不再出现）；若此时正在播广播，广播结束后补显示。
- 闲置 9 秒无操作 → 显示提示并给 `[data-hint-target]` 元素加 `.hint-pulse` 脉冲高亮；每次进入场景最多 3 次，间隔 ≥ 15 秒；小游戏游玩中关闭。
- 提示槽 `pointer-events: none`，不遮挡按钮；任何 pointerdown/keydown 立即收起提示（capture 监听，不阻止事件），第一下点击照常生效。
- 页面隐藏时暂停计时；没有任何模态教程。
- `announce(lines)`：园区广播队列（每条 2.5 秒），优先级最高，绑定所属场景，切场景时丢弃上一场景未播完的广播。

### 4.3 存储降级（`core/storage.ts`）

- 启动时做一次 localStorage 写入测试；失败则所有读写走内存 `Map`。
- 写入过程中抛错（配额/策略）也会自动切换到内存模式。
- HUD 右上显示"存储不可用：进度仅在本次运行中保留"。
- 开场若检测到已有进度，提供"继续上次游园（直达地图）"。

### 4.4 音频（`core/audio.ts`）

- **首次进入绝不自动播放**：BGM 只能由用户点击 HUD 的 🎵 按钮开启。
- 所有 Howl 实例在首次 `play` 时才创建；文件缺失标记为 `missing`，UI 显示"音频素材尚未就绪"，不报错。
- `html5: true` 规避 `file://` 下 Web Audio XHR 的 CORS 限制。
- 主音量/静音保存在进度中，通过 `Howler.volume / Howler.mute` 全局生效。

### 4.5 舞台与分辨率

- 逻辑画布固定 1920×1080，`Stage` 根据窗口 `min(w/1920, h/1080)` 等比缩放并居中，四周留深色边。
- 所有场景按 1920×1080 设计，无需考虑其它尺寸。

### 4.6 资源注册表（`config/assets.ts`）

- 每条资源包含 `kind / path / description / placeholder / loop / volume`。
- 代码中只能通过 `assetUrl(id)` / `assetPlaceholder(id)` 访问，禁止散落硬编码路径。
- 真实素材放入 `public/assets/<path>` 即可生效，占位组件右下角标注了对应路径。

### 4.7 小游戏框架

所有关卡共用 `useMinigamePhase` + `MinigameShell`，统一具备 **开始 → 游玩 → 暂停 → 结算** 四态：

| 状态 | 面板 | 可用操作 |
| --- | --- | --- |
| intro | 标题、说明、规则、角色 | 开始游戏 / 跳过这关 |
| playing | 顶部 HUD + 暂停按钮 | 关卡交互 |
| paused | 已暂停 | 继续 / 重新开始 / 跳过这关 |
| result | 结算数据 + 角色 | 再玩一次 / 领取印章返回地图 |

- 进入 result 时调用 `ensureStamp`，首次通关发章，重玩不重复。
- "跳过这关"视为通关（发章并返回地图），保证直播不会卡住。
- 音效全部经 `audio.playSfx(id)`，素材缺失时静默。

**第一关 · 薄荷糖补给站**（`MintScene`）
- 20 秒倒计时（`useCountdown`，暂停时停表）；每 520ms 随机生成一枚，同屏最多 7 枚，各自有存活时间与进度环。
- 普通薄荷糖 +10、奖励糖 +30（生命更短、带光晕）、干扰物（风油精/肥皂/橡皮擦）-15 并清零连击。
- 连击倍率每 5 连击 +0.5，上限 3 倍；到达 5 的倍数时全屏"N 连击！"。
- 结算：得分、最高连击、命中/失误、历史最高（持久化）、新纪录徽章。

**第二关 · 美食幻想屋**（`FoodScene`，数据在 `config/food.ts`）
- 大厅四个站台 + 柜台糖罐（V1.2：未收集时上方跳动气泡「咦？柜台上好像有个糖罐……」）；完成 **火锅 + 水果捞** 即可"完成美食之旅"领取唯一一枚美食印章。
- A 火锅台：12 种食材选 4；下锅触发蒸汽粒子与台词，离谱食材（西瓜/冰淇淋/薄荷糖/奶茶）触发吐槽；按离谱数量评级（教科书级 / 创意 / 勇者 / 黑暗料理实验）。**端上桌后停留显示「店长点评」组合专属吐槽**（`config/foodQuips.ts` `hotpotQuips`：特殊组合规则优先 → 口感 / 温度属性模板 → 兜底，1~2 句）→ 「回大厅」。完成送「糖饼」。
- B 水果捞台：3 水果 + 1 底料 + 1 配料，完成展示成品名；端上桌后同样显示 `fruitQuips`（酸 / 甜 / 颜色 / 底料配料搭配；蛋黄沙司有专属反馈）。完成送「云片糕」。
- C 神秘料理台（V1.1 有提示的探索 + V1.2 三步互动）：大厅常驻卡片；未解锁点击 → 提示面板「神秘料理尚未解锁！/ 听说水果捞里混进了一个奇怪的配料」+「去水果捞看看」；水果捞配料「蛋黄沙司（？）」高亮带问号，**点一下即解锁**（hiddenDishUnlocked）并显示两句线索 + 「去神秘料理台」；进入后 `components/food/HiddenDishGame.tsx`：切窝瓜（砧板 pointerdown/move 4 刀）→ 裹蛋黄沙司（点击 +18% / 拖动 +3% 到 100%）→ 黄金焗烤（rAF 指针往返 2.2 秒，五档火候，点「出炉！」停针，**任何火候都成功**）→ 金黄成品 + Q 版 cheer 气泡；「快速完成」「再做一次」「端上桌」→ 「蛋黄焗窝瓜」（hiddenDishFound）。非强制，不影响印章。
- D 图鉴：云片糕、糖饼、薄荷糖（点柜台糖罐）、蛋黄焗窝瓜（神秘条目），永久保存。玩家可见文字统一「蛋黄焗窝瓜」，内部 ID danhuangnangua 保留。
- 文案不涉及暴食、强制吃完、体重或健康话题。

**第三关 · 认证考试**（`ExamScene`，题库在 `config/exam.ts`）
- V1.2 题组（EXAM_SET_VERSION = 3）6 题 = 3 道事实题（最喜欢吃火锅；星座 = 天蝎座；专业 = 表演）+ 娱乐题「隐藏被动技能」+ 弹幕互动题「加一个 BUFF」+ 荒谬判定题「找出麻衣」。每道事实题的错误选项各有专属吐槽（`feedback[]`）。
- 导航：`answers[]` 保存每题当前选择；「上一题 / 下一题」自由翻看、可改选（`changes` 计数）；未作答不能下一题；最后一题「交卷」按事实题**最终选择** `countFact(answers)` 计分。
- 事实题：选错**立即揭晓答案**+ 该选项吐槽，不锁定；"弹幕提示"按钮显示提示。娱乐题反馈尾注「弹幕印象，未经本人认证」。荒谬题任选皆对，首次作答先播「判定器过载」1.3 秒再给专属反馈（每题一次）。
- 弹幕倒计时（20 秒）默认关，HUD 开关持久化。
- 结算：事实题正确数 0～3、改选次数、历史最佳（仅同题组）；无论结果都"认证通过"；`recordExam` 写 examSet=3。

**第四关 · 心愿收藏屋**（`WishScene`）
- 四张固定卡（财运爆棚 / 纯爱成真 / 舞台闪耀 / 顺心自在）**拖到樱花树上**挂起（自定义指针拖拽，位移 ÷ 舞台缩放；树冠 `getBoundingClientRect` ± 40px 命中；松手不在树上回弹）→ 光点飞入树冠 650ms → 点亮一簇。备用操作：点卡片（待挂）再点树。
- 第五张「麻衣专属许愿卡」：四张挂满后才出现；浮层 textarea，compositionstart/end 期间不截断，结束后按码点截断 80；「保存心愿」/ 清空 / 先不写；复选框决定是否在票根公开（默认否）；只写本地存档。正常流程须保存后才进入选择（否则 toast + 打开许愿卡）；全局「跳过这关」仍可直接领印章且不写入任何心愿。
- 选择浮层：默认单选（`selectedWishIds` 最多 1 个，可跳过 → `[]` + `mainWishBySystem=true`）；底部「向小鬼申请心愿扩容」→ 小鬼对话 → 口令输入（`verifyWishExpandCode`，错误可无限重试）→ 故障动画 → `multiWishUnlocked=true` → 多选（切换 / 「全部都要！」/ 「确认我的心愿」），保留原单选、不重播挂树动画。→ "封存心愿"进入结算。好信号挂牌为可选浮层。无失败机制。

## 5. 剧情流转

```
boot → gate（全屏闸机，任意身份 → 寿星本人 100% → 推开闸门：双门滑开 + 白光）→ map
map → mint → food → exam → wish（V1.2 严格顺序；Q 版麻衣站在当前站门口并随进度移动；已盖章场馆可重玩，不重复盖章）
第 3 枚到手 → 心愿屋解锁演出 → wish
第 4 枚到手 → 汇聚演出 → cake → candle → music（播放/跳过）→ final（7 幕演出，可跳过）→ ticket → (egg) → map
```

旧场景 ID `auth` / `notice` 仍保留在注册表中，进入即重定向到 `gate` / `map`。

彩蛋入口：闭园票根下方显性按钮「🦊 好像还有一个地方没逛，要去看看吗？」（找到后隐藏）。地图标题连点与最终祝福页隐藏热区均已删除。

## 6. 完成进度

### 本轮（架构与场景流转）✅

- [x] 项目脚手架、离线单文件构建（`npm run build` → `dist/index.html`，file:// 验证通过）
- [x] 统一场景管理器 + 进入守卫
- [x] 进度状态、四枚印章首次发放机制
- [x] 地图与各场景导航、随时返回地图、错误边界
- [x] 占位背景 / 占位角色 / 占位卡片
- [x] 音量、静音、BGM 手动开关，素材缺失容错
- [x] 进度持久化 + 存储不可用降级（已模拟验证）
- [x] 资源统一配置表
- [x] 1920×1080 舞台 + 任意窗口等比缩放（1600×900、1280×1024 验证）
- [x] 13 个场景全部可点击走通到结局与彩蛋（Edge 无头端到端走查通过）

### 第二轮（四个小游戏）✅

- [x] 小游戏通用框架：`MinigameShell` + `useMinigamePhase` + `useCountdown`
- [x] 第一关 薄荷糖补给站：计时、随机生成、三类目标、连击特效、结算、重玩、暂停/跳过
- [x] 第二关 美食幻想屋：火锅台、水果捞台、隐藏料理（蛋黄沙司 → 蛋黄焗南瓜）、图鉴（持久化）
- [x] 第三关 认证考试：事实题/娱乐题区分、重试与揭晓、弹幕提示、差异化反馈
- [x] 第四关 心愿收藏屋：心愿卡翻转、樱花树逐簇点亮、满树花开动画
- [x] 新增音效 ID 全部注册到资源表，缺失时静默
- [x] 端到端走查：四关完整玩法 + 跳过路径 + 刷新后图鉴/记录保留，TypeScript 与构建通过

### 第三轮 · 第一阶段（V1.0 正式开发：骨架与规则）✅

依据 `DESIGN_DECISIONS.md`（优先）与其余设计文档实现：

- [x] 入园闸机 `GateScene`：合并认证 + 须知；左侧闸机扫描框（三步扫描文字 + 进度条）→ "检测到：寿星本人 / 置信度：100%"；四个身份各有幽默回复；"老登大道理功能已临时下线"作为装饰须知牌保留；"推开闸门"主按钮带呼吸光；写 `authDone + noticeDone` 兼容旧守卫
- [x] 真实游园会地图 `MapScene` + `MapBuilding` + `config/mapLayout.ts`：四场馆固定外框 + 中央蛋糕房；纯 CSS 建筑；已通关显示"已盖章"与亮窗；锁定显示条件文字与 🔒；五层 DOM（背景/建筑/环境光/特效/UI）
- [x] 解锁规则：三关任意顺序；心愿屋 3 章自动解锁（含演出）；第 4 章触发汇聚演出（入夜 → 灯笼 → 印章飞行 → 四槽点亮 → 烟花 → 蛋糕房开放）；可跳过，跳过仍写进度，只播一次
- [x] 轻提示系统 `HintProvider` / `useSceneHint` / `HintBar`：首次目标一句话、闲置 9 秒高亮推荐操作、每场景 ≤ 3 次、不遮挡按钮、不吞点击、页面隐藏暂停、无模态教程；Q 版麻衣 `ChibiMayi` 纯 CSS 占位（8 个动作类名）
- [x] 存档 v2 `normalizeProgress`：逐字段校验与默认填充、嵌套对象逐键归一化、v1 自动迁移、非法值回退、存储不可用单次运行可玩；新增 `wishUnlockSeen / convergenceSeen / candles / ticketSeen / signalCardSeen / records.hotpotName|fruitName|mainWish|mainWishBySystem / settings.danmuTimer / hintsSeen`
- [x] 四个小游戏保持原样可进入 / 可玩 / 可跳过 / 可返回；心愿屋旧入口适配新锁；蛋糕房 `lightAllCandles` 与 v2 蜡烛字段保持一致
- [x] 新增资源 ID：`map_building_*`、`map_layer_night`、`map_layer_lanterns`、`chibi_mayi`（见 `ASSETS.md`）
- [x] 自动化验收（Edge 无头 + puppeteer-core，脚本位于仓库外）：`phase1.mjs`（闸机 / 地图锁定 / 自由顺序 / 心愿解锁演出 / 汇聚演出跳过与完整播放 / 刷新恢复 / 重复通关不重复发章 / v1 脏存档迁移 / 闲置提示）、`run.mjs`（主线到彩蛋 + 刷新恢复）、`games.mjs`（四关真实玩法）、`fallback.mjs`（存储不可用 + 1280×1024），在 `dist/index.html`（file://）与 dev server 上全部通过，页面零错误

### 第四轮 · V1.1 内容与交互修改 ✅

- [x] 美食屋：神秘料理改为「有提示的探索机制」（常驻神秘料理台 + 未解锁提示面板 + 蛋黄沙司点击即解锁 + 线索卡）；菜名统一「蛋黄焗窝瓜」；新增 `hiddenDishUnlocked`
- [x] 心愿屋：4 张固定心愿卡（财运 / 纯爱 / 舞台 / 顺心）+ 第 5 张「麻衣专属许愿卡」（IME 安全 textarea、80 码点、保存 / 清空 / 跳过、票根公开复选框、仅本地）+ 「最想收下的心愿」选择（可跳过）+ 好信号挂牌
- [x] 认证考试：V1.1 题组 5 题（删除狐耳 / 异瞳；2 喜好 + 娱乐 + BUFF + 荒谬判定），答错立即揭晓，`examSet` 题组版本化，旧 3 题成绩不迁移
- [x] 最终祝福：`FinalScene` 重写为「生日愿望审批系统 × 话剧分幕」7 幕（点击推进 / 跳过 / 分层 DOM / 文字层数据驱动）；新增 `TicketScene`（票根数据映射、自定义心愿隐私规则、新旧成绩区分、🦊 显性彩蛋入口）；移除旧 🦊 隐藏热区
- [x] 存档 v3（`normalizeProgress` 迁移规则见 §4.2）；新样式集中在 `src/styles/v11.css`
- [x] 自动化：`run.mjs` / `games.mjs` / `phase1.mjs` / `ticket.mjs` / `fallback.mjs` 在 `file://` 与 dev server 全部通过（覆盖中文输入、存档兼容、神秘料理解锁、考试答案、完整主线）

### 第五轮 · V1.2 游戏玩法与交互升级 ✅（2026-10-15）

- [x] 美食屋：火锅 / 水果捞「端上桌」后组合专属吐槽（`config/foodQuips.ts`，特殊组合优先 → 属性模板 → 兜底；西瓜+冰淇淋、酸味三巨头、蛋黄沙司等专属句）；糖罐提示气泡；神秘料理台改为 `HiddenDishGame` 三步真实互动（切 / 裹 / 火候指针，任何火候都成功，快速完成 / 再做一次）
- [x] 认证考试：6 题（新增星座 / 专业事实题，每个错误选项专属吐槽）；上一题 / 下一题 / 改选；交卷按最终选择计分；`EXAM_SET_VERSION=3`、`EXAM_FACT_TOTAL=3`；结算 / 票根 / 存档同步
- [x] 心愿屋：拖拽挂树（指针事件 + 舞台缩放换算 + 光点飞入 + 回弹）与「点卡片再点树」备用；第五张许愿卡在四张挂满后出现；保存后才进入选择；「向小鬼申请心愿扩容」（口令集中在 `config/secrets.ts`，错误可重试，成功播故障动画并持久解锁多选 / 全部都要）；票根心愿三态
- [x] 入园闸机全屏重做（`.gate2` 四层 + 双门滑开演出）；地图严格顺序闯关（`STRICT_ORDER` / `currentStage` / `canEnterStage` / `strictGuard`，状态牌三态，Q 版麻衣站在当前站、可点击进入、通关后移动；四枚齐后全部可重玩；旧存档乱序印章保留）
- [x] 存档 v4：`records.mainWish` → `records.selectedWishIds[]`（迁移 + 未解锁裁为 1）、新增 `multiWishUnlocked`；新样式集中在 `src/styles/v12.css`
- [x] 自动化（仓库外 `%TEMP%\mayi-e2e`）：`v12.mjs`（73 断言全流程）、`v12-save.mjs`（21 断言存档迁移 / 票根四态 / 乱序旧档）、`v12-scale.mjs`（1280×1024 拖拽）、`fallback.mjs`（存储不可用 + 严格顺序）在 `file://dist/index.html` 与 dev server 全部通过，页面零错误；`run.mjs` / `games.mjs` / `phase1.mjs` / `ticket.mjs` 基于 V1.1 自由顺序假设，已被 `v12*.mjs` 取代
- [x] 六份设计文档 + 本文件同步到 V1.2；人工验收项见 `GAME_QA_CHECKLIST.md` §17

### 待后续阶段

- [ ] 蜡烛 4 支逐支点亮、吹蜡烛长按/点击、音乐暂停/进度/音量（`DESIGN_DECISIONS.md` D-13/D-14）
- [ ] 真实美术素材接入（见 `ASSETS.md`），Q 版麻衣替换为 PNG/序列帧
- [ ] 《红豆》音频接入与播放进度条
- [ ] 文案润色、直播间演出节奏调整
- [ ] 键盘快捷键、无障碍细节

## 7. 开发约定

- 所有注释使用 JSDoc 格式；所有界面文字为中文并集中在 `config/texts.ts`。
- 新增场景：`config/scenes.ts` 加元数据 → `scenes/XxxScene.tsx` 实现 → `scenes/index.ts` 注册。
- 新增资源：只在 `config/assets.ts` 注册，并同步更新 `ASSETS.md`。
- 内容红线：避免暧昧、情侣元素、粉丝占有感、私人经历与敏感健康话题。
