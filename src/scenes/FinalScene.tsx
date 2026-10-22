import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '../components/ui/Button';
import { ChibiMayi } from '../components/ui/ChibiMayi';
import { PlaceholderBackground } from '../components/ui/PlaceholderBackground';
import { GUIDE_SPEAKER_LABEL } from '../config/characters';
import { SCENE_THEMES, sceneThemeStyle } from '../config/sceneThemes';
import { PlaceholderCharacter } from '../components/ui/PlaceholderCharacter';
import { assetUrl } from '../config/assets';
import { SCENES } from '../config/scenes';
import { TEXTS } from '../config/texts';
import { audio } from '../core/audio';
import { getVoiceCaption, getVoiceCaptionSnapshot, playCharacterVoice, subscribeVoiceCaption } from '../core/characterVoice';
import { useGame } from '../core/GameContext';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useSceneHint } from '../hooks/useSceneHint';

/** 第一幕系统加载时长 */
const LOADING_MS = 1600;
/** 预测幕「正在预测」到「预测失败」的等待 */
const PREDICT_MS = 1500;

type Act = (typeof TEXTS.final.acts)[number];

/**
 * 某一幕总共有多少个「点击推进」步骤
 * - loading：0 加载中 → 1 幕布开启（自动）
 * - approve：0 盖章 → 1..n 逐句
 * - predict：0 预测中（自动到 1）→ 1 失败 → 2 原因
 * - curtain：0..n-1 逐句 → n 大字
 * - end：单步
 */
function stepsOf(act: Act): number {
  switch (act.kind) {
    case 'loading':
      return 2;
    case 'approve':
      return act.lines.length + 1;
    case 'predict':
      return 3;
    case 'curtain':
      return act.lines.length + 1;
    default:
      return 1;
  }
}

/**
 * 场景 12：最终祝福——「生日愿望审批系统 × 话剧式分幕演出」
 * 每幕由玩家点击推进，可随时跳过到落幕；结束后进入闭园纪念票根。
 * 图层自下而上：背景 → 舞台 → 角色立绘 → 聚光灯 → 文字层 → 幕布 → UI
 */
export function FinalScene() {
  const { patch, goTo } = useGame();
  const t = TEXTS.final;
  const curtainL = useAssetImageReady('theater_curtain_l');
  const curtainR = useAssetImageReady('theater_curtain_r');
  const valance = useAssetImageReady('theater_valance');
  const acts = t.acts;
  useSceneHint('final', { target: 'final-next' });

  const [actIdx, setActIdx] = useState(0);
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);
  const act = acts[actIdx];
  const isEnd = act.kind === 'end';
  useSyncExternalStore(subscribeVoiceCaption, getVoiceCaptionSnapshot);
  const guideSpeaking = isEnd && getVoiceCaption() !== null;
  const lastStep = stepsOf(act) - 1;

  useEffect(() => {
    patch({ finalSeen: true });
  }, [patch]);

  useEffect(() => {
    if (!isEnd) return;
    playCharacterVoice('guide_farewell');
  }, [isEnd]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  /** 跳到下一幕 */
  const nextAct = useCallback(() => {
    if (actIdx + 1 >= acts.length) return;
    setActIdx(actIdx + 1);
    setStep(0);
  }, [actIdx, acts.length]);

  /** 推进一步（最后一步则进入下一幕） */
  const advance = useCallback(() => {
    if (isEnd) return;
    // 开场点一次就揭幕，不再等加载条自己把幕布拉开。预测中的那一下仍然自动。
    if (act.kind === 'loading') {
      audio.playSfx('sfx_click');
      nextAct();
      return;
    }
    if (act.kind === 'predict' && step === 0) return;
    audio.playSfx('sfx_click');
    if (step >= lastStep) nextAct();
    else setStep(step + 1);
  }, [act.kind, isEnd, lastStep, nextAct, step]);

  /** 跳过演出：直达落幕 */
  const skipAll = () => {
    audio.playSfx('sfx_click');
    setActIdx(acts.length - 1);
    setStep(0);
  };

  // 自动步骤：开场文案在幕布前换一句；预测幕一段时间后失败。计时器随幕次清掉，避免点开始后还改到下一幕。
  useEffect(() => {
    let timer = 0;
    if (act.kind === 'loading' && step === 0) {
      timer = window.setTimeout(() => {
        audio.playSfx('sfx_unlock');
        setStep(1);
      }, LOADING_MS);
    }
    if (act.kind === 'predict' && step === 0) {
      timer = window.setTimeout(() => {
        audio.playSfx('sfx_wrong');
        setStep(1);
      }, PREDICT_MS);
    }
    if (act.kind === 'approve' && step === 0) audio.playSfx('sfx_stamp');
    if (act.kind === 'curtain' && step === lastStep) audio.playSfx('sfx_success');
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [act.kind, step, lastStep]);

  // 幕布：整个开场都合拢，点「下一步」离开开场后才拉开；落幕时再合上。
  const curtainClosed = act.kind === 'loading' || isEnd;
  // 闭幕时只留一层很暗的氛围光，谢幕句聚焦，其余幕次用柔光。
  const spotlight = curtainClosed ? 'dim' : act.kind === 'curtain' ? 'focus' : 'soft';
  const mood = isEnd || act.kind === 'curtain' ? 'happy' : act.kind === 'predict' && step >= 1 ? 'surprise' : act.kind === 'approve' ? 'happy' : 'normal';

  const renderActContent = () => {
    switch (act.kind) {
      case 'loading':
        return (
          <div className="theater__system">
            <span className="theater__sys-tag">{t.systemTag}</span>
            <p className="theater__sys-line">{step === 0 ? act.lines[0] : act.loadingDone}</p>
            <div className="theater__load">
              <motion.div className="theater__load-fill" initial={{ width: '0%' }} animate={{ width: step === 0 ? '100%' : '100%' }} transition={{ duration: LOADING_MS / 1000, ease: 'easeInOut' }} />
            </div>
          </div>
        );
      case 'approve':
        return (
          <div className="theater__system">
            <span className="theater__sys-tag">{t.systemTag}</span>
            <motion.div className="theater__stamp" initial={{ scale: 2.2, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
              {act.stamp}
            </motion.div>
            <div className="theater__lines">
              {act.lines.slice(0, step).map((l) => (
                <motion.p key={l} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  {l}
                </motion.p>
              ))}
            </div>
          </div>
        );
      case 'predict':
        return (
          <div className="theater__system">
            <span className="theater__sys-tag">{t.systemTag}</span>
            {step === 0 && (
              <p className="theater__sys-line">
                {act.lines[0]}
                <span className="theater__dots" />
              </p>
            )}
            {step >= 1 && (
              <motion.p className="theater__fail" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
                {act.fail}
              </motion.p>
            )}
            {step >= 2 && (
              <motion.p className="theater__reason" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {act.reason}
              </motion.p>
            )}
          </div>
        );
      case 'curtain':
        return (
          <div className="theater__lines theater__lines--soft">
            {act.lines.slice(0, Math.min(step + 1, act.lines.length)).map((l) => (
              <motion.p key={l} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                {l}
              </motion.p>
            ))}
            {step >= act.lines.length && (
              <motion.strong className="theater__big" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }}>
                {act.big}
              </motion.strong>
            )}
          </div>
        );
      default:
        return (
          <motion.strong className="theater__big theater__big--end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.4 }}>
            {act.big}
          </motion.strong>
        );
    }
  };

  return (
    <div className={`scene scene--final scene--themed theater theater--${act.kind}`} style={sceneThemeStyle(SCENE_THEMES.final)} data-act={act.id} data-step={step}>
      {/* 背景层 */}
      <div className="theater__layer theater__layer--bg">
        <PlaceholderBackground asset={SCENES.final.bg} />
      </div>
      {/* 舞台层 */}
      <div className="theater__layer theater__layer--stage" aria-hidden>
        <div className="theater__floor" />
        <div className="theater__edge" />
      </div>
      {/* 角色立绘层 */}
      <div className="theater__layer theater__layer--char">
        <div className="theater__char">
          <PlaceholderCharacter mood={mood} frame="full" scale={1.9} />
        </div>
      </div>
      {/* 聚光灯层 */}
      <div className={`theater__layer theater__layer--light theater__light--${spotlight}`} aria-hidden>
        <div className="theater__spot" />
        <div className="theater__wash" />
      </div>
      {/* 文字层（可编辑文字，不写进背景图） */}
      <div className="theater__layer theater__layer--text" onClick={advance}>
        <AnimatePresence mode="wait">
          <motion.div key={`${act.id}-${act.kind === 'loading' ? step : 'x'}`} className="theater__text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            {renderActContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* 幕布层 */}
      <div className="theater__layer theater__layer--curtain" aria-hidden>
        <motion.div
          className={`theater__curtain theater__curtain--l ${curtainL ? 'theater__curtain--art' : ''}`}
          style={curtainL ? { backgroundImage: `url(${assetUrl('theater_curtain_l')})` } : undefined}
          initial={false}
          animate={{ x: curtainClosed ? '0%' : '-50%' }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        <motion.div
          className={`theater__curtain theater__curtain--r ${curtainR ? 'theater__curtain--art' : ''}`}
          style={curtainR ? { backgroundImage: `url(${assetUrl('theater_curtain_r')})` } : undefined}
          initial={false}
          animate={{ x: curtainClosed ? '0%' : '50%' }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        <div
          className={`theater__valance ${valance ? 'theater__valance--art' : ''}`}
          style={valance ? { backgroundImage: `url(${assetUrl('theater_valance')})` } : undefined}
        />
      </div>
      {/* UI 层 */}
      <div className="theater__layer theater__layer--ui">
        <div className="theater__header">
          <h1 className="theater__title">{t.title}</h1>
          <span className="theater__act-label" data-testid="act-label">
            {t.actLabel(actIdx + 1, acts.length)} · {act.title}
          </span>
        </div>
        <div className="theater__controls">
          {!isEnd ? (
            <>
              <Button variant="ghost" small onClick={skipAll} data-testid="final-skip">
                {t.skip}
              </Button>
              <Button variant="gold" onClick={advance} data-hint-target="final-next" data-testid="final-next" disabled={act.kind === 'predict' && step === 0}>
                {step >= lastStep ? t.nextAct : t.nextStep}
              </Button>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.6 }} style={{ display: 'flex', gap: 14 }}>
              <Button
                variant="ghost"
                small
                onClick={() => {
                  setActIdx(0);
                  setStep(0);
                }}
              >
                {t.replay}
              </Button>
              <Button variant="gold" className="btn--breath" onClick={() => goTo('ticket')} data-hint-target="final-next" data-testid="final-ticket">
                {t.toTicket}
              </Button>
            </motion.div>
          )}
        </div>
        <span className="theater__layer-label">{t.layerLabels}</span>
        {guideSpeaking && (
          <div className="theater__host">
            <div className="theater__host-bubble" role="status">
              <span className="theater__host-who">{GUIDE_SPEAKER_LABEL}</span>
              <span className="theater__host-line">{getVoiceCaption()?.line}</span>
            </div>
            <div className="theater__host-cast">
              <ChibiMayi action="farewell" scale={1.6} facing="right" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
