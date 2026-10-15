import type { ReactNode } from 'react';
import { STAGE_HEIGHT, STAGE_WIDTH, useStageScale } from '../hooks/useStageScale';

/**
 * 舞台容器：固定 1920x1080 逻辑画布，按窗口等比缩放居中显示
 */
export function Stage({ children }: { children: ReactNode }) {
  const scale = useStageScale();
  return (
    <div className="stage-viewport">
      <div
        className="stage"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
