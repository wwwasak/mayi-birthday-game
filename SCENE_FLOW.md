# 《麻衣生日奇妙游园会》场景流程与互动表现规格

> V1.2 玩法与交互升级版 · 规格以 `DESIGN_DECISIONS.md` 为准；文案见 `STORY_SCRIPT.md`；布局见 `UI_WIREFRAMES.md`
> 标注：**[现有]** 已实现 · **[新增]** 待开发 · **[改]** 需调整 · **[删]** 需移除 · **[可选，待开发]** 非本轮范围
> V1.2 已实现：§0 严格顺序 + 守卫、§2 gate（全屏 + 开门演出）、§3 map（当前站 / 锁定 / Q 版移动）、§5 food（组合吐槽、三步神秘料理、糖罐气泡）、§6 exam（6 题 + 上一题 / 改选）、§7 wish（拖拽挂树、第五张后置、保存门槛、小鬼扩容、多选）、§12 ticket（心愿三态）
> V1.1 已实现：§5 food（神秘料理线索 + hiddenPrompt）、§6 exam（新题组）、§7 wish（5 卡 + 浮层）、§11 final（话剧分幕）、§12 ticket

## 0. 总流程

```
boot ──► gate(全屏，开门演出) ──► map ◄──────────────────────────────┐
                                  │  严格顺序（V1.2）                 │
                                  ▼                                  │
      mint ──► food ──► exam ──► wish      （各 1 枚；Q 版站在当前站）│
       ▲        ▲        ▲        ▲                                  │
       └────────┴────────┴────────┘ 已盖章可重玩（不重复盖章）         │
                                  │ 3 枚 → map 播「心愿屋解锁」动画    │
                                  │ 4 枚 → map 自动播「印章汇聚」（一次，可跳过）
                                  ▼                                  │
      cake ──► candle ──► music ──► final ──► ticket ────────────────┤
                                                 │  ▲                │
                                                 ▼  │                │
                                                egg ┘ （可选）        │
```

### 0.1 场景 ID

| ID | 处理 |
| --- | --- |
| `boot` | [现有] |
| `auth` | [改] 渲染为入园闸机（含须知装饰牌） |
| `notice` | [改] 保留 ID 以兼容旧存档，进入即重定向 `map` |
| `map` `mint` `food` `exam` `wish` `cake` `candle` `music` `final` `egg` | [现有] 按本文件调整 |
| `ticket` | [现有] V1.1 已实现（`TicketScene.tsx`，守卫 4 枚印章） |

### 0.2 进入守卫

| 场景 | 条件 | 拦截反馈 |
| --- | --- | --- |
| mint / food / exam / wish | `canEnterStage(p, id)`：已盖章 **或** 为 `currentStage(p)`（顺序 mint→food→exam→wish 中第一个未盖章）[V1.2 现有] | 建筑轻晃 + toast「这里还没开放，先去「X」拿到印章～」；四枚齐后「四枚印章已集齐，去中央蛋糕房吧！」 |
| cake / candle / music / final / ticket | 4 枚印章 [现有] | toast「还差 N 枚印章解锁」[现有] |
| egg | 无（入口仅在票根） | — |

### 0.3 存档字段

见 `DESIGN_DECISIONS.md` §3（存档 **v4**）。V1.2 变更：`records.mainWish`（单值）→ `records.selectedWishIds`（数组，v3 读入时自动包成单元素数组）；新增 `multiWishUnlocked`；`EXAM_SET_VERSION=3`，`examBestCorrect` 上限 3，旧题组（examSet 1/2）成绩清零仅作标记；印章字段不变，严格顺序由 `stamps` 推导。V1.1 新增：`hiddenDishUnlocked` `records.examSet` `records.customWish` `records.customWishPublic`。

### 0.4 全局规则

| 项 | 规则 |
| --- | --- |
| 返回地图 | HUD 常显（boot/gate 除外）[现有]；四关游玩中返回弹二次确认 [新增] |
| 暂停 / 重试 / 跳过 | 四关统一面板 [现有]；跳过按钮文字改「跳过并领取印章」[改] |
| 自动演出 | ≤ 8 秒，点击任意处跳过，跳过与播完结果一致 |
| 提示槽 | HUD 下方；目标句首次进入显示 5 秒或首次点击消失；闲置 8～10 秒重现 + Q 版 point + 对象脉冲；每场景最多 3 次 |
| 广播横幅 | 与提示槽同位，广播优先；≤ 28 字；2.5 秒自动消失；悬停暂停 |
| 音频 | 首次进入静音；BGM 手动开启；缺失静默 [现有]；SFX 同刻 ≤ 2 个 |
| 语音 | 每场景 ≤ 2 个触发点；可打断；结算/祝福/音乐页不触发 |

---

## 1. `boot` 开场连接

| 项 | 内容 |
| --- | --- |
| 进入 | 启动 |
| 退出 | 进入游园会 → `gate`；继续上次游园 → `map`（有任意进度）[现有] |
| 元素 | 标题、进度条、按钮、音量提示 |
| 可点 | 两按钮；进度条点击直接满 [新增] |
| 角色 | 进度满时 Q 版 peek [新增] |
| 音效 / 语音 / BGM | 无 |
| 提示 | 无（按钮本身即引导） |
| 时长 | 8～10 秒 |

## 2. `gate` 入园闸机 [改]

| 项 | 内容 |
| --- | --- |
| 进入 | boot |
| 退出 | 推开闸门 → `map`，写 `authDone=noticeDone=true` |
| 布局 [V1.2 现有] | 全屏 `.gate2`，四层：`--bg`（占位背景 + 天空渐变）/ `--gate`（CSS 闸机：拱门招牌、双立柱、双门、通道灯、地面）/ `--content`（居中：标题、问题、扫描器、选项、回复、推开闸门；左下须知牌）/ `--char`（右侧立绘占位） |
| 元素 | 扫描框、四选项、立绘常态、须知装饰牌（可悬停放大，不需确认）、广播、Q 版 peek（右立柱外侧） |
| 可点 | 四选项（点后锁定 1.2 秒扫描）；推开闸门（结果出现后弹出 + 呼吸光） |
| 结果 | 任何选项 → 扫描三行 → 「寿星本人 100%」+ 回复 |
| 开门演出 [V1.2 现有] | 点「推开闸门」→ `gate2--opening`：双门向两侧滑开 + 白光 `.gate2__flash`（`GATE_OPEN_MS=1100`）→ `map` |
| 角色 | 立绘常态 → 结果时惊讶；闸门开 Q 版 peek 跑出 |
| 音效 | 选项 `sfx_click`；扫描 `sfx_scan`*；结果 `sfx_success`；闸门 `sfx_gate`* |
| 语音 | 来了！ |
| BGM | `bgm_park`（若已手动开启） |
| 视觉 | 扫描条滚动；数字 0→100；闸门左右滑开 + 白光 |
| 提示 | 目标句「选一个身份，闸机会帮你确认。」；闲置 → 选项脉冲 |
| 时长 | 25～30 秒 |

（* 为新增资源 ID，缺失静默）

## 3. `map` 游园会地图 [改]

| 项 | 内容 |
| --- | --- |
| 进入 | gate；任何「返回地图」；关卡结算 |
| 退出 | 五栋建筑 → 对应场景（受守卫）；重置 → boot |
| 元素 | 固定主地图 + 6 图层；五栋建筑（名称牌、描述、状态角标）；印章托盘；Q 版；提示槽/广播 |
| 可点 | 建筑（悬停抬起 + 名称牌高亮；仅已盖章或当前站可进）；**Q 版麻衣（点击 = 进入当前站）** [V1.2]；重置；HUD |
| 顺序 [V1.2 现有] | `STRICT_ORDER = mint → food → exam → wish`；`currentStage` = 第一个未盖章；`recommendNext = currentStage ?? 'cake'`；锁定场馆点击 → 建筑轻晃 + toast「这里还没开放，先去「X」拿到印章～」 |
| 状态角标 | 已盖章：✔ 印章 + 窗户亮 + 「第 N 站 · 再玩一次」；当前站：建筑发光 + 「第 N 站 · 👉 当前站，点击进入」；未到：🔒 「先完成「X」」；蛋糕房：「还差 N 枚印章解锁」/「进入蛋糕房」 |
| 角色 | Q 版站在当前站门口 idle（气泡「点我也能进入当前站！」）；刚通关回地图时从上一站**走到**当前站（`cameFrom` 由 `lastStampSnapshot` 差分得出）；闲置 point；解锁心愿屋跑过去；汇聚 cheer |
| 自动事件 A | 心愿屋解锁（3 枚 & `wishUnlockSeen=false`）：建筑发光 1 秒 → Q 版跑过去 → 广播「心愿收藏屋现在开放。」→ 名称牌「现在可以进入」常显；写 `wishUnlockSeen=true`；不自动进入 |
| 自动事件 B | 印章汇聚（4 枚 & `convergenceSeen=false`）：天色滤镜到夜 → 灯笼全亮 → 四印章弧线飞向蛋糕房门槽（各 `sfx_stamp`）→ 两朵烟花（`sfx_firework`*）→ 两句广播 → 蛋糕房按钮亮 + 弹跳；点击任意处跳过；写 `convergenceSeen=true`；跳过亦解锁 |
| 音效 | 建筑 `sfx_click`；锁定建筑 `sfx_wrong`（温和） |
| 语音 | 汇聚烟花「诶？」 |
| BGM | `bgm_park`；汇聚时淡出 1 秒后静到蛋糕房 |
| 提示 | 目标句「按顺序逛：先去 Q 版麻衣站着的那一站。」；闲置「下一站在这里哦！」+ 当前站建筑脉冲 |
| 时长 | 首访 15 秒；经过 5～10 秒；解锁动画 4 秒；汇聚 8 秒 |

## 4. `mint` 薄荷糖补给站 [改]

| 项 | 内容 |
| --- | --- |
| 进入 | map |
| 退出 | 结算「领取印章 / 返回地图」→ map；「跳过并领取印章」→ map |
| 状态 | intro → playing ⇄ paused → result [现有] |
| 参数 | 见 `GAME_DESIGN.md` §六（600ms / 6 枚 / 70-15-15 / −5） |
| 元素 | 顶栏（倒计时、得分、连击、暂停）；台面；Q 版右下；事件横幅 |
| 可点 | 糖果 pointerdown [现有]；暂停；面板按钮 |
| 随机事件 | 每局 2 个，自动出现：糖果雨 / 巨型薄荷糖 / 风油精刺客 / 薄荷风 |
| 角色 | intro 立绘常态；playing Q 版 idle/happy/surprise；result ≥350 立绘开心 |
| 音效 | `sfx_pop`（节流 80ms）`sfx_bonus` `sfx_miss` `sfx_combo` [现有 ID]；`sfx_event`* `sfx_whistle`* |
| 语音 | 开始！/ 首次 10 连击 哇 |
| BGM | `bgm_park` |
| 视觉 | 飘分、连击大字、最后 5 秒倒计时红 [现有]；金色粒子、「时间到！」[新增] |
| 提示 | 目标句「看到糖就点，20 秒后自动结算。」；intro 闲置 → 开始按钮脉冲 |
| 时长 | 45 秒 |

## 5. `food` 美食幻想屋 [改]

| 项 | 内容 |
| --- | --- |
| 进入 | map |
| 退出 | 大厅「完成美食之旅」→ 结算 → map；「跳过并领取印章」 |
| 子状态 | hub / hotpot / fruit / hidden / **hiddenPrompt** [V1.1 现有] / gallery [现有]；零食架并入 hub 侧栏 [可选，待开发] |
| hub 元素 | 四张站台卡（火锅 / 水果捞 / **神秘料理台（常驻）** / 图鉴）；糖罐按钮 + **跳动气泡「咦？柜台上好像有个糖罐……」**（`collectibles.bohetang` 为 true 后隐藏）[V1.2]；进度「火锅 ✔ · 水果捞 …」；完成按钮；Q 版 point 未完成站台 |
| 神秘料理台卡 | 未解锁：❓ 虚线边 + 「尚未解锁。听说线索在水果捞的配料里……」→ 点击进入 hiddenPrompt；已解锁：🎃 + 「已解锁！」→ 点击进入 hidden；做完角标「已制作」。状态源 `hiddenDishUnlocked` / `hiddenDishFound` [V1.1 现有] |
| hiddenPrompt | 面板「神秘料理尚未解锁！/ 听说水果捞里混进了一个奇怪的配料，要不要去看看？」；「去水果捞看看」→ fruit；「先回大厅」→ hub [V1.1 现有] |
| hotpot | 食材 4 选 [现有]；计数「已选食材 n / 4」；开锅 → 评级；**端上桌 → 停留在火锅台，显示「店长点评」吐槽框（`hotpotQuips(ids)` 1~2 句）→ 「回大厅」** [V1.2]；糖饼入图鉴；写 `records.hotpotName`。汤底 3 选 1 / 开锅演出三档 / 命名 [可选，待开发] |
| fruit | 一屏（水果 3 / 底料 1 / 配料 1）；全满 → 开做亮；**端上桌 → 停留显示「店长点评」（`fruitQuips(fruits, base, topping)`）→ 「回大厅」** [V1.2]；云片糕入图鉴；写 `records.fruitName`。**配料「蛋黄沙司（？）」**：问号角标 + 金色呼吸高亮；点击 → `sfx_unlock` + 右侧线索卡（两句 + 「去神秘料理台」）+ 首次写 `hiddenDishUnlocked=true` + toast；**不必做完水果捞** [V1.1 现有]。装饰列 [可选，待开发] |
| hidden [现有] | `HiddenDishGame`：步骤 0 **划动切窝瓜**（3 条引导线，线段穿过才计数，点按无效，块沿切缝拉开）→ 步骤 1 **碗内搅拌**（轨迹长度换算成逻辑像素，碗沿外放宽，点按无效，颜色橙→金）→ 步骤 2 **点一次「出炉」**（指针 0→100→0 / 2.2 秒，区间 [15,35,65,85]，任何火候成功）→ 步骤 3 金黄成品 + Q 版气泡。判定用 `getBoundingClientRect` 百分比，缩放后仍对准。按钮只有完成后的「再做一次」「端上桌」；防卡关用外壳「跳过这关」。未解锁入口不变；全程约 20～30 秒 |
| 图鉴 | 已收集彩色；未收集灰 + 一句获取方式；糖罐一次点击得薄荷糖；名称「蛋黄焗窝瓜」[现有] |
| 角色 | hub point；hotpot happy / peek；fruit nod；intro 立绘惊讶 |
| 音效 | `sfx_steam` `sfx_unlock` `sfx_sparkle` `sfx_success` [现有]；`sfx_lid`* |
| 语音 | 开锅 好香… / 出炉 哇！ |
| BGM | `bgm_park` |
| 提示 | 目标句见 `STORY_SCRIPT.md` §15；闲置 → 未完成站台 / 未满列脉冲 |
| 时长 | 2 分（+40 秒） |

## 6. `exam` 本人认证考试 [V1.2 现有]

| 项 | 内容 |
| --- | --- |
| 进入 | map（守卫：food 已盖章或自身已盖章） |
| 退出 | 交卷 → 结算 → map；跳过并领取印章 |
| 元素 | 答题卡（题号 + 类型标签、题干、4 选项 `aria-pressed`、弹幕提示（仅事实题）、**上一题 / 下一题 / 交卷**）；HUD：第 n/6 题 + 六个进度点（已答亮起）· ⏱ 弹幕倒计时开关（默认关，持久化 `settings.danmuTimer`）；右侧弹幕区 + 反馈框 + Q 版 |
| 题目 | V1.2 题组 6 题（3 事实 + 2 娱乐 + 1 荒谬），见 `DESIGN_DECISIONS.md` §11；`EXAM_SET_VERSION = 3` |
| 状态 | `answers[]`（每题当前选择）、`byTimer`、`overloaded`、`hintShown`、`changes`（改选次数）；`evaluate(q, pick)` 生成反馈，`countFact(answers)` 计分 |
| 事实题流程 | 点选项 → 不锁定；答对：✅ + 依据；答错：抖动 + 「❌ 不对哦。正确答案是：X」+ 该选项专属吐槽（正确项高亮绿、错选红）；再点其它选项 = 改选，反馈即时更新，`changes+1` |
| 娱乐 / 弹幕题 | 点选项 → 该选项反馈（娱乐题尾注「弹幕印象，未经本人认证」）；可改选；不计分 |
| 荒谬判定题 | 首次点选 → 「⚠ 判定器过载中……」覆盖层 1.3 秒（每题仅一次）→ 该选项专属「判定正确」反馈；改选不重播 |
| 导航 | 「上一题」任何时候可回看；「下一题」需本题已答（否则 toast「这题还没选哦」）；最后一题按钮变「交卷」 |
| 倒计时 | 开启时每题 20 秒（≤5 秒红色闪烁），归零 → 事实题自动按错处理并揭晓；其它题随机代选；关闭时无 |
| 结算 | 交卷时按事实题**最终选择**计分 `finalFact` 0~3、评语 0～3 四档、改选次数、历史最佳（仅同题组）；`recordExam(n)`：不同题组覆盖、同题组取 max，写 `examBestCorrect` + `examSet=3` |
| 角色 | 立绘思考/开心/惊讶 [现有]；Q 版 nod / surprise / 躲黑板 |
| 音效 | `sfx_correct` `sfx_wrong` `sfx_success` [现有] |
| 语音 | 答错 诶？/ 交卷 通过！ |
| BGM | `bgm_park`；交卷后音量降至 50% 持续到心愿屋 |
| 提示 | 目标句「选一个答案就行，答错也可以回上一题改。」；闲置 → 选项脉冲 |
| 时长 | 1 分 40 秒（开倒计时最多 +90 秒） |

## 7. `wish` 心愿收藏屋 [V1.2 现有]

| 项 | 内容 |
| --- | --- |
| 进入 | map（守卫：exam 已盖章或自身已盖章） |
| 退出 | 封存心愿 → 结算 → map（触发汇聚）；跳过这关（`selectedWishIds` 保持 `[]`、不写任何心愿 → 票根「还没来得及选」） |
| 元素 | 樱花树 `wish-tree`（树干 + 4 簇 + 投放提示）；四固定卡 2×2（可拖拽，`data-hung`）；第五张整宽「✍️ 麻衣专属许愿卡」（四张挂满后才渲染，`wish-custom--new` 脉冲）；状态「已点亮 n/4」；小挂牌；浮层 `custom / choose / expand / code / glitch / signal`；封存按钮 |
| 拖拽 | 自定义指针拖拽（`pointerdown` 捕获 → `pointermove` 位移 ÷ `stageScale()` → `pointerup`）；拖动中 `.wish-card--dragging`（放大 + 发光）、树冠 `.sakura-stage--over` + 「放到这里！」；`isOverTree` = 指针在树 `getBoundingClientRect` ± 40px 内 → `hang(i)`：卡片回位 + `.wish-flight` 光点 650ms 飞入树冠 → `commitHang`（簇亮、toast、`sfx_sparkle`）；不在树上 → 回弹原位。**备用**：点卡片 → `armed`（`.wish-card--armed` + 提示「已选中「X」，点一下樱花树挂上去」）→ 点树 → `hang` |
| 流程 | 挂 4 张（任意顺序）→ 满树花开 → 第五张卡出现（toast「✍️ 第五张卡出现了！」）→ 点开填写 → **「保存心愿」** → 700ms 后自动弹出选择浮层（`setDraftSel` + `setOverlay('choose')`）→ 单选一张 / 跳过选择 → 「封存心愿」亮起（可「重新选择」）→ 结算。未保存就点「选最想收下的心愿」→ toast「先填写并保存麻衣专属许愿卡，再来选择～」并打开许愿卡 |
| 许愿卡编辑 | textarea（`lang=zh-CN`，`compositionstart/end` 期间不截断；结束后按码点截断 80）；字数 n / 80；复选框「在闭园票根上显示」；保存 → `setRecords({customWish, customWishPublic})` + toast；清空 → `customWish=null` 并从 `selectedWishIds` 移除 `'custom'`；先不写 / 收起 → 丢弃草稿 |
| 选择浮层 | 单选：权限标签「当前权限：最多选择 1 个心愿」，点卡替换选中；跳过 → `selectedWishIds=[]`、`mainWishBySystem=true`。多选（`multiWishUnlocked`）：标签「✨ 不限数量（小鬼特批）」，点卡切换（`.wish-pick--on` 金边 + 勾 + 发光），「全部都要！」`selectAll`，「确认我的心愿」`confirmSel`（≥1，否则 toast）→ `setRecords({selectedWishIds, mainWishBySystem:false})`；保留之前单选项；不重播挂树动画 |
| 小鬼扩容 | 单选浮层底部 teaser + 「呼叫小鬼，申请扩容！」→ `expand` 对话框（4 句）→ 「输入小鬼给的密码」→ `code` 输入框（trim + 全角归一化，`verifyWishExpandCode`）→ 错误：行内「权限申请未通过！可以再问问小鬼。」（不锁、不限次）；正确：`glitch` 故障浮层 5 行逐行 → `patch({multiWishUnlocked:true})` → 回 `choose` 保留 `draftSel`。「算啦，我就选一个」→ 回 `choose` |
| 小挂牌 | 任意时刻可点；浮层「直播永不卡顿，弹幕永远热闹。」；`signalCardSeen=true`；不计入 4/4 [现有] |
| 存档 | `records.selectedWishIds: WishCardId[]`、`mainWishBySystem`（跳过 = true）、`customWish`、`customWishPublic`、`multiWishUnlocked`（根级） |
| 结算 | 列出五张卡 + （若有）许愿卡正文（`user-text`）+ 「今年最想收下的心愿」/「今年想收下的心愿们」/「全部都要！五份心愿已打包」/「五张心愿全部收下（未指定）」；封存飞入演出 [可选，待开发] |
| 角色 | 立绘常态 → 满树开心；Q 版 pray / 抬头 |
| 音效 | `sfx_flip` `sfx_sparkle` `sfx_stamp` [现有]；`sfx_chime`* |
| 语音 | 满树花开 ……好漂亮。 |
| BGM | 进入淡出 `bgm_park` → `bgm_wish_clean`*；第 3 张叠 `bgm_wish_full`*；第 4 张加风铃 |
| 提示 | 目标句「把心愿卡拖到樱花树上（拖不动就先点卡片，再点树）。」；树下常显「拖不动？先点卡片，再点树」；闲置 → 未挂卡脉冲；选择阶段闲置 → 「跳过选择」脉冲 |
| 时长 | 1 分 20 秒（+30 秒扩容对话） |

## 8. `cake` 生日蛋糕房

| 项 | 内容 |
| --- | --- |
| 进入 | map「进入蛋糕房」（守卫 4 枚印章） |
| 退出 | 五根全亮后「去吹蜡烛」→ candle |
| 元素 | 蛋糕 + 五根蜡烛。从左到右：薄荷绿 `mint`、暖橙 `food`、正中金色 `mayi`、紫蓝 `exam`、樱花粉 `wish`。蜡身 36×120 |
| 可点 | 每根未点亮的蜡烛；「点亮蛋糕」一次点亮五根；全亮后「去吹蜡烛」 |
| 结果 | 点一根写 `candles[id]=true`。金色点亮时播放金色光效。五根全亮 → `cakeLit=true` |
| 再进 | 按蜡烛 ID 恢复，不按数组位置 |
| 音效 | 每根 `sfx_candle`；金色额外 `sfx_sparkle` |

## 9. `candle` 吹蜡烛

| 项 | 内容 |
| --- | --- |
| 进入 | `cakeLit=true` |
| 退出 | 「领取音乐礼物」→ music。音乐与祝福流程不变 |
| 操作 | 点击「呼——吹蜡烛」。每次最多 2 根：先 `mint`+`wish`，再 `food`+`exam`，最后 `mayi` |
| 结果 | 金色熄灭时显示「最后一个愿望，已经替你送往未来啦！」，Q 版 cheer，并写 `candlesBlown=true` |
| 再进 | `blownCandles` 恢复已灭的火苗。已经吹完的旧存档直接进入音乐 |
| 时长 | 25 秒 |

## 10. `music` 音乐礼物 [改]

| 项 | 内容 |
| --- | --- |
| 进入 | candle |
| 退出 | 前往最终祝福 → final；写 `musicDone=true` |
| 元素 | 唱片机；控制条（播放 / 暂停 / 继续 / 可拖进度 / 页面音量 / 跳过）；立绘开心 |
| 结果 | 播放 → 唱片旋转、BGM 淡出；结束 → 「歌送到了。」+ 前往按钮；跳过 → 前往；缺失 → 直接显示前往 + 小字 |
| 音效 | `sfx_needle`* |
| 语音 | 无 |
| 提示 | 目标句「想听就点播放，不想听可以跳过。」 |
| 时长 | 15 秒 + 歌 |

## 11. `final` 生日特别演出（生日愿望审批系统 × 话剧分幕）[V1.1 现有]

| 项 | 内容 |
| --- | --- |
| 进入 | music；地图蛋糕房在 `musicDone && !finalSeen && !ticketSeen` 时直达；票根「重看生日演出」；进入写 `finalSeen=true` |
| 退出 | 落幕「查看闭园票根」→ ticket |
| 数据 | `TEXTS.final.acts`（7 幕，kind = loading / approve / predict / curtain / end），`stepsOf(act)` 决定每幕步数 |
| 推进 | 文字层整屏可点 = 「下一步 ▶」；幕内最后一步按钮变「下一幕 ▶」；loading / predict 的自动步骤（1.6 s / 1.5 s）期间按钮禁用；「跳过演出 ≫」→ 直达落幕 |
| 幕布 | 第一幕加载中与落幕时合拢，其余打开（开 1.1 s / 落幕 2.2 s）；落幕时文字层置于幕布之上 |
| 聚光灯 | loading：off；approve / predict：soft；curtain / end：focus（放大 1.1，角色 scale 1.04） |
| 角色 | approve / curtain / end：happy；predict 失败后：surprise；其余 normal；加载时隐藏 |
| 图层 DOM | `.theater__layer--bg / --stage / --char / --light / --text / --curtain / --ui`（可独立替换美术） |
| 音效 | 加载完成 `sfx_unlock`；盖章 `sfx_stamp`；预测失败 `sfx_wrong`；「生日快乐，麻衣。」`sfx_success`；推进 `sfx_click` |
| BGM | `bgm_cake` |
| 提示 | 目标句「点击推进每一幕，想快一点可以跳过。」；闲置 → 「下一步」按钮脉冲 |
| 时长 | 完整点击 ≈ 60 秒；跳过 ≈ 5 秒 |

## 12. `ticket` 闭园纪念票根 [V1.1 现有]

| 项 | 内容 |
| --- | --- |
| 进入 | final 落幕；地图蛋糕房在 `ticketSeen || finalSeen` 时直达；进入写 `ticketSeen=true` + `sfx_stamp` |
| 退出 | 返回地图 → map；重看生日演出 → final；重新体验一遍（`confirm` → `resetProgress`）；🦊 入口 → egg（`eggFound` 后不再显示） |
| 元素 | 票根卡（滑入 + 微倾斜；票头 / 四星印章 / 两列数据行 / 底部句 / 撕线 / 按钮区）；右侧立绘 happy |
| 数据 | 按 `DESIGN_DECISIONS.md` §4 映射：心愿行按 `selectedWishIds.length` 三态（1 → 「今年最想收下的心愿」；2~4 → 「今年想收下的心愿们」卡名顿号连接；5 → 「全部都要！五份心愿已打包 🎁」；自定义只显示「✍️ 麻衣专属心愿」）[V1.2]；自定义心愿行仅 `customWish` 非空时出现，`customWishPublic=false` 显示「（仅本地保存，未公开）」；考试行「事实题 n / 3」按 `examSet===3` 区分；无 undefined/null/NaN |
| 音效 | `sfx_stamp` |
| BGM | `bgm_cake` |
| 提示 | 目标句「票根已为你保存，随时可以返回地图。」 |
| 时长 | 20 秒 |

## 13. `egg` 后台控制室 [改]

| 项 | 内容 |
| --- | --- |
| 进入 | ticket 入口 |
| 退出 | 悄悄离开 → ticket；写 `eggFound=true` |
| 元素 | 3 行 + 引言 [现有]；可选 3 设备 |
| [删] | 地图标题 7 连点入口 |
| 音效 | `sfx_overload`* |
| BGM | 停止或环境电流声 |
| 时长 | 20 秒 |

---

## 14. 资源 ID 规划

| ID | 状态 | 用途 |
| --- | --- | --- |
| `bgm_park` `bgm_cake` `music_hongdou` | [现有] | — |
| `bgm_wish_clean` `bgm_wish_full` | [新增] | 心愿屋两层 |
| 现有 SFX 16 个 | [现有] | — |
| `sfx_scan sfx_gate sfx_event sfx_whistle sfx_lid sfx_overload sfx_chime sfx_firework sfx_party sfx_needle sfx_page sfx_print` | [新增] | 见各场景 |
| 地图图层：`bg_map`（基准）+ `layer_map_sky` `layer_map_lanterns` `layer_map_stars` `layer_map_windows` `layer_map_fireworks` | [新增] | 分层环境 |
| Q 版：`chibi_idle/point/happy/surprise/peek/pray/cheer/nod` | [新增] | 8 动作 |
| `bg_gate` 复用 [现有]；`bg_ticket` | [新增] | — |

全部注册后缺失静默，占位沿用现有机制。

## 15. 时长总表

| 段落 | 正常 | 全跳过 |
| --- | --- | --- |
| boot + gate | 0:35 | 0:15 |
| map 首访 | 0:15 | 0:05 |
| mint | 0:45 | 0:10 |
| food（+神秘料理 + 吐槽） | 2:00（2:40） | 0:10 |
| exam（6 题） | 1:40 | 0:10 |
| wish（拖拽 + 许愿卡 + 选择；+扩容） | 1:20（1:50） | 0:10 |
| 汇聚 + cake + candle | 1:10 | 0:25 |
| music | 0:15 + 歌 | 0:05 |
| final + ticket | 0:45 | 0:15 |
| **合计** | **≈ 8:45（9:55）** | **≈ 1:45** |

玩家最长连续操作段：薄荷糖 20 秒；最长自动演出：印章汇聚 8 秒（可跳过）。
