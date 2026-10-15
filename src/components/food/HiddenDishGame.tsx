import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { assetPlaceholder } from '../../config/assets';
import { COLLECTIBLES } from '../../config/food';
import { TEXTS } from '../../config/texts';
import { audio } from '../../core/audio';
import { Button } from '../ui/Button';
import { ChibiMayi } from '../ui/ChibiMayi';

/** 切窝瓜需要的刀数 */
const CUT_TOTAL = 4;
/** 每次点击 / 划过增加的裹酱进度 */
const COAT_CLICK = 18;
const COAT_DRAG = 3;
/** 火候指针往返一次的时长（毫秒） */
const HEAT_PERIOD_MS = 2200;
/** 火候分区边界（指针位置 0~100 → 等级 0~4） */
const HEAT_ZONES = [15, 35, 65, 85];
/** 「刚刚好」等级下标（快速完成时使用） */
const HEAT_PERFECT = 2;

type Step = 0 | 1 | 2 | 3;

export interface HiddenDishGameProps {
  /** 小游戏是否处于游玩中（暂停时停止指针动画） */
  active: boolean;
  /** 已经做过（重玩不再重复入图鉴，由父级处理） */
  onServe: () => void;
  onBack: () => void;
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
 * 神秘料理台三步互动：切窝瓜（点击 / 划过）→ 裹蛋黄沙司（点击 / 拖动）→ 黄金焗烤（火候指针）
 * 任何火候都能出炉，不存在失败；提供快速完成与再做一次
 */
export function HiddenDishGame({ active, onServe, onBack }: HiddenDishGameProps) {
  const t = TEXTS.food.hidden;
  const [step, setStep] = useState<Step>(0);
  const [cuts, setCuts] = useState(0);
  const [coat, setCoat] = useState(0);
  const [heatPos, setHeatPos] = useState(0);
  const [heat, setHeat] = useState<number | null>(null);
  const [line, setLine] = useState('');
  const [reactIdx] = useState(() => Math.floor(Math.random() * t.mayiReact.length));
  const lastCutAt = useRef(0);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const heatStart = useRef(performance.now());
  const pausedAt = useRef<number | null>(null);

  const reset = useCallback(() => {
    setStep(0);
    setCuts(0);
    setCoat(0);
    setHeat(null);
    setLine('');
    lastCutAt.current = 0;
    lastPointer.current = null;
  }, []);

  // ---------- 步骤 1：切窝瓜 ----------
  const doCut = useCallback(() => {
    if (step !== 0) return;
    const now = performance.now();
    if (now - lastCutAt.current < 260) return;
    lastCutAt.current = now;
    audio.playSfx('sfx_click');
    setCuts((c) => {
      const n = Math.min(CUT_TOTAL, c + 1);
      setLine(t.cutLines[Math.min(n - 1, t.cutLines.length - 1)]);
      if (n >= CUT_TOTAL) {
        window.setTimeout(() => {
          setLine(t.cutDone);
          setStep(1);
          audio.playSfx('sfx_success');
        }, 500);
      }
      return n;
    });
  }, [step, t]);

  const onCutMove = (e: ReactPointerEvent) => {
    if (step !== 0 || e.buttons === 0) return;
    const p = { x: e.clientX, y: e.clientY };
    if (lastPointer.current) {
      const d = Math.hypot(p.x - lastPointer.current.x, p.y - lastPointer.current.y);
      if (d > 50) {
        lastPointer.current = p;
        doCut();
      }
    } else {
      lastPointer.current = p;
    }
  };

  // ---------- 步骤 2：裹酱 ----------
  const addCoat = useCallback(
    (amount: number) => {
      if (step !== 1) return;
      setCoat((c) => {
        const n = Math.min(100, c + amount);
        if (n >= 100 && c < 100) {
          audio.playSfx('sfx_success');
          setLine(t.coatDone);
          window.setTimeout(() => {
            setStep(2);
            heatStart.current = performance.now();
          }, 600);
        } else if (n < 100) {
          const idx = n < 34 ? 0 : n < 70 ? 1 : 2;
          setLine(t.coatLines[idx]);
        }
        return n;
      });
    },
    [step, t],
  );

  const onCoatClick = () => {
    audio.playSfx('sfx_click');
    addCoat(COAT_CLICK);
  };
  const onCoatMove = (e: ReactPointerEvent) => {
    if (e.buttons === 0) return;
    addCoat(COAT_DRAG);
  };

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
      const phase = el / HEAT_PERIOD_MS; // 0~1
      const pos = phase < 0.5 ? phase * 2 : (1 - phase) * 2; // 0→1→0 往返
      setHeatPos(Math.round(pos * 100));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [step, heat, active]);

  const bake = (level?: number) => {
    const lv = level ?? heatLevel(heatPos);
    setHeat(lv);
    setLine(t.heatLines[lv]);
    audio.playSfx('sfx_steam');
    window.setTimeout(() => {
      setStep(3);
      audio.playSfx('sfx_sparkle');
    }, 900);
  };

  /** 快速完成：直接以「刚刚好」出炉 */
  const quick = () => {
    setCuts(CUT_TOTAL);
    setCoat(100);
    setStep(2);
    bake(HEAT_PERFECT);
  };

  const revealed = step === 3;
  const dishDesc = COLLECTIBLES.find((c) => c.id === 'danhuangnangua')?.desc ?? '';

  // ---------- 渲染 ----------
  const renderStage = () => {
    if (step === 0) {
      return (
        <div className="hd-board" data-testid="hd-cut-board" onPointerDown={doCut} onPointerMove={onCutMove} onPointerUp={() => (lastPointer.current = null)}>
          <div className="hd-pumpkin">
            🎃
            {Array.from({ length: CUT_TOTAL }, (_, i) => (
              <motion.span key={i} className="hd-cut" style={{ left: `${18 + i * 20}%` }} initial={{ scaleY: 0, opacity: 0 }} animate={cuts > i ? { scaleY: 1, opacity: 1 } : {}} transition={{ duration: 0.18 }} />
            ))}
          </div>
          <div className="hd-tool">🔪</div>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="hd-board" data-testid="hd-coat-board" onPointerDown={onCoatClick} onPointerMove={onCoatMove}>
          <div className="hd-pieces">
            {Array.from({ length: CUT_TOTAL }, (_, i) => (
              <div key={i} className="hd-piece">
                <span>🟧</span>
                <span className="hd-piece__sauce" style={{ opacity: Math.min(1, coat / 100 + (i % 2) * 0.05) }} />
              </div>
            ))}
          </div>
          <div className="hd-tool">🥚</div>
        </div>
      );
    }
    if (step === 2) {
      const lv = heat ?? heatLevel(heatPos);
      return (
        <div className="hd-board hd-board--oven" data-testid="hd-heat-board">
          <div className={`hd-oven ${heat !== null ? 'hd-oven--baking' : ''}`}>🔥</div>
          <div className="hd-heat">
            <div className="hd-heat__bar">
              {HEAT_ZONES.map((b, i) => (
                <span key={b} className="hd-heat__tick" style={{ left: `${b}%` }} data-i={i} />
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
          {step === 0 && t.cutHint(cuts, CUT_TOTAL)}
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
          {!revealed && (
            <Button variant="ghost" small onClick={quick} data-testid="hd-quick">
              {t.quick}
            </Button>
          )}
          {revealed && (
            <Button variant="secondary" small onClick={reset} data-testid="hd-replay">
              {t.replay}
            </Button>
          )}
          {step === 2 && heat === null && (
            <Button variant="primary" className="btn--breath" onClick={() => bake()} data-testid="hd-bake">
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
