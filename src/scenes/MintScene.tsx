import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MinigameShell } from '../components/minigame/MinigameShell';
import { SceneLayout } from '../components/ui/SceneLayout';
import { assetUrl, type ImageAssetId } from '../config/assets';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useCountdown } from '../hooks/useCountdown';
import { useMinigamePhase } from '../hooks/useMinigamePhase';

/** 一局时长 */
const ROUND_MS = 20_000;
/** 同屏最多糖果数 */
const MAX_ON_FIELD = 7;
/** 生成间隔 */
const SPAWN_MS = 520;
/** 存活刷新间隔 */
const TICK_MS = 100;

type CandyKind = 'mint' | 'bonus' | 'junk';

interface Candy {
  id: number;
  kind: CandyKind;
  /** 位置（相对游玩区百分比） */
  x: number;
  y: number;
  /** 剩余存活毫秒 */
  ttl: number;
  /** 总存活毫秒（用于进度环） */
  life: number;
  label: string;
  emoji: string;
  /** 干扰物种类，用于正式图 */
  junkIdx: number;
}

interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'plus' | 'bonus' | 'minus';
}

const SCORE: Record<CandyKind, number> = { mint: 10, bonus: 30, junk: -15 };
const LIFE: Record<CandyKind, number> = { mint: 1900, bonus: 1300, junk: 2300 };
const JUNK_EMOJI = ['🧴', '🧼', '🩹'];

let nextId = 1;

/**
 * 随机生成一颗糖果
 */
function spawnCandy(): Candy {
  const r = Math.random();
  const kind: CandyKind = r < 0.6 ? 'mint' : r < 0.76 ? 'bonus' : 'junk';
  const junkIdx = Math.floor(Math.random() * TEXTS.mint.junkNames.length);
  return {
    id: nextId++,
    kind,
    x: 8 + Math.random() * 84,
    y: 12 + Math.random() * 76,
    ttl: LIFE[kind],
    life: LIFE[kind],
    label: kind === 'mint' ? '薄荷糖' : kind === 'bonus' ? '奖励糖' : TEXTS.mint.junkNames[junkIdx],
    emoji: kind === 'mint' ? '🍬' : kind === 'bonus' ? '✨' : JUNK_EMOJI[junkIdx],
    junkIdx,
  };
}

/**
 * 连击加成倍率：每 5 连击 +50%，上限 3 倍
 */
function multiplier(combo: number): number {
  return Math.min(3, 1 + Math.floor(combo / 5) * 0.5);
}

/**
 * 第一关：薄荷糖补给站——20 秒限时点击收集
 */
const JUNK_ART: ImageAssetId[] = ['item_junk_fengyoujing', 'item_junk_soap', 'item_junk_eraser'];

export function MintScene() {
  const { progress, updateRecords } = useGame();
  const mintArt = useAssetImageReady('item_mint');
  const bonusArt = useAssetImageReady('item_candy_bonus');
  const junkArt = [useAssetImageReady('item_junk_fengyoujing'), useAssetImageReady('item_junk_soap'), useAssetImageReady('item_junk_eraser')];
  const t = TEXTS.mint;

  const [candies, setCandies] = useState<Candy[]>([]);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [burst, setBurst] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const prevBest = useRef(progress.records.mintBest);
  const comboRef = useRef(0);
  /** 这一局是否已经为第一颗薄荷糖说过话 */
  const mintVoiceRef = useRef(false);
  /** 这一局是否已经提醒过奖励糖。正在说别的句子时不占掉这次机会。 */
  const bonusVoiceRef = useRef(false);

  const resetRound = useCallback(() => {
    setCandies([]);
    setFloats([]);
    setScore(0);
    comboRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    setHits(0);
    setMisses(0);
    setBurst(null);
    setIsNewRecord(false);
    prevBest.current = progress.records.mintBest;
  }, [progress.records.mintBest]);

  const game = useMinigamePhase('mint', resetRound);
  const playing = game.phase === 'playing';

  // 回合结束
  const onRoundEnd = useCallback(() => {
    setCandies([]);
    setIsNewRecord(score > prevBest.current);
    updateRecords({ mintBest: score, mintBestCombo: maxCombo });
    game.finishToResult();
  }, [score, maxCombo, updateRecords, game]);

  const { leftMs, reset: resetTimer } = useCountdown(ROUND_MS, playing, onRoundEnd);

  // 开始/重开时重置计时器
  const startRound = () => {
    mintVoiceRef.current = false;
    bonusVoiceRef.current = false;
    resetTimer();
    game.start();
  };
  const restartRound = () => {
    mintVoiceRef.current = false;
    bonusVoiceRef.current = false;
    resetTimer();
    game.restart();
  };

  // 生成糖果
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCandies((list) => (list.length >= MAX_ON_FIELD ? list : [...list, spawnCandy()]));
    }, SPAWN_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  // 存活倒计时
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCandies((list) => list.map((c) => ({ ...c, ttl: c.ttl - TICK_MS })).filter((c) => c.ttl > 0));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const addFloat = (x: number, y: number, text: string, kind: FloatText['kind']) => {
    const id = nextId++;
    setFloats((f) => [...f, { id, x, y, text, kind }]);
    window.setTimeout(() => setFloats((f) => f.filter((i) => i.id !== id)), 800);
  };

  const hit = (c: Candy) => {
    if (!playing) return;
    setCandies((list) => list.filter((i) => i.id !== c.id));

    if (c.kind === 'junk') {
      audio.playSfx('sfx_miss');
      setScore((s) => Math.max(0, s + SCORE.junk));
      comboRef.current = 0;
      setCombo(0);
      setMisses((m) => m + 1);
      addFloat(c.x, c.y, `${SCORE.junk}`, 'minus');
      return;
    }

    // 使用 ref 读取连击，避免快速连点时拿到过期闭包值
    const gain = Math.round(SCORE[c.kind] * multiplier(comboRef.current));
    const nextCombo = comboRef.current + 1;
    comboRef.current = nextCombo;
    audio.playSfx(c.kind === 'bonus' ? 'sfx_bonus' : 'sfx_pop');
    if (c.kind === 'mint' && !mintVoiceRef.current) {
      mintVoiceRef.current = true;
      playCharacterVoice('mint_first_candy');
    }
    if (c.kind === 'bonus' && !bonusVoiceRef.current && playCharacterVoice('mint_bonus')) {
      bonusVoiceRef.current = true;
    }
    setScore((s) => s + gain);
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    setHits((h) => h + 1);
    addFloat(c.x, c.y, `+${gain}`, c.kind === 'bonus' ? 'bonus' : 'plus');

    if (nextCombo > 0 && nextCombo % 5 === 0) {
      audio.playSfx('sfx_combo');
      setBurst(nextCombo);
      window.setTimeout(() => setBurst((b) => (b === nextCombo ? null : b)), 900);
    }
  };

  const seconds = (leftMs / 1000).toFixed(1);
  const best = Math.max(progress.records.mintBest, score);
  /** 开场和结算才把玩家放在旁边。游玩时她退开，向导只在说话时露一下。 */
  const mintPlayerMood = game.phase === 'result' && score >= 350 ? 'happy' : 'normal';

  return (
    <SceneLayout
      scene="mint"
      title={t.title}
      subtitle={t.subtitle}
      side={game.phase === 'playing' ? 'overlay' : 'flow'}
      mood={game.phase === 'playing' ? null : mintPlayerMood}
      guide={game.phase === 'playing' ? { action: 'happy', scale: 0.8, followVoice: true, onlyWhileSpeaking: true } : null}
      compact
    >
      <MinigameShell
        phase={game.phase}
        title={t.title}
        desc={t.desc}
        rules={t.rules}
        introMood="normal"
        resultMood={score >= 350 ? 'happy' : 'normal'}
        onStart={startRound}
        onPause={game.pause}
        onResume={game.resume}
        onRestart={restartRound}
        onSkip={game.skip}
        onFinish={game.finish}
        finishLabel="领取印章，返回地图"
        hud={
          <>
            <span className={`mg__hud-pill ${leftMs < 5000 ? 'mg__hud-pill--accent' : ''}`}>{t.timeLeft(seconds)}</span>
            <span className="mg__hud-pill">{t.score(score)}</span>
            <AnimatePresence>
              {combo >= 2 && (
                <motion.span
                  key="combo"
                  className="mg__hud-pill mg__hud-pill--gold"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                >
                  {t.combo(combo)} ×{multiplier(combo).toFixed(1)}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        }
        result={
          <>
            <p className="mg__result-title">
              {t.resultTitle(score)}
              {isNewRecord && <span className="mg__badge-new">{t.newRecord}</span>}
            </p>
            <p style={{ margin: 0 }}>{t.resultLine(score)}</p>
            <div className="mg__stats">
              <div className="mg__stat">
                <div className="mg__stat-label">{t.statScore}</div>
                <div className="mg__stat-value">{score}</div>
              </div>
              <div className="mg__stat">
                <div className="mg__stat-label">{t.statCombo}</div>
                <div className="mg__stat-value">x{maxCombo}</div>
              </div>
              <div className="mg__stat">
                <div className="mg__stat-label">{t.statHits}</div>
                <div className="mg__stat-value">
                  {hits} / {misses}
                </div>
              </div>
              <div className="mg__stat">
                <div className="mg__stat-label">{t.statBest}</div>
                <div className="mg__stat-value">{best}</div>
              </div>
            </div>
          </>
        }
      >
        <div className={`mint-field ${combo >= 5 ? 'mint-field--combo' : ''}`}>
          <AnimatePresence>
            {candies.map((c) => (
              <motion.button
                key={c.id}
                className={`candy candy--${c.kind}`}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                whileHover={{ scale: 1.1 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  hit(c);
                }}
                aria-label={c.label}
              >
                <span
                  className="candy__ring"
                  style={{ transform: `rotate(${(1 - c.ttl / c.life) * 360}deg)`, opacity: 0.6 + (c.ttl / c.life) * 0.4 }}
                />
                {(() => {
                  const artId = c.kind === 'mint' ? 'item_mint' : c.kind === 'bonus' ? 'item_candy_bonus' : JUNK_ART[c.junkIdx];
                  const ready = c.kind === 'mint' ? mintArt : c.kind === 'bonus' ? bonusArt : junkArt[c.junkIdx];
                  return ready ? <img className="candy__art" src={assetUrl(artId)} alt="" draggable={false} /> : c.emoji;
                })()}
                <span className="candy__label">{c.label}</span>
              </motion.button>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {floats.map((f) => (
              <motion.span
                key={f.id}
                className={`float-text float-text--${f.kind}`}
                style={{ left: `${f.x}%`, top: `${f.y}%` }}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -80, scale: 1.2 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {f.text}
              </motion.span>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {burst !== null && (
              <motion.div
                key={burst}
                className="combo-burst"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.2, 1], opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {t.comboBurst(burst)}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </MinigameShell>
    </SceneLayout>
  );
}
