import { WardrobePicker } from '../components/WardrobePicker';
import { useGame } from '../core/GameContext';

/**
 * 每次打开游戏的入场造型。
 * 确认后才进入原来的开场，不跳过闸机，也不播放语音或地图音乐。
 */
export function WardrobeScene() {
  const { progress, patch, goTo } = useGame();

  return (
    <WardrobePicker
      mode="enter"
      initial={progress.mayiAppearance}
      onConfirm={(look) => {
        patch({ mayiAppearance: look });
        goTo('boot');
      }}
    />
  );
}
