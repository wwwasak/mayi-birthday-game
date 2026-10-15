import { ASSETS, assetPlaceholder, type ImageAssetId } from '../../config/assets';

export interface PlaceholderBackgroundProps {
  /** 背景资源 ID（读取其 placeholder 渐变与说明） */
  asset: ImageAssetId;
}

/**
 * 占位背景：使用资源表中的渐变 + 几个模糊色块，并在右下角标注将要替换的资源路径
 */
export function PlaceholderBackground({ asset }: PlaceholderBackgroundProps) {
  const entry = ASSETS[asset];
  return (
    <div className="placeholder-bg" style={{ background: assetPlaceholder(asset) }}>
      <div
        className="placeholder-bg__blob"
        style={{ width: 520, height: 520, left: -120, top: -160, background: 'rgba(255,255,255,0.7)' }}
      />
      <div
        className="placeholder-bg__blob"
        style={{ width: 640, height: 640, right: -200, bottom: -260, background: 'rgba(255,170,220,0.6)' }}
      />
      <div
        className="placeholder-bg__blob"
        style={{ width: 360, height: 360, right: 420, top: 80, background: 'rgba(170,190,255,0.5)' }}
      />
      <span className="placeholder-bg__label">占位背景 · {entry.path}</span>
    </div>
  );
}
