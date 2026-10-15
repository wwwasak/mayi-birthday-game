import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { assetPlaceholder } from '../../config/assets';
import { COLLECTIBLES } from '../../config/food';
import { TEXTS } from '../../config/texts';
import { audio } from '../../core/audio';
import { Button } from '../ui/Button';
import { ChibiMayi } from '../ui/ChibiMayi';

/** 三道切割引导线（相对窝瓜宽度的百分比，任意顺序划过即可） */
const GUIDE_LINES = [25, 50, 75];
/** 切开后切缝让出的宽度（百分比），判定仍按引导线原位置 */
const CUT_GAP = 2.6;
/** 搅拌满进度所需的轨迹长度（逻辑像素，约画 3 圈） */
const STIR_NEED = 2100;
/** 单次指针事件计入的最大位移，避免跳变一下灌满进度 */
const STIR_CAP = 140;
/** 碗内判定半径（相对碗半径，>0.5 即略出碗沿也算，避免卡手） */
const STIR_RADIUS = 0.68;
/** 火候指针往返一次的时长（毫秒） */
const HEAT_PERIOD_MS = 2200;
/** 火候分区边界（指针位置 0~100 → 等级 0~4） */
const HEAT_ZONES = [15, 35, 65, 85];

type Step = 0 | 1 | 2 | 3;
interface Pt {
  x: number;
  y: number;
}

export interface HiddenDishGameProps {
  /** 小游戏是否处于游玩中（暂停时停止指针动画与操作） */
  active: boolean;
  /** 端上桌（入图鉴由父级处理，重做不重复发放） */
  onServe: () => void;
  onBack: () => void;
}

/**
 * 把指针换成元素内的百分比坐标（用 getBoundingClientRect，与舞台缩放无关）
 * @param e 指针事件
 * @param el 参照元素
 */
function localPercent(e: { clientX: number; clientY: number }, el: HTMLElement | null): Pt | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
}

/**
 * 线段穿过了哪些竖向引导线（按穿过顺序）
 * y 允许超出窝瓜约 1/4，轨迹不必贴着线
 * @param a 起点（百分比）
 * @param b 终点（百分比）
 * @param lines 尚未切开的引导线
 */
function crossedLines(a: Pt, b: Pt, lines: number[]): number[] {
  const hit: { line: number; t: number }[] = [];
  for (const line of lines) {
    const dx = b.x - a.x;
    if (Math.abs(dx) < 0.01) continue;
    if ((a.x - line) * (b.x - line) > 0) continue;
    const t = (line - a.x) / dx;
    if (t < 0 || t > 1) continue;
    const y = a.y + t * (b.y - a.y);
    if (y < -25 || y > 125) continue;
    hit.push({ line, t });
  }
  hit.sort((p, q) => p.t - q.t);
  return hit.map((h) => h.line);
}

/**
 * 四块始终存在并铺满窝瓜；某条引导线被划开后，两侧各让出一条缝，靠 CSS 过渡拉开
 * @param cut 已切开的引导线位置
 */
function chunksOf(cut: number[]): { key: number; left: number; width: number }[] {
  const marks = [0, ...GUIDE_LINES, 100];
  const pieces: { key: number; left: number; width: number }[] = [];
  for (let i = 0; i < marks.length - 1; i += 1) {
    const openedLeft = i > 0 && cut.includes(marks[i]);
    const openedRight = i < marks.length - 2 && cut.includes(marks[i + 1]);
    const left = marks[i] + (openedLeft ? CUT_GAP : 0);
    const end = marks[i + 1] - (openedRight ? CUT_GAP : 0);
    pieces.push({ key: i, left, width: Math.max(3, end - left) });
  }
  return pieces;
}

/**
 * 根据指针位置求火候等级
 * @param pos 0~100
 */
function heatLevel(pos: number): number {
  const i = HEAT_ZONES.findIndex((b) => pos < b);
  return i === -1 ? HEAT_ZONES.length : i;
}

/**
 * 窝瓜块颜色：搅拌进度 0→100 从橙色过渡到金黄
 * @param progress 0~100
 */
function chunkColor(progress: number): string {
  const t = Math.min(1, Math.max(0, progress / 100));
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(232, 255)}, ${mix(126, 206)}, ${mix(42, 72)})`;
}

/**
 * 神秘料理台：每一步只有一种鼠标操作
 * 1. 按住划过引导线，窝瓜裂开（3 刀，点按无效）
 * 2. 按住在碗里移动，按真实轨迹累计搅拌（点按无效）
 * 3. 火候指针摆动时点一次「出炉」，任何火候都成功
 * 防卡关只保留外壳上的「跳过这关」，步骤内不再提供第二种完成方式
 */
export function HiddenDishGame({ active, onServe, onBack }: HiddenDishGameProps) {
  const t = TEXTS.food.hidden;
  const [step, setStep] = useState<Step>(0);
  const [cuts, setCuts] = useState<number[]>([]);
  const [slash, setSlash] = useState<number | null>(null);
  const [coat, setCoat] = useState(0);
  const [swirl, setSwirl] = useState(0);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [heatPos, setHeatPos] = useState(0);
  const [heat, setHeat] = useState<number | null>(null);
  const [line, setLine] = useState('');
  const [reactIdx] = useState(() => Math.floor(Math.random() * t.mayiReact.length));

  const stepRef = useRef<Step>(0);
  const cutsRef = useRef<number[]>([]);
  const coatRef = useRef(0);
  const heatPosRef = useRef(0);
  const heatStart = useRef(performance.now());
  const pausedAt = useRef<number | null>(null);
  const pumpkinRef = useRef<HTMLDivElement>(null);
  const bowlRef = useRef<HTMLDivElement>(null);
  const heatBoardRef = useRef<HTMLDivElement>(null);
  const lastPt = useRef<Pt | null>(null);
  const lastClient = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const gestureCut = useRef(false);

  const syncStep = (n: Step) => {
    stepRef.current = n;
    setStep(n);
  };

  const reset = useCallback(() => {
    cutsRef.current = [];
    coatRef.current = 0;
    stepRef.current = 0;
    dragging.current = false;
    gestureCut.current = false;
    lastPt.current = null;
    lastClient.current = null;
    setCuts([]);
    setSlash(null);
    setCoat(0);
    setSwirl(0);
    setTrail([]);
    setHeat(null);
    setHeatPos(0);
    setLine('');
    heatStart.current = performance.now();
    setStep(0);
  }, []);

  // ---------- 步骤 1：划动切割 ----------
  const onCutDown = (e: ReactPointerEvent) => {
    if (!active || stepRef.current !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    gestureCut.current = false;
    lastPt.current = localPercent(e, pumpkinRef.current);
  };

  const onCutMove = (e: ReactPointerEvent) => {
    if (!dragging.current || stepRef.current !== 0) return;
    const p = localPercent(e, pumpkinRef.current);
    const prev = lastPt.current;
    lastPt.current = p;
    if (!p || !prev) return;
    const fresh = crossedLines(prev, p, GUIDE_LINES.filter((g) => !cutsRef.current.includes(g)));
    if (fresh.length === 0) return;
    gestureCut.current = true;
    cutsRef.current = [...cutsRef.current, ...fresh];
    setCuts(cutsRef.current);
    setSlash(fresh[fresh.length - 1]);
    setLine(t.cutLines[Math.min(cutsRef.current.length, t.cutLines.length) - 1]);
    audio.playSfx('sfx_click');
  };

  const onCutUp = () => {
    const missed = dragging.current && stepRef.current === 0 && !gestureCut.current && cutsRef.current.length < GUIDE_LINES.length;
    dragging.current = false;
    lastPt.current = null;
    if (missed) setLine(t.cutMiss);
  };

  useEffect(() => {
    if (step !== 0 || cuts.length < GUIDE_LINES.length) return;
    const id = window.setTimeout(() => {
      setLine(t.cutDone);
      syncStep(1);
      audio.playSfx('sfx_success');
    }, 520);
    return () => window.clearTimeout(id);
  }, [cuts, step, t.cutDone]);

  // ---------- 步骤 2：碗内搅拌（只累计真实移动） ----------
  const onStirDown = (e: ReactPointerEvent) => {
    if (!active || stepRef.current !== 1 || coatRef.current >= 100) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    lastClient.current = { x: e.clientX, y: e.clientY };
  };

  const onStirMove = (e: ReactPointerEvent) => {
    if (!dragging.current || stepRef.current !== 1 || coatRef.current >= 100) return;
    const bowl = bowlRef.current;
    const prev = lastClient.current;
    lastClient.current = { x: e.clientX, y: e.clientY };
    if (!bowl || !prev) return;
    const r = bowl.getBoundingClientRect();
    const scale = r.width / bowl.offsetWidth || 1;
    const dist = Math.min(Math.hypot((e.clientX - prev.x) / scale, (e.clientY - prev.y) / scale), STIR_CAP);
    if (dist < 0.8) return;
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const px = (prev.x - (r.left + r.width / 2)) / (r.width / 2);
    const py = (prev.y - (r.top + r.height / 2)) / (r.height / 2);
    // 当前点或上一点在碗内（含放宽半径）才计入，纯点击位移为 0
    if (nx * nx + ny * ny > STIR_RADIUS ** 2 && px * px + py * py > STIR_RADIUS ** 2) return;
    const next = Math.min(100, coatRef.current + (dist / STIR_NEED) * 100);
    coatRef.current = next;
    setCoat(next);
    setSwirl((s) => s + dist * 0.45);
    setLine(t.coatLines[next < 34 ? 0 : next < 70 ? 1 : 2]);
    const spot = localPercent(e, bowl);
    if (spot) setTrail((prevTrail) => [...prevTrail, spot].slice(-36));
  };

  const onStirUp = () => {
    dragging.current = false;
    lastClient.current = null;
  };

  useEffect(() => {
    if (step !== 1 || coat < 100) return;
    const id = window.setTimeout(() => {
      setLine(t.coatDone);
      syncStep(2);
      heatStart.current = performance.now();
      audio.playSfx('sfx_success');
    }, 480);
    return () => window.clearTimeout(id);
  }, [coat, step, t.coatDone]);

  // ---------- 步骤 3：火候指针 ----------
  useEffect(() => {
    if (step !== 2 || heat !== null) return;
    if (!active) {
      pausedAt.current = performance.now();
      return;
    }
    if (pausedAt.current !== null) {
      heatStart.current += performance.now() - pausedAt.current;
      pausedAt.current = null;
    }
    let raf = 0;
    const tick = () => {
      const el = (performance.now() - heatStart.current) % HEAT_PERIOD_MS;
      const phase = el / HEAT_PERIOD_MS;
      const pos = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      const rounded = Math.round(pos * 100);
      heatPosRef.current = rounded;
      if (heatBoardRef.current) heatBoardRef.current.dataset.level = String(heatLevel(rounded));
      setHeatPos(rounded);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [step, heat, active]);

  const bake = () => {
    if (stepRef.current !== 2 || heat !== null) return;
    const lv = heatLevel(heatPosRef.current);
    setHeat(lv);
    setLine(t.heatLines[lv]);
    audio.playSfx('sfx_steam');
    window.setTimeout(() => {
      syncStep(3);
      audio.playSfx('sfx_sparkle');
    }, 900);
  };

  const revealed = step === 3;
  const dishDesc = COLLECTIBLES.find((c) => c.id === 'danhuangnangua')?.desc ?? '';
  const pieces = chunksOf(cuts);

  const renderStage = () => {
    if (step === 0) {
      return (
        <div className="hd-board hd-board--cut" data-testid="hd-cut-board" data-cuts={cuts.length} onPointerDown={onCutDown} onPointerMove={onCutMove} onPointerUp={onCutUp} onPointerCancel={onCutUp}>
          <div className="hd-pumpkin" ref={pumpkinRef} data-testid="hd-pumpkin">
            <div className="hd-stem" />
            <div className="hd-flesh">
              {pieces.map((p) => (
                <div key={p.key} className="hd-chunk" style={{ left: `${p.left}%`, width: `${p.width}%` }} />
              ))}
            </div>
            {GUIDE_LINES.filter((g) => !cuts.includes(g)).map((g) => (
              <span key={g} className="hd-guide" style={{ left: `${g}%` }} data-testid="hd-guide" />
            ))}
            {slash !== null && <motion.span key={slash} className="hd-slash" style={{ left: `${slash}%` }} initial={{ scaleY: 0.15, opacity: 1 }} animate={{ scaleY: 1, opacity: 0 }} transition={{ duration: 0.38 }} />}
          </div>
          <p className="hd-op">{t.stepDesc[0]}</p>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="hd-board hd-board--stir" data-testid="hd-coat-board" data-coat={Math.round(coat)} onPointerDown={onStirDown} onPointerMove={onStirMove} onPointerUp={onStirUp} onPointerCancel={onStirUp}>
          <div className="hd-bowl-wrap">
            <div className="hd-ring" style={{ ['--p' as string]: `${coat}%` }} />
            <div className="hd-bowl" ref={bowlRef} data-testid="hd-bowl">
              <div className="hd-bowl__sauce" style={{ transform: `rotate(${swirl}deg)` }} />
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className="hd-bowl__chunk" style={{ background: chunkColor(coat), transform: `rotate(${i * 90 + swirl * 0.05}deg) translateY(-62px)` }} />
              ))}
              <svg className="hd-stir-trail" viewBox="0 0 100 100" aria-hidden>
                <polyline points={trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
              </svg>
            </div>
          </div>
          <p className="hd-op">{t.stepDesc[1]}</p>
        </div>
      );
    }
    if (step === 2) {
      const lv = heat ?? heatLevel(heatPos);
      return (
        <div className="hd-board hd-board--oven" data-testid="hd-heat-board" data-level={lv} ref={heatBoardRef}>
          <div className={`hd-oven ${heat !== null ? 'hd-oven--baking' : ''}`}>
            <span className="hd-oven__door">🔥</span>
          </div>
          <div className="hd-heat">
            <div className="hd-heat__bar">
              {HEAT_ZONES.map((b) => (
                <span key={b} className="hd-heat__tick" style={{ left: `${b}%` }} />
              ))}
              <span className="hd-heat__perfect" style={{ left: `${HEAT_ZONES[1]}%`, width: `${HEAT_ZONES[2] - HEAT_ZONES[1]}%` }} />
              <span className="hd-heat__pointer" style={{ left: `${heatPos}%` }} />
            </div>
            <div className="hd-heat__labels">
              {t.heatLevels.map((l, i) => (
                <span key={l} className={i === lv ? 'on' : ''}>
                  {l}
                </span>
              ))}
            </div>
          </div>
          <p className="hd-op">{t.stepDesc[2]}</p>
        </div>
      );
    }
    return (
      <motion.div className="hd-board hd-board--done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
        <motion.div
          className="hd-dish"
          style={{ background: assetPlaceholder('item_golden_dish') }}
          animate={{ scale: [1, 1.12, 1], rotate: [0, 4, -4, 0], boxShadow: ['0 0 0 0 rgba(255,215,100,0)', '0 0 70px 26px rgba(255,215,100,0.75)', '0 0 40px 14px rgba(255,215,100,0.5)'] }}
          transition={{ duration: 1.1 }}
        >
          ✨
        </motion.div>
        {Array.from({ length: 8 }, (_, i) => (
          <motion.span
            key={i}
            className="hd-spark"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], x: Math.cos((i / 8) * Math.PI * 2) * 150, y: Math.sin((i / 8) * Math.PI * 2) * 120, scale: 1.2 }}
            transition={{ duration: 1.2, delay: 0.1 + i * 0.05 }}
          >
            ✦
          </motion.span>
        ))}
        <motion.div className="hd-chibi" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <ChibiMayi action="cheer" scale={0.7} />
          <span className="hd-chibi__bubble">{t.mayiReact[reactIdx]}</span>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="food-station-view hd" data-step={step}>
      <div className="food-station-view__left">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="step-title">{t.title}</h3>
          <Button variant="ghost" small onClick={onBack}>
            {TEXTS.food.hub.back}
          </Button>
        </div>
        <ol className="hd-steps">
          {t.steps.map((s, i) => (
            <li key={s} className={`hd-step ${step === i ? 'hd-step--active' : ''} ${step > i ? 'hd-step--done' : ''}`}>
              <span className="hd-step__no">{step > i ? '✔' : i + 1}</span>
              <div>
                <div className="hd-step__title">{s}</div>
                <div className="hd-step__desc">{t.stepDesc[i]}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="hd-progress" data-testid="hd-progress">
          {step === 0 && t.cutHint(cuts.length, GUIDE_LINES.length)}
          {step === 1 && (
            <>
              {t.coatHint(Math.round(coat))}
              <div className="bake-bar" style={{ marginTop: 8 }}>
                <div className="bake-bar__fill" style={{ width: `${coat}%` }} />
              </div>
            </>
          )}
          {step === 2 && t.heatTitle}
          {step === 3 && (
            <strong style={{ color: '#b8860b' }}>
              {t.reveal} {heat !== null ? `（${t.heatLevels[heat]}）` : ''}
            </strong>
          )}
        </div>
        <div className={`feedback-box ${revealed ? 'feedback-box--gold' : ''}`} data-testid="hd-line">
          {revealed ? (
            <>
              <strong style={{ display: 'block', color: '#b8860b' }}>{t.servedTitle}</strong>
              {line || dishDesc}
            </>
          ) : (
            line || t.stepDesc[step]
          )}
        </div>
      </div>
      <div className="food-station-view__right">
        <div className="pot-area hd-area">
          <AnimatePresence mode="wait">
            <motion.div key={step} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {renderStage()}
            </motion.div>
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', alignItems: 'center' }}>
          {revealed && (
            <Button variant="secondary" small onClick={reset} data-testid="hd-replay">
              {t.replay}
            </Button>
          )}
          {step === 2 && heat === null && (
            <Button variant="primary" className="btn--breath" onClick={bake} data-testid="hd-bake">
              {t.heatBtn}
            </Button>
          )}
          {revealed && (
            <Button variant="gold" onClick={onServe} data-testid="hd-serve">
              {t.done}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
