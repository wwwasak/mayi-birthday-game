import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { TEXTS } from '../../config/texts';
import { Button } from '../ui/Button';
import { PlaceholderCharacter, type CharacterMood } from '../ui/PlaceholderCharacter';

/** 小游戏阶段 */
export type MinigamePhase = 'intro' | 'playing' | 'paused' | 'result';

export interface MinigameShellProps {
  phase: MinigamePhase;
  /** 开始面板标题 */
  title: string;
  /** 开始面板说明 */
  desc: string;
  /** 规则条目 */
  rules: readonly string[];
  /** 游玩中顶部栏内容（分数、计时等） */
  hud?: ReactNode;
  /** 结算面板内容 */
  result?: ReactNode;
  /** 结算面板"再玩一次"按钮文案 */
  replayLabel?: string;
  /** 结算面板"完成"按钮文案 */
  finishLabel?: string;
  /** 开始面板角色表情 */
  introMood?: CharacterMood;
  /** 结算面板角色表情 */
  resultMood?: CharacterMood;
  /** 是否显示暂停按钮（默认 true） */
  pausable?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSkip: () => void;
  onFinish: () => void;
  /** 游玩区内容 */
  children: ReactNode;
}

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const panelMotion = {
  initial: { scale: 0.9, y: 20, opacity: 0 },
  animate: { scale: 1, y: 0, opacity: 1 },
  exit: { scale: 0.95, y: 10, opacity: 0 },
  transition: { type: 'spring', stiffness: 260, damping: 22 } as const,
};

/**
 * 小游戏外壳：统一提供 开始 / 游玩 / 暂停 / 结算 四种状态的面板与按钮
 * 游玩区由 children 提供；所有面板覆盖在游玩区之上
 */
export function MinigameShell({
  phase,
  title,
  desc,
  rules,
  hud,
  result,
  replayLabel = '再玩一次',
  finishLabel = TEXTS.common.done,
  introMood = 'normal',
  resultMood = 'happy',
  pausable = true,
  onStart,
  onPause,
  onResume,
  onRestart,
  onSkip,
  onFinish,
  children,
}: MinigameShellProps) {
  return (
    <div className="mg">
      <div className="mg__topbar">
        <div className="mg__hud">{hud}</div>
        {phase === 'playing' && pausable && (
          <Button variant="secondary" small onClick={onPause}>
            ⏸ 暂停
          </Button>
        )}
      </div>

      <div className={`mg__play ${phase === 'playing' ? '' : 'mg__play--dim'}`}>{children}</div>

      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div key="intro" className="mg__overlay" {...overlayMotion}>
            <motion.div className="mg__panel" {...panelMotion}>
              <div className="mg__panel-char">
                <PlaceholderCharacter mood={introMood} />
              </div>
              <div className="mg__panel-body">
                <h2 className="mg__panel-title">{title}</h2>
                <p className="mg__panel-desc">{desc}</p>
                <ul className="mg__rules">
                  {rules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <div className="mg__panel-actions">
                  <Button variant="ghost" onClick={onSkip}>
                    {TEXTS.common.skip}
                  </Button>
                  <Button variant="gold" className="btn--breath" data-hint-target="mg-start" onClick={onStart}>
                    开始游戏
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'paused' && (
          <motion.div key="paused" className="mg__overlay" {...overlayMotion}>
            <motion.div className="mg__panel mg__panel--small" {...panelMotion}>
              <div className="mg__panel-body" style={{ textAlign: 'center' }}>
                <h2 className="mg__panel-title">已暂停</h2>
                <p className="mg__panel-desc">歇一下，弹幕也喘口气。</p>
                <div className="mg__panel-actions" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button variant="ghost" onClick={onSkip}>
                    {TEXTS.common.skip}
                  </Button>
                  <Button variant="secondary" onClick={onRestart}>
                    重新开始
                  </Button>
                  <Button variant="gold" onClick={onResume}>
                    继续
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div key="result" className="mg__overlay" {...overlayMotion}>
            <motion.div className="mg__panel" {...panelMotion}>
              <div className="mg__panel-char">
                <PlaceholderCharacter mood={resultMood} />
              </div>
              <div className="mg__panel-body">
                <h2 className="mg__panel-title">结算</h2>
                <div className="mg__result">{result}</div>
                <div className="mg__panel-actions">
                  <Button variant="secondary" onClick={onRestart}>
                    {replayLabel}
                  </Button>
                  <Button variant="gold" data-hint-target="mg-finish" onClick={onFinish}>
                    {finishLabel}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
