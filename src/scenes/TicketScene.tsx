import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { SceneLayout } from '../components/ui/SceneLayout';
import { COLLECTIBLES } from '../config/food';
import { TEXTS } from '../config/texts';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useGame } from '../core/GameContext';
import { EXAM_FACT_TOTAL, EXAM_SET_VERSION, WISH_CARD_TOTAL, countStamps } from '../core/progress';
import { useSceneHint } from '../hooks/useSceneHint';

/**
 * 场景 13：闭园纪念票根
 * 汇总本次游园记录；所有行都有缺省文字。自定义心愿仅在玩家勾选「公开」后才显示。
 * 票根上保留隐藏彩蛋入口（🦊），以及重看演出 / 重新体验入口。
 */
export function TicketScene() {
  const t = TEXTS.ticket;
  const { progress, patch, goTo, backToMap, resetProgress } = useGame();
  const { records } = progress;
  useSceneHint('ticket', { target: 'ticket-back' });

  useEffect(() => {
    patch({ ticketSeen: true });
    audio.playSfx('sfx_stamp');
    playCharacterVoice('ticket_keep');
  }, [patch]);

  const stampCount = countStamps(progress);
  const galleryCount = COLLECTIBLES.filter((c) => progress.collectibles[c.id]).length;

  /** 心愿行：单选 / 多选 / 全部都要；自定义心愿只显示「麻衣专属心愿」，不公开正文（正文另起一行且需主动勾选） */
  const sel = records.selectedWishIds;
  const wishLabel = sel.length > 1 ? t.rows.mainWishMulti : t.rows.mainWish;
  const mainWishName = (() => {
    if (sel.length === 0) return records.mainWishBySystem ? t.values.mainWishSkipped : t.values.mainWishNone;
    if (sel.length >= WISH_CARD_TOTAL) return t.values.mainWishAll;
    return sel
      .map((id) => {
        if (id === 'custom') return `${TEXTS.wish.custom.emoji} 麻衣专属心愿`;
        const card = TEXTS.wish.cards.find((c) => c.id === id);
        return card ? `${card.emoji} ${card.title}` : '';
      })
      .filter(Boolean)
      .join('、');
  })();

  const examValue = (() => {
    if (records.examSet === EXAM_SET_VERSION) {
      return records.examBestCorrect > 0 ? t.values.exam(records.examBestCorrect, EXAM_FACT_TOTAL) : t.values.examNone;
    }
    // 旧题组成绩不迁移：明确标注，不把旧 3 题成绩当新版 2 题成绩
    return records.examSet > 0 ? t.values.examLegacy : t.values.examNone;
  })();

  const rows: { key: string; label: string; value: string; user?: boolean; muted?: boolean }[] = [
    { key: 'stamps', label: t.rows.stamps, value: stampCount === 4 ? t.values.stampsAll : `${stampCount} / 4` },
    { key: 'mint', label: t.rows.mint, value: records.mintBest > 0 ? t.values.mint(records.mintBest, records.mintBestCombo) : t.values.mintNone },
    { key: 'hotpot', label: t.rows.hotpot, value: records.hotpotName ?? t.values.hotpotNone },
    { key: 'fruit', label: t.rows.fruit, value: records.fruitName ?? t.values.fruitNone },
    { key: 'exam', label: t.rows.exam, value: examValue },
    { key: 'mainWish', label: wishLabel, value: mainWishName },
    { key: 'hidden', label: t.rows.hidden, value: progress.hiddenDishFound ? t.values.hiddenDone : t.values.hiddenNone, muted: !progress.hiddenDishFound },
    { key: 'gallery', label: t.rows.gallery, value: t.values.gallery(galleryCount, COLLECTIBLES.length) },
  ];
  if (records.customWish) {
    rows.splice(6, 0, {
      key: 'customWish',
      label: t.rows.customWish,
      value: records.customWishPublic ? records.customWish : t.values.customHidden,
      user: records.customWishPublic,
      muted: !records.customWishPublic,
    });
  }
  if (progress.signalCardSeen) rows.push({ key: 'signal', label: t.rows.signal, value: t.values.signalSeen });

  return (
    <SceneLayout
      scene="ticket"
      title={t.title}
      subtitle={t.subtitle}
      mood="happy"
      guide={{ action: 'point', scale: 0.72, followVoice: true, onlyWhileSpeaking: true }}
    >
      <motion.div className="ticket" data-testid="ticket" initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
        <div className="ticket__head">
          <span className="ticket__serial">{t.serial}</span>
          <span className="ticket__stamps" aria-label={t.rows.stamps}>
            {(['mint', 'food', 'exam', 'wish'] as const).map((s) => (
              <span key={s} className={`ticket__stamp ${progress.stamps[s] ? 'ticket__stamp--on' : ''}`}>
                ★
              </span>
            ))}
          </span>
        </div>
        <ul className="ticket__rows">
          {rows.map((r, i) => (
            <motion.li key={r.key} className={`ticket__row ${r.muted ? 'ticket__row--muted' : ''}`} data-row={r.key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
              <span className="ticket__label">{r.label}</span>
              <span className={`ticket__value ${r.user ? 'user-text' : ''}`}>{r.value}</span>
            </motion.li>
          ))}
        </ul>
        <p className="ticket__footer">{t.footer}</p>
        <div className="ticket__perforation" aria-hidden />
        <div className="ticket__actions">
          <Button variant="secondary" small onClick={() => goTo('final')} data-testid="ticket-replay">
            {t.replayShow}
          </Button>
          <Button variant="primary" onClick={backToMap} data-hint-target="ticket-back" data-testid="ticket-back">
            {TEXTS.common.backToMap}
          </Button>
          <Button
            variant="ghost"
            small
            onClick={() => {
              if (window.confirm('确定要清空进度，重新体验一遍吗？')) resetProgress();
            }}
          >
            {t.again}
          </Button>
        </div>
      </motion.div>
      {!progress.eggFound && (
        <motion.button type="button" className="ticket__egg" data-testid="ticket-egg" onClick={() => goTo('egg')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} whileHover={{ scale: 1.04 }}>
          {t.eggEntry}
        </motion.button>
      )}
    </SceneLayout>
  );
}
