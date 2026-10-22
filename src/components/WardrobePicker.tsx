import { useState } from 'react';
import { assetUrl } from '../config/assets';
import { MAYI_APPEARANCE_ORDER, type MayiAppearance } from '../config/mayiAppearances';
import { TEXTS } from '../config/texts';
import { audio } from '../core/audio';
import { usePlayerPortrait } from '../hooks/usePlayerPortrait';
import { Button } from './ui/Button';

const COPY = TEXTS.wardrobe;

export interface WardrobePickerProps {
  /** enter 确认后进入开场；change 只更换当前造型。 */
  mode: 'enter' | 'change';
  /** 打开时默认高亮的造型。 */
  initial: MayiAppearance;
  /**
   * 玩家按下确认。
   * @param look 当前选中的造型
   */
  onConfirm: (look: MayiAppearance) => void;
  /** 更换模式下的取消。入场模式不提供跳过。 */
  onCancel?: () => void;
}

/**
 * 三套普通立绘的选择面板。
 * 点卡片只选中，必须再按确认才会生效。
 */
export function WardrobePicker({ mode, initial, onConfirm, onCancel }: WardrobePickerProps) {
  const [draft, setDraft] = useState<MayiAppearance>(initial);
  const selected = COPY.styles[draft];
  const overlay = mode === 'change';

  return (
    <section
      className={`wardrobe${overlay ? ' wardrobe--overlay' : ' scene'}`}
      data-mode={mode}
      data-selected={draft}
      aria-label={mode === 'enter' ? COPY.title : COPY.changeTitle}
    >
      <div className="wardrobe__glow" aria-hidden />
      <header className="wardrobe__head">
        <h1 className="wardrobe__title">{mode === 'enter' ? COPY.title : COPY.changeTitle}</h1>
        <p className="wardrobe__subtitle">{mode === 'enter' ? COPY.subtitle : COPY.changeSubtitle}</p>
      </header>
      <div className="wardrobe__cards" role="radiogroup" aria-label="麻衣造型">
        {MAYI_APPEARANCE_ORDER.map((look) => (
          <WardrobeCard
            key={look}
            look={look}
            selected={draft === look}
            dimmed={draft !== look}
            onSelect={() => {
              if (draft === look) return;
              audio.playSfx('sfx_click');
              setDraft(look);
            }}
          />
        ))}
      </div>
      <footer className="wardrobe__actions">
        {overlay && (
          <Button variant="secondary" sfx onClick={onCancel}>
            {COPY.cancel}
          </Button>
        )}
        <Button variant="gold" data-testid="wardrobe-confirm" onClick={() => onConfirm(draft)}>
          {mode === 'enter' ? COPY.confirmEnter(selected.name) : COPY.confirmChange}
        </Button>
      </footer>
    </section>
  );
}

/**
 * 一张造型预览卡。立绘跟随卡片自己的风格，不跟随已经保存的风格。
 * @param look 这张卡展示的造型
 * @param selected 是否为当前草稿
 * @param dimmed 已有选择时，未选中的卡稍微让开
 * @param onSelect 只更新草稿
 */
function WardrobeCard({
  look,
  selected,
  dimmed,
  onSelect,
}: {
  look: MayiAppearance;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const copy = COPY.styles[look];
  const asset = usePlayerPortrait('normal', look);

  return (
    <button
      type="button"
      className={`wardrobe__card wardrobe__card--${look}${selected ? ' wardrobe__card--on' : ''}${dimmed ? ' wardrobe__card--dim' : ''}`}
      data-testid={`wardrobe-card-${look}`}
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
    >
      <span className="wardrobe__art">
        {asset && <img src={assetUrl(asset)} alt="" draggable={false} />}
      </span>
      <span className="wardrobe__meta">
        <span className="wardrobe__name">
          {copy.name} · {copy.title}
        </span>
        <span className="wardrobe__desc">{copy.desc}</span>
      </span>
    </button>
  );
}
