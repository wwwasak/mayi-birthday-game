import { useEffect, useState } from 'react';
import { ASSETS, assetPlaceholder, assetUrl, type ImageAssetId } from '../../config/assets';
import { isDebugUiEnabled } from '../../config/debugUi';

export interface PlaceholderBackgroundProps {
  /** 背景资源 ID（读取其 placeholder 渐变与说明） */
  asset: ImageAssetId;
}

/**
 * 场景背景：优先加载资源表中的图片；失败或未就绪时回退 CSS 占位渐变。
 */
export function PlaceholderBackground({ asset }: PlaceholderBackgroundProps) {
  const entry = ASSETS[asset];
  const url = assetUrl(asset);
  const showDebug = isDebugUiEnabled();
  const [useImage, setUseImage] = useState(false);

  useEffect(() => {
    setUseImage(false);
    const img = new Image();
    const ok = () => setUseImage(true);
    const fail = () => setUseImage(false);
    img.addEventListener('load', ok);
    img.addEventListener('error', fail);
    img.src = url;
    return () => {
      img.removeEventListener('load', ok);
      img.removeEventListener('error', fail);
    };
  }, [url]);

  if (useImage) {
    return (
      <div className="placeholder-bg placeholder-bg--image" data-asset={asset}>
        <img className="placeholder-bg__photo" src={url} alt="" decoding="async" />
      </div>
    );
  }

  return (
    <div className="placeholder-bg placeholder-bg--fallback" style={{ background: assetPlaceholder(asset) }}>
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
      {showDebug && <span className="placeholder-bg__label">占位背景 · {entry.path}</span>}
    </div>
  );
}
