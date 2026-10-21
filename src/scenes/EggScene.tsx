import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SceneLayout } from '../components/ui/SceneLayout';
import { TEXTS } from '../config/texts';
import { playCharacterVoice } from '../core/characterVoice';
import { useGame } from '../core/GameContext';

/**
 * 场景 13：隐藏彩蛋——被下线的“老登大道理功能”留下的一句话
 */
export function EggScene() {
  const { patch, backToMap } = useGame();
  const t = TEXTS.egg;

  useEffect(() => {
    patch({ eggFound: true });
  }, [patch]);

  useEffect(() => {
    const id = window.setTimeout(() => playCharacterVoice('egg_quiet'), 500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <SceneLayout
      scene="egg"
      title={t.title}
      mood={null}
      guide={{ action: 'peek', scale: 0.75, followVoice: true, onlyWhileSpeaking: true }}
      actions={
        <Button variant="secondary" onClick={backToMap}>
          {t.back}
        </Button>
      }
    >
      <Card className="egg-note" tag="占位 · 后台控制室">
        {t.lines.map((line, i) => (
          <motion.p
            key={line}
            className="card__text egg-note__line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 * i }}
          >
            &gt; {line}
          </motion.p>
        ))}
        <motion.p
          className="egg-note__quote"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 * t.lines.length + 0.3 }}
        >
          {t.quote}
        </motion.p>
      </Card>
    </SceneLayout>
  );
}
