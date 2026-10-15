import { HintBar } from './components/HintBar';
import { Hud } from './components/Hud';
import { SceneRouter } from './components/SceneRouter';
import { Stage } from './components/Stage';
import { GameProvider } from './core/GameContext';
import { HintProvider } from './core/HintContext';

/**
 * 应用根组件：GameProvider → HintProvider → 舞台 → 场景 + HUD + 提示槽
 */
export default function App() {
  return (
    <GameProvider>
      <HintProvider>
        <Stage>
          <SceneRouter />
          <Hud />
          <HintBar />
        </Stage>
      </HintProvider>
    </GameProvider>
  );
}
