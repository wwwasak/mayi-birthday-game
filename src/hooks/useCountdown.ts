import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 可暂停的倒计时
 * @param totalMs 总时长（毫秒）
 * @param running 是否计时中（false 时暂停，不丢失剩余时间）
 * @param onEnd 归零时回调（只触发一次，reset 后可再次触发）
 * @returns 剩余毫秒与重置函数
 */
export function useCountdown(totalMs: number, running: boolean, onEnd: () => void) {
  const [leftMs, setLeftMs] = useState(totalMs);
  const leftRef = useRef(totalMs);
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const reset = useCallback(() => {
    leftRef.current = totalMs;
    endedRef.current = false;
    setLeftMs(totalMs);
  }, [totalMs]);

  useEffect(() => {
    if (!running || endedRef.current) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      leftRef.current = Math.max(0, leftRef.current - (now - last));
      last = now;
      setLeftMs(leftRef.current);
      if (leftRef.current <= 0 && !endedRef.current) {
        endedRef.current = true;
        window.clearInterval(id);
        onEndRef.current();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [running]);

  return { leftMs, reset };
}
