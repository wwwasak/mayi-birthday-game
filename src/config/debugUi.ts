/**
 * 是否显示开发调试 UI（资源路径、占位说明等）。
 * 正式构建始终为 false；本地开发需在地址栏加 `?debug=1`。
 */
export function isDebugUiEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === '1';
}
