import { AnimatePresence, motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { MinigameShell } from '../components/minigame/MinigameShell';
import { Button } from '../components/ui/Button';
import { ChibiMayi } from '../components/ui/ChibiMayi';
import { PlaceholderCharacter } from '../components/ui/PlaceholderCharacter';
import { SceneLayout } from '../components/ui/SceneLayout';
import { verifyWishExpandCode } from '../config/secrets';
import { ASSETS, assetUrl } from '../config/assets';
import { isDebugUiEnabled } from '../config/debugUi';
import { TEXTS } from '../config/texts';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useGame } from '../core/GameContext';
import { CUSTOM_WISH_MAX, WISH_CARD_TOTAL, sanitizeUserText, type WishCardId } from '../core/progress';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useMinigamePhase } from '../hooks/useMinigamePhase';

/**
 * 四簇花冠：中心点相对树框的比例 + 显示尺寸（对应四根主枝）
 */
const CLUSTERS = [
  { x: 0.2, y: 0.34, rotate: -12, w: 168, h: 132 },
  { x: 0.46, y: 0.1, rotate: -3, w: 178, h: 142 },
  { x: 0.72, y: 0.22, rotate: 10, w: 162, h: 128 },
  { x: 0.84, y: 0.46, rotate: 14, w: 156, h: 124 },
];

/** 树枝角度 */
const BRANCHES = [-48, -18, 16, 46];

/** 光点飞向树冠的时长 */
const FLIGHT_MS = 650;
/** 保存许愿卡后多久弹出选择 */
const CHOOSE_DELAY_MS = 700;
/** 故障动画每行间隔 */
const GLITCH_STEP_MS = 520;

type Overlay = 'none' | 'custom' | 'choose' | 'expand' | 'code' | 'glitch' | 'signal';

/**
 * 飘落花瓣
 */
function Petals({ count }: { count: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 53) % 100,
        delay: (i * 0.37) % 3,
        duration: 4 + ((i * 0.7) % 3),
        drift: ((i % 5) - 2) * 40,
      })),
    [count],
  );
  return (
    <>
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="petal"
          style={{ left: `${p.left}%`, top: -20 }}
          animate={{ y: [0, 720], x: [0, p.drift, -p.drift / 2, p.drift], rotate: [0, 180, 360], opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </>
  );
}

/** 按 Unicode 码点计数（中文 / emoji 都算 1 个字） */
const countChars = (s: string) => Array.from(s).length;

/** 读取舞台缩放比例（屏幕像素 / 逻辑像素） */
function stageScale(): number {
  const el = document.querySelector<HTMLElement>('.stage');
  if (!el || el.offsetWidth === 0) return 1;
  return el.getBoundingClientRect().width / el.offsetWidth || 1;
}

/**
 * 第四关：心愿收藏屋（V1.2）
 * - 四张固定心愿卡拖到樱花树上（或点卡片再点树），光点飞入树冠点亮一簇花
 * - 四张挂好后出现「麻衣专属许愿卡」，填写并保存后才进入心愿选择
 * - 默认单选；向小鬼申请扩容并输入口令后可多选 / 全部都要
 * - 全局「跳过」直接通关，不伪造任何已填写内容
 */
export function WishScene() {
  const t = TEXTS.wish;
  const { progress, setRecords, patch, showToast } = useGame();
  const multi = progress.multiWishUnlocked;

  const [hung, setHung] = useState<boolean[]>(() => t.cards.map(() => false));
  /** 是否已翻到正面（挂树后视为保持正面） */
  const [revealed, setRevealed] = useState<boolean[]>(() => t.cards.map(() => false));
  const [sparkleAt, setSparkleAt] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>('none');
  /** 本局是否已完成心愿选择 / 跳过 */
  const [chosen, setChosen] = useState(false);
  /** 本局是否已经“出现过”第五张卡（用于入场动画） */
  const chooseTimer = useRef<number | null>(null);

  // ---------- 拖拽 ----------
  const viewRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const treeFrameRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<{ i: number; startX: number; startY: number; moved: boolean; flipOnly: boolean } | null>(null);
  const [dragPos, setDragPos] = useState<{ i: number; dx: number; dy: number } | null>(null);
  const [overTree, setOverTree] = useState(false);
  /** 备用操作：先点卡片（选中），再点树 */
  const [armed, setArmed] = useState<number | null>(null);
  /** 飞向树冠的光点 */
  const [flight, setFlight] = useState<{ i: number; from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);

  // ---------- 自定义许愿卡 ----------
  const savedWish = progress.records.customWish;
  const [draft, setDraft] = useState(savedWish ?? '');
  const [draftPublic, setDraftPublic] = useState(progress.records.customWishPublic);
  const composing = useRef(false);

  // ---------- 心愿选择 ----------
  const selected = progress.records.selectedWishIds;
  const [draftSel, setDraftSel] = useState<WishCardId[]>(selected);
  const [code, setCode] = useState('');
  const [codeWrong, setCodeWrong] = useState(0);
  const [glitchStep, setGlitchStep] = useState(0);

  const resetWish = useCallback(() => {
    setHung(t.cards.map(() => false));
    setRevealed(t.cards.map(() => false));
    setSparkleAt(null);
    setOverlay('none');
    setChosen(false);
    setArmed(null);
    setDragPos(null);
    setFlight(null);
    setOverTree(false);
    dragRef.current = null;
    if (chooseTimer.current) window.clearTimeout(chooseTimer.current);
  }, [t.cards]);

  const game = useMinigamePhase('wish', resetWish);
  /** 正面 / 背面卡框；文件缺失时继续用 CSS 占位 */
  const cardArtReady = useAssetImageReady('item_wish_card');
  const cardBackArtReady = useAssetImageReady('img_wish_card_back');
  const treeArtReady = useAssetImageReady('img_sakura_tree');
  const clusterDimReady = useAssetImageReady('item_sakura_cluster');
  const clusterLitReady = useAssetImageReady('item_sakura_cluster_lit');
  const clusterArtReady = clusterDimReady && clusterLitReady;
  const litCount = hung.filter(Boolean).length;
  const fullBloom = litCount === t.cards.length;
  const interactive = game.phase === 'playing' && overlay === 'none' && flight === null;

  /** 判断屏幕坐标是否落在樱花树投放区（外扩 40px） */
  const isOverTree = (x: number, y: number) => {
    const r = treeRef.current?.getBoundingClientRect();
    if (!r) return false;
    const pad = 40 * stageScale();
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  };

  const isFaceFront = (i: number) => revealed[i] || hung[i];

  const revealCard = (i: number) => {
    if (isFaceFront(i) || hung[i] || !interactive) return;
    setRevealed((arr) => (arr[i] ? arr : arr.map((v, idx) => (idx === i ? true : v))));
    audio.playSfx('sfx_flip');
    setArmed(null);
    setDragPos(null);
  };

  /** 把卡片挂上树：光点从卡片飞到对应花簇，然后点亮 */
  const hang = (i: number) => {
    if (hung[i] || flight || !isFaceFront(i)) return;
    const s = stageScale();
    const view = viewRef.current?.getBoundingClientRect();
    const frame = treeFrameRef.current?.getBoundingClientRect();
    const card = cardRefs.current[i]?.getBoundingClientRect();
    if (!view || !frame || !card) {
      commitHang(i);
      return;
    }
    const from = { x: (card.left + card.width / 2 - view.left) / s, y: (card.top + card.height / 2 - view.top) / s };
    const c = CLUSTERS[i];
    const fw = frame.width / s;
    const fh = frame.height / s;
    const fx = (frame.left - view.left) / s;
    const fy = (frame.top - view.top) / s;
    const to = { x: fx + c.x * fw, y: fy + c.y * fh };
    audio.playSfx('sfx_flip');
    setArmed(null);
    setDragPos(null);
    setFlight({ i, from, to });
    window.setTimeout(() => {
      setFlight(null);
      commitHang(i);
    }, FLIGHT_MS);
  };

  const commitHang = (i: number) => {
    if (!hung[i] && hung.filter(Boolean).length === 3) playCharacterVoice('wish_bloom');
    setHung((arr) => (arr[i] ? arr : arr.map((v, idx) => (idx === i ? true : v))));
    setRevealed((arr) => (arr[i] ? arr : arr.map((v, idx) => (idx === i ? true : v))));
    setSparkleAt(i);
    audio.playSfx('sfx_sparkle');
    showToast(t.drag.hung(t.cards[i].title), 1600);
    window.setTimeout(() => setSparkleAt((s) => (s === i ? null : s)), 1200);
  };

  const onCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>, i: number) => {
    if (hung[i] || !interactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { i, startX: e.clientX, startY: e.clientY, moved: false, flipOnly: !isFaceFront(i) };
  };
  const onCardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.flipOnly) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    const s = stageScale();
    setDragPos({ i: d.i, dx: dx / s, dy: dy / s });
    setOverTree(isOverTree(e.clientX, e.clientY));
  };
  const onCardPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    setOverTree(false);
    if (!d.moved) {
      if (d.flipOnly) {
        revealCard(d.i);
        return;
      }
      if (!isFaceFront(d.i)) return;
      audio.playSfx('sfx_click');
      setArmed((a) => (a === d.i ? null : d.i));
      setDragPos(null);
      return;
    }
    if (!isFaceFront(d.i)) {
      setDragPos(null);
      return;
    }
    if (isOverTree(e.clientX, e.clientY)) hang(d.i);
    else setDragPos(null); // 回弹
  };

  /** 点树：挂上已选中的卡片 */
  const onTreeClick = () => {
    if (armed === null || !interactive || !isFaceFront(armed) || hung[armed]) return;
    hang(armed);
  };

  // 满树花开：提示音
  useEffect(() => {
    if (!fullBloom || game.phase !== 'playing') return;
    audio.playSfx('sfx_success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullBloom]);

  useEffect(
    () => () => {
      if (chooseTimer.current) window.clearTimeout(chooseTimer.current);
    },
    [],
  );

  // ---------- 自定义许愿卡 ----------
  const openCustom = () => {
    if (game.phase !== 'playing') return;
    audio.playSfx('sfx_click');
    setDraft(savedWish ?? '');
    setDraftPublic(progress.records.customWishPublic);
    setOverlay('custom');
  };

  /** 限制长度：IME 组合输入期间不截断，组合结束后再按码点截断，避免打断中文输入法 */
  const clampDraft = (v: string) => {
    const pts = Array.from(v);
    return pts.length > CUSTOM_WISH_MAX ? pts.slice(0, CUSTOM_WISH_MAX).join('') : v;
  };
  const onDraftChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setDraft(composing.current ? v : clampDraft(v));
  };
  const onCompositionStart = () => {
    composing.current = true;
  };
  const onCompositionEnd = (e: CompositionEvent<HTMLTextAreaElement>) => {
    composing.current = false;
    setDraft(clampDraft((e.target as HTMLTextAreaElement).value));
  };

  const saveCustom = () => {
    const clean = sanitizeUserText(draft);
    audio.playSfx(clean ? 'sfx_sparkle' : 'sfx_click');
    const nextSel = clean === null ? selected.filter((id) => id !== 'custom') : selected;
    setRecords({ customWish: clean, customWishPublic: clean !== null && draftPublic, selectedWishIds: nextSel });
    setDraft(clean ?? '');
    showToast(clean ? t.custom.saved : t.custom.cleared, 2200);
    setOverlay('none');
    // 正常流程：保存了有效内容且尚未选择 ⇒ 稍后弹出选择（不经过 openChoose 的闭包校验，避免读到旧的 savedWish）
    if (clean && fullBloom && !chosen) {
      chooseTimer.current = window.setTimeout(() => {
        setDraftSel(nextSel);
        setOverlay('choose');
      }, CHOOSE_DELAY_MS);
    }
  };
  const clearCustom = () => {
    audio.playSfx('sfx_click');
    setDraft('');
    setDraftPublic(false);
    setRecords({ customWish: null, customWishPublic: false, selectedWishIds: selected.filter((id) => id !== 'custom') });
    showToast(t.custom.cleared, 1800);
  };
  const closeCustom = () => {
    audio.playSfx('sfx_click');
    setDraft(savedWish ?? '');
    setOverlay('none');
  };

  // ---------- 心愿选择 ----------
  const openChoose = () => {
    if (!savedWish) {
      showToast(t.custom.needSave, 2400);
      openCustom();
      return;
    }
    setDraftSel(progress.records.selectedWishIds);
    setOverlay('choose');
  };

  const toggleSel = (id: WishCardId) => {
    if (id === 'custom' && !savedWish) return;
    audio.playSfx('sfx_click');
    setDraftSel((cur) => {
      if (multi) return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return cur.includes(id) ? [] : [id];
    });
  };
  const selectAll = () => {
    audio.playSfx('sfx_sparkle');
    setDraftSel(['fortune', 'love', 'stage', 'ease', ...(savedWish ? (['custom'] as WishCardId[]) : [])]);
  };
  const confirmSel = () => {
    if (draftSel.length === 0) {
      showToast(t.choose.needOne, 1800);
      return;
    }
    audio.playSfx('sfx_sparkle');
    setRecords({ selectedWishIds: multi ? draftSel : draftSel.slice(0, 1), mainWishBySystem: false });
    setChosen(true);
    setOverlay('none');
  };
  const skipSel = () => {
    audio.playSfx('sfx_click');
    setRecords({ selectedWishIds: [], mainWishBySystem: true });
    setChosen(true);
    setOverlay('none');
  };

  // ---------- 向小鬼申请扩容 ----------
  const submitCode = () => {
    if (verifyWishExpandCode(code)) {
      audio.playSfx('sfx_wrong');
      setCode('');
      setGlitchStep(0);
      setOverlay('glitch');
      return;
    }
    audio.playSfx('sfx_wrong');
    setCodeWrong((n) => n + 1);
  };

  // 故障动画逐行播放 → 解锁多选 → 回到选择界面（保留此前选择）
  useEffect(() => {
    if (overlay !== 'glitch') return;
    const total = t.expand.glitch.length;
    if (glitchStep < total) {
      const id = window.setTimeout(() => {
        setGlitchStep((s) => s + 1);
        audio.playSfx(glitchStep >= total - 2 ? 'sfx_sparkle' : 'sfx_click');
      }, GLITCH_STEP_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      patch({ multiWishUnlocked: true });
      audio.playSfx('sfx_success');
      setOverlay('choose');
    }, 900);
    return () => window.clearTimeout(id);
  }, [overlay, glitchStep, patch, t.expand.glitch.length]);

  // ---------- 好信号挂牌 ----------
  const openSignal = () => {
    audio.playSfx('sfx_click');
    patch({ signalCardSeen: true });
    setOverlay('signal');
  };

  // ---------- 派生 ----------
  const nameOf = (id: WishCardId) => (id === 'custom' ? t.custom.title : (t.cards.find((c) => c.id === id)?.title ?? ''));
  const selectedNames = selected.map(nameOf);
  const statusText = (() => {
    if (!chosen) return savedWish ? t.fullBloom : t.custom.appear;
    if (selected.length === 0) return t.choose.skipped;
    if (selected.length >= WISH_CARD_TOTAL) return t.choose.pickedAll;
    if (selected.length === 1) return t.choose.picked(selectedNames[0]);
    return `${t.choose.pickedMulti(selected.length)}：${selectedNames.join('、')}`;
  })();
  const draftCount = countChars(draft);
  const canSeal = fullBloom && chosen;
  const dragging = dragPos !== null;

  return (
    <SceneLayout
      scene="wish"
      title={t.title}
      subtitle={t.subtitle}
      mood={null}
      compact
    >
      <MinigameShell
        phase={game.phase}
        title={t.title}
        desc={t.desc}
        rules={t.rules}
        introMood="normal"
        onStart={game.start}
        onPause={game.pause}
        onResume={game.resume}
        onRestart={game.restart}
        onSkip={game.skip}
        onFinish={game.finish}
        finishLabel="领取印章，返回地图"
        replayLabel="再许一次"
        hud={
          <>
            <span className="mg__hud-pill mg__hud-pill--accent">{t.lit(litCount)}</span>
            {multi && <span className="mg__hud-pill mg__hud-pill--gold">{t.expand.unlockedTag}</span>}
          </>
        }
        result={
          <>
            <p className="mg__result-title">{t.resultTitle}</p>
            <p style={{ margin: 0 }}>{t.resultLine}</p>
            <ul className="wish-result-list">
              {t.cards.map((c) => (
                <li key={c.id}>
                  {c.emoji} <strong>{c.title}</strong>：{c.text}
                </li>
              ))}
              {savedWish && (
                <li className="wish-result-list__custom">
                  {t.custom.emoji} <strong>{t.resultCustom}</strong>：<span className="user-text">{savedWish}</span>
                </li>
              )}
              <li data-testid="wish-result-main">
                🌸 <strong>{selected.length > 1 ? t.resultMainMulti : t.resultMain}</strong>：
                {selected.length === 0 ? t.choose.skipped : selected.length >= WISH_CARD_TOTAL ? t.choose.pickedAll : selectedNames.join('、')}
              </li>
            </ul>
          </>
        }
      >
        <div className={`wish-view ${dragging ? 'wish-view--dragging' : ''}`} ref={viewRef}>
          <div className="wish-bust" aria-hidden>
            <PlaceholderCharacter mood={litCount >= 4 ? 'happy' : armed !== null ? 'surprise' : 'normal'} />
          </div>
          <div className="wish-guide" aria-hidden>
            <ChibiMayi action="point" facing="right" scale={0.72} followVoice />
          </div>
          <div
            className={[
              'sakura-stage',
              overTree ? 'sakura-stage--over' : '',
              armed !== null ? 'sakura-stage--armed' : '',
              treeArtReady ? 'sakura-stage--has-tree-art' : '',
              clusterArtReady ? 'sakura-stage--has-cluster-art' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            ref={treeRef}
            data-testid="wish-tree"
            onClick={onTreeClick}
            role={armed !== null ? 'button' : undefined}
          >
            <div className="sakura-tree-stack" aria-hidden>
              <div className="sakura-tree-frame" ref={treeFrameRef}>
                {treeArtReady ? (
                  <img className="sakura-tree__art" src={assetUrl('img_sakura_tree')} alt="" draggable={false} />
                ) : (
                  <>
                    <div className="sakura-trunk sakura-trunk--in-frame" />
                    {BRANCHES.map((deg, i) => (
                      <div key={deg} className="sakura-branch sakura-branch--in-frame" style={{ transform: `translateX(-50%) rotate(${deg}deg)`, opacity: hung[i] ? 1 : 0.7 }} />
                    ))}
                  </>
                )}

                <div className="sakura-canopy">
                  {CLUSTERS.map((c, i) =>
                    clusterArtReady ? (
                      <motion.img
                        key={i}
                        className={`sakura-cluster__art ${hung[i] ? 'sakura-cluster__art--lit' : 'sakura-cluster__art--dim'}`}
                        src={hung[i] ? assetUrl('item_sakura_cluster_lit') : assetUrl('item_sakura_cluster')}
                        alt=""
                        draggable={false}
                        style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: c.w, height: c.h, rotate: c.rotate }}
                        animate={hung[i] ? { scale: [0.82, 1.22, 1] } : { scale: 1 }}
                        transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 14 }}
                      />
                    ) : (
                      <motion.div
                        key={i}
                        className={`sakura-cluster ${hung[i] ? 'sakura-cluster--lit' : ''}`}
                        style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: c.w, height: c.h, rotate: c.rotate }}
                        animate={hung[i] ? { scale: [0.8, 1.25, 1], opacity: 1, filter: 'saturate(1)' } : { scale: 1, opacity: 0.18, filter: 'saturate(0.4)' }}
                        transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 14 }}
                      />
                    ),
                  )}
              <AnimatePresence>
                {sparkleAt !== null && (
                  <motion.div
                    key={sparkleAt}
                    style={{
                      position: 'absolute',
                      left: `${CLUSTERS[sparkleAt].x * 100}%`,
                      top: `${CLUSTERS[sparkleAt].y * 100}%`,
                      width: CLUSTERS[sparkleAt].w,
                      height: CLUSTERS[sparkleAt].h,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 72,
                      pointerEvents: 'none',
                      translate: '-50% -50%',
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1 }}
                  >
                    ✨
                  </motion.div>
                )}
              </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 投放提示 */}
            <AnimatePresence>
              {(dragging || armed !== null) && !fullBloom && (
                <motion.div key="drop" className="sakura-drop-hint" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  {overTree ? t.drag.dropHere : armed !== null && !dragging ? t.drag.armed(t.cards[armed].title) : t.drag.hint}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 满树花开：整体光晕 + 花瓣飘落 */}
            <AnimatePresence>
              {fullBloom && (
                <motion.div
                  key="glow"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 50% 35%, rgba(255,190,225,0.45) 0%, transparent 60%)',
                    pointerEvents: 'none',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                />
              )}
            </AnimatePresence>
            <Petals count={fullBloom ? 24 : litCount * 3} />
            <div className="sakura-ground" />
            {isDebugUiEnabled() && (
              <span className="placeholder-bg__label" style={{ left: 16, right: 'auto' }}>
                {treeArtReady ? ASSETS.img_sakura_tree.path : 'CSS 树干'}
                {clusterArtReady ? ` · ${ASSETS.item_sakura_cluster.path}` : ''}
              </span>
            )}
          </div>

          <div className="wish-cards">
            <div className="wish-cards__grid">
            {t.cards.map((c, i) => {
              const isDrag = dragPos?.i === i;
              const isHung = hung[i];
              const isFront = isFaceFront(i);
              return (
                <motion.div
                  key={c.id}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className={[
                    'wish-card',
                    'wish-card--v12',
                    isFront ? 'wish-card--revealed' : 'wish-card--sealed',
                    isHung ? 'wish-card--hung' : '',
                    armed === i ? 'wish-card--armed' : '',
                    isDrag ? 'wish-card--dragging' : '',
                    chosen && selected.includes(c.id) ? 'wish-card--main' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-testid={`wish-card-${c.id}`}
                  data-hung={isHung ? '1' : '0'}
                  data-face={isFront ? 'front' : 'back'}
                  animate={{ x: isDrag ? dragPos.dx : 0, y: isDrag ? dragPos.dy : 0, scale: isDrag ? 1.08 : 1 }}
                  transition={isDrag ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 24 }}
                  onPointerDown={(e) => onCardPointerDown(e, i)}
                  onPointerMove={onCardPointerMove}
                  onPointerUp={onCardPointerUp}
                  onPointerCancel={onCardPointerUp}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key !== 'Enter' && e.key !== ' ') || isHung || !interactive) return;
                    e.preventDefault();
                    if (!isFront) revealCard(i);
                    else setArmed((a) => (a === i ? null : i));
                  }}
                  aria-label={
                    isHung
                      ? `${c.title}：${c.text}（已挂上树）`
                      : isFront
                        ? `${c.title}：${c.text}`
                        : `${c.title}（未翻开，点击翻开祝福）`
                  }
                >
                  <div className={`wish-card__flip${isFront ? ' wish-card__flip--front' : ''}`}>
                    <div
                      className={[
                        'wish-card__face',
                        'wish-card__face--back',
                        cardBackArtReady ? 'wish-card__face--art' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {cardBackArtReady && (
                        <img className="wish-card__art wish-card__art--back" src={assetUrl('img_wish_card_back')} alt="" draggable={false} />
                      )}
                      {!cardBackArtReady && <span className="wish-card__back-mark" aria-hidden>🌸</span>}
                      {!isHung && <span className="wish-card__hint wish-card__hint--back">{t.flip.tapBack}</span>}
                    </div>
                    <div className={`wish-card__face wish-card__face--front${cardArtReady ? ' wish-card__face--art' : ''}`}>
                      {cardArtReady && <img className="wish-card__art wish-card__art--front" src={assetUrl('item_wish_card')} alt="" draggable={false} />}
                      <div className="wish-card__copy">
                        <span className="wish-card__title">
                          {c.emoji} {c.title}
                        </span>
                        <span className="wish-card__text">{c.text}</span>
                      </div>
                      <div className="wish-card__status">
                        {isHung ? (
                          <span className="wish-card__badge">🌸 已挂上树</span>
                        ) : (
                          <span className="wish-card__drag">{armed === i ? t.flip.armed : t.flip.dragFront}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>

          {/* 底栏：第五张专属卡和状态，不挤进竖卡格子 */}
          <div className="wish-dock">
            <AnimatePresence>
              {fullBloom && (
                <motion.button
                  key="custom"
                  type="button"
                  className={`wish-custom ${savedWish ? 'wish-custom--filled' : 'wish-custom--new'} ${chosen && selected.includes('custom') ? 'wish-card--main' : ''}`}
                  data-testid="wish-custom"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.5 }}
                  onClick={openCustom}
                >
                  <span className="wish-custom__title">
                    {t.custom.emoji} {t.custom.title}
                  </span>
                  <span className={`wish-custom__text ${savedWish ? 'user-text' : ''}`}>{savedWish ?? t.custom.empty}</span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="wish-status">
              {fullBloom ? (
                <div className="wish-status__row">
                  <span className="wish-status__main" data-testid="wish-main-status">
                    {statusText}
                  </span>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button variant="secondary" small onClick={openChoose} data-testid="wish-choose">
                      {chosen ? t.choose.change : t.choose.open}
                    </Button>
                    <Button variant="gold" disabled={!canSeal} onClick={game.finishToResult} data-hint-target="wish-seal" data-testid="wish-seal">
                      {t.seal}
                    </Button>
                  </div>
                </div>
              ) : (
                <span>
                  {t.lit(litCount)} · <small style={{ opacity: 0.8 }}>{t.drag.fallback}</small>
                </span>
              )}
              <button type="button" className="wish-signal-tag" data-testid="wish-signal" onClick={openSignal}>
                {t.signal.tag}
              </button>
            </div>
          </div>

          {/* 飞向树冠的光点 */}
          <AnimatePresence>
            {flight && (
              <motion.div
                key={`flight-${flight.i}`}
                className="wish-flight"
                initial={{ left: flight.from.x, top: flight.from.y, scale: 0.6, opacity: 0.9 }}
                animate={{ left: flight.to.x, top: flight.to.y, scale: [0.6, 1.3, 0.9], opacity: 1 }}
                exit={{ opacity: 0, scale: 1.8 }}
                transition={{ duration: FLIGHT_MS / 1000, ease: 'easeInOut' }}
              >
                {t.cards[flight.i].emoji}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 浮层：许愿卡编辑 / 心愿选择 / 扩容申请 / 口令输入 / 故障动画 / 好信号挂牌 */}
          <AnimatePresence>
            {overlay !== 'none' && (
              <motion.div key={overlay} className={`wish-overlay ${overlay === 'glitch' ? 'wish-overlay--glitch' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <motion.div className={`wish-overlay__panel ${overlay === 'choose' ? 'wish-overlay__panel--wide' : ''}`} initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                  {overlay === 'custom' && (
                    <>
                      <h3 className="wish-overlay__title">
                        {t.custom.emoji} {t.custom.title}
                      </h3>
                      <p className="wish-overlay__hint">{t.custom.hint}</p>
                      <textarea
                        className="wish-textarea"
                        data-testid="wish-textarea"
                        value={draft}
                        placeholder={t.custom.placeholder}
                        rows={4}
                        lang="zh-CN"
                        autoComplete="off"
                        spellCheck={false}
                        onChange={onDraftChange}
                        onCompositionStart={onCompositionStart}
                        onCompositionEnd={onCompositionEnd}
                        autoFocus
                      />
                      <div className="wish-overlay__meta">
                        <span className={draftCount >= CUSTOM_WISH_MAX ? 'wish-count wish-count--full' : 'wish-count'} data-testid="wish-count">
                          {t.custom.count(draftCount, CUSTOM_WISH_MAX)}
                        </span>
                        <label className="wish-public">
                          <input type="checkbox" checked={draftPublic} onChange={(e) => setDraftPublic(e.target.checked)} data-testid="wish-public" />
                          <span>{t.custom.publicLabel}</span>
                        </label>
                      </div>
                      <div className="wish-overlay__actions">
                        <Button variant="ghost" small onClick={closeCustom} data-testid="wish-custom-close">
                          {savedWish ? t.custom.close : t.custom.skip}
                        </Button>
                        <Button variant="secondary" small onClick={clearCustom} disabled={!draft && !savedWish}>
                          {t.custom.clear}
                        </Button>
                        <Button variant="gold" small onClick={saveCustom} data-testid="wish-save">
                          {t.custom.save}
                        </Button>
                      </div>
                    </>
                  )}

                  {overlay === 'choose' && (
                    <>
                      <h3 className="wish-overlay__title">{multi ? t.choose.titleMulti : t.choose.title}</h3>
                      <p className="wish-overlay__hint">
                        <span className={`wish-limit-tag ${multi ? 'wish-limit-tag--multi' : ''}`} data-testid="wish-limit">
                          {multi ? t.choose.limitTagMulti : t.choose.limitTag(1)}
                        </span>{' '}
                        {multi ? t.choose.subMulti : t.choose.sub}
                      </p>
                      <div className={`wish-choose-grid ${multi ? 'wish-choose-grid--multi' : ''}`}>
                        {t.cards.map((c) => {
                          const on = draftSel.includes(c.id);
                          return (
                            <button key={c.id} type="button" className={`option-btn wish-pick ${on ? 'wish-pick--on' : ''}`} data-testid={`choose-${c.id}`} aria-pressed={on} onClick={() => toggleSel(c.id)}>
                              {on && <span className="wish-pick__check">✔</span>}
                              {c.emoji} {c.title}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className={`option-btn wish-pick wish-choose-grid__custom ${draftSel.includes('custom') ? 'wish-pick--on' : ''}`}
                          data-testid="choose-custom"
                          aria-pressed={draftSel.includes('custom')}
                          disabled={!savedWish}
                          onClick={() => toggleSel('custom')}
                        >
                          {draftSel.includes('custom') && <span className="wish-pick__check">✔</span>}
                          {t.custom.emoji} {t.custom.title}
                          {!savedWish && <small>{t.choose.customDisabled}</small>}
                        </button>
                      </div>
                      <div className="wish-overlay__actions">
                        <Button variant="ghost" small onClick={skipSel} data-testid="choose-skip">
                          {t.choose.skip}
                        </Button>
                        {multi && (
                          <Button variant="secondary" small onClick={selectAll} data-testid="choose-all">
                            {t.choose.all}
                          </Button>
                        )}
                        <Button variant="gold" small onClick={confirmSel} data-testid="choose-confirm">
                          {t.choose.confirm}
                        </Button>
                      </div>
                      {!multi && (
                        <div className="wish-expand-teaser" data-testid="wish-expand-teaser">
                          <p>
                            {t.expand.teaser1}
                            <br />
                            {t.expand.teaser2}
                          </p>
                          <Button variant="ghost" small onClick={() => setOverlay('expand')} data-testid="wish-expand-call">
                            {t.expand.call}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {overlay === 'expand' && (
                    <>
                      <h3 className="wish-overlay__title">{t.expand.title}</h3>
                      <div className="wish-expand-lines" data-testid="wish-expand-dialog">
                        {t.expand.lines.map((l) => (
                          <p key={l}>{l}</p>
                        ))}
                      </div>
                      <div className="wish-overlay__actions">
                        <Button variant="ghost" small onClick={() => setOverlay('choose')} data-testid="wish-expand-later">
                          {t.expand.later}
                        </Button>
                        <Button variant="gold" small onClick={() => setOverlay('code')} data-testid="wish-expand-input">
                          {t.expand.input}
                        </Button>
                      </div>
                    </>
                  )}

                  {overlay === 'code' && (
                    <>
                      <h3 className="wish-overlay__title">{t.expand.input}</h3>
                      <motion.input
                        key={codeWrong}
                        className="wish-code"
                        data-testid="wish-code"
                        value={code}
                        placeholder={t.expand.placeholder}
                        autoComplete="off"
                        inputMode="text"
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitCode();
                        }}
                        animate={codeWrong > 0 ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        autoFocus
                      />
                      <p className="wish-overlay__hint wish-code-msg" data-testid="wish-code-msg">
                        {codeWrong > 0 ? t.expand.wrong : '\u00a0'}
                      </p>
                      <div className="wish-overlay__actions">
                        <Button variant="ghost" small onClick={() => setOverlay('expand')}>
                          ← 返回
                        </Button>
                        <Button variant="gold" small onClick={submitCode} data-testid="wish-code-submit">
                          {t.expand.submit}
                        </Button>
                      </div>
                    </>
                  )}

                  {overlay === 'glitch' && (
                    <div className="wish-glitch" data-testid="wish-glitch">
                      {t.expand.glitch.slice(0, glitchStep).map((l, i) => (
                        <motion.p key={l} className={`wish-glitch__line ${i >= 2 ? 'wish-glitch__line--ok' : ''}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
                          {l}
                        </motion.p>
                      ))}
                    </div>
                  )}

                  {overlay === 'signal' && (
                    <>
                      <h3 className="wish-overlay__title">📡 {t.signal.title}</h3>
                      <p className="wish-signal-text">{t.signal.text}</p>
                      <p className="wish-overlay__hint">{t.signal.note}</p>
                      <div className="wish-overlay__actions">
                        <Button variant="gold" small onClick={() => setOverlay('none')}>
                          {t.signal.close}
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MinigameShell>
    </SceneLayout>
  );
}
