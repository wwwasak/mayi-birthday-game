import { useEffect } from 'react';
import type { SceneId } from '../config/scenes';
import { useGame } from '../core/GameContext';

/**
 * 旧版场景 ID 的兼容重定向：挂载后立即跳转，不渲染内容
 * @param to 目标场景
 */
function Redirect({ to }: { to: SceneId }) {
  const { goTo } = useGame();
  useEffect(() => {
    goTo(to);
  }, [goTo, to]);
  return <div className="scene" />;
}

/** 旧 `auth`（生日身份认证）→ 新版入园闸机 */
export function AuthRedirectScene() {
  return <Redirect to="gate" />;
}

/** 旧 `notice`（游客须知）→ 地图（须知已并入闸机装饰牌） */
export function NoticeRedirectScene() {
  return <Redirect to="map" />;
}
