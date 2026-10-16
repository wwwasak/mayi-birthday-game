import { useEffect, useState } from 'react';
import { assetUrl, type ImageAssetId } from '../config/assets';

/**
 * 检测图片资源是否可加载（用于地图建筑等：有图用图，无图保留 CSS 占位）。
 * @param id 资源 ID
 */
export function useAssetImageReady(id: ImageAssetId): boolean {
  const url = assetUrl(id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const img = new Image();
    const ok = () => setReady(true);
    const fail = () => setReady(false);
    img.addEventListener('load', ok);
    img.addEventListener('error', fail);
    img.src = url;
    return () => {
      img.removeEventListener('load', ok);
      img.removeEventListener('error', fail);
    };
  }, [url]);

  return ready;
}
