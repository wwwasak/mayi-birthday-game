import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { HiddenDishGame } from '../components/food/HiddenDishGame';
import { MinigameShell } from '../components/minigame/MinigameShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { assetPlaceholder, assetUrl, type ImageAssetId } from '../config/assets';
import {
  COLLECTIBLES,
  FRUITS,
  FRUIT_BASES,
  FRUIT_TOPPINGS,
  HOTPOT_INGREDIENTS,
  HOTPOT_RATINGS,
  SECRET_TOPPING_ID,
} from '../config/food';
import { fruitQuips, hotpotQuips } from '../config/foodQuips';
import { TEXTS } from '../config/texts';
import { useGame } from '../core/GameContext';
import { audio } from '../core/audio';
import { playCharacterVoice } from '../core/characterVoice';
import { useAssetImageReady } from '../hooks/useAssetImageReady';
import { useMinigamePhase } from '../hooks/useMinigamePhase';

type Station = 'hub' | 'hotpot' | 'fruit' | 'hidden' | 'hiddenPrompt' | 'gallery';

/**
 * 料理完成后的正式成品图。只有图片加载失败时才说明缺文件，避免加载瞬间闪一下占位文案。
 */
function FinishedDish({ src, missingPath, label }: { src: string; missingPath: string; label: string }) {
  const [miss, setMiss] = useState(false);
  if (miss) {
    return (
      <p className="dish-reveal__miss" data-testid="dish-missing">
        {label}未显示：{missingPath}
      </p>
    );
  }
  return (
    <motion.img
      className="dish-reveal"
      src={src}
      alt={label}
      draggable={false}
      data-testid="dish-reveal"
      onError={() => setMiss(true)}
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: [0.86, 1.04, 1] }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    />
  );
}

/**
 * 图鉴缩略图：正式 PNG 优先，失败时用 emoji。
 */
function GalleryIcon({ asset, fallback, showArt }: { asset: ImageAssetId; fallback: string; showArt: boolean }) {
  const ready = useAssetImageReady(asset);
  return (
    <div className="gallery-item__icon" style={ready && showArt ? undefined : { background: assetPlaceholder(asset) }}>
      {ready && showArt ? <img src={assetUrl(asset)} alt="" draggable={false} style={{ width: '78%', height: '78%', objectFit: 'contain', pointerEvents: 'none' }} /> : fallback}
    </div>
  );
}

const HOTPOT_MAX = 4;
const FRUIT_MAX = 3;

/**
 * 根据离谱食材数量获取火锅评级
 */
function rateHotpot(weirdCount: number) {
  return HOTPOT_RATINGS.find((r) => weirdCount <= r.maxWeird) ?? HOTPOT_RATINGS[HOTPOT_RATINGS.length - 1];
}

/**
 * 蒸汽粒子：数量随食材增加
 */
function Steam({ count }: { count: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: 20 + ((i * 37) % 60),
        delay: (i * 0.23) % 1.4,
        size: 28 + ((i * 13) % 26),
      })),
    [count],
  );
  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="steam"
          style={{ left: `${p.left}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -170], opacity: [0.85, 0], scale: [1, 1.8] }}
          transition={{ duration: 1.8, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

/**
 * 第二关：麻衣的美食幻想屋
 * 大厅 → 火锅台 / 水果捞台 / 神秘料理台 / 图鉴；完成火锅 + 水果捞即可领取印章
 * 神秘料理台始终可见：未解锁时点击给出明确提示并可直达水果捞台；在水果捞台点一下「蛋黄沙司（？）」即解锁（持久化）
 */
export function FoodScene() {
  const { progress, unlockCollectible, patch, setRecords, showToast } = useGame();
  const t = TEXTS.food;
  const potReady = useAssetImageReady('item_pot');
  const bowlReady = useAssetImageReady('item_bowl');
  const hotpotDishReady = useAssetImageReady('item_hotpot');
  const fruitDishReady = useAssetImageReady('item_fruit');
  const sauceReady = useAssetImageReady('item_sauce_jar');

  const [station, setStation] = useState<Station>('hub');

  // 火锅
  const [hotpotPicks, setHotpotPicks] = useState<string[]>([]);
  const [hotpotCooked, setHotpotCooked] = useState(false);
  const [hotpotLine, setHotpotLine] = useState<{ text: string; weird: boolean } | null>(null);
  const [hotpotDone, setHotpotDone] = useState<string | null>(null);
  /** 端上桌后的组合专属吐槽（null = 尚未端上桌） */
  const [hotpotQuipLines, setHotpotQuipLines] = useState<string[] | null>(null);

  // 水果捞
  const [fruitPicks, setFruitPicks] = useState<string[]>([]);
  const [basePick, setBasePick] = useState<string | null>(null);
  const [toppingPick, setToppingPick] = useState<string | null>(null);
  const [fruitMade, setFruitMade] = useState(false);
  const [fruitDone, setFruitDone] = useState<string | null>(null);
  const [fruitQuipLines, setFruitQuipLines] = useState<string[] | null>(null);

  // 神秘料理（解锁状态持久化在 progress.hiddenDishUnlocked）
  const hiddenUnlocked = progress.hiddenDishUnlocked;
  /** 本局是否刚刚点出线索（用于水果捞台显示线索卡） */
  const [clueShown, setClueShown] = useState(false);
  const [hiddenServed, setHiddenServed] = useState(false);
  /** 用于「再做一次」时重建神秘料理小游戏 */
  const [hiddenRun, setHiddenRun] = useState(0);

  const resetAll = useCallback(() => {
    setStation('hub');
    setHotpotPicks([]);
    setHotpotCooked(false);
    setHotpotLine(null);
    setHotpotDone(null);
    setHotpotQuipLines(null);
    setFruitPicks([]);
    setBasePick(null);
    setToppingPick(null);
    setFruitMade(false);
    setFruitDone(null);
    setFruitQuipLines(null);
    setClueShown(false);
    setHiddenServed(false);
    setHiddenRun((n) => n + 1);
  }, []);

  const game = useMinigamePhase('food', resetAll);

  // ---------- 火锅 ----------
  const toggleHotpot = (id: string) => {
    if (hotpotCooked) return;
    const ing = HOTPOT_INGREDIENTS.find((i) => i.id === id);
    if (!ing) return;
    if (hotpotPicks.includes(id)) {
      setHotpotPicks((p) => p.filter((x) => x !== id));
      setHotpotLine(null);
      return;
    }
    if (hotpotPicks.length >= HOTPOT_MAX) return;
    audio.playSfx('sfx_steam');
    setHotpotPicks((p) => [...p, id]);
    setHotpotLine({ text: ing.line, weird: !!ing.weird });
  };

  const hotpotWeird = hotpotPicks.filter((id) => HOTPOT_INGREDIENTS.find((i) => i.id === id)?.weird).length;
  const hotpotRating = rateHotpot(hotpotWeird);

  const cookHotpot = () => {
    audio.playSfx('sfx_success');
    if (hotpotWeird > 0) playCharacterVoice('food_weird');
    setHotpotCooked(true);
    setHotpotLine({ text: hotpotRating.line, weird: hotpotWeird > 0 });
  };

  /** 端上桌：记录成品、生成组合专属吐槽并停留在本台展示 */
  const serveHotpot = () => {
    audio.playSfx('sfx_sparkle');
    setHotpotDone(hotpotRating.title);
    setHotpotQuipLines(hotpotQuips(hotpotPicks));
    setRecords({ hotpotName: hotpotRating.title });
    if (unlockCollectible('tangbing')) showToast(t.hotpot.gift, 2600);
  };

  const resetHotpot = () => {
    setHotpotPicks([]);
    setHotpotCooked(false);
    setHotpotLine(null);
    setHotpotQuipLines(null);
  };

  // ---------- 水果捞 ----------
  const toggleFruit = (id: string) => {
    if (fruitMade) return;
    audio.playSfx('sfx_click');
    setFruitPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= FRUIT_MAX ? p : [...p, id]));
  };

  const fruitReady = fruitPicks.length === FRUIT_MAX && basePick && toppingPick;
  const secretChosen = toppingPick === SECRET_TOPPING_ID;
  const fruitName = t.fruit.resultName(
    FRUIT_BASES.find((b) => b.id === basePick)?.name ?? '',
    fruitPicks.map((id) => FRUITS.find((f) => f.id === id)?.name ?? ''),
  );

  /** 选配料：点到蛋黄沙司即解锁神秘料理台（不必做完水果捞） */
  const pickTopping = (id: string) => {
    if (fruitMade) return;
    setToppingPick(id);
    if (id === SECRET_TOPPING_ID) {
      audio.playSfx('sfx_unlock');
      setClueShown(true);
      if (!hiddenUnlocked) {
        patch({ hiddenDishUnlocked: true });
        showToast(t.fruit.secretUnlocked, 3000);
        playCharacterVoice('secret_found');
      }
    } else {
      audio.playSfx('sfx_click');
    }
  };

  const makeFruit = () => {
    audio.playSfx('sfx_success');
    setFruitMade(true);
  };

  /** 端上桌：记录成品、生成组合专属吐槽并停留在本台展示 */
  const serveFruit = () => {
    audio.playSfx('sfx_sparkle');
    setFruitDone(fruitName);
    setFruitQuipLines(fruitQuips(fruitPicks, basePick, toppingPick));
    setRecords({ fruitName });
    if (unlockCollectible('yunpiangao')) showToast(t.fruit.gift, 2600);
  };

  const resetFruit = () => {
    setFruitPicks([]);
    setBasePick(null);
    setToppingPick(null);
    setFruitMade(false);
    setFruitQuipLines(null);
    setClueShown(false);
  };

  // ---------- 隐藏料理 ----------
  const serveHidden = () => {
    setHiddenServed(true);
    patch({ hiddenDishFound: true });
    if (unlockCollectible('danhuangnangua')) showToast(t.hidden.gift, 2600);
    setHiddenRun((n) => n + 1);
    setStation('hub');
  };

  // ---------- 糖罐 ----------
  const mintTaken = progress.collectibles.bohetang;
  const takeMint = () => {
    if (unlockCollectible('bohetang')) showToast(t.hub.jarFound, 2400);
    else showToast(t.hub.jarEmpty, 1800);
  };

  const canFinish = !!hotpotDone && !!fruitDone;
  const collected = Object.values(progress.collectibles).filter(Boolean).length;
  const hiddenFound = progress.hiddenDishFound || hiddenServed;

  const goHub = () => {
    audio.playSfx('sfx_click');
    setStation('hub');
  };

  // ---------- 渲染：各站台 ----------
  const renderHub = () => (
    <div className="food-hub">
      <Card className="food-station" clickable done={!!hotpotDone} placeholder={!hotpotDone} onClick={() => { setStation('hotpot'); playCharacterVoice('hotpot_enter'); }}>
        {hotpotDone && <span className="food-station__done">已完成</span>}
        <div className="food-station__icon" style={potReady || hotpotDishReady ? undefined : { background: assetPlaceholder('item_pot') }}>
          {hotpotDone && hotpotDishReady ? (
            <img src={assetUrl('item_hotpot')} alt="" draggable={false} style={{ width: '86%', height: '86%', objectFit: 'contain', pointerEvents: 'none' }} />
          ) : potReady ? (
            <img src={assetUrl('item_pot')} alt="" draggable={false} style={{ width: '86%', height: '86%', objectFit: 'contain', pointerEvents: 'none' }} />
          ) : (
            '🍲'
          )}
        </div>
        <div>
          <h3 className="card__title" style={{ fontSize: 30 }}>
            {t.hub.hotpot.title}
          </h3>
          <p className="card__text" style={{ fontSize: 21, color: 'var(--c-ink-soft)' }}>
            {hotpotDone ? `成品：${hotpotDone}` : t.hub.hotpot.desc}
          </p>
        </div>
      </Card>

      <Card className="food-station" clickable done={!!fruitDone} placeholder={!fruitDone} onClick={() => setStation('fruit')}>
        {fruitDone && <span className="food-station__done">已完成</span>}
        <div className="food-station__icon" style={bowlReady || fruitDishReady ? undefined : { background: assetPlaceholder('item_fruit') }}>
          {fruitDone && fruitDishReady ? (
            <img src={assetUrl('item_fruit')} alt="" draggable={false} style={{ width: '86%', height: '86%', objectFit: 'contain', pointerEvents: 'none' }} />
          ) : bowlReady ? (
            <img src={assetUrl('item_bowl')} alt="" draggable={false} style={{ width: '86%', height: '86%', objectFit: 'contain', pointerEvents: 'none' }} />
          ) : (
            '🍉'
          )}
        </div>
        <div>
          <h3 className="card__title" style={{ fontSize: 30 }}>
            {t.hub.fruit.title}
          </h3>
          <p className="card__text" style={{ fontSize: 21, color: 'var(--c-ink-soft)' }}>
            {fruitDone ? `成品：${fruitDone}` : t.hub.fruit.desc}
          </p>
        </div>
      </Card>

      <Card
        className={`food-station food-station--mystery ${hiddenUnlocked ? '' : 'food-station--locked'}`}
        clickable
        done={hiddenFound}
        placeholder={!hiddenFound}
        testId="station-hidden"
        onClick={() => {
          audio.playSfx('sfx_click');
          setStation(hiddenUnlocked ? 'hidden' : 'hiddenPrompt');
        }}
      >
        {hiddenFound && <span className="food-station__done">已制作</span>}
        <div className="food-station__icon" style={{ background: assetPlaceholder('item_golden_dish') }}>
          {hiddenUnlocked ? '🎃' : '❓'}
        </div>
        <div>
          <h3 className="card__title" style={{ fontSize: 30 }}>
            {hiddenUnlocked ? t.hub.hidden.title : t.hub.hiddenLocked.title}
          </h3>
          <p className="card__text" style={{ fontSize: 21, color: 'var(--c-ink-soft)' }}>
            {hiddenUnlocked ? t.hub.hidden.desc : t.hub.hiddenLocked.desc}
          </p>
        </div>
      </Card>

      <Card className="food-station" clickable placeholder onClick={() => setStation('gallery')}>
        <div className="food-station__icon" style={{ background: assetPlaceholder('item_yunpiangao') }}>
          📖
        </div>
        <div>
          <h3 className="card__title" style={{ fontSize: 30 }}>
            {t.hub.gallery.title}
          </h3>
          <p className="card__text" style={{ fontSize: 21, color: 'var(--c-ink-soft)' }}>
            {t.gallery.count(collected, COLLECTIBLES.length)}
          </p>
        </div>
      </Card>

      <div className="food-hub__footer">
        <div className="food-jar-wrap">
          <button className="food-jar" onClick={takeMint} data-testid="food-jar">
            {t.hub.jar}
          </button>
          <AnimatePresence>
            {!mintTaken && (
              <motion.button
                key="bubble"
                type="button"
                className="food-jar-bubble"
                data-testid="jar-bubble"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: [0, -8, 0] }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ opacity: { duration: 0.3 }, y: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } }}
                onClick={takeMint}
              >
                {t.hub.jarBubble}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 22, color: 'var(--c-ink-soft)' }}>{t.hub.doneHint(!!hotpotDone, !!fruitDone)}</span>
          <Button variant="gold" disabled={!canFinish} onClick={game.finishToResult}>
            {t.hub.done}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderHotpot = () => (
    <div className="food-station-view">
      <div className="food-station-view__left">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="step-title">{t.hotpot.pick(hotpotPicks.length)}</h3>
          <Button variant="ghost" small onClick={goHub}>
            {t.hub.back}
          </Button>
        </div>
        <div className="ingredient-grid">
          {HOTPOT_INGREDIENTS.map((ing) => {
            const picked = hotpotPicks.includes(ing.id);
            return (
              <button
                key={ing.id}
                className={`ingredient ${picked ? 'ingredient--picked' : ''} ${ing.weird ? 'ingredient--weird' : ''}`}
                disabled={hotpotCooked || (!picked && hotpotPicks.length >= HOTPOT_MAX)}
                onClick={() => toggleHotpot(ing.id)}
              >
                <span className="ingredient__emoji">{ing.emoji}</span>
                {ing.name}
              </button>
            );
          })}
        </div>
        {hotpotQuipLines ? (
          <motion.div className="feedback-box quip-box" data-testid="hotpot-quips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="quip-box__tag">🍲 {t.hotpot.servedTag}</span>
            <strong style={{ color: 'var(--c-pink-deep)', display: 'block' }}>{hotpotRating.title}</strong>
            {hotpotQuipLines.map((l) => (
              <p key={l} className="quip-box__line">
                {l}
              </p>
            ))}
          </motion.div>
        ) : (
          <div className={`feedback-box ${hotpotLine?.weird ? 'feedback-box--weird' : ''}`}>
            {hotpotCooked && <strong style={{ color: 'var(--c-pink-deep)', display: 'block' }}>{hotpotRating.title}</strong>}
            {hotpotLine?.text ?? t.hotpot.emptyLine}
          </div>
        )}
      </div>
      <div className="food-station-view__right">
        <div className="pot-area">
          <Steam count={hotpotPicks.length * 2 + hotpotWeird * 3 + (hotpotCooked ? 4 : 0)} />
          {hotpotCooked ? (
            <FinishedDish src={assetUrl('item_hotpot')} missingPath="public/assets/images/items/hotpot.png" label="火锅成品" />
          ) : (
            <div className={`pot ${potReady ? 'pot--art' : ''}`}>
              {potReady && <img className="pot__art" src={assetUrl('item_pot')} alt="" draggable={false} />}
              <div className="pot__items">
                <AnimatePresence>
                  {hotpotPicks.map((id) => (
                    <motion.span
                      key={id}
                      initial={{ y: -120, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                    >
                      {HOTPOT_INGREDIENTS.find((i) => i.id === id)?.emoji}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
          <Button variant="secondary" small onClick={resetHotpot} disabled={hotpotPicks.length === 0}>
            {t.hotpot.reset}
          </Button>
          {hotpotQuipLines ? (
            <Button variant="gold" onClick={goHub} data-testid="hotpot-back">
              {t.hotpot.backHub}
            </Button>
          ) : !hotpotCooked ? (
            <Button disabled={hotpotPicks.length < HOTPOT_MAX} onClick={cookHotpot}>
              {t.hotpot.start}
            </Button>
          ) : (
            <Button variant="gold" onClick={serveHotpot} data-testid="hotpot-serve">
              {t.hotpot.done}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderPickGroup = <T extends { id: string; name: string; emoji: string; secret?: boolean }>(
    title: string,
    items: T[],
    isPicked: (id: string) => boolean,
    onPick: (id: string) => void,
    disabledAll: boolean,
    disabledUnpicked: boolean,
  ) => (
    <div>
      <h3 className="step-title" style={{ marginBottom: 10 }}>
        {title}
      </h3>
      <div className="ingredient-grid">
        {items.map((it) => {
          const picked = isPicked(it.id);
          return (
            <button
              key={it.id}
              className={`ingredient ${picked ? 'ingredient--picked' : ''} ${it.secret ? 'ingredient--secret' : ''}`}
              disabled={disabledAll || (!picked && disabledUnpicked)}
              data-testid={it.secret ? 'topping-secret' : undefined}
              onClick={() => onPick(it.id)}
            >
              <span className="ingredient__emoji">
                {it.secret && sauceReady ? <img className="ingredient__art" src={assetUrl('item_sauce_jar')} alt="" draggable={false} /> : it.emoji}
              </span>
              {it.name}
              {it.secret && <span className="ingredient__secret-mark">？</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderFruit = () => (
    <div className="food-station-view">
      <div className="food-station-view__left" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" small onClick={goHub}>
            {t.hub.back}
          </Button>
        </div>
        {renderPickGroup(
          t.fruit.stepFruit(fruitPicks.length),
          FRUITS,
          (id) => fruitPicks.includes(id),
          toggleFruit,
          fruitMade,
          fruitPicks.length >= FRUIT_MAX,
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 4fr', gap: 16 }}>
          {renderPickGroup(
            t.fruit.stepBase,
            FRUIT_BASES,
            (id) => basePick === id,
            (id) => {
              audio.playSfx('sfx_click');
              setBasePick(id);
            },
            fruitMade,
            false,
          )}
          {renderPickGroup(t.fruit.stepTopping, FRUIT_TOPPINGS, (id) => toppingPick === id, pickTopping, fruitMade, false)}
        </div>
      </div>
      <div className="food-station-view__right">
        <div className="pot-area">
          {fruitMade ? (
            <FinishedDish src={assetUrl('item_fruit')} missingPath="public/assets/images/items/fruit_bowl.png" label="水果捞成品" />
          ) : (
            <div className={`bowl ${bowlReady ? 'bowl--art' : ''}`}>
              {bowlReady && <img className="bowl__art" src={assetUrl('item_bowl')} alt="" draggable={false} />}
              <div className="bowl__items">
                <AnimatePresence>
                  {[...fruitPicks, basePick, toppingPick].filter(Boolean).map((id) => {
                    const item =
                      FRUITS.find((f) => f.id === id) ?? FRUIT_BASES.find((b) => b.id === id) ?? FRUIT_TOPPINGS.find((x) => x.id === id);
                    return (
                      <motion.span
                        key={id as string}
                        initial={{ y: -120, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                      >
                        {item?.emoji}
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
        {/* 端上桌后：组合专属吐槽；线索卡：点到蛋黄沙司后出现（未开做时替代提示框），可直达神秘料理台 */}
        {fruitQuipLines ? (
          <motion.div className="feedback-box quip-box" data-testid="fruit-quips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="quip-box__tag">🍉 {t.hotpot.servedTag}</span>
            <strong style={{ color: 'var(--c-pink-deep)', display: 'block' }}>{fruitName}</strong>
            {fruitQuipLines.map((l) => (
              <p key={l} className="quip-box__line">
                {l}
              </p>
            ))}
            {secretChosen && hiddenUnlocked && (
              <Button small variant="gold" onClick={() => setStation('hidden')}>
                {t.fruit.goHidden}
              </Button>
            )}
          </motion.div>
        ) : clueShown && !fruitMade ? (
          <motion.div key="clue" className="clue-card" data-testid="clue-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <span className="clue-card__tag">🔍 {t.fruit.clueTag}</span>
            <div className="clue-card__lines">
              {t.fruit.clueLines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
            <Button small variant="gold" onClick={() => setStation('hidden')}>
              {t.fruit.goHidden}
            </Button>
          </motion.div>
        ) : (
          <div className={`feedback-box ${fruitMade && secretChosen ? 'feedback-box--weird' : ''}`}>
            {fruitMade ? (
              <>
                <strong style={{ color: 'var(--c-pink-deep)', display: 'block' }}>{fruitName}</strong>
                {secretChosen ? t.fruit.secretLine : t.fruit.resultLine}
              </>
            ) : (
              '选好水果、底料和配料后点"开做！"'
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
          <Button variant="secondary" small onClick={resetFruit} disabled={fruitPicks.length === 0 && !basePick && !toppingPick}>
            {t.fruit.reset}
          </Button>
          {fruitQuipLines ? (
            <Button variant="gold" onClick={goHub} data-testid="fruit-back">
              {t.hotpot.backHub}
            </Button>
          ) : !fruitMade ? (
            <Button disabled={!fruitReady} onClick={makeFruit} data-testid="fruit-make">
              {t.fruit.make}
            </Button>
          ) : (
            <Button variant="gold" onClick={serveFruit} data-testid="fruit-serve">
              {t.fruit.done}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderHidden = () => <HiddenDishGame key={hiddenRun} active={game.phase === 'playing'} onServe={serveHidden} onBack={goHub} />;

  /** 神秘料理台未解锁时的提示面板：明确告诉玩家线索在哪，并可直达水果捞台 */
  const renderHiddenPrompt = () => (
    <div className="food-station-view" style={{ gridTemplateColumns: '1fr' }}>
      <div className="food-station-view__left" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <motion.div className="mystery-prompt" data-testid="mystery-prompt" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="mystery-prompt__icon" style={{ background: assetPlaceholder('item_golden_dish') }}>
            ❓
          </div>
          <h3 className="mystery-prompt__title">{t.hub.hiddenPrompt.title}</h3>
          <p className="mystery-prompt__line">{t.hub.hiddenPrompt.line}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Button variant="secondary" onClick={goHub}>
              {t.hub.hiddenPrompt.later}
            </Button>
            <Button variant="gold" className="btn--breath" data-testid="go-fruit" onClick={() => setStation('fruit')}>
              {t.hub.hiddenPrompt.go}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className="food-station-view" style={{ gridTemplateColumns: '1fr' }}>
      <div className="food-station-view__left">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="step-title">
            {t.hub.gallery.title} · {t.gallery.count(collected, COLLECTIBLES.length)}
          </h3>
          <Button variant="ghost" small onClick={goHub}>
            {t.hub.back}
          </Button>
        </div>
        <div className="gallery-grid">
          {COLLECTIBLES.map((c) => {
            const got = progress.collectibles[c.id];
            return (
              <Card key={c.id} className={`gallery-item ${got ? '' : 'gallery-item--locked'}`} done={got} placeholder={!got}>
                <GalleryIcon asset={c.asset} fallback={got || !c.secret ? c.emoji : '❓'} showArt={got || !c.secret} />
                <h4 className="card__title" style={{ fontSize: 26 }}>
                  {got || !c.secret ? c.name : '？？？'}
                </h4>
                <p className="card__text" style={{ fontSize: 19, color: 'var(--c-ink-soft)' }}>
                  {got ? c.desc : `${t.gallery.locked} · ${c.howTo}`}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );

  const views: Record<Station, () => JSX.Element> = {
    hub: renderHub,
    hotpot: renderHotpot,
    fruit: renderFruit,
    hidden: renderHidden,
    hiddenPrompt: renderHiddenPrompt,
    gallery: renderGallery,
  };

  /** 游玩时右侧半身：神秘料理思考，两道正餐都完成后开心 */
  const foodMood = station === 'hidden' ? 'think' : hotpotDone && fruitDone ? 'happy' : 'normal';

  return (
    <SceneLayout scene="food" title={t.title} subtitle={t.subtitle} mood={game.phase === 'playing' ? foodMood : null} compact>
      <MinigameShell
        phase={game.phase}
        title={t.title}
        desc={t.desc}
        rules={t.rules}
        introMood="surprise"
        onStart={game.start}
        onPause={game.pause}
        onResume={game.resume}
        onRestart={game.restart}
        onSkip={game.skip}
        onFinish={game.finish}
        finishLabel="领取印章，返回地图"
        hud={
          <>
            <span className="mg__hud-pill">{t.hub.doneHint(!!hotpotDone, !!fruitDone)}</span>
            <span className="mg__hud-pill mg__hud-pill--gold">
              图鉴 {collected}/{COLLECTIBLES.length}
            </span>
          </>
        }
        result={
          <>
            <p className="mg__result-title">{t.resultTitle}</p>
            {t.resultLines(hotpotDone ?? '—', fruitDone ?? '—', hiddenFound, collected).map((l) => (
              <p key={l} style={{ margin: 0 }}>
                {l}
              </p>
            ))}
          </>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={station}
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {views[station]()}
          </motion.div>
        </AnimatePresence>
      </MinigameShell>
    </SceneLayout>
  );
}
