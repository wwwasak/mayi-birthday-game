import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapBuilding, type BuildingState } from '../components/map/MapBuilding';
import { Button } from '../components/ui/Button';
import { ChibiMayi, type ChibiAction } from '../components/ui/ChibiMayi';
import { PlaceholderBackground } from '../components/ui/PlaceholderBackground';
import { ASSETS } from '../config/assets';
import { isDebugUiEnabled } from '../config/debugUi';
import { cakeSlotCenter, chibiSpot, STAMP_TRAY, trayCenter, type BuildingId } from '../config/mapLayout';
import { hasAllStamps } from '../config/scenes';
import { STAMPS, STAMP_ORDER, type StampId } from '../config/stamps';
import { TEXTS } from '../config/texts';
import { audio } from '../core/audio';
import { useGame } from '../core/GameContext';
import { useHints } from '../core/HintContext';
import { canEnterStage, countPreWishStamps, countStamps, currentStage, STRICT_ORDER, type GameProgress } from '../core/progress';
import { useSceneHint } from '../hooks/useSceneHint';
import { useAssetImageReady } from '../hooks/useAssetImageReady';

/** 地图演出类型 */
type ShowKind = 'none' | 'wish' | 'converge';

/** 印章汇聚演出时间轴（毫秒） */
const CONVERGE_T = {
  night: 300,
  lanterns: 1500,
  fly: 2800,
  flyEach: 450,
  flyDuration: 800,
  slots: 5000,
  announce: 5200,
  end: 8000,
};

/** 心愿屋解锁演出时长 */
const WISH_SHOW_MS = 4000;

/**
 * 本次运行中上一次离开地图时的印章快照（用于识别“刚拿到哪枚印章”并播放对应广播）
 * 模块级变量：刷新页面后重置，避免重复广播历史印章
 */
let lastStampSnapshot: Record<StampId, boolean> | null = null;

/**
 * 计算当前站（严格顺序：薄荷糖 → 美食 → 考试 → 心愿屋 → 蛋糕房）
 * @param p 进度
 */
function recommendNext(p: GameProgress): BuildingId {
  return currentStage(p) ?? 'cake';
}

/**
 * 场景 4：游园会地图——固定建筑布局 + 分层环境 + 严格顺序闯关 + 两段自动演出
 * 图层自下而上：背景层 → 建筑层 → 环境光层 → 特效层 → UI 层
 */
export function MapScene() {
  const { progress, goTo, resetProgress, patch } = useGame();
  const { announce, mode: hintMode } = useHints();
  const t = TEXTS.map;

  const n = countStamps(progress);
  const pre = countPreWishStamps(progress);
  const allDone = hasAllStamps(progress);
  const wishOpen = canEnterStage(progress, 'wish');
  const mintArt = useAssetImageReady('map_building_mint');
  const foodArt = useAssetImageReady('map_building_food');
  const examArt = useAssetImageReady('map_building_exam');
  const wishArt = useAssetImageReady('map_building_wish');
  const cakeArt = useAssetImageReady('map_building_cake');
  const artReady: Record<BuildingId, boolean> = {
    mint: mintArt,
    food: foodArt,
    exam: examArt,
    wish: wishArt,
    cake: cakeArt,
  };

  // ---------- 演出状态 ----------
  const needConverge = allDone && !progress.convergenceSeen;
  const needWishUnlock = !allDone && pre >= 3 && !progress.stamps.wish && !progress.wishUnlockSeen;
  const [show, setShow] = useState<ShowKind>(() => (needConverge ? 'converge' : needWishUnlock ? 'wish' : 'none'));
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  /** 结束当前演出并写入进度（跳过与自然播完走同一条路径） */
  const finishShow = useCallback(() => {
    clearTimers();
    if (show === 'converge') {
      patch({ convergenceSeen: true, wishUnlockSeen: true });
      setStep(4);
    } else if (show === 'wish') {
      patch({ wishUnlockSeen: true });
    }
    setShow('none');
  }, [show, patch]);

  // 启动演出时间轴
  useEffect(() => {
    if (show === 'none') return;
    if (show === 'converge') {
      at(CONVERGE_T.night, () => setStep(1));
      at(CONVERGE_T.lanterns, () => setStep(2));
      at(CONVERGE_T.fly, () => {
        setStep(3);
        STAMP_ORDER.forEach((_, i) => at(i * CONVERGE_T.flyEach + CONVERGE_T.flyDuration, () => audio.playSfx('sfx_stamp')));
      });
      at(CONVERGE_T.slots, () => {
        setStep(4);
        audio.playSfx('sfx_success');
      });
      at(CONVERGE_T.announce, () => announce(t.broadcast.convergence));
      at(CONVERGE_T.end, finishShow);
    } else {
      at(400, () => announce([t.broadcast.wishUnlocked]));
      at(WISH_SHOW_MS, finishShow);
    }
    return clearTimers;
    // 仅在演出种类变化时重建时间轴
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // ---------- 广播：首次到达 / 刚拿到印章 ----------
  /** 刚拿到印章的场馆：Q 版麻衣从那里走向下一站 */
  const [cameFrom] = useState<StampId | null>(() => {
    if (lastStampSnapshot === null) return null;
    const gained = STAMP_ORDER.filter((id) => progress.stamps[id] && !lastStampSnapshot![id]);
    return gained.length >= 1 ? gained[0] : null;
  });
  useEffect(() => {
    if (show === 'converge') {
      lastStampSnapshot = { ...progress.stamps };
      return;
    }
    if (lastStampSnapshot === null) {
      if (n === 0) announce(t.broadcast.first);
    } else {
      const gained = STAMP_ORDER.filter((id) => progress.stamps[id] && !lastStampSnapshot![id]);
      if (gained.length === 1) {
        const line = t.broadcast.afterStamp[gained[0]];
        announce([line && line.length > 0 ? line : t.broadcast.generic(4 - n)]);
      } else if (gained.length > 1) {
        announce([t.broadcast.generic(4 - n)]);
      }
    }
    lastStampSnapshot = { ...progress.stamps };
    // 只在挂载时评估一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 引导 ----------
  const next = useMemo(() => recommendNext(progress), [progress]);
  useSceneHint('map', { target: `bld-${next}`, enabled: show === 'none' });

  // ---------- 环境光等级 0~4 ----------
  const ambientLevel = (() => {
    if (show === 'converge') return step >= 1 ? 4 : 3;
    return Math.min(4, n);
  })();
  const lanternLevel: 0 | 1 | 2 = (() => {
    if (show === 'converge') return step >= 2 ? 2 : 1;
    if (n >= 4) return 2;
    if (n >= 2) return 1;
    return 0;
  })();
  const slotsLit = allDone && (progress.convergenceSeen || step >= 4);

  // ---------- 点击处理 ----------
  const [shaking, setShaking] = useState<BuildingId | null>(null);
  const shake = (id: BuildingId) => {
    setShaking(id);
    window.setTimeout(() => setShaking((s) => (s === id ? null : s)), 450);
  };

  const enterBooth = (id: StampId) => {
    if (show === 'wish' && id === 'wish') finishShow();
    const ok = goTo(id);
    if (!ok) shake(id);
  };

  /** 蛋糕房入口（重复进入时按进度直达对应环节） */
  const enterCake = () => {
    if (show === 'converge') {
      finishShow();
    }
    if (!allDone) {
      goTo('cake'); // 守卫拦截并提示
      shake('cake');
      return;
    }
    if (progress.ticketSeen || progress.finalSeen) goTo('ticket');
    else if (progress.musicDone) goTo('final');
    else if (progress.candlesBlown) goTo('music');
    else if (progress.cakeLit) goTo('candle');
    else goTo('cake');
  };

  // ---------- Q 版麻衣：站在当前站门口；刚通关时从上一站走过来 ----------
  const chibiTarget: BuildingId = show === 'wish' ? 'wish' : show === 'converge' ? 'cake' : next;
  const chibiPos = chibiSpot(chibiTarget, artReady[chibiTarget]);
  const chibiStart = cameFrom ? chibiSpot(cameFrom, artReady[cameFrom]) : chibiPos;
  const chibiAction: ChibiAction = show === 'converge' ? (step >= 4 ? 'cheer' : 'surprise') : show === 'wish' ? 'point' : hintMode === 'idle' ? 'point' : 'idle';
  const chibiFacing = chibiPos.x < 960 ? 'right' : 'left';
  /** 点击 Q 版麻衣 = 进入当前站 */
  const enterCurrent = () => {
    if (show !== 'none') return;
    if (next === 'cake') enterCake();
    else enterBooth(next);
  };

  // ---------- 建筑状态（严格顺序：已盖章可重玩；当前站可进；其余锁定） ----------
  const boothState = (id: StampId): BuildingState => (progress.stamps[id] ? 'done' : canEnterStage(progress, id) ? 'open' : 'locked');
  const stepNo = (id: StampId) => STRICT_ORDER.indexOf(id) + 1;
  const boothStatus = (id: StampId) => {
    const s = boothState(id);
    if (s !== 'open') return null;
    if (id === 'wish' && (show === 'wish' || (progress.wishUnlockSeen && !progress.stamps.wish))) return `✨ ${t.wishEnterNow}`;
    return `${t.orderStep(stepNo(id))} · 点击进入`;
  };
  const boothHint = (id: StampId) => {
    const s = boothState(id);
    if (s === 'locked') {
      const cur = currentStage(progress);
      return cur ? t.orderLocked(t.booths[cur].title) : t.replay;
    }
    if (s === 'done') return `${t.booths[id].desc}（${t.replay}）`;
    return t.booths[id].desc;
  };

  return (
    <div className="scene park" data-ambient={ambientLevel}>
      {/* 背景层 */}
      <div className="park__layer park__layer--bg">
        <PlaceholderBackground asset="bg_map" />
        <div className="park__ground" />
        <div className="park__path park__path--h" />
        <div className="park__path park__path--v" />
      </div>

      {/* 建筑层 */}
      <div className="park__layer park__layer--buildings">
        {STAMP_ORDER.map((id) => (
          <MapBuilding
            key={id}
            id={id}
            title={t.booths[id].title}
            hint={boothHint(id)}
            state={boothState(id)}
            enterLabel={boothStatus(id)}
            lanternLevel={lanternLevel}
            shaking={shaking === id}
            glowing={(id === 'wish' && (show === 'wish' || (progress.wishUnlockSeen && !progress.stamps.wish && wishOpen))) || (show === 'none' && boothState(id) === 'open')}
            onClick={() => enterBooth(id)}
          />
        ))}
        <MapBuilding
          id="cake"
          title={t.cakeTitle}
          hint={allDone ? t.cakeOpen : t.cakeLocked(n)}
          state={allDone ? 'open' : 'locked'}
          enterLabel={allDone ? `🎂 ${t.cakeEnter}` : undefined}
          lanternLevel={lanternLevel}
          shaking={shaking === 'cake'}
          glowing={allDone && show === 'none'}
          slotsLit={slotsLit}
          onClick={enterCake}
        />
      </div>

      {/* 环境光层：天色滤镜 + 星光（pointer-events: none） */}
      <div className="park__layer park__layer--ambient" aria-hidden>
        <div className="park__sky" />
        <div className="park__stars">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} className="park__star" style={{ left: `${(i * 137) % 100}%`, top: `${(i * 61) % 28}%`, animationDelay: `${(i % 5) * 0.4}s` }} />
          ))}
        </div>
      </div>

      {/* 特效层：飞行印章、烟花 */}
      <div className="park__layer park__layer--fx" aria-hidden>
        <AnimatePresence>
          {show === 'converge' && step >= 3 && step < 4 && (
            <>
              {STAMP_ORDER.map((id, i) => {
                const from = trayCenter(i);
                const to = cakeSlotCenter(i);
                return (
                  <motion.div
                    key={`fly-${id}`}
                    className="park__fly-stamp"
                    style={{ ['--stamp-color' as string]: STAMPS[id].color }}
                    initial={{ left: from.x, top: from.y, scale: 1, opacity: 1 }}
                    animate={{ left: to.x, top: to.y, scale: 0.75, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: CONVERGE_T.flyDuration / 1000, delay: (i * CONVERGE_T.flyEach) / 1000, ease: 'easeInOut' }}
                  >
                    {STAMPS[id].emoji}
                  </motion.div>
                );
              })}
            </>
          )}
          {show === 'converge' && step >= 4 && (
            <>
              <motion.div key="fw1" className="park__firework" style={{ left: 420, top: 150 }} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 1.6 }} />
              <motion.div key="fw2" className="park__firework park__firework--gold" style={{ left: 1440, top: 120 }} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3.4, opacity: 0 }} transition={{ duration: 1.8, delay: 0.5 }} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* UI 层：Q 版麻衣、印章托盘、重置、演出跳过 */}
      <div className="park__layer park__layer--ui">
        <motion.div
          className="park__chibi park__chibi--clickable"
          data-testid="map-chibi"
          initial={{ left: chibiStart.x, top: chibiStart.y }}
          animate={{ left: chibiPos.x, top: chibiPos.y }}
          transition={{ type: 'spring', stiffness: 60, damping: 16, delay: cameFrom ? 0.6 : 0 }}
          style={{ position: 'absolute' }}
          role="button"
          tabIndex={0}
          aria-label={t.chibiHint}
          title={t.chibiHint}
          onClick={enterCurrent}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') enterCurrent();
          }}
        >
          <ChibiMayi action={chibiAction} facing={chibiFacing} showLabel={isDebugUiEnabled()} />
        </motion.div>

        <div className="park__tray" style={{ left: STAMP_TRAY.x, top: STAMP_TRAY.y }}>
          {STAMP_ORDER.map((id, i) => {
            const got = progress.stamps[id];
            const flying = show === 'converge' && step >= 3;
            return (
              <div
                key={id}
                className={`park__tray-disc ${got ? 'park__tray-disc--on' : ''}`}
                style={{ left: i * STAMP_TRAY.gap, width: STAMP_TRAY.disc, height: STAMP_TRAY.disc, opacity: flying ? 0.25 : 1, ['--stamp-color' as string]: STAMPS[id].color }}
                title={STAMPS[id].name}
              >
                {got ? STAMPS[id].emoji : ''}
              </div>
            );
          })}
          <span className="park__tray-label">印章 {n} / 4</span>
        </div>

        <div className="park__corner">
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm(TEXTS.common.resetConfirm)) resetProgress();
            }}
          >
            {TEXTS.common.reset}
          </Button>
        </div>

        {isDebugUiEnabled() && (
          <span className="park__layer-label">
            {t.layerLabels.bg} · {t.layerLabels.buildings} · {t.layerLabels.ambient}（{ASSETS.map_layer_night.path}）· {t.layerLabels.fx} · {t.layerLabels.ui}
          </span>
        )}

        <AnimatePresence>
          {show !== 'none' && (
            <motion.div key="skip" className="park__skip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button variant="secondary" small onClick={finishShow}>
                {t.skipShow}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
