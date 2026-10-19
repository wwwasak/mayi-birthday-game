import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ChibiMayi } from '../components/ui/ChibiMayi';
import { PlaceholderBackground } from '../components/ui/PlaceholderBackground';
import { PlaceholderCharacter } from '../components/ui/PlaceholderCharacter';
import { ASSETS, assetUrl } from '../config/assets';
import { isDebugUiEnabled } from '../config/debugUi';
import { SCENES } from '../config/scenes';
import { TEXTS } from '../config/texts';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useGame } from '../core/GameContext';
import { useHints } from '../core/HintContext';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useSceneHint } from '../hooks/useSceneHint';

/** 每一行扫描文字的停留时间 */
const SCAN_STEP_MS = 420;
/** 闸门打开到切换场景的时间 */
const GATE_OPEN_MS = 1100;

type ScanState = 'idle' | 'scanning' | 'done' | 'opening';

/**
 * 场景 2：入园闸机（V1.2 全屏版）
 * 图层自下而上：背景层（预留 1920×1080 正式底图）→ 闸机层（CSS/SVG 大门 + 通道）→ 内容层（身份选项 / 须知 / 扫描结果 / 按钮）→ 右侧立绘层
 * 任意身份 → 扫描 → “寿星本人 100%” → 推开闸门 → 大门开启、通道亮起 → 地图
 */
export function GateScene() {
  const { goTo, patch, progress } = useGame();
  const { announce } = useHints();
  const t = TEXTS.gate;
  const [picked, setPicked] = useState<number | null>(null);
  const [scan, setScan] = useState<ScanState>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [pct, setPct] = useState(0);
  const timers = useRef<number[]>([]);

  useSceneHint('gate', { target: scan === 'done' ? 'gate-open' : 'gate-option', enabled: scan !== 'opening' });

  // 首次来到闸机：播放一句广播
  const announced = useRef(false);
  useEffect(() => {
    if (!announced.current && !progress.authDone) {
      announced.current = true;
      announce([t.broadcast]);
    }
  }, [announce, progress.authDone, t.broadcast]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  /** 选择身份并开始扫描（扫描中可换选项，结果不变） */
  const pick = (i: number) => {
    if (scan === 'opening') return;
    audio.playSfx('sfx_click');
    setPicked(i);
    if (i === 2) playCharacterVoice('gate_confused');
    if (scan === 'scanning' || scan === 'done') return;
    setScan('scanning');
    setScanStep(0);
    setPct(0);
    const total = t.scanSteps.length;
    for (let s = 1; s <= total; s++) {
      timers.current.push(
        window.setTimeout(() => {
          setScanStep(Math.min(s, total - 1));
          setPct(Math.round((s / total) * 100));
        }, SCAN_STEP_MS * s),
      );
    }
    const choice = i;
    timers.current.push(
      window.setTimeout(() => {
        setScan('done');
        audio.playSfx('sfx_success');
        if (choice === 3) playCharacterVoice('gate_spare');
      }, SCAN_STEP_MS * total + 150),
    );
  };

  /** 推开闸门：写入兼容标记后进入地图 */
  const open = () => {
    if (scan !== 'done') return;
    setScan('opening');
    audio.playSfx('sfx_unlock');
    patch({ authDone: true, noticeDone: true });
    timers.current.push(window.setTimeout(() => goTo('map'), GATE_OPEN_MS));
  };

  const def = SCENES.gate;
  const opening = scan === 'opening';
  const done = scan === 'done' || opening;
  /** 拱门图加载成功后替换 CSS 拱门和立柱；失败时保留原来的占位 */
  const archReady = useAssetImageReady('gate_arch');
  const doorLReady = useAssetImageReady('gate_door_l');
  const doorRReady = useAssetImageReady('gate_door_r');

  return (
    <div className={`scene gate2 ${opening ? 'gate2--opening' : ''} ${done ? 'gate2--done' : ''} ${archReady ? 'gate2--arch-art' : ''}`} data-testid="gate">
      {/* 背景层：预留正式 1920×1080 底图 */}
      <div className="gate2__layer gate2__layer--bg">
        <PlaceholderBackground asset={def.bg} />
        <div className="gate2__sky" />
      </div>

      {/* 闸机层：拱门与两扇门分开。有正式拱门图时不再画 CSS 拱门和立柱 */}
      <div className="gate2__layer gate2__layer--gate" aria-hidden>
        {archReady ? (
          <img className="gate2__arch-art" src={assetUrl('gate_arch')} alt="" />
        ) : (
          <>
            <div className="gate2__arch">
              <div className="gate2__arch-sign">🎪 {TEXTS.common.gameTitle}</div>
            </div>
            <div className="gate2__pillar gate2__pillar--l" />
            <div className="gate2__pillar gate2__pillar--r" />
          </>
        )}
        <div className={`gate2__glow ${opening ? 'gate2__glow--on' : ''}`} />
        <div className={`gate2__door gate2__door--l ${doorLReady ? 'gate2__door--art' : ''}`}>
          {doorLReady ? <img src={assetUrl('gate_door_l')} alt="" draggable={false} /> : <span className="gate2__door-emblem">🌸</span>}
        </div>
        <div className={`gate2__door gate2__door--r ${doorRReady ? 'gate2__door--art' : ''}`}>
          {doorRReady ? <img src={assetUrl('gate_door_r')} alt="" draggable={false} /> : <span className="gate2__door-emblem">🌸</span>}
        </div>
        <div className="gate2__passage">
          <div className="gate2__passage-light" />
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="gate2__passage-lamp" style={{ animationDelay: `${i * 0.12}s`, left: `${12 + i * 15}%` }} />
          ))}
        </div>
        <div className="gate2__ground" />
        {isDebugUiEnabled() && (
          <span className="gate2__asset-label">
            背景层 · {ASSETS.bg_gate.path}
            {archReady ? ` · 拱门 ${ASSETS.gate_arch.path}` : ' · 闸机层 CSS 占位'}
          </span>
        )}
      </div>

      {/* 内容层：居中 */}
      <div className="gate2__layer gate2__layer--content">
        <div className="gate2__center">
          <h1 className="gate2__title">{t.title}</h1>
          <p className="gate2__question">{t.question}</p>

          {/* 扫描屏 */}
          <div className="gate2__scanner" data-testid="gate-scanner">
            <div className="gate2__scanner-title">身份扫描</div>
            <AnimatePresence mode="wait">
              {scan === 'idle' && (
                <motion.p key="idle" className="gate__scan-line gate__scan-line--dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {t.scanIdle}
                </motion.p>
              )}
              {scan === 'scanning' && (
                <motion.p key={`s${scanStep}`} className="gate__scan-line" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  {t.scanSteps[scanStep]}
                </motion.p>
              )}
              {done && (
                <motion.div key="done" className="gate__result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <span className="gate__result-main">{t.resultLabel}</span>
                  <span className="gate__result-sub">{t.confidence}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="gate__scan-bar">
              <motion.div
                className="gate__scan-fill"
                animate={{ width: scan === 'idle' ? '0%' : scan === 'scanning' ? `${Math.max(12, pct)}%` : '100%' }}
                transition={{ duration: 0.35 }}
              />
            </div>
          </div>

          {/* 身份选项 */}
          <div className="gate2__options">
            {t.options.map((opt, i) => (
              <button
                key={opt.label}
                className={`option-btn ${picked === i ? 'option-btn--picked' : ''}`}
                data-hint-target="gate-option"
                data-testid={`gate-option-${i}`}
                disabled={opening}
                onClick={() => pick(i)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 回复 + 推开闸门 */}
          <div className="gate2__reply">
            <AnimatePresence mode="wait">
              {done && picked !== null && (
                <motion.div key={picked} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p className="gate__reply-main">✅ {t.options[picked].reply}</p>
                  {t.options[picked].note && <p className="gate__reply-note">{t.options[picked].note}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="gate2__actions">
            <AnimatePresence>
              {done && (
                <motion.div key="open" initial={{ opacity: 0, scale: 0.8, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                  <Button variant="gold" className="btn--breath" data-hint-target="gate-open" data-testid="gate-open" disabled={opening} onClick={open}>
                    {t.open}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 左下：游客须知（装饰牌） */}
        <div className="gate2__notice gate__notice" aria-label={t.noticeTitle}>
          <div className="gate__notice-title">📋 {t.noticeTitle}</div>
          <ol>
            {t.notice.map((item) => (
              <li key={item.text} className={item.off ? 'off' : ''}>
                {item.text}
              </li>
            ))}
          </ol>
        </div>

        {/* 闸机旁的 Q 版麻衣 */}
        <div className="gate2__chibi">
          <ChibiMayi action={opening ? 'cheer' : done ? 'peek' : 'idle'} scale={2.35} />
        </div>
      </div>

      {/* 右侧半身立绘：放大后裁掉腰以下，狐耳和脸留在画面里 */}
      <div className="gate2__layer gate2__layer--char">
        <div className="gate2__portrait">
          <PlaceholderCharacter mood={done ? 'surprise' : picked === null ? 'normal' : 'think'} scale={1} frame="full" />
        </div>
      </div>

      {/* 开门白光过渡 */}
      <AnimatePresence>
        {opening && <motion.div key="flash" className="gate2__flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: GATE_OPEN_MS / 1000, ease: 'easeIn' }} />}
      </AnimatePresence>
    </div>
  );
}
