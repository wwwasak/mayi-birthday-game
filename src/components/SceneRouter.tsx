import { AnimatePresence, motion } from 'motion/react';
import { useGame } from '../core/GameContext';
import { SCENE_COMPONENTS } from '../scenes';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * 场景路由：根据 GameContext 中的当前场景渲染对应组件，并做淡入淡出过渡
 * 不依赖 URL / History，file:// 下完全可用
 */
export function SceneRouter() {
  const { scene, backToMap } = useGame();
  const Scene = SCENE_COMPONENTS[scene];

  return (
    <ErrorBoundary onRecover={backToMap}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={scene}
          style={{ position: 'absolute', inset: 0 }}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Scene />
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
