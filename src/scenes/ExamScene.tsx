import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinigameShell } from '../components/minigame/MinigameShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChibiMayi } from '../components/ui/ChibiMayi';
import { PlaceholderCharacter } from '../components/ui/PlaceholderCharacter';
import { SceneLayout } from '../components/ui/SceneLayout';
import { DANMU_TIMER_SECONDS, EXAM_QUESTIONS, EXAM_RESULT_LINES, type ExamQuestion } from '../config/exam';
import { TEXTS } from '../config/texts';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useGame } from '../core/GameContext';
import { EXAM_FACT_TOTAL, EXAM_SET_VERSION } from '../core/progress';
import { useMinigamePhase } from '../hooks/useMinigamePhase';

type Verdict = 'ok' | 'bad' | 'fun' | null;

/** 判定器过载动画时长 */
const OVERLOAD_MS = 1300;

/**
 * 计算某题在给定选择下的判定与反馈
 * @param q 题目
 * @param pick 选项下标（null = 未作答）
 * @param prefix 前缀（如“时间到”）
 */
function evaluate(q: ExamQuestion, pick: number | null, t: typeof TEXTS.exam, prefix = ''): { verdict: Verdict; text: string } {
  if (pick === null) return { verdict: null, text: '' };
  if (q.type === 'fun' || q.type === 'absurd') return { verdict: 'fun', text: `${prefix}${q.feedback?.[pick] ?? '判定正确。'}`.trim() };
  if (pick === q.answer) return { verdict: 'ok', text: `${t.correct} ${q.basis ?? ''}`.trim() };
  const ans = q.options[q.answer ?? 0];
  return { verdict: 'bad', text: `${prefix}${t.wrongReveal(ans)} ${q.feedback?.[pick] ?? ''} ${t.changeHint}`.trim() };
}

/**
 * 统计事实题正确数
 * @param answers 各题选择
 */
function countFact(answers: (number | null)[]): number {
  return EXAM_QUESTIONS.reduce((n, q, i) => (q.type === 'fact' && answers[i] === q.answer ? n + 1 : n), 0);
}

/**
 * 第三关：麻衣本人认证考试（V1.2 题组，6 题）
 * - 事实题：选错立刻揭晓答案；可随时改选，交卷时按最终选择计分
 * - 娱乐题：所有选项都有反馈，不计入正确率
 * - 荒谬判定题：怎么选都对，首次作答触发「判定器过载」动画
 * - 「上一题 / 下一题」自由翻看，返回时保留原选择
 * - 弹幕倒计时：可选，默认关闭；时间到自动代选（事实题代选一个错误答案并揭晓）
 */
export function ExamScene() {
  const { progress, recordExam, updateSettings, showToast } = useGame();
  const t = TEXTS.exam;
  const total = EXAM_QUESTIONS.length;

  const [idx, setIdx] = useState(0);
  /** 各题当前选择（null = 未作答） */
  const [answers, setAnswers] = useState<(number | null)[]>(() => EXAM_QUESTIONS.map(() => null));
  /** 由倒计时代选的题（反馈加“时间到”前缀） */
  const [byTimer, setByTimer] = useState<Record<number, boolean>>({});
  /** 已播放过过载动画的题 */
  const [overloaded, setOverloaded] = useState<Record<number, boolean>>({});
  const [overload, setOverload] = useState(false);
  const [hintShown, setHintShown] = useState<Record<number, boolean>>({});
  const [changes, setChanges] = useState(0);
  const [shake, setShake] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DANMU_TIMER_SECONDS);
  /** 交卷时冻结的成绩 */
  const [finalFact, setFinalFact] = useState(0);

  const timerOn = progress.settings.danmuTimer;

  const resetExam = useCallback(() => {
    setIdx(0);
    setAnswers(EXAM_QUESTIONS.map(() => null));
    setByTimer({});
    setOverloaded({});
    setOverload(false);
    setHintShown({});
    setChanges(0);
    setFinalFact(0);
    setTimeLeft(DANMU_TIMER_SECONDS);
  }, []);

  const game = useMinigamePhase('exam', resetExam);
  const q = EXAM_QUESTIONS[idx];
  const picked = answers[idx];
  const answered = picked !== null;

  /** 作答 / 改选 */
  const choose = useCallback(
    (i: number, fromTimer = false) => {
      if (game.phase !== 'playing' || overload) return;
      const prev = answers[idx];
      if (prev === i) return;
      if (prev !== null) setChanges((n) => n + 1);
      setAnswers((a) => a.map((v, k) => (k === idx ? i : v)));
      if (fromTimer) setByTimer((m) => ({ ...m, [idx]: true }));
      else if (byTimer[idx]) setByTimer((m) => ({ ...m, [idx]: false }));

      if (q.type === 'absurd') {
        if (!overloaded[idx]) {
          audio.playSfx('sfx_wrong');
          playCharacterVoice('exam_overload');
          setOverload(true);
          setOverloaded((m) => ({ ...m, [idx]: true }));
          window.setTimeout(() => {
            setOverload(false);
            audio.playSfx('sfx_success');
          }, OVERLOAD_MS);
        } else {
          audio.playSfx('sfx_correct');
        }
        return;
      }
      if (q.type === 'fun' || i === q.answer) {
        audio.playSfx('sfx_correct');
        if (q.type === 'fact') playCharacterVoice('exam_proud');
      } else {
        audio.playSfx('sfx_wrong');
        if (q.type === 'fact') playCharacterVoice('exam_wrong');
        setShake((s) => s + 1);
      }
    },
    [answers, byTimer, game.phase, idx, overload, overloaded, q],
  );

  // 弹幕倒计时（可选）：游玩中且当前题未作答时计时；时间到 → 事实题代选一个错误答案并揭晓 / 其它题随机代选
  useEffect(() => {
    if (!timerOn || answered || game.phase !== 'playing') return;
    if (timeLeft <= 0) {
      const pick = q.type === 'fact' ? (q.answer === 0 ? 1 : 0) : Math.floor(Math.random() * q.options.length);
      choose(pick, true);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timerOn, answered, game.phase, timeLeft, q, choose]);

  const gotoQuestion = (n: number) => {
    audio.playSfx('sfx_click');
    setIdx(n);
    setTimeLeft(DANMU_TIMER_SECONDS);
  };

  const prev = () => {
    if (idx === 0 || overload) return;
    gotoQuestion(idx - 1);
  };

  const next = () => {
    if (overload) return;
    if (!answered) {
      showToast(t.unanswered, 1600);
      return;
    }
    if (idx + 1 >= total) {
      const fact = countFact(answers);
      setFinalFact(fact);
      recordExam(fact);
      audio.playSfx('sfx_click');
      game.finishToResult();
      return;
    }
    gotoQuestion(idx + 1);
  };

  const { verdict, text: feedback } = useMemo(
    () => evaluate(q, picked, t, byTimer[idx] ? `${t.timeUp} ` : ''),
    [q, picked, t, byTimer, idx],
  );
  const liveFact = countFact(answers);
  const playerMood = overload || verdict === 'bad' ? 'surprise' : verdict === 'ok' || verdict === 'fun' ? 'happy' : 'normal';
  const examinerAction = overload ? 'surprise' : verdict === 'bad' ? 'tease' : verdict === 'ok' || verdict === 'fun' ? 'happy' : 'think';
  const tag = q.type === 'fact' ? t.tagFact : q.type === 'fun' ? t.tagFun : t.tagAbsurd;
  const danmuLine = q.type === 'fact' ? (hintShown[idx] ? q.hint : t.danmuFact) : q.type === 'fun' ? t.danmuFun : t.danmuAbsurd;
  /** 历史最佳：只在同一题组下才有意义 */
  const best = progress.records.examSet === EXAM_SET_VERSION ? Math.max(progress.records.examBestCorrect, finalFact) : finalFact;
  const isLast = idx + 1 >= total;

  return (
    <SceneLayout scene="exam" title={t.title} subtitle={t.subtitle} mood={null} compact>
      <MinigameShell
        phase={game.phase}
        title={t.title}
        desc={t.desc}
        rules={t.rules}
        introMood="think"
        onStart={() => {
          playCharacterVoice('exam_think');
          game.start();
        }}
        onPause={game.pause}
        onResume={game.resume}
        onRestart={game.restart}
        onSkip={game.skip}
        onFinish={game.finish}
        finishLabel="领取印章，返回地图"
        hud={
          <>
            <span className="mg__hud-pill" data-testid="exam-progress">
              {t.progress(idx + 1, total)}
            </span>
            <span className="mg__hud-pill mg__hud-pill--accent">
              {t.statFact} {liveFact}/{EXAM_FACT_TOTAL}
            </span>
            <button
              type="button"
              className={`mg__hud-pill mg__hud-toggle ${timerOn ? 'mg__hud-toggle--on' : ''}`}
              data-testid="danmu-timer-toggle"
              onClick={() => {
                audio.playSfx('sfx_click');
                updateSettings({ danmuTimer: !timerOn });
                setTimeLeft(DANMU_TIMER_SECONDS);
              }}
            >
              {timerOn ? t.timerOn : t.timerOff}
            </button>
          </>
        }
        result={
          <>
            <p className="mg__result-title">{t.pass}</p>
            <p style={{ margin: 0 }}>{EXAM_RESULT_LINES[finalFact] ?? EXAM_RESULT_LINES[0]}</p>
            <div className="mg__stats">
              <div className="mg__stat">
                <div className="mg__stat-label">{t.statFact}</div>
                <div className="mg__stat-value" data-testid="exam-final-fact">
                  {finalFact} / {EXAM_FACT_TOTAL}
                </div>
              </div>
              <div className="mg__stat">
                <div className="mg__stat-label">{t.statWrong}</div>
                <div className="mg__stat-value">{changes}</div>
              </div>
              <div className="mg__stat">
                <div className="mg__stat-label">{t.statBest}</div>
                <div className="mg__stat-value">
                  {best} / {EXAM_FACT_TOTAL}
                </div>
              </div>
            </div>
          </>
        }
      >
        <div className="exam-view">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
            >
              <Card style={{ height: '100%', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span className={`exam-tag ${q.type === 'fact' ? 'exam-tag--fact' : q.type === 'fun' ? 'exam-tag--fun' : 'exam-tag--absurd'}`}>{tag}</span>
                  <span className="exam-dots" aria-label={t.progress(idx + 1, total)}>
                    {EXAM_QUESTIONS.map((qq, i) => (
                      <span key={qq.id} className={`exam-dot ${i === idx ? 'exam-dot--cur' : ''} ${answers[i] !== null ? 'exam-dot--done' : ''}`} />
                    ))}
                  </span>
                  {timerOn && !answered && (
                    <span className={`exam-timer ${timeLeft <= 5 ? 'exam-timer--urgent' : ''}`} data-testid="danmu-timer">
                      {t.timeLeft(timeLeft)}
                    </span>
                  )}
                </div>
                <motion.h3
                  className="exam-q"
                  key={shake}
                  animate={shake > 0 ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <span className="exam-q__no">Q{idx + 1}</span> {q.q}
                </motion.h3>
                <div className="exam-options">
                  {q.options.map((opt, i) => {
                    const isAnswer = answered && q.type === 'fact' && i === q.answer;
                    const isWrongPick = answered && q.type === 'fact' && i === picked && i !== q.answer;
                    const isPickedOther = answered && q.type !== 'fact' && i === picked;
                    return (
                      <button
                        key={`${q.id}-${i}`}
                        className={['option-btn', isWrongPick ? 'option-btn--wrong' : '', isAnswer || isPickedOther ? 'option-btn--correct' : '', i === picked ? 'option-btn--picked' : '']
                          .filter(Boolean)
                          .join(' ')}
                        disabled={overload}
                        aria-pressed={i === picked}
                        data-testid={`exam-option-${i}`}
                        onClick={() => choose(i)}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" small disabled={idx === 0 || overload} onClick={prev} data-testid="exam-prev">
                      ← {t.prev}
                    </Button>
                    {q.type === 'fact' && !answered && (
                      <Button variant="ghost" small onClick={() => setHintShown((m) => ({ ...m, [idx]: true }))} disabled={!!hintShown[idx]} sfx={!hintShown[idx]}>
                        💬 {t.danmuHint}
                      </Button>
                    )}
                  </div>
                  <Button variant={answered ? 'gold' : 'secondary'} disabled={overload} onClick={next} data-hint-target="exam-next" data-testid="exam-next">
                    {isLast ? t.submit : `${t.next} →`}
                  </Button>
                </div>

                {/* 判定器过载动画（荒谬判定题） */}
                <AnimatePresence>
                  {overload && (
                    <motion.div
                      key="overload"
                      className="exam-overload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="exam-overload__text">{t.overload}</div>
                      <div className="exam-overload__bar">
                        <motion.div className="exam-overload__fill" initial={{ width: '0%' }} animate={{ width: '140%' }} transition={{ duration: OVERLOAD_MS / 1000, ease: 'easeIn' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </AnimatePresence>

          <div className="exam-side">
            <div className="exam-danmu">💬 弹幕可以一起猜！{danmuLine}</div>
            <div className={`exam-feedback ${verdict === 'ok' || verdict === 'fun' ? 'exam-feedback--ok' : ''} ${verdict === 'bad' ? 'exam-feedback--bad' : ''}`} data-testid="exam-feedback">
              <AnimatePresence mode="wait">
                <motion.div key={overload ? 'overload' : feedback || 'empty'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {overload ? t.overload : feedback || '选择一个答案，Q版麻衣会给出反馈。'}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="exam-cast">
              <PlaceholderCharacter mood={playerMood} />
              <ChibiMayi action={examinerAction} scale={1.15} followVoice />
            </div>
          </div>
        </div>
      </MinigameShell>
    </SceneLayout>
  );
}
